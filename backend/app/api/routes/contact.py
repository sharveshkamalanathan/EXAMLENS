from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageCreate, ContactMessageResponse

router = APIRouter(prefix="/contact", tags=["Contact Inquiries"])

@router.post("", response_model=ContactMessageResponse)
def submit_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a user or customer inquiry message to the platform administration.
    Stored directly in the database for the admin dashboard inbox.
    """
    msg = ContactMessage(
        name=payload.name.strip(),
        email=str(payload.email).strip().lower(),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        status="unread"
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
