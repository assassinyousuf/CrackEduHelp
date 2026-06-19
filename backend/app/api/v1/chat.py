from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, ChatMessage, Order, AuditLog
from app.schemas.schemas import ChatMessageResponse, ChatMessageCreate

router = APIRouter()


@router.get("/{order_id}", response_model=List[ChatMessageResponse])
def get_order_messages(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve chat history logs for a specific order. Verifies user access."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorize role access
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this thread")
    elif current_user.role == "specialist" and order.specialist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this thread")

    messages = db.query(ChatMessage).filter(ChatMessage.order_id == order_id).order_by(ChatMessage.created_at.asc()).all()
    return messages


@router.post("/{order_id}", response_model=ChatMessageResponse)
def send_order_message(
    order_id: UUID,
    message_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post a chat message in an order-specific thread."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorize role access
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to message in this thread")
    elif current_user.role == "specialist" and order.specialist_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to message in this thread")

    msg = ChatMessage(
        order_id=order_id,
        sender_id=current_user.id,
        message_text=message_in.message_text,
        attachment_key=message_in.attachment_key
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
