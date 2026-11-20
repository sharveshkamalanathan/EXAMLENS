import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, Text
from app.database.session import Base

class TrialRegistration(Base):
    __tablename__ = "trial_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    mobile_number = Column(String(50), nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=False)
    otp_code = Column(String(10), nullable=False)
    otp_expires_at = Column(DateTime, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    trial_status = Column(String(50), default="active", nullable=False)  # pending_verification, active, expired
    trial_start_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
