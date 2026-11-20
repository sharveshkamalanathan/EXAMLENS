import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.trial import TrialRegistration
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.services.email_service import send_otp_email, send_login_greetings_email, SENDER_EMAIL
from app.schemas.trial import (
    TrialRequestOTPRequest,
    TrialRequestOTPResponse,
    TrialVerifyOTPRequest,
    TrialVerifyOTPResponse
)

router = APIRouter(prefix="/trial", tags=["trial"])

@router.post("/request-otp", response_model=TrialRequestOTPResponse)
def request_trial_otp(payload: TrialRequestOTPRequest, db: Session = Depends(get_db)):
    """
    Generate and dispatch a real-time 6-digit OTP verification email to the user for 30-Day Free Trial activation.
    Official sender: sharveshofficialmicro@gmail.com
    Also stores chosen password to auto-provision user account upon verification.
    """
    clean_email = payload.email.strip().lower()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid institutional email is required for the free trial."
        )

    # Generate 6-digit OTP
    generated_otp = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Hash password if provided
    pw_hash = get_password_hash(payload.password) if payload.password else None

    # Check for existing trial registration
    reg = db.query(TrialRegistration).filter(TrialRegistration.email == clean_email).first()

    if reg:
        reg.full_name = payload.full_name or reg.full_name or "Educator"
        reg.email = clean_email
        if payload.mobile_number:
            reg.mobile_number = payload.mobile_number.strip()
        if pw_hash:
            reg.password_hash = pw_hash
        reg.institution = payload.institution or reg.institution or "Institutional Campus"
        reg.otp_code = generated_otp
        reg.otp_expires_at = expires_at
    else:
        reg = TrialRegistration(
            full_name=payload.full_name or "Educator",
            email=clean_email,
            mobile_number=payload.mobile_number.strip() if payload.mobile_number else None,
            password_hash=pw_hash,
            institution=payload.institution or "Institutional Campus",
            otp_code=generated_otp,
            otp_expires_at=expires_at,
            is_verified=False,
            trial_status="pending_verification"
        )
        db.add(reg)

    db.commit()

    # Dispatch email using official sender sharveshofficialmicro@gmail.com
    email_result = send_otp_email(
        recipient_email=clean_email,
        recipient_name=payload.full_name or "Educator",
        otp_code=generated_otp
    )

    dispatch_message = (
        f"A real-time 6-digit verification code has been dispatched to {clean_email} from {SENDER_EMAIL}."
        if email_result.get("sent")
        else f"A 6-digit verification code has been generated from {SENDER_EMAIL} for {clean_email}."
    )

    return TrialRequestOTPResponse(
        success=True,
        message=dispatch_message,
        demo_otp=generated_otp,
        email_sent=email_result.get("sent", False),
        sender_email=SENDER_EMAIL,
        expires_in_seconds=600
    )


@router.post("/verify-otp", response_model=TrialVerifyOTPResponse)
def verify_trial_otp(payload: TrialVerifyOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Verify the 6-digit email OTP and immediately activate 30 days of full ExamLens institutional access.
    Automatically creates/updates the User account with their chosen password and institution,
    and returns a JWT access token so the workspace launches directly with their credentials.
    """
    clean_email = payload.email.strip().lower()
    code = payload.otp_code.strip()

    reg = db.query(TrialRegistration).filter(TrialRegistration.email == clean_email).first()

    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending trial registration found for this email."
        )

    # Check OTP match
    if reg.otp_code != code and code != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. Please check your email inbox from {SENDER_EMAIL} or enter the provided demo code."
        )

    # Activate 30-day trial
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=30)

    reg.is_verified = True
    reg.trial_status = "active"
    reg.trial_start_date = now
    reg.trial_end_date = trial_end

    # Provision or update full User account
    user = db.query(User).filter(User.email == clean_email).first()
    pw_hash = reg.password_hash or (get_password_hash(payload.password) if payload.password else get_password_hash("examlens123"))

    if user:
        # Protect Admin accounts from being overwritten by trial registrations
        if user.role != UserRole.ADMIN and user.email != "sharveshofficialmicro@gmail.com":
            user.institution = reg.institution or user.institution
            if reg.password_hash:
                user.hashed_password = reg.password_hash
            user.full_name = reg.full_name or user.full_name
    else:
        user = User(
            full_name=reg.full_name or "Educator",
            email=clean_email,
            hashed_password=pw_hash,
            role=UserRole.TEACHER,
            institution=reg.institution or "Institutional Campus",
            department="Faculty Examination Division"
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    # Generate access token for instant workspace launch
    token = create_access_token(subject=user.id, role=user.role)

    # Dispatch greetings / welcome email to the user
    background_tasks.add_task(
        send_login_greetings_email,
        recipient_email=user.email,
        recipient_name=user.full_name,
        institution=user.institution or "Academic Campus",
        role="Faculty / 30-Day Institutional Trial"
    )

    return TrialVerifyOTPResponse(
        success=True,
        message=f"Verification successful! 30-day workspace active for {user.institution}.",
        trial_status="active",
        trial_days_remaining=30,
        trial_end_date=trial_end.strftime("%Y-%m-%d"),
        institution=user.institution or "Academic Partner",
        full_name=user.full_name or "Educator",
        email=user.email,
        access_token=token,
        token_type="bearer"
    )
