import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    ForeignKey,
    Numeric,
    Text,
    Table
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="student", nullable=False)  # student, specialist, ambassador, admin
    phone = Column(String, nullable=True)
    university = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    facebook_link = Column(String, nullable=True)
    linkedin_link = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ambassador_profile = relationship("AmbassadorProfile", uselist=False, back_populates="user")
    student_orders = relationship("Order", foreign_keys="[Order.student_id]", back_populates="student")
    specialist_orders = relationship("Order", foreign_keys="[Order.specialist_id]", back_populates="specialist")
    payments = relationship("Payment", foreign_keys="[Payment.student_id]", back_populates="student")
    uploaded_files = relationship("OrderFile", back_populates="uploader")
    chat_messages = relationship("ChatMessage", back_populates="sender")


class AmbassadorProfile(Base):
    __tablename__ = "ambassador_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    referral_code = Column(String, unique=True, index=True, nullable=False)
    referral_url = Column(String, nullable=False)
    commission_rate = Column(Numeric(10, 2), default=10.00, nullable=False)  # e.g., 10%
    balance = Column(Numeric(10, 2), default=0.00, nullable=False)

    # Relationships
    user = relationship("User", back_populates="ambassador_profile")
    referrals = relationship("Referral", back_populates="ambassador")


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ambassador_id = Column(UUID(as_uuid=True), ForeignKey("ambassador_profiles.user_id", ondelete="CASCADE"), nullable=False)
    referred_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    status = Column(String, default="registered", nullable=False)  # registered, order_placed, paid
    commission_earned = Column(Numeric(10, 2), default=0.00, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    ambassador = relationship("AmbassadorProfile", back_populates="referrals")
    referred_user = relationship("User")


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    specialist_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    university = Column(String, nullable=False)
    course_name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)  # e.g. PPT Presentation, Report
    task_description = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=True)
    slide_count = Column(Integer, nullable=True)
    deadline = Column(DateTime, nullable=False)
    priority_level = Column(String, default="standard", nullable=False)  # standard, urgent, express
    status = Column(String, default="submitted", nullable=False)
    # submitted, under_review, quoted, deposit_paid, assigned, in_progress, draft_submitted, revision_requested, final_review, completed, cancelled
    
    quote_amount = Column(Numeric(10, 2), nullable=True)
    deposit_amount = Column(Numeric(10, 2), nullable=True)
    final_amount = Column(Numeric(10, 2), nullable=True)
    admin_override_quote = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="student_orders")
    specialist = relationship("User", foreign_keys=[specialist_id], back_populates="specialist_orders")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    files = relationship("OrderFile", back_populates="order", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="order", cascade="all, delete-orphan")


class OrderFile(Base):
    __tablename__ = "order_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_key = Column(String, nullable=False)  # Local storage path or S3 key
    file_size = Column(Integer, nullable=False)
    file_type = Column(String, nullable=False)
    file_category = Column(String, nullable=False)  # source, draft, final, revision
    is_clean = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="files")
    uploader = relationship("User", back_populates="uploaded_files")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(String, nullable=False)  # deposit, final
    payment_method = Column(String, nullable=False)  # bank_transfer, wise, paypal
    status = Column(String, default="pending", nullable=False)  # pending, approved, rejected
    proof_file_key = Column(String, nullable=False)  # uploaded image of receipt
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="payments")
    student = relationship("User", foreign_keys=[student_id], back_populates="payments")
    verifier = relationship("User", foreign_keys=[verified_by])


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    attachment_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="chat_messages")
    sender = relationship("User", back_populates="chat_messages")


class PricingRule(Base):
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    service_type = Column(String, unique=True, index=True, nullable=False)
    base_price = Column(Numeric(10, 2), default=20.00, nullable=False)
    price_per_word = Column(Numeric(10, 4), default=0.05, nullable=False)
    price_per_slide = Column(Numeric(10, 2), default=5.00, nullable=False)
    urgent_multiplier = Column(Numeric(5, 2), default=1.50, nullable=False)
    express_multiplier = Column(Numeric(5, 2), default=2.00, nullable=False)


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # Study Tips, Referencing Guides, Productivity, Presentation Skills, Academic Writing
    published = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class LeadCapture(Base):
    __tablename__ = "lead_captures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)  # newsletter, consultation
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    name = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
