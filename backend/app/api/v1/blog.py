from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import BlogPost, LeadCapture, AuditLog
from app.schemas.schemas import BlogPostResponse, LeadCaptureCreate, LeadCaptureResponse, BlogPostCreate

router = APIRouter()

# Seed basic blog posts if empty
MOCK_POSTS = [
    {
        "title": "Mastering Harvard Referencing: A Step-by-Step Guide",
        "slug": "mastering-harvard-referencing",
        "content": "Accurate citations form the cornerstone of academic report writing. In this guide, we break down standard book, journal, and web formatting systems to elevate your citation structure...",
        "category": "Referencing Guides"
    },
    {
        "title": "Sleek Slide Layouts: Design Hacks for Presentation Design",
        "slug": "sleek-slide-layouts-design-hacks",
        "content": "Visual communication is key. Learn how to implement clear layout margins, limit text blocks, choose modern typography colors (like charcoal and teal), and design layouts that command attention.",
        "category": "Presentation Skills"
    },
    {
        "title": "Boost Your Focus: Time-Blocking for Academic Productivity",
        "slug": "time-blocking-academic-productivity",
        "content": "Discover how organizing study hours into dedicated 50-minute task blocks improves retention, mitigates exam stress, and helps you deliver academic reports on schedule.",
        "category": "Productivity"
    }
]


@router.get("", response_model=List[BlogPostResponse])
def get_posts(db: Session = Depends(get_db)):
    """Fetch all published educational study guides and tips articles."""
    posts = db.query(BlogPost).filter(BlogPost.published == True).all()
    if not posts:
        # Auto-seed mock data on first request
        for p in MOCK_POSTS:
            db_post = BlogPost(
                title=p["title"],
                slug=p["slug"],
                content=p["content"],
                category=p["category"],
                published=True
            )
            db.add(db_post)
        db.commit()
        posts = db.query(BlogPost).filter(BlogPost.published == True).all()
    return posts


@router.get("/{slug}", response_model=BlogPostResponse)
def get_post_by_slug(slug: str, db: Session = Depends(get_db)):
    """Fetch article details for a given slug."""
    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.published == True).first()
    if not post:
        raise HTTPException(status_code=404, detail="Article not found")
    return post


@router.post("/lead", response_model=LeadCaptureResponse, status_code=status.HTTP_201_CREATED)
def submit_lead(lead_in: LeadCaptureCreate, db: Session = Depends(get_db)):
    """Capture newsletter subscriptions or free consult requests from public pages."""
    lead = LeadCapture(
        type=lead_in.type,
        email=lead_in.email,
        phone=lead_in.phone,
        name=lead_in.name,
        message=lead_in.message
    )
    db.add(lead)
    
    # Log lead creation audit
    log = AuditLog(
        action="lead_capture",
        details=f"Captured lead type {lead_in.type} for email: {lead_in.email}"
    )
    db.add(log)
    db.commit()
    db.refresh(lead)
    return lead
