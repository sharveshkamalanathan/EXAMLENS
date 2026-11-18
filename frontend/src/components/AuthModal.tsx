import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Building, Briefcase, Hash, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('National Institute of Technology');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, loginAsDemo } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          full_name: fullName,
          email,
          password,
          role,
          institution,
          department,
          roll_number: role === 'student' ? rollNumber : undefined
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole: 'teacher' | 'student-1' | 'student-2' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemo(demoRole);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Sign in to ExamLens' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' 
                ? 'Enter your institutional credentials or choose a demo profile.'
                : 'Join ExamLens to evaluate or view handwritten exam results.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Profiles Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center space-x-1.5 mb-2 text-xs font-semibold text-brand-800">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Instant Demo Sign-in (No typing needed)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoClick('teacher')}
              className="p-2 text-left bg-white border border-brand-200 hover:border-brand-500 hover:bg-brand-50/50 rounded-lg transition-all shadow-sm group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-brand-700">Prof. Rajesh Sharma</div>
              <div className="text-[10px] text-slate-500">Teacher / Evaluator</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('student-1')}
              className="p-2 text-left bg-white border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 rounded-lg transition-all shadow-sm group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-brand-700">Aarav Sharma</div>
              <div className="text-[10px] text-slate-500">Student (STU-1024)</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('student-2')}
              className="p-2 text-left bg-white border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 rounded-lg transition-all shadow-sm group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-brand-700">Priya Nair</div>
              <div className="text-[10px] text-slate-500">Student (STU-1025)</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('admin')}
              className="p-2 text-left bg-white border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 rounded-lg transition-all shadow-sm group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-brand-700">Exam Admin NIT</div>
              <div className="text-[10px] text-slate-500">Administrator</div>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">I am registering as:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      role === 'teacher'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Teacher / Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      role === 'student'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              {role === 'student' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Roll / Registration Number</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. STU-1024"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nit.edu"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-brand-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : (mode === 'login' ? 'Sign in' : 'Create Account')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
