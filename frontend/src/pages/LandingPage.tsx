import React from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  BarChart2, 
  ShieldCheck, 
  ArrowRight, 
  UploadCloud, 
  ScanText, 
  Cpu, 
  CheckSquare, 
  Share2, 
  Clock, 
  AlertCircle,
  Eye,
  Sliders,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onNavigateTab }) => {
  const { user, role, loginAsDemo } = useAuth();

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>AI Evaluates. Teacher Verifies. Student Learns.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] mb-6">
              See beyond <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-700">the answer.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10">
              AI-assisted examination evaluation that understands handwritten answers, evaluates concepts against custom rubrics, and keeps teachers in complete control of the final marks.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => loginAsDemo('teacher')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <span>Explore Live Demo (Teacher)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Designed specifically for physical pen-and-paper examinations in colleges & universities.
            </p>
          </div>

          {/* Realistic Product Mockup: Split-Screen Grading */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
            {/* Mockup Title bar */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-300">ExamLens Review Center — STU-1024 (Aarav Sharma)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold text-[10px]">
                  Rubric AI Active
                </span>
                <span className="text-[11px] text-slate-400">Teacher Final Authority</span>
              </div>
            </div>

            {/* Split Screen Layout Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50">
              {/* Left Side: Scanned Handwritten Sheet */}
              <div className="p-6 bg-amber-50/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <ScanText className="w-4 h-4 text-brand-600" />
                      <span>Physical Scanned Script (Page 1)</span>
                    </span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      OCR Confidence: 94%
                    </span>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 space-y-2.5 shadow-sm leading-relaxed">
                    <p className="text-brand-900 font-bold border-b border-slate-100 pb-1">
                      Q1. Paging in Operating Systems
                    </p>
                    <p className="bg-brand-50/50 p-1.5 rounded border border-brand-100">
                      "Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. In paging, the logical address space is divided into pages, and physical memory is divided into frames..."
                    </p>
                    <p className="text-slate-600">
                      "The page table maps logical pages to physical frames. Address translation splits logical address into page number (p) and offset (d)..."
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Zoom: 100% | Orientation: Normal</span>
                  <span className="text-brand-600 font-medium">Original upload preserved</span>
                </div>
              </div>

              {/* Right Side: AI Rubric Evaluation & Teacher Override */}
              <div className="p-6 bg-white space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>Semantic Rubric Evaluation</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    Awarded: <span className="text-brand-600">4.5</span> / 5.0
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">1. Definition & Separation</p>
                      <p className="text-[11px] text-slate-500">Accurately identifies non-contiguous mapping.</p>
                      <p className="text-[10px] text-emerald-700 font-mono mt-1">Evidence: "eliminates contiguous allocation..."</p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">1.0 / 1.0</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">2. Address Translation (p, d)</p>
                      <p className="text-[11px] text-slate-500">Correctly describes logical-to-physical translation.</p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">1.0 / 1.0</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">3. Fragmentation Impact</p>
                      <p className="text-[11px] text-slate-500">Mentions external fragmentation; missed internal on last page.</p>
                    </div>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">0.5 / 1.0</span>
                  </div>
                </div>

                {/* Teacher Action Pill */}
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-brand-900">Teacher Override Ready</p>
                    <p className="text-[11px] text-brand-700">Modify score or approve with 1 click.</p>
                  </div>
                  <button className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                    Approve Marks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">The Real Challenge</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Physical examinations are essential. Manual grading is exhausting.
            </h3>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Paper and pen tests remain the gold standard for authentic examination integrity in colleges. But evaluating hundreds of handwritten answer scripts manually creates bottlenecks, fatigue, and delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">40+ Hours of Repetitive Grading</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Teachers spend days calculating marks for batches of 60 to 300 students, distracting from teaching, research, and mentoring.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Subjectivity & Fatigue Inconsistency</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Grading the 100th paper on a Sunday evening is rarely evaluated with the same precision as the 1st paper on Friday morning.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Zero Educational Feedback</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Students receive a bare numerical score (e.g. 14/25) with no actionable guidance on which specific concepts were misunderstood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How ExamLens Works (5-step process) */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">End-to-End Workflow</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From physical paper to verified results in five steps
            </h3>
            <p className="text-base text-slate-600 mt-3">
              ExamLens preserves traditional physical examinations while modernizing evaluation, verification, and feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: "01",
                title: "UPLOAD",
                subtitle: "Digitize Scripts",
                desc: "Scan collected physical answer sheets into PDF or images and upload in bulk batches.",
                icon: UploadCloud,
              },
              {
                step: "02",
                title: "RECOGNIZE",
                subtitle: "Handwriting OCR",
                desc: "Extract handwritten text, detect question numbers, and highlight uncertain words for teacher verification.",
                icon: ScanText,
              },
              {
                step: "03",
                title: "EVALUATE",
                subtitle: "Semantic AI",
                desc: "AI evaluates meaning against teacher rubrics, awarding partial marks and citing evidence.",
                icon: Cpu,
              },
              {
                step: "04",
                title: "REVIEW",
                subtitle: "Teacher Authority",
                desc: "Teacher inspects marks in split-view, adjusts scores with reasons, and approves final evaluations.",
                icon: CheckSquare,
              },
              {
                step: "05",
                title: "PUBLISH",
                subtitle: "Student Portal",
                desc: "Release approved results. Students see question-wise marks, strengths, and concept improvement suggestions.",
                icon: Share2,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative flex flex-col justify-between group hover:border-brand-300 hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-brand-600/30 group-hover:text-brand-600 transition-colors">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-brand-700 tracking-wider uppercase mb-1">{item.title}</p>
                    <h4 className="text-base font-bold text-slate-900 mb-2">{item.subtitle}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Evaluation Section */}
      <section id="ai-evaluation" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
                <Cpu className="w-4 h-4" />
                <span>Meaning-Based Evaluation</span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
                Evaluating concepts, not exact keyword matches
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Students explain ideas using diverse vocabulary, scientific metaphors, and phrasing. Traditional software penalizes anything different from the answer key. ExamLens AI understands the semantic meaning:
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Configurable Multi-Criteria Rubrics:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Every question has discrete grading criteria with designated marks and expected concepts.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Verbatim Evidence Citing:</span>
                    <p className="text-xs text-slate-600 mt-0.5">AI cites actual sentences from student handwriting to justify awarded or deducted points.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Fair Partial Marks:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Awards partial credit for partially correct reasoning rather than an all-or-nothing score.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Flagging Borderline Cases:</span>
                    <p className="text-xs text-slate-600 mt-0.5">Uncertain answers automatically alert the teacher for mandatory human verification.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm tracking-wide">Responsible AI Principles</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded">
                  Teacher Final Authority
                </span>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-white">1. AI is an Assistant, Not the Judge:</strong> AI never publishes scores directly to students without explicit teacher authorization.
                </p>
                <p>
                  <strong className="text-white">2. Immutable AI Audit History:</strong> When a teacher overrides marks, the original AI evaluation and explanation remain permanently preserved in the database audit log.
                </p>
                <p>
                  <strong className="text-white">3. Zero Data Hallucination:</strong> If an answer is blank, faint, or illegible, the system marks it as unreadable rather than inventing scores.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Ready to test?</span>
                <button
                  onClick={() => loginAsDemo('teacher')}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow transition-all"
                >
                  Launch Demo Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-indigo-900 to-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Transform physical examination evaluation today.
          </h2>
          <p className="text-base text-indigo-200 mb-8 max-w-2xl mx-auto">
            Give teachers their weekends back while giving students rich, actionable learning feedback.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-8 py-3.5 bg-white text-brand-900 hover:bg-slate-100 font-bold rounded-xl shadow-lg transition-all"
            >
              Start Free Institutional Pilot
            </button>
            <button
              onClick={() => loginAsDemo('student-1')}
              className="px-6 py-3.5 bg-indigo-800/60 hover:bg-indigo-800 text-white font-semibold rounded-xl border border-indigo-700 transition-all"
            >
              View Student Portal Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              E
            </div>
            <span className="font-bold text-white text-sm">ExamLens</span>
            <span>— See beyond the answer.</span>
          </div>

          <p className="text-slate-500">
            AI-Assisted Physical Examination Evaluation Platform. Built for Colleges & Institutions.
          </p>
        </div>
      </footer>
    </div>
  );
};
