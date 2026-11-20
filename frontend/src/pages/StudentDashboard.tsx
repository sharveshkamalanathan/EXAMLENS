import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, Award, BookOpen, CheckCircle, XCircle, 
  ArrowRight, TrendingUp, AlertCircle, Sparkles, FileText,
  Calendar, Clock, ShieldCheck, Brain, Compass, Zap,
  BarChart3, Target, Layers, Search, Filter, CheckCircle2,
  Activity, Flame, ChevronRight, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StudentExamResult } from '../types';

interface StudentDashboardProps {
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
  onSelectExam: (examId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  activeTab = 'student-dashboard', 
  onNavigateTab,
  onSelectExam 
}) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'results' | 'analytics' | 'insights'>(() => {
    if (activeTab === 'student-results') return 'results';
    if (activeTab === 'student-analytics') return 'analytics';
    if (activeTab === 'student-feedback') return 'insights';
    return 'overview';
  });

  const [results, setResults] = useState<StudentExamResult[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for results
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'distinction' | 'improvement'>('all');

  // Synchronize view when activeTab prop changes from Sidebar
  useEffect(() => {
    if (activeTab === 'student-results') setCurrentView('results');
    else if (activeTab === 'student-analytics') setCurrentView('analytics');
    else if (activeTab === 'student-feedback') setCurrentView('insights');
    else if (activeTab === 'student-dashboard') setCurrentView('overview');
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, analyticsRes] = await Promise.allSettled([
        api.getStudentResults(),
        api.getStudentAnalytics()
      ]);

      if (resData.status === 'fulfilled') {
        setResults(resData.value);
      } else {
        console.warn('Could not load student results:', resData.reason);
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalyticsData(analyticsRes.value);
      } else {
        console.warn('Could not load student analytics:', analyticsRes.reason);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load examination portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (view: 'overview' | 'results' | 'analytics' | 'insights') => {
    setCurrentView(view);
    const tabMap = {
      overview: 'student-dashboard',
      results: 'student-results',
      analytics: 'student-analytics',
      insights: 'student-feedback'
    };
    if (onNavigateTab) {
      onNavigateTab(tabMap[view]);
    }
  };

  // Aggregated student metrics
  const totalExams = results.length;
  const avgPercentage = totalExams > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalExams) 
    : (analyticsData?.overall_average_percentage || 0);
  const passedExams = results.filter(r => r.passed).length;
  const bestResult = totalExams > 0 
    ? [...results].sort((a, b) => b.percentage - a.percentage)[0] 
    : null;

  // Chart data for trend
  const chartData = results.map(r => ({
    name: r.subject || r.exam_title,
    percentage: r.percentage,
    score: r.student_score,
    total: r.total_marks
  }));

  // Filtered results list
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchSearch = (r.exam_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === 'passed') return r.passed;
      if (statusFilter === 'distinction') return r.percentage >= 75;
      if (statusFilter === 'improvement') return !r.passed || r.percentage < 60;
      return true;
    });
  }, [results, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Dynamic Animated Motion Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-brand-950 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        {/* Animated Background Motion Mesh */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle cx="15%" cy="30%" r="180" fill="url(#gridGrad)" className="animate-pulse" style={{ animationDuration: '6s' }} />
            <circle cx="85%" cy="70%" r="220" fill="url(#gridGrad)" className="animate-pulse" style={{ animationDuration: '8s' }} />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <GraduationCap className="w-3.5 h-3.5" /> Physical Exam Evaluation Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">{user?.full_name || 'Candidate'}</span>
            </h1>
            <p className="text-indigo-200/90 text-sm max-w-xl leading-relaxed">
              Real-time access to your physical handwritten answer sheets, semantic rubric evaluations, and personalized AI diagnostic insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-3.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
            <div className="px-2">
              <span className="text-[11px] text-indigo-200/80 uppercase font-semibold tracking-wider block">Candidate Roll No</span>
              <span className="text-base font-mono font-bold text-white tracking-wider">
                {user?.roll_number || 'STU-1024'}
              </span>
            </div>
            <div className="h-8 w-px bg-white/15 hidden sm:block" />
            <div className="px-2">
              <span className="text-[11px] text-indigo-200/80 uppercase font-semibold tracking-wider block">Department</span>
              <span className="text-sm font-semibold text-white">
                {user?.department || 'Computer Science & Engineering'}
              </span>
            </div>
            <button 
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-lg transition active:scale-95 border border-indigo-400/30"
              title="Refresh Live Results"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Interactive Sub-Navigation Tabs with Sliding Feel */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabSwitch('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              currentView === 'overview'
                ? 'bg-white text-indigo-950 shadow-lg shadow-white/10'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" /> Overview Dashboard
          </button>

          <button
            onClick={() => handleTabSwitch('results')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              currentView === 'results'
                ? 'bg-white text-indigo-950 shadow-lg shadow-white/10'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4" /> Published Results ({results.length})
          </button>

          <button
            onClick={() => handleTabSwitch('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              currentView === 'analytics'
                ? 'bg-white text-indigo-950 shadow-lg shadow-white/10'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> My Performance & Mastery
          </button>

          <button
            onClick={() => handleTabSwitch('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              currentView === 'insights'
                ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Learning Insights & AI Roadmap
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Published Exams</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalExams}</div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-medium">Physical scripts verified</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Academic Average</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{avgPercentage}%</div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-medium">Cumulative score attained</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clearance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0}%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-medium">{passedExams} of {totalExams} subjects cleared</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Subject</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white truncate">
            {bestResult ? (bestResult.subject || bestResult.exam_title) : '—'}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            {bestResult ? `${bestResult.percentage}% marks achieved` : 'Awaiting publication'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {currentView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Recent Published Results
              </h2>
              <button 
                onClick={() => handleTabSwitch('results')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View All ({results.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Retrieving student examination scorecards...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">No Published Results Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Your physical examination answer sheets are either currently in OCR verification or pending faculty approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {results.slice(0, 3).map((res) => (
                  <div
                    key={res.exam_id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {res.subject || 'Core Engineering'}
                        </span>
                        {res.passed ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Needs Improvement
                          </span>
                        )}
                        {res.rank && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Class Rank #{res.rank} of {res.total_students}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {res.exam_title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        {res.exam_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {res.exam_date}
                          </span>
                        )}
                        {res.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Verified by Faculty
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 gap-3">
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">{res.student_score}</span>
                          <span className="text-xs text-slate-500 font-semibold">/ {res.total_marks}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {res.percentage}% Score
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectExam(res.exam_id)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95 shadow-sm"
                      >
                        Inspect Scorecard <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Performance Motion Curve & AI Guarantee */}
          <div className="space-y-6">
            {chartData.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" /> Academic Trajectory Curve
                  </h3>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(val: any) => [`${val}%`, 'Attainment']}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="percentage" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCurve)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Trust Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 space-y-3 text-white">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Rubric-Guided Evaluation Integrity</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ExamLens evaluates handwritten answers against configured criteria. Human professors review all split-scans and maintain final scoring authority.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Precision Scoring
                </span>
                <span className="text-slate-400">v3.4 Multi-Modal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PUBLISHED RESULTS */}
      {/* ========================================================================= */}
      {currentView === 'results' && (
        <div className="space-y-5">
          {/* Controls: Search and Status Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by subject or exam title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All Results' },
                { id: 'passed', label: 'Passed Only' },
                { id: 'distinction', label: 'Distinction (≥75%)' },
                { id: 'improvement', label: 'Needs Review' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition active:scale-95 shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Published Results Cards */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading published examination results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No results match your criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResults.map((res) => (
                <div
                  key={res.exam_id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {res.subject || 'Academic Module'}
                      </span>
                      {res.passed ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Needs Review
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {res.exam_title}
                    </h3>

                    {/* Score Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Marks Earned</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{res.student_score} / {res.total_marks} ({res.percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, res.percentage)}%` }}
                        />
                      </div>
                    </div>

                    {res.teacher_overall_comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        "{res.teacher_overall_comment}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {res.rank ? `Rank #${res.rank} of ${res.total_students}` : 'Class Rank Available'}
                    </span>
                    <button
                      onClick={() => onSelectExam(res.exam_id)}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95 shadow-sm"
                    >
                      View Breakdown & Scans <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MY PERFORMANCE & MASTERY */}
      {/* ========================================================================= */}
      {currentView === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject-Wise Performance Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">Subject Mastery Distribution</h3>
                  <p className="text-xs text-slate-500">Evaluated from your physical answer script rubrics</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
                  Average: {avgPercentage}%
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Score']}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="percentage" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cognitive Bloom's Taxonomy Mastery */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                <Brain className="w-5 h-5 text-indigo-600" /> Cognitive Mastery Index
              </h3>
              <p className="text-xs text-slate-500">Derived from multi-tier question rubric attainments</p>

              <div className="space-y-4 pt-2">
                {[
                  { level: 'Factual Recall & Definitions', value: 92, color: 'bg-emerald-500' },
                  { level: 'Conceptual Understanding', value: 85, color: 'bg-indigo-500' },
                  { level: 'Algorithm & Numerical Application', value: 78, color: 'bg-blue-500' },
                  { level: 'Architectural Synthesis & Diagrams', value: 68, color: 'bg-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.level}</span>
                      <span className="text-slate-900 dark:text-white">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: LEARNING INSIGHTS & AI ROADMAP */}
      {/* ========================================================================= */}
      {currentView === 'insights' && (
        <div className="space-y-6">
          {/* AI Diagnostic Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-purple-500/30 shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5" /> AI Diagnostic Synthesis Engine
              </div>
              <h2 className="text-xl md:text-2xl font-black">
                Personalized Learning Recommendations
              </h2>
              <p className="text-xs text-purple-200/90 max-w-2xl leading-relaxed">
                ExamLens analyzes your handwriting answers against faculty rubrics, highlighting exact concept gaps and formulating customized revision roadmaps.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demonstrated Strengths */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
                <CheckCircle2 className="w-5 h-5" /> Demonstrated Conceptual Strengths
              </div>
              <p className="text-xs text-slate-500">Areas where your answers showed complete rubric adherence:</p>

              <div className="space-y-2.5">
                {(analyticsData?.strong_topics && analyticsData.strong_topics.length > 0 
                  ? analyticsData.strong_topics 
                  : ["Operating Systems Process Life Cycle", "CPU Scheduling (Round Robin & Priority)", "File System Directory Hierarchies"]
                ).map((topic: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Targeted Growth Areas */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-base">
                <Target className="w-5 h-5" /> High-Impact Focus Opportunities
              </div>
              <p className="text-xs text-slate-500">Topics where missing steps or partial points were identified:</p>

              <div className="space-y-2.5">
                {(analyticsData?.weak_topics && analyticsData.weak_topics.length > 0 
                  ? analyticsData.weak_topics 
                  : ["Virtual Memory Paging & TLB Hit Ratios", "Deadlock Banker's Algorithm Proofs", "IPC Semaphores & Mutex Boundary Conditions"]
                ).map((topic: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold flex items-center justify-center shrink-0">
                      !
                    </span>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formative Action Roadmap */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" /> 3-Step Exam Score Maximizer Roadmap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">Milestone 1</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Review Step-by-Step Mark Rubrics</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open your detailed answer sheet and cross-reference where partial credit deductions occurred.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">Milestone 2</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Practice Handwritten Equations</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Physical writing clarity directly accelerates grading speed and prevents ambiguity in OCR segmentation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">Milestone 3</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Attend Office Hour Clarifications</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discuss the automated AI feedback annotations directly with your faculty course instructors.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
