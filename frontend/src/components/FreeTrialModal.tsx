import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Phone, 
  Mail, 
  Building, 
  User as UserIcon, 
  Lock,
  KeyRound, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../utils/audioEffects';

interface FreeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export const FreeTrialModal: React.FC<FreeTrialModalProps> = ({ 
  isOpen, 
  onClose, 
  onActivated 
}) => {
  const { loginWithToken } = useAuth();

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [senderEmail, setSenderEmail] = useState('sharveshofficialmicro@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [trialDetails, setTrialDetails] = useState<any>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Please create a password with at least 4 characters for your workspace account.');
      return;
    }

    if (!institution.trim()) {
      setError('Please enter your university or institution name.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.requestTrialOTP({
        full_name: fullName.trim() || 'Educator',
        email: email.trim(),
        password: password,
        institution: institution.trim(),
        mobile_number: mobileNumber.trim() || undefined
      });

      if (res.success) {
        setDemoOtp(res.demo_otp);
        setOtpCode(res.demo_otp); // Pre-fill with demo code for effortless 1-click testing
        setEmailSent(res.email_sent);
        setSenderEmail(res.sender_email || 'sharveshofficialmicro@gmail.com');
        setCountdown(60);
        setStep('otp');
        soundEffects.playScanTick();
      } else {
        setError(res.message || 'Unable to dispatch verification email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyTrialOTP({
        email: email.trim(),
        otp_code: otpCode.trim(),
        password: password
      });

      if (res.success) {
        setTrialDetails(res);

        // Auto-provision and authenticate user into workspace
        if (res.access_token) {
          loginWithToken(res.access_token, {
            id: res.email,
            email: res.email,
            full_name: res.full_name || fullName || 'Educator',
            role: 'teacher',
            institution: res.institution || institution || 'Institutional Campus',
            department: 'Faculty Examination Division',
            created_at: new Date().toISOString()
          } as any);
        }

        setStep('success');
        soundEffects.playSuccessPing();
      } else {
        setError(res.message || 'Invalid verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.requestTrialOTP({
        full_name: fullName.trim() || 'Educator',
        email: email.trim(),
        password: password,
        institution: institution.trim(),
        mobile_number: mobileNumber.trim() || undefined
      });
      setDemoOtp(res.demo_otp);
      setOtpCode(res.demo_otp);
      setEmailSent(res.email_sent);
      setCountdown(60);
      soundEffects.playScanTick();
    } catch (err: any) {
      setError(err.message || 'Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchWorkspace = () => {
    onClose();
    if (onActivated) {
      onActivated();
    }
  };

  const handleResetAndClose = () => {
    setStep('form');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-card gradient-border-glow shadow-2xl border border-white/40 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-gradient-to-tr from-brand-500/20 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  30-Day Free Trial
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Instant Access
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified real-time via official sender <code className="text-brand-600 dark:text-brand-400 font-mono text-[11px] font-semibold">{senderEmail}</code>
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 relative max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Registration Form with Email OTP & Password Creation */}
          {step === 'form' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              {/* Value highlights pill */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited Handwriting OCR</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Semantic Rubric AI Marking</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Real-time Email OTP</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>No credit card required</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Prof. David Miller"
                    className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email (For Real-time OTP) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david.miller@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  We will dispatch your 6-digit confirmation code directly to this email from <strong className="text-brand-600 dark:text-brand-400">{senderEmail}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Create Workspace Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password for your 30-day workspace"
                    className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  This will be your login password to access your workspace.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institution / University Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Stanford University / Indian Institute of Technology"
                    className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 font-medium">
                  This institution name will appear prominently under the ExamLens logo in your workspace.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 group cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Dispatching Real-time Code...' : 'Send Real-time Email OTP'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* STEP 2: Email OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-4 bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/60 rounded-2xl text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-brand-100 dark:bg-brand-900/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-2">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Enter 6-Digit Email Code
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Dispatched to <strong className="text-slate-900 dark:text-white">{email}</strong>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Official Sender: <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{senderEmail}</span>
                </p>

                {/* Instant Sandbox Testing Badge */}
                {demoOtp && (
                  <div 
                    onClick={() => setOtpCode(demoOtp)}
                    className="mt-3 inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-brand-300 dark:border-brand-700 rounded-full text-xs font-medium text-brand-700 dark:text-brand-300 shadow-sm cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                    <span>Your Verification OTP: <strong className="tracking-widest font-mono text-sm">{demoOtp}</strong> (Click to auto-apply)</span>
                  </div>
                )}

                {!emailSent && (
                  <div className="mt-3 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 text-left">
                    <span className="font-bold">Why isn't it in your mailbox yet?</span>
                    <p className="mt-0.5 text-amber-700 dark:text-amber-300 leading-relaxed">
                      Google requires a free 16-character <strong>Gmail App Password</strong> for <code className="font-mono">{senderEmail}</code> to deliver live emails to real inboxes. Your generated code is <strong>{demoOtp}</strong> (pre-filled below). Once you add the App Password to <code className="font-mono">backend/.env</code>, live emails will land directly in your inbox.
                    </p>
                  </div>
                )}

                {emailSent && (
                  <div className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-left flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live email dispatched via Gmail SMTP to your inbox from {senderEmail}. Please check your inbox or spam folder.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">
                  Verification Code
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 px-4 glass-input rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expires in: {Math.floor(countdown / 60)}:{countdown % 60 < 10 ? `0${countdown % 60}` : countdown % 60}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="font-medium text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  Resend Email Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Verifying Code...' : 'Verify OTP & Activate 30-Day Trial'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Change email or account details
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Celebration & Direct Workspace Launch */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/20 animate-pulse-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  30-Day Trial Workspace Created!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your account has been created for <strong className="text-slate-900 dark:text-white">{trialDetails?.email || email}</strong>. Your institutional workspace is fully unlocked.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-slate-500">Institution</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{trialDetails?.institution || institution}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-slate-500">Account Email</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{trialDetails?.email || email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-slate-500">Trial Valid Through</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{trialDetails?.trial_end_date || '30 days from today'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Logo Branding</span>
                  <span className="px-2 py-0.5 bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300 rounded font-semibold text-[10px]">
                    Displaying under ExamLens logo
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchWorkspace}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Launch Workspace for {trialDetails?.institution || institution || 'Your Institution'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
