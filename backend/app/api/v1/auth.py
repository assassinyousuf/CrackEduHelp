import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.models import User, AmbassadorProfile, Referral, AuditLog
from app.schemas.schemas import UserCreate, Token, LoginRequest, UserResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    role: str = Form(...),
    phone: str = Form(...),
    university: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    facebook_link: Optional[str] = Form(None),
    linkedin_link: Optional[str] = Form(None),
    referral_code: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Register student, ambassador or support staff. Binds referral code and optional profile picture."""
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered."
        )

    # Validate roles
    if role not in ["student", "ambassador"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-registration is only allowed for 'student' or 'ambassador' roles."
        )

    # Process avatar upload if provided
    profile_picture_key = None
    if profile_picture:
        from app.services.files import FileService
        file_key, _, is_clean = await FileService.save_file(profile_picture, "avatars")
        if is_clean:
            profile_picture_key = file_key

    # Hash user password
    hashed_pwd = get_password_hash(password)
    user = User(
        email=email,
        hashed_password=hashed_pwd,
        full_name=full_name,
        role=role,
        phone=phone,
        university=university,
        whatsapp=whatsapp,
        facebook_link=facebook_link,
        linkedin_link=linkedin_link,
        profile_picture=profile_picture_key
    )
    db.add(user)
    db.flush()  # Extract user.id for profile logic

    # Role specific creation logic
    if user.role == "ambassador":
        ref_code = f"REF-{str(uuid.uuid4())[:8].upper()}"
        profile = AmbassadorProfile(
            user_id=user.id,
            referral_code=ref_code,
            referral_url=f"/register?ref={ref_code}",
            commission_rate=10.00,  # default 10%
            balance=0.00
        )
        db.add(profile)
    
    # Process referral tracking for students
    elif user.role == "student" and user_in.referral_code:
        ambassador = db.query(AmbassadorProfile).filter(
            AmbassadorProfile.referral_code == user_in.referral_code
        ).first()
        if ambassador:
            referral = Referral(
                ambassador_id=ambassador.user_id,
                referred_user_id=user.id,
                status="registered"
            )
            db.add(referral)

    # Log action
    log = AuditLog(
        user_id=user.id,
        action="user_registration",
        details=f"Registered as role: {user.role}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate email and password and return a JWT access token."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated."
        )

    # Generate token
    token_expiry = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=user.id, expires_delta=token_expiry)

    # Log login success
    log = AuditLog(
        user_id=user.id,
        action="user_login",
        details="Successfully logged in"
    )
    db.add(log)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
