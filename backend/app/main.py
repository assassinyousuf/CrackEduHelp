from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User
from app.services.pricing import seed_pricing_rules

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.orders import router as orders_router
from app.api.v1.payments import router as payments_router
from app.api.v1.chat import router as chat_router
from app.api.v1.referrals import router as referrals_router
from app.api.v1.blog import router as blog_router
from app.api.v1.admin import router as admin_router

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CreackEduHelp Academic Support & Productivity API platform.",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # update to specific hosts in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Execute startup database seeding operations."""
    db = SessionLocal()
    try:
        # 1. Seed pricing rules
        seed_pricing_rules(db)
        
        # 2. Seed initial testing accounts if empty
        # Admin account
        admin_email = "admin@creackeduhelp.com"
        if not db.query(User).filter(User.email == admin_email).first():
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("adminpass123"),
                full_name="System Administrator",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            
        # Specialist account
        spec_email = "specialist@creackeduhelp.com"
        if not db.query(User).filter(User.email == spec_email).first():
            spec_user = User(
                email=spec_email,
                hashed_password=get_password_hash("specpass123"),
                full_name="Dr. Sarah Jenkins (PPT/Report Specialist)",
                role="specialist",
                is_active=True
            )
            db.add(spec_user)
            
        db.commit()
    finally:
        db.close()


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to CreackEduHelp API. Visit /docs for Swagger interactive endpoints."}


# Register routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(orders_router, prefix=f"{settings.API_V1_STR}/orders", tags=["Orders"])
app.include_router(payments_router, prefix=f"{settings.API_V1_STR}/payments", tags=["Payments"])
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["Chat"])
app.include_router(referrals_router, prefix=f"{settings.API_V1_STR}/referrals", tags=["Referrals"])
app.include_router(blog_router, prefix=f"{settings.API_V1_STR}/blog", tags=["Marketing & Blog"])
app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin Panel"])
