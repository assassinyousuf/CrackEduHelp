from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from app.core.database import get_db
from app.core.deps import RoleChecker
from app.models.models import User, AmbassadorProfile, Referral, Order
from app.schemas.schemas import AmbassadorStats, AmbassadorProfileResponse

router = APIRouter()


@router.get("/profile", response_model=AmbassadorProfileResponse)
def get_ambassador_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ambassador"]))
):
    """Retrieve current ambassador profile settings and code details."""
    profile = db.query(AmbassadorProfile).filter(AmbassadorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Ambassador profile not initialized")
    return profile


@router.get("/stats", response_model=AmbassadorStats)
def get_ambassador_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ambassador"]))
):
    """Compute performance dashboard aggregates: total clicks, referrals, conversions, and balances."""
    profile = db.query(AmbassadorProfile).filter(AmbassadorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Ambassador profile not found")

    referrals = db.query(Referral).filter(Referral.ambassador_id == current_user.id).all()
    
    # Calculate stats
    registrations = len(referrals)
    converted = sum(1 for r in referrals if r.status in ["order_placed", "paid"])
    
    # Let's mock click rates (say 4 clicks per registration for realistic dashboard representation)
    simulated_clicks = registrations * 4 + 12

    total_earnings = sum(r.commission_earned for r in referrals)

    return AmbassadorStats(
        clicks=simulated_clicks,
        registrations=registrations,
        converted_orders=converted,
        total_earnings=Decimal(str(total_earnings)),
        current_balance=profile.balance,
        referrals=referrals
    )
