from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
from decimal import Decimal

from app.core.database import get_db
from app.core.deps import get_current_user, RoleChecker
from app.models.models import User, Payment, Order, Referral, AmbassadorProfile, AuditLog
from app.schemas.schemas import PaymentResponse, PaymentVerifyRequest
from app.services.files import FileService
from app.services.notifications import NotificationService

router = APIRouter()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def submit_payment_proof(
    order_id: UUID = Form(...),
    amount: Decimal = Form(...),
    payment_type: str = Form(...),  # deposit, final
    payment_method: str = Form(...),  # bank_transfer, wise, paypal
    proof: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["student"]))
):
    """Submits manual payment proof screenshot for admin verification."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if payment_type not in ["deposit", "final"]:
        raise HTTPException(status_code=400, detail="Payment type must be 'deposit' or 'final'")
        
    if payment_method not in ["bank_transfer", "wise", "paypal"]:
        raise HTTPException(status_code=400, detail="Invalid payment method")

    # Save proof file
    subfolder = f"payments/{order_id}"
    file_key, _, is_clean = await FileService.save_file(proof, subfolder)
    
    if not is_clean:
        raise HTTPException(status_code=400, detail="File verification failed. Please re-upload.")

    payment = Payment(
        order_id=order_id,
        student_id=current_user.id,
        amount=amount,
        payment_type=payment_type,
        payment_method=payment_method,
        status="pending",
        proof_file_key=file_key
    )
    db.add(payment)
    db.flush()

    # Log action
    log = AuditLog(
        user_id=current_user.id,
        action="payment_proof_submitted",
        details=f"Submitted {payment_type} payment of £{amount} for order {order_id}"
    )
    db.add(log)
    db.commit()
    db.refresh(payment)

    return payment


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List payments based on role permissions."""
    if current_user.role == "admin":
        return db.query(Payment).order_by(Payment.created_at.desc()).all()
    elif current_user.role == "student":
        return db.query(Payment).filter(Payment.student_id == current_user.id).order_by(Payment.created_at.desc()).all()
    
    raise HTTPException(status_code=403, detail="Unauthorized")


@router.post("/{payment_id}/verify", response_model=PaymentResponse)
def verify_payment(
    payment_id: UUID,
    verify_in: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    """Admin verifies and approves/rejects student's payment proof."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    if payment.status != "pending":
        raise HTTPException(status_code=400, detail="Payment already processed")

    # Update payment status
    payment.status = verify_in.status
    payment.verified_by = current_user.id
    payment.verified_at = datetime.now(timezone.utc)

    order = payment.order

    if verify_in.status == "approved":
        if payment.payment_type == "deposit":
            order.status = "deposit_paid"
            
            # Handle referral commissions since first deposit has been approved
            ref = db.query(Referral).filter(Referral.referred_user_id == order.student_id).first()
            if ref and ref.status != "paid":
                ref.status = "paid"
                # Calculate payout: commission_rate % of order.quote_amount
                ambassador_profile = db.query(AmbassadorProfile).filter(
                    AmbassadorProfile.user_id == ref.ambassador_id
                ).first()
                if ambassador_profile:
                    earned = (order.quote_amount or Decimal("0.00")) * (ambassador_profile.commission_rate / Decimal("100.00"))
                    ref.commission_earned = earned
                    ambassador_profile.balance += earned
                    
                    # Audit referral bonus
                    ref_log = AuditLog(
                        user_id=ambassador_profile.user_id,
                        action="referral_commission_credit",
                        details=f"Earned £{earned:.2f} referral bonus for student register: {order.student_id}"
                    )
                    db.add(ref_log)
        else:
            # Final payment approved -> order transitions to completed
            order.status = "completed"

        # Log payment approval
        log = AuditLog(
            user_id=current_user.id,
            action="payment_approved",
            details=f"Approved {payment.payment_type} of £{payment.amount} for order {order.id}"
        )
        db.add(log)

        # Notify student
        NotificationService.notify_payment_received(
            email=order.student.email,
            order_id=str(order.id),
            amount=float(payment.amount),
            payment_type=payment.payment_type
        )
    else:
        # If payment is rejected, log
        log = AuditLog(
            user_id=current_user.id,
            action="payment_rejected",
            details=f"Rejected {payment.payment_type} for order {order.id}"
        )
        db.add(log)

    db.commit()
    db.refresh(payment)
    return payment
