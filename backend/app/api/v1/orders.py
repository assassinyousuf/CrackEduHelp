from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker
from app.models.models import User, Order, OrderFile, AuditLog, Referral
from app.schemas.schemas import (
    OrderCreate, OrderResponse, OrderUpdate,
    PricingEstimationRequest, PricingEstimationResponse, OrderFileResponse
)
from app.services.pricing import calculate_quote
from app.services.files import FileService
from app.services.notifications import NotificationService

router = APIRouter()


@router.post("/estimate", response_model=PricingEstimationResponse)
def estimate_cost(request: PricingEstimationRequest, db: Session = Depends(get_db)):
    """Calculate the estimated pricing details without creating an order record."""
    return calculate_quote(db, request)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["student"]))):
    """Create a new academic support task. Generates estimated quote automatically."""
    # Build order
    order = Order(
        student_id=current_user.id,
        title=order_in.title,
        university=order_in.university,
        course_name=order_in.course_name,
        service_type=order_in.service_type,
        task_description=order_in.task_description,
        word_count=order_in.word_count,
        slide_count=order_in.slide_count,
        deadline=order_in.deadline,
        priority_level=order_in.priority_level,
        status="submitted"
    )
    
    # Calculate initial quote
    est_req = PricingEstimationRequest(
        service_type=order_in.service_type,
        word_count=order_in.word_count,
        slide_count=order_in.slide_count,
        priority_level=order_in.priority_level
    )
    est_res = calculate_quote(db, est_req)
    
    order.quote_amount = est_res.estimated_total
    order.deposit_amount = est_res.deposit_required
    order.final_amount = est_res.final_balance

    db.add(order)
    db.flush()

    # Track conversion referral update
    ref = db.query(Referral).filter(Referral.referred_user_id == current_user.id).first()
    if ref and ref.status == "registered":
        ref.status = "order_placed"

    # Log order placement
    log = AuditLog(
        user_id=current_user.id,
        action="order_create",
        details=f"Created order: {order.id} under service: {order.service_type}"
    )
    db.add(log)
    db.commit()
    db.refresh(order)

    # Dispatch notification log
    NotificationService.notify_order_status_change(
        email=current_user.email,
        order_id=str(order.id),
        new_status="Submitted",
        detail_url=f"/student/orders/{order.id}"
    )

    return order


@router.get("", response_model=List[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List orders with dynamic filters depending on the requester's role."""
    query = db.query(Order)
    
    if current_user.role == "student":
        query = query.filter(Order.student_id == current_user.id)
    elif current_user.role == "specialist":
        query = query.filter(Order.specialist_id == current_user.id)
    # admins see all orders. Ambassadors shouldn't be using this endpoint.

    return query.order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details for a single order, verifying role authorization."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorize role access
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this order")
    elif current_user.role == "specialist" and order.specialist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this order")

    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: UUID,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order parameters or status. Triggers timeline and notification flows."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check update auth constraints
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "specialist" and order.specialist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Allowed status progressions by role
    old_status = order.status
    if order_in.status:
        new_status = order_in.status
        if current_user.role == "student":
            # Student can request revisions or cancel before work starts
            if new_status not in ["revision_requested", "cancelled"]:
                raise HTTPException(status_code=400, detail="Invalid status transition for student")
        elif current_user.role == "specialist":
            # Specialist updates progress
            if new_status not in ["in_progress", "draft_submitted", "final_review"]:
                raise HTTPException(status_code=400, detail="Invalid status transition for specialist")
        # Admins can set any state

        order.status = new_status
        
        # Log action
        log = AuditLog(
            user_id=current_user.id,
            action="order_status_update",
            details=f"Order status changed from {old_status} to {new_status}"
        )
        db.add(log)
        
        # Send notifications
        NotificationService.notify_order_status_change(
            email=order.student.email,
            order_id=str(order.id),
            new_status=new_status,
            detail_url=f"/orders/{order.id}"
        )

    if order_in.title:
        order.title = order_in.title
    if order_in.task_description:
        order.task_description = order_in.task_description

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/files", response_model=OrderFileResponse)
async def upload_order_file(
    order_id: UUID,
    file_category: str = Form(...),  # source, draft, final, revision
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload task attachments or deliverables. Simulates scanning and tags roles."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Auth check
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    elif current_user.role == "specialist" and order.specialist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Limit delivery types for specialists
    if current_user.role == "specialist" and file_category not in ["draft", "final"]:
        raise HTTPException(status_code=400, detail="Specialists can only upload 'draft' or 'final' files.")

    # Save to disk
    subfolder = f"orders/{order_id}"
    file_key, size_bytes, is_clean = await FileService.save_file(file, subfolder)

    # Save order file model
    order_file = OrderFile(
        order_id=order_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_key=file_key,
        file_size=size_bytes,
        file_type=file.content_type or "application/octet-stream",
        file_category=file_category,
        is_clean=is_clean
    )
    db.add(order_file)

    # Update order state automatically if final file is uploaded
    if file_category == "final" and current_user.role == "specialist":
        order.status = "final_review"
    elif file_category == "draft" and current_user.role == "specialist":
        order.status = "draft_submitted"

    # Log action
    log = AuditLog(
        user_id=current_user.id,
        action="file_upload",
        details=f"Uploaded {file.filename} as category {file_category}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(order_file)
    return order_file


@router.get("/files/{file_id}/download")
def download_order_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Securely download project attachments. Prevents access if order is locked/unpaid."""
    order_file = db.query(OrderFile).filter(OrderFile.id == file_id).first()
    if not order_file:
        raise HTTPException(status_code=404, detail="File not found")

    order = order_file.order

    # Role auth check
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "specialist" and order.specialist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Business rule: Students cannot download final files until the final payment is Approved
    if current_user.role == "student" and order_file.file_category == "final":
        if order.status not in ["completed", "final_review"] or order.final_amount > 0:
            # Check if there is an approved final payment
            has_approved_final_payment = any(
                p.payment_type == "final" and p.status == "approved" 
                for p in order.payments
            )
            if not has_approved_final_payment:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Final delivery is locked. Please submit the final payment first."
                )

    file_path = FileService.get_file_path(order_file.file_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file storage not found")

    # Audit tracking
    log = AuditLog(
        user_id=current_user.id,
        action="file_download",
        details=f"Downloaded file: {order_file.file_name} from order {order.id}"
    )
    db.add(log)
    db.commit()

    return FileResponse(
        path=file_path,
        filename=order_file.file_name,
        media_type=order_file.file_type
    )
