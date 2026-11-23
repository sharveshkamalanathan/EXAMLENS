import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv

# Load local environment variables from backend/.env and root .env
_backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)
load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL", "examlenses@gmail.com")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("GMAIL_APP_PASSWORD", ""))
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://examlens-m4ji.onrender.com")

def send_otp_email(recipient_email: str, recipient_name: str, otp_code: str) -> dict:
    """
    Dispatches a real-time 6-digit OTP verification email to the user for the 30-Day Free Trial.
    Official sender: examlenses@gmail.com.
    Gracefully handles live SMTP dispatch if credentials exist or provides simulated sandbox delivery.
    """
    clean_recipient = recipient_email.strip().lower()
    clean_name = recipient_name.strip() if recipient_name else "Educator"

    # Fast simulation in unit test runner
    if os.getenv("TESTING") == "1":
        return {
            "sent": True,
            "message": f"Test mode: OTP {otp_code} simulated for {clean_recipient}.",
            "sender": SENDER_EMAIL,
            "demo_otp": otp_code
        }

    subject = f"ExamLens Verification Code: {otp_code} (30-Day Institutional Trial)"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .header {{ background: linear-gradient(135deg, #4338ca, #6366f1); padding: 28px 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0; font-size: 13px; opacity: 0.9; }}
    .body {{ padding: 32px 24px; text-align: center; }}
    .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; text-align: left; }}
    .message {{ font-size: 14px; line-height: 1.6; color: #475569; text-align: left; margin-bottom: 24px; }}
    .otp-box {{ background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; margin: 24px 0; display: inline-block; width: 80%; }}
    .otp-code {{ font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338ca; margin: 0; }}
    .expiry {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
    .features {{ background: #f8fafc; border-radius: 12px; padding: 16px; text-align: left; margin-top: 24px; font-size: 12px; color: #475569; }}
    .features li {{ margin-bottom: 6px; }}
    .footer {{ background: #f1f5f9; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ExamLens Academic Evaluation</h1>
      <p>30-Day Full Institutional Trial Activation</p>
    </div>
    <div class="body">
      <div class="greeting">Hello {clean_name},</div>
      <div class="message">
        Thank you for choosing ExamLens for your institution. To complete your 30-day full access activation, please enter the following 6-digit verification code:
      </div>
      <div class="otp-box">
        <div class="otp-code">{otp_code}</div>
        <div class="expiry">Valid for 10 minutes • Do not share this code with anyone</div>
      </div>
      <div class="features">
        <strong>Included with your 30-Day Institutional Trial:</strong>
        <ul style="padding-left: 20px; margin-top: 8px;">
          <li>Universal Handwriting OCR (Cursive, Block, Q1/q.1/1. formats)</li>
          <li>Semantic AI Partial Credit Marking with custom rubrics</li>
          <li>Faculty Review Workspace with 100% Final Authority</li>
          <li>Student Knowledge Portal with personalized revision tips</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      Dispatched securely from {SENDER_EMAIL}<br>
      © ExamLens Academic Platform • Questions? Contact sharveshofficialmicro@gmail.com
    </div>
  </div>
</body>
</html>"""

    # Prepare MIME Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"ExamLens Verification <{SENDER_EMAIL}>"
    msg["To"] = clean_recipient

    part_text = MIMEText(f"Your ExamLens 30-day trial verification code is: {otp_code}. Valid for 10 minutes.", "plain")
    part_html = MIMEText(html_content, "html")
    msg.attach(part_text)
    msg.attach(part_html)

    # Attempt live SMTP dispatch if credentials provided
    if SMTP_PASSWORD:
        try:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=8) as server:
                server.starttls()
                server.login(SENDER_EMAIL, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, clean_recipient, msg.as_string())
            return {
                "sent": True,
                "message": f"Real-time OTP dispatched to {clean_recipient} via Gmail SMTP from {SENDER_EMAIL}.",
                "sender": SENDER_EMAIL
            }
        except Exception as e:
            # Fallback to simulated delivery without breaking user flow
            return {
                "sent": False,
                "message": f"Email prepared from {SENDER_EMAIL}. (SMTP note: {str(e)})",
                "sender": SENDER_EMAIL,
                "demo_otp": otp_code
            }

    # If SMTP_PASSWORD not set, simulate live dispatch gracefully
    return {
        "sent": False,
        "message": f"Real-time OTP prepared from {SENDER_EMAIL} for {clean_recipient}.",
        "sender": SENDER_EMAIL,
        "demo_otp": otp_code
    }

def send_login_greetings_email(
    recipient_email: str,
    recipient_name: str,
    institution: str = "Academic Institution",
    role: str = "Faculty"
) -> dict:
    """
    Sends a warm welcome / greetings email upon successful sign in or trial activation.
    Dispatched securely from examlenses@gmail.com via Gmail SMTP.
    """
    clean_recipient = recipient_email.strip().lower()
    clean_name = recipient_name.strip() if recipient_name else "Educator"
    clean_inst = institution.strip() if institution else "Academic Campus"

    # Fast simulation in unit test runner
    if os.getenv("TESTING") == "1":
        return {
            "sent": True,
            "message": f"Test mode: greetings email simulated for {clean_recipient}.",
            "sender": SENDER_EMAIL
        }

    subject = f"Welcome to ExamLens, {clean_name}! Your Workspace is Active"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .header {{ background: linear-gradient(135deg, #1e1b4b, #4338ca, #6366f1); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0; font-size: 13px; opacity: 0.9; }}
    .body {{ padding: 32px 28px; text-align: left; }}
    .greeting {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
    .message {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
    .profile-card {{ background: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; }}
    .profile-row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }}
    .profile-row:last-child {{ border-bottom: none; }}
    .profile-label {{ color: #64748b; font-weight: 500; }}
    .profile-value {{ color: #0f172a; font-weight: 700; text-align: right; }}
    .actions-box {{ background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin: 24px 0; }}
    .actions-title {{ font-size: 13px; font-weight: 700; color: #3730a3; margin-bottom: 8px; }}
    .actions-list {{ margin: 0; padding-left: 20px; font-size: 12px; color: #4338ca; line-height: 1.6; }}
    .btn {{ display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-top: 12px; }}
    .security-note {{ font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
    .footer {{ background: #f8fafc; padding: 20px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ExamLens Academic Evaluation</h1>
      <p>AI-Assisted Physical Examination Assessment Platform</p>
    </div>
    <div class="body">
      <div class="greeting">Greetings, {clean_name}! 👋</div>
      <div class="message">
        You have successfully signed in to ExamLens. Your academic evaluation workspace is now unlocked and ready for curriculum assessments.
      </div>

      <div class="profile-card">
        <div class="profile-row">
          <span class="profile-label">Signed-in Email</span>
          <span class="profile-value">{clean_recipient}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Institution Campus</span>
          <span class="profile-value">{clean_inst}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Role Profile</span>
          <span class="profile-value">{role}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Workspace Status</span>
          <span class="profile-value" style="color: #059669;">● Active & Ready</span>
        </div>
      </div>

      <div class="actions-box">
        <div class="actions-title">Your Workspace Highlights:</div>
        <ul class="actions-list">
          <li><strong>Universal OCR:</strong> Rapid recognition of handwritten student scripts and custom question markers (Q1, q.1, 1., etc.).</li>
          <li><strong>Semantic Rubric AI:</strong> Conceptual evaluation against rubrics with verbatim evidence citations.</li>
          <li><strong>Teacher Authority:</strong> Interactive review workspace with complete override authority before publication.</li>
          <li><strong>Institutional Branding:</strong> {clean_inst} displayed prominently under your ExamLens brand logo.</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="{FRONTEND_URL}" class="btn">Launch Your Workspace →</a>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> If you did not initiate this sign-in to ExamLens, please change your password immediately in your account settings or contact administrator support.
      </div>
    </div>
    <div class="footer">
      Sent with precision from {SENDER_EMAIL}<br>
      © ExamLens Academic Platform • Dedicated to fair, transparent physical examination grading.
    </div>
  </div>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"ExamLens <{SENDER_EMAIL}>"
    msg["To"] = clean_recipient

    part_text = MIMEText(
        f"Greetings, {clean_name}!\n\nYou have successfully signed in to ExamLens for {clean_inst}.\nYour workspace is now active at {FRONTEND_URL}.\n\nSent from {SENDER_EMAIL}",
        "plain"
    )
    part_html = MIMEText(html_content, "html")
    msg.attach(part_text)
    msg.attach(part_html)

    if SMTP_PASSWORD:
        try:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=8) as server:
                server.starttls()
                server.login(SENDER_EMAIL, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, clean_recipient, msg.as_string())
            return {
                "sent": True,
                "message": f"Greetings email sent to {clean_recipient} from {SENDER_EMAIL}.",
                "sender": SENDER_EMAIL
            }
        except Exception as e:
            return {
                "sent": False,
                "message": f"SMTP dispatch error: {str(e)}",
                "sender": SENDER_EMAIL
            }

    return {
        "sent": False,
        "message": f"Greetings email prepared for {clean_recipient} from {SENDER_EMAIL}.",
        "sender": SENDER_EMAIL
    }
