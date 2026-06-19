from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from decimal import Decimal
from uuid import UUID


# ==========================================
# AUTH & USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "student"  # student, specialist, ambassador, admin
    phone: str = Field(...)
    university: Optional[str] = None
    whatsapp: Optional[str] = None
    facebook_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    profile_picture: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    referral_code: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    phone: str
    university: Optional[str] = None
    whatsapp: Optional[str] = None
    facebook_link: Optional[str] = None
    linkedin_link: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


# ==========================================
# AMBASSADOR & REFERRAL SCHEMAS
# ==========================================

class AmbassadorProfileResponse(BaseModel):
    user_id: UUID
    referral_code: str
    referral_url: str
    commission_rate: Decimal
    balance: Decimal

    class Config:
        from_attributes = True


class ReferralResponse(BaseModel):
    id: UUID
    ambassador_id: UUID
    referred_user_id: UUID
    status: str
    commission_earned: Decimal
    created_at: datetime
    referred_user: UserResponse

    class Config:
        from_attributes = True


class AmbassadorStats(BaseModel):
    clicks: int = 0
    registrations: int = 0
    converted_orders: int = 0
    total_earnings: Decimal = Decimal("0.00")
    current_balance: Decimal = Decimal("0.00")
    referrals: List[ReferralResponse] = []


# ==========================================
# ORDER SCHEMAS
# ==========================================

class OrderBase(BaseModel):
    title: str = Field(..., min_length=3)
    university: str
    course_name: str
    service_type: str
    task_description: str
    word_count: Optional[int] = None
    slide_count: Optional[int] = None
    deadline: datetime
    priority_level: str = "standard"  # standard, urgent, express

    @field_validator("service_type")
    def validate_service_type(cls, v):
        from app.core.config import settings
        if v not in settings.ALLOWED_SERVICES:
            raise ValueError(f"Service type '{v}' is not supported. Allowed services are: {', '.join(settings.ALLOWED_SERVICES)}")
        return v

    @field_validator("priority_level")
    def validate_priority(cls, v):
        if v not in ["standard", "urgent", "express"]:
            raise ValueError("Priority level must be 'standard', 'urgent', or 'express'")
        return v

    @field_validator("task_description")
    def check_ethics(cls, v):
        from app.core.config import settings
        v_lower = v.lower()
        for kw in settings.PROHIBITED_KEYWORDS:
            if kw in v_lower:
                raise ValueError(
                    f"Warning: Task description contains references to prohibited academic services ('{kw}'). "
                    "CreackEduHelp does not assist with live testing, academic impersonation, or exam cheating."
                )
        return v


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    title: Optional[str] = None
    task_description: Optional[str] = None
    status: Optional[str] = None
    specialist_id: Optional[UUID] = None


class OrderFileResponse(BaseModel):
    id: UUID
    order_id: UUID
    uploaded_by: UUID
    file_name: str
    file_key: str
    file_size: int
    file_type: str
    file_category: str
    is_clean: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: UUID
    student_id: UUID
    specialist_id: Optional[UUID] = None
    title: str
    university: str
    course_name: str
    service_type: str
    task_description: str
    word_count: Optional[int] = None
    slide_count: Optional[int] = None
    deadline: datetime
    priority_level: str
    status: str
    quote_amount: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    final_amount: Optional[Decimal] = None
    admin_override_quote: bool
    created_at: datetime
    updated_at: datetime
    files: List[OrderFileResponse] = []
    student: Optional[UserResponse] = None
    specialist: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class OrderQuoteOverride(BaseModel):
    quote_amount: Decimal


# ==========================================
# PRICING ENGINE SCHEMAS
# ==========================================

class PricingEstimationRequest(BaseModel):
    service_type: str
    word_count: Optional[int] = 0
    slide_count: Optional[int] = 0
    priority_level: str = "standard"


class PricingEstimationResponse(BaseModel):
    estimated_total: Decimal
    deposit_required: Decimal
    final_balance: Decimal
    base_price: Decimal
    word_cost: Decimal
    slide_cost: Decimal
    priority_multiplier: Decimal


# ==========================================
# PAYMENT SCHEMAS
# ==========================================

class PaymentCreate(BaseModel):
    order_id: UUID
    amount: Decimal
    payment_type: str  # deposit, final
    payment_method: str  # bank_transfer, wise, paypal


class PaymentResponse(BaseModel):
    id: UUID
    order_id: UUID
    student_id: UUID
    amount: Decimal
    payment_type: str
    payment_method: str
    status: str
    proof_file_key: str
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentVerifyRequest(BaseModel):
    status: str  # approved, rejected


# ==========================================
# CHAT SCHEMAS
# ==========================================

class ChatMessageCreate(BaseModel):
    message_text: str
    attachment_key: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    order_id: UUID
    sender_id: UUID
    message_text: str
    attachment_key: Optional[str] = None
    created_at: datetime
    sender: UserResponse

    class Config:
        from_attributes = True


# ==========================================
# MARKETING & LEAD CAPTURE SCHEMAS
# ==========================================

class LeadCaptureCreate(BaseModel):
    type: str  # newsletter, consultation
    email: EmailStr
    phone: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None


class LeadCaptureResponse(BaseModel):
    id: UUID
    type: str
    email: EmailStr
    phone: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content: str
    category: str


class BlogPostResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    category: str
    published: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# AUDIT & ADMIN SCHEMAS
# ==========================================

class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    active_specialists: int
    total_revenue: Decimal
    referral_payout_liability: Decimal
    active_users: int
