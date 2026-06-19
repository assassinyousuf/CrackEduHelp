import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.models import PricingRule
from app.services.pricing import seed_pricing_rules

# Setup in-memory SQLite database for test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Override database dependency in FastAPI application
app.dependency_overrides[get_db] = override_get_db

# Initialize database schemas
Base.metadata.create_all(bind=engine)

# Seed basic rates for testing
db_session = TestingSessionLocal()
seed_pricing_rules(db_session)
db_session.close()

client = TestClient(app)


def test_read_root():
    """Verify that root endpoint responds successfully."""
    response = client.get("/")
    assert response.status_code == 200
    assert "CreackEduHelp API" in response.json()["message"]


def test_pricing_estimation():
    """Verify that the pricing engine returns mathematically correct values."""
    payload = {
        "service_type": "Report Formatting",
        "word_count": 2000,
        "slide_count": 0,
        "priority_level": "standard"
    }
    response = client.post("/api/v1/orders/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Report base = 25.00, word rate = 0.04 -> 25 + 2000 * 0.04 = 105.00
    # Deposit required = 30% of 105.00 = 31.50
    assert float(data["estimated_total"]) == 105.00
    assert float(data["deposit_required"]) == 31.50
    assert float(data["final_balance"]) == 73.50


def test_user_registration_and_login():
    """Verify registration, duplicate checking, and token issuing."""
    # 1. Register a student
    reg_payload = {
        "email": "teststudent@creackeduhelp.com",
        "password": "securepassword123",
        "full_name": "Test Student Persona",
        "role": "student"
    }
    response = client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    assert response.json()["email"] == "teststudent@creackeduhelp.com"

    # 2. Re-register duplicate email (should fail)
    response_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert response_dup.status_code == 400

    # 3. Log in with password
    login_payload = {
        "email": "teststudent@creackeduhelp.com",
        "password": "securepassword123"
      }
    response_login = client.post("/api/v1/auth/login", json=login_payload)
    assert response_login.status_code == 200
    data = response_login.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "teststudent@creackeduhelp.com"


def test_ethical_compliance_guards():
    """Verify description blocks requests containing academic misconduct keywords."""
    reg_payload = {
        "email": "student2@creackeduhelp.com",
        "password": "securepassword123",
        "full_name": "Ethical Student",
        "role": "student"
    }
    response = client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 201
    
    # Get auth token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student2@creackeduhelp.com",
        "password": "securepassword123"
    })
    token = login_res.json()["access_token"]
    
    # Try submitting order with prohibited cheating keywords
    order_payload = {
        "title": "Exam Assistance",
        "university": "Oxford",
        "course_name": "Maths",
        "service_type": "Report Formatting",
        "task_description": "Can you do my exam for me please?",
        "word_count": 500,
        "deadline": "2026-07-20T12:00:00Z",
        "priority_level": "standard"
    }
    
    # Send request with authorization token
    response_cheat = client.post(
        "/api/v1/orders", 
        json=order_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    # Backend validation check triggers error
    assert response_cheat.status_code == 422 or response_cheat.status_code == 400
