from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.models import PricingRule
from app.schemas.schemas import PricingEstimationRequest, PricingEstimationResponse
from app.core.config import settings

# Default fallback values if DB rules are not initialized
DEFAULT_RULES = {
    "PPT Presentation": {"base": Decimal("30.00"), "per_word": Decimal("0.00"), "per_slide": Decimal("6.00")},
    "Report Formatting": {"base": Decimal("25.00"), "per_word": Decimal("0.04"), "per_slide": Decimal("0.00")},
    "Research Assistance": {"base": Decimal("40.00"), "per_word": Decimal("0.06"), "per_slide": Decimal("0.00")},
    "Proofreading & Editing": {"base": Decimal("15.00"), "per_word": Decimal("0.02"), "per_slide": Decimal("0.00")},
    "Referencing & Citation": {"base": Decimal("20.00"), "per_word": Decimal("0.03"), "per_slide": Decimal("0.00")},
    "Data Analysis": {"base": Decimal("50.00"), "per_word": Decimal("0.05"), "per_slide": Decimal("10.00")},
    "Programming Support": {"base": Decimal("45.00"), "per_word": Decimal("0.08"), "per_slide": Decimal("0.00")},
    "Document Design": {"base": Decimal("25.00"), "per_word": Decimal("0.00"), "per_slide": Decimal("5.00")},
}


def calculate_quote(db: Session, request: PricingEstimationRequest) -> PricingEstimationResponse:
    """Calculate the order quote dynamically based on database configuration or system fallback."""
    # Find matching pricing rule in database
    db_rule = db.query(PricingRule).filter(PricingRule.service_type == request.service_type).first()
    
    if db_rule:
        base_price = db_rule.base_price
        price_per_word = db_rule.price_per_word
        price_per_slide = db_rule.price_per_slide
        urgent_mult = db_rule.urgent_multiplier
        express_mult = db_rule.express_multiplier
    else:
        # Fallback to defaults
        rule = DEFAULT_RULES.get(request.service_type, {"base": Decimal("20.00"), "per_word": Decimal("0.04"), "per_slide": Decimal("4.00")})
        base_price = rule["base"]
        price_per_word = rule["per_word"]
        price_per_slide = rule["per_slide"]
        urgent_mult = Decimal("1.50")
        express_mult = Decimal("2.00")

    # Determine priority multiplier
    if request.priority_level == "urgent":
        priority_multiplier = urgent_mult
    elif request.priority_level == "express":
        priority_multiplier = express_mult
    else:
        priority_multiplier = Decimal("1.00")

    # Calculate subcomponents
    word_count = request.word_count or 0
    slide_count = request.slide_count or 0

    word_cost = Decimal(str(word_count)) * price_per_word
    slide_cost = Decimal(str(slide_count)) * price_per_slide

    raw_total = base_price + word_cost + slide_cost
    estimated_total = round(raw_total * priority_multiplier, 2)
    
    # 30% deposit business model
    deposit_required = round(estimated_total * Decimal("0.30"), 2)
    final_balance = round(estimated_total - deposit_required, 2)

    return PricingEstimationResponse(
        estimated_total=estimated_total,
        deposit_required=deposit_required,
        final_balance=final_balance,
        base_price=base_price,
        word_cost=word_cost,
        slide_cost=slide_cost,
        priority_multiplier=priority_multiplier
    )


def seed_pricing_rules(db: Session):
    """Seed initial rules if the database rules table is empty."""
    if db.query(PricingRule).count() == 0:
        for s_type, rates in DEFAULT_RULES.items():
            rule = PricingRule(
                service_type=s_type,
                base_price=rates["base"],
                price_per_word=rates["per_word"],
                price_per_slide=rates["per_slide"],
                urgent_multiplier=Decimal("1.50"),
                express_multiplier=Decimal("2.00")
            )
            db.add(rule)
        db.commit()
