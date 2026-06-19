from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from decimal import Decimal
from typing import List

from app.core.database import get_db
from app.core.deps import RoleChecker
from app.models.models import User, Order, Payment, AmbassadorProfile, AuditLog
from app.schemas.schemas import AdminDashboardStats, OrderResponse, OrderQuoteOverride, UserResponse

router = APIRouter()


@router.get("/stats", response_model=AdminDashboardStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Calculate platform performance dashboard metrics."""
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == "submitted").count()
    
    # Active specialists count
    active_specialists = db.query(User).filter(User.role == "specialist", User.is_active == True).count()
    
    # Sum of all approved payments
    approved_payments = db.query(Payment).filter(Payment.status == "approved").all()
    total_rev = sum(p.amount for p in approved_payments)
    
    # Sum of all ambassador balances
    ambassador_liability = sum(
        profile.balance for profile in db.query(AmbassadorProfile).all()
    )
    
    active_users = db.query(User).filter(User.is_active == True).count()

    return AdminDashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        active_specialists=active_specialists,
        total_revenue=Decimal(str(total_rev)),
        referral_payout_liability=Decimal(str(ambassador_liability)),
        active_users=active_users
    )


@router.post("/orders/{order_id}/override", response_model=OrderResponse)
def override_order_quote(
    order_id: UUID,
    quote_in: OrderQuoteOverride,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Allows administrators to manually adjust quotation pricing for an order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_total = quote_in.quote_amount
    deposit = round(new_total * Decimal("0.30"), 2)
    balance = round(new_total - deposit, 2)

    order.quote_amount = new_total
    order.deposit_amount = deposit
    order.final_amount = balance
    order.admin_override_quote = True
    order.status = "quoted"  # advance status after quote is set

    # Log action
    log = AuditLog(
        user_id=current_user.id,
        action="order_quote_override",
        details=f"Overrode order {order_id} quote to £{new_total}"
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{order_id}/assign/{specialist_id}", response_model=OrderResponse)
def assign_specialist(
    order_id: UUID,
    specialist_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Assigns an academic specialist to a paid task, moving the status to 'assigned'."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    specialist = db.query(User).filter(User.id == specialist_id, User.role == "specialist").first()
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")

    order.specialist_id = specialist.id
    order.status = "assigned"

    # Log assignment
    log = AuditLog(
        user_id=current_user.id,
        action="order_specialist_assigned",
        details=f"Assigned specialist {specialist_id} to order {order_id}"
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order


@router.get("/specialists", response_model=List[UserResponse])
def list_specialists(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Retrieve list of active specialists to populate assignment dropdowns."""
    return db.query(User).filter(User.role == "specialist", User.is_active == True).all()


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Retrieve a list of all registered platform users."""
    return db.query(User).all()
