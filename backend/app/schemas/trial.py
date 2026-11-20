from typing import Optional
from pydantic import BaseModel, Field

class TrialRequestOTPRequest(BaseModel):
    full_name: Optional[str] = Field("Educator", description="Full name of the faculty or administrator")
    email: str = Field(..., description="Institutional email address")
    institution: Optional[str] = Field("University / College", description="Name of the educational institution")
    password: Optional[str] = Field(None, description="Password created by the user for workspace access")
    mobile_number: Optional[str] = Field(None, description="Optional mobile number")

class TrialRequestOTPResponse(BaseModel):
    success: bool
    message: str
    demo_otp: str = Field(..., description="Demo OTP for instant sandboxed testing")
    email_sent: bool = Field(False, description="Whether live SMTP delivered to email")
    sender_email: str = "examlenses@gmail.com"
    expires_in_seconds: int = 600

class TrialVerifyOTPRequest(BaseModel):
    email: str
    otp_code: str = Field(..., min_length=4, max_length=10)
    password: Optional[str] = None

class TrialVerifyOTPResponse(BaseModel):
    success: bool
    message: str
    trial_status: str
    trial_days_remaining: int
    trial_end_date: str
    institution: str
    full_name: str
    email: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
