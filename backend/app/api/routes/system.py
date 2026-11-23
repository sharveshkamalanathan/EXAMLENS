from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.services.ocr.service import get_ocr_provider
from app.services.ai.service import get_ai_evaluator

router = APIRouter(prefix="/system", tags=["System & Providers"])

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    ocr = get_ocr_provider()
    ai = get_ai_evaluator()

    return {
        "app_name": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "demo_mode": settings.DEMO_MODE,
        "ocr": {
            "active_provider": ocr.provider_name,
            "configured_provider": settings.OCR_PROVIDER,
            "is_configured": ocr.is_configured(),
            "status_label": "Ready (Live Handwriting OCR)" if (ocr.is_configured() and ocr.provider_name != "mock_demo") else "Active (Demo Mode Simulation)",
            "azure_endpoint_set": bool(settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT),
        },
        "ai": {
            "active_provider": ai.provider_name,
            "configured_provider": settings.AI_PROVIDER,
            "model": settings.AI_MODEL,
            "is_configured": bool(settings.AI_API_KEY),
            "status_label": "Ready (Connected)" if bool(settings.AI_API_KEY) else "Active (Intelligent Demo Evaluator)",
            "base_url": settings.AI_BASE_URL
        },
        "storage": {
            "upload_dir": settings.UPLOAD_DIR,
            "processed_dir": settings.PROCESSED_DIR,
            "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB
        },
        "demo_accounts": [
            {"role": "Teacher", "email": "teacher@examlens.edu", "password": "examlens123", "name": "Prof. Rajesh Sharma"},
            {"role": "Student (STU-1024)", "email": "stu101@examlens.edu", "password": "examlens123", "name": "Aarav Sharma"},
            {"role": "Student (STU-1025)", "email": "stu102@examlens.edu", "password": "examlens123", "name": "Priya Nair"},
            {"role": "Admin", "email": "admin@examlens.edu", "password": "examlens123", "name": "Exam Admin NIT"}
        ]
    }

@router.get("/email-diagnostic")
def email_diagnostic(recipient: str = "sharveshofficalmicro@gmail.com"):
    import os
    from email.mime.text import MIMEText
    from app.services.email_service import _dispatch_smtp_email
    
    sender = os.getenv("SENDER_EMAIL") or "examlenses@gmail.com"
    pw = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or "fxjyxvrinycoalby"
    
    msg = MIMEText(f"ExamLens live diagnostic test email to {recipient} from Render production.")
    msg["Subject"] = "ExamLens Diagnostic Delivery Test"
    msg["From"] = f"ExamLens <{sender}>"
    msg["To"] = recipient
    
    sent, detail = _dispatch_smtp_email(msg, recipient)
    return {
        "success": sent,
        "detail": detail,
        "sender": sender,
        "recipient": recipient,
        "pw_configured": bool(pw),
        "pw_length": len(pw) if pw else 0
    }
