import os
import smtplib
import ssl
import json
import urllib.request
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
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or "fxjyxvrinycoalby"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://examlens-m4ji.onrender.com")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY") or os.getenv("SENDINBLUE_API_KEY", "")
EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID") or "service_javpoj9"
EMAILJS_TEMPLATE_ID = os.getenv("EMAILJS_TEMPLATE_ID") or "template_afsdesm"
EMAILJS_PUBLIC_KEY = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID") or "IqgCK6r0PxCtxQHeN"
EMAILJS_PRIVATE_KEY = os.getenv("EMAILJS_PRIVATE_KEY") or os.getenv("EMAILJS_ACCESS_TOKEN") or "uBykCJEo6enV241M0-PSO"

def _dispatch_emailjs_https(
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
    recipient_name: str = "Educator",
    otp_code: str = ""
) -> tuple[bool, str]:
    """
    Sends email via EmailJS REST API over HTTPS (Port 443).
    Bypasses cloud provider SMTP firewall blocks.
    Requires NO phone number, NO domain, connects directly to user Gmail.
    """
    service_id = os.getenv("EMAILJS_SERVICE_ID") or EMAILJS_SERVICE_ID
    template_id = os.getenv("EMAILJS_TEMPLATE_ID") or EMAILJS_TEMPLATE_ID
    public_key = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID") or EMAILJS_PUBLIC_KEY
    private_key = os.getenv("EMAILJS_PRIVATE_KEY") or os.getenv("EMAILJS_ACCESS_TOKEN") or EMAILJS_PRIVATE_KEY

    if not service_id or not template_id or not public_key:
        return False, "EMAILJS credentials not fully configured"

    payload = {
        "service_id": service_id.strip(),
        "template_id": template_id.strip(),
        "user_id": public_key.strip(),
        "template_params": {
            "to_name": recipient_name or "Educator",
            "to_email": recipient,
            "recipient_email": recipient,
            "otp_code": otp_code,
            "subject": subject,
            "message": text_content,
            "html_content": html_content
        }
    }
    if private_key:
        payload["accessToken"] = private_key.strip()

    try:
        req = urllib.request.Request(
            "https://api.emailjs.com/api/v1.0/email/send",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "ExamLens/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            return True, f"Delivered via EmailJS HTTPS ({resp_body or 'OK'})"
    except urllib.error.HTTPError as he:
        try:
            err_data = he.read().decode("utf-8")
        except Exception:
            err_data = str(he)
        return False, f"EmailJS HTTPS error ({err_data})"
    except Exception as e:
        return False, f"EmailJS error: {str(e)}"

def _dispatch_brevo_https(recipient: str, subject: str, html_content: str, text_content: str) -> tuple[bool, str]:
    """
    Sends email via Brevo's (Sendinblue) REST API over HTTPS (Port 443).
    Allows sending to ANY recipient email without requiring a custom domain.
    100% free (300 emails/day).
    """
    api_key = os.getenv("BREVO_API_KEY") or os.getenv("SENDINBLUE_API_KEY") or BREVO_API_KEY
    if not api_key:
        return False, "BREVO_API_KEY not configured"

    sender_email = os.getenv("BREVO_SENDER") or os.getenv("SENDER_EMAIL") or "examlenses@gmail.com"
    payload = {
        "sender": {"name": "ExamLens", "email": sender_email},
        "to": [{"email": recipient}],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content
    }

    try:
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "api-key": api_key.strip(),
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "ExamLens/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, f"Delivered via Brevo HTTPS (ID: {data.get('messageId', 'ok')})"
    except urllib.error.HTTPError as he:
        try:
            err_data = json.loads(he.read().decode("utf-8"))
            err_msg = err_data.get("message", str(he))
        except Exception:
            err_msg = str(he)
        return False, f"Brevo HTTPS ({err_msg})"
    except Exception as e:
        return False, f"Brevo HTTPS error: {str(e)}"

def _dispatch_resend_https(recipient: str, subject: str, html_content: str, text_content: str) -> tuple[bool, str]:
    """
    Sends email via Resend's REST API over HTTPS (Port 443).
    Bypasses cloud provider SMTP firewall blocks (e.g. Render Free Tier blocking ports 465/587).
    """
    api_key = os.getenv("RESEND_API_KEY") or RESEND_API_KEY
    if not api_key:
        return False, "RESEND_API_KEY not configured"

    from_addr = os.getenv("RESEND_FROM", "ExamLens <onboarding@resend.dev>")
    payload = {
        "from": from_addr,
        "to": [recipient],
        "subject": subject,
        "html": html_content,
        "text": text_content
    }

    try:
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key.strip()}",
                "Content-Type": "application/json",
                "User-Agent": "ExamLens/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, f"Delivered via Resend HTTPS (ID: {data.get('id', 'ok')})"
    except urllib.error.HTTPError as he:
        try:
            err_data = json.loads(he.read().decode("utf-8"))
            err_msg = err_data.get("message", str(he))
        except Exception:
            err_msg = str(he)
        return False, f"Resend HTTPS ({err_msg})"
    except Exception as e:
        return False, f"Resend HTTPS API error: {str(e)}"

