import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Award, BookOpen, CheckCircle, XCircle, 
  ArrowRight, TrendingUp, AlertCircle, Sparkles, FileText,
  Calendar, Clock, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StudentExamResult } from '../types';

interface StudentDashboardProps {
  onSelectExam: (examId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onSelectExam }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<StudentExamResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStudentResults();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load published examination results');
    } finally {
      setLoading(false);
    }
  };

  // Aggregated student metrics
  const totalExams = results.length;
  const avgPercentage = totalExams > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalExams) 
    : 0;
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-sm">
              <GraduationCap className="w-3.5 h-3.5" /> Student Examination Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user?.full_name || 'Student'}
            </h1>
            <p className="text-indigo-200 text-sm max-w-xl">
              Access your physical handwritten exam results, faculty-approved marking rubrics, and AI diagnostic feedback.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <div>
              <span className="text-xs text-indigo-200 block">Candidate Roll No</span>
              <span className="text-lg font-mono font-bold text-white tracking-wide">
                {user?.roll_number || '21CS101'}
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="text-xs text-indigo-200 block">Department</span>
              <span className="text-sm font-semibold text-white">
                {user?.department || 'Computer Science'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Published Exams</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalExams}</div>
          <span className="text-xs text-slate-500 mt-1 block">Paper exams evaluated</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{avgPercentage}%</div>
          <span className="text-xs text-slate-500 mt-1 block">Cumulative academic average</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clearance Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{passedExams} of {totalExams} passed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Subject</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {bestResult ? bestResult.subject : '—'}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">
            {bestResult ? `${bestResult.percentage}% marks attained` : 'Awaiting publication'}
          </span>
        </div>
      </div>

      {/* Main Content: Published Exams List & Performance Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Published Examination Cards (2 Columns on Large Screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Published Examination Results
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Verified by Faculty
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600">Retrieving published evaluations...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">No Published Results Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Your paper examination scripts are either still being evaluated by faculty or the examination results have not been officially published yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((res) => (
                <div
                  key={res.exam_id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {res.subject}
                      </span>
                      {res.passed ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Needs Improvement
                        </span>
                      )}
                      {res.rank && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Class Rank #{res.rank} of {res.total_students}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{res.exam_title}</h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {res.exam_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {res.exam_date}
                        </span>
                      )}
                      {res.published_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Published {new Date(res.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{res.student_score}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {res.total_marks}</span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 block">
                        {res.percentage}% Score
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectExam(res.exam_id)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
                    >
                      View Detailed Feedback <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Trend Chart & Responsible AI Explanation */}
        <div className="space-y-6">
          {/* Trend Chart */}
          {chartData.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Academic Performance Curve</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Percentage']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="percentage" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Responsible AI Principles Box */}
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ExamLens Student Evaluation Notice</span>
            </div>
            <p className="text-xs text-indigo-800/90 leading-relaxed">
              Every score published on ExamLens has been evaluated through a rubric-guided semantic AI model and verified by your course faculty.
            </p>
            <div className="space-y-1.5 text-xs text-indigo-900/80">
              <div className="flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>AI evaluates meaning and conceptual understanding, not just rote keywords.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Teachers review handwriting OCR and maintain complete override authority over all marks.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