def _dispatch_email(
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str,
    msg: MIMEMultipart,
    recipient_name: str = "Educator",
    otp_code: str = ""
) -> tuple[bool, str]:
    """
    Unified email dispatcher:
    1. Checks for EmailJS HTTPS API (Port 443) - zero phone number, connects to Gmail.
    2. Checks for Brevo HTTPS API (Port 443) - sends to ANY recipient without domain.
    3. Checks for Resend HTTPS API (Port 443).
    4. Falls back to Gmail SMTP SSL (Port 465).
    5. Falls back to Gmail STARTTLS (Port 587).
    """
    errors = []

    # 1. Try EmailJS HTTPS API if configured (No phone number, sends directly via user Gmail)
    if os.getenv("EMAILJS_SERVICE_ID") or EMAILJS_SERVICE_ID:
        sent, info = _dispatch_emailjs_https(recipient, subject, html_content, text_content, recipient_name=recipient_name, otp_code=otp_code)
        if sent:
            return True, info
        errors.append(info)

    # 2. Try Brevo HTTPS API if configured (Send to any email address, 100% free)
    if os.getenv("BREVO_API_KEY") or os.getenv("SENDINBLUE_API_KEY") or BREVO_API_KEY:
        sent, info = _dispatch_brevo_https(recipient, subject, html_content, text_content)
        if sent:
            return True, info
        errors.append(info)

    # 3. Try Resend HTTPS API if configured
    if os.getenv("RESEND_API_KEY") or RESEND_API_KEY:
        sent, info = _dispatch_resend_https(recipient, subject, html_content, text_content)
        if sent:
            return True, info
        errors.append(info)

    # 3. Try Direct SMTP (Works locally or on paid Render / standard cloud)
    pw = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or SMTP_PASSWORD or "fxjyxvrinycoalby"
    sender = os.getenv("SENDER_EMAIL") or SENDER_EMAIL or "examlenses@gmail.com"
    server_host = os.getenv("SMTP_SERVER") or SMTP_SERVER or "smtp.gmail.com"

    # Try Port 465 (Direct SSL)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(server_host, 465, context=context, timeout=8) as s:
            s.login(sender, pw)
            s.sendmail(sender, recipient, msg.as_string())
        return True, f"Dispatched via SSL port 465 from {sender}"
    except Exception as e1:
        errors.append(f"Port 465 SSL: {str(e1)}")

    # Try Port 587 (STARTTLS)
    try:
        with smtplib.SMTP(server_host, 587, timeout=8) as s:
            s.starttls()
            s.login(sender, pw)
            s.sendmail(sender, recipient, msg.as_string())
        return True, f"Dispatched via STARTTLS port 587 from {sender}"
    except Exception as e2:
        errors.append(f"Port 587 STARTTLS: {str(e2)}")

    # Cloud firewall notice if network unreachable
    combined = " | ".join(errors)
    if "Network is unreachable" in combined or "Errno 101" in combined:
        combined += " [Render Free Tier blocks outbound SMTP ports 465/587. Add RESEND_API_KEY in Render to send via HTTPS Port 443]"

    return False, combined

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
      <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.png" width="56" height="56" alt="🙏 Vanakkam" style="display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));" />
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

    # Attempt live email dispatch (HTTPS EmailJS, Brevo, Resend or direct SMTP fallback)
    text_content = part_text.get_payload()
    sent, dispatch_info = _dispatch_email(
        clean_recipient,
        subject,
        html_content,
        text_content,
        msg,
        recipient_name=clean_name,
        otp_code=otp_code
    )
    if sent:
        return {
            "sent": True,
            "message": f"Real-time OTP dispatched to {clean_recipient} ({dispatch_info}).",
            "sender": os.getenv("SENDER_EMAIL") or "examlenses@gmail.com",
            "demo_otp": otp_code
        }
    else:
        return {
            "sent": False,
            "message": f"OTP generated. Delivery note: {dispatch_info}",
            "sender": os.getenv("SENDER_EMAIL") or "examlenses@gmail.com",
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

    # Attempt live email dispatch (HTTPS EmailJS, Brevo, Resend or direct SMTP fallback)
    text_content = part_text.get_payload()
    sent, dispatch_info = _dispatch_email(
        clean_recipient,
        subject,
        html_content,
        text_content,
        msg,
        recipient_name=clean_name,
        otp_code=otp_code
    )
    sender = os.getenv("SENDER_EMAIL") or "examlenses@gmail.com"
    if sent:
        return {
            "sent": True,
            "message": f"Greetings email sent to {clean_recipient} ({dispatch_info}).",
            "sender": sender
        }
    else:
        return {
            "sent": False,
            "message": f"Greetings email simulated for {clean_recipient}. Delivery note: {dispatch_info}",
            "sender": sender
        }
