import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  X,
  Play,
  RotateCw,
  Compass,
  Check,
  Zap,
  BookOpen,
  HelpCircle,
  Lock,
  Mail,
  Copy,
  Send,
  UserCheck,
  CheckCheck,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PromoVideoModal } from '../components/PromoVideoModal';

import { api } from '../services/api';
import { soundEffects } from '../utils/audioEffects';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateTab: (tab: string) => void;
  externalFeaturesOpen?: boolean;
  externalWorkflowOpen?: boolean;
  externalContactOpen?: boolean;
  onOpenTrial?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onOpenAuth, 
  onNavigateTab,
  externalFeaturesOpen = false,
  externalWorkflowOpen = false,
  externalContactOpen = false,
  onOpenTrial
}) => {
  const { user, role, loginAsDemo } = useAuth();
  const { isDark } = useTheme();

  // Modals & Interactive States
  const [promoModalOpen, setPromoModalOpen] = useState<boolean>(false);
  const [featuresModalOpen, setFeaturesModalOpen] = useState<boolean>(externalFeaturesOpen);
  const [workflowModalOpen, setWorkflowModalOpen] = useState<boolean>(externalWorkflowOpen);
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(externalContactOpen);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);

  // Animated Answer Script Preview State
  const [activeScriptPage, setActiveScriptPage] = useState<number>(1);
  const [isCopiedEmail, setIsCopiedEmail] = useState<boolean>(false);
  const [contactFormSubmitted, setContactFormSubmitted] = useState<boolean>(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    institution: '',
    message: ''
  });

  const contactEmail = "sharveshofficialmicro@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setIsCopiedEmail(true);
    setTimeout(() => setIsCopiedEmail(false), 2500);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitContactMessage({
        name: contactFormData.name,
        email: contactFormData.email,
        subject: `Inquiry from ${contactFormData.institution || 'Institutional User'}`,
        message: contactFormData.message,
      });
      soundEffects.playSuccessPing();
      setContactFormSubmitted(true);
      setTimeout(() => {
        setContactFormData({ name: '', email: '', institution: '', message: '' });
      }, 1000);
    } catch (err) {
      console.error(err);
      soundEffects.playSuccessPing();
      setContactFormSubmitted(true);
    }
  };

  // Sample student script pages for animated interactive answer sheet mockup
  const samplePages = [
    {
      pageNumber: 1,
      title: "Q1. Paging in Operating Systems",
      questionNumber: "q.1) Definition",
      confidence: "96%",
      awarded: "4.5 / 5.0",
      handwrittenLines: [
        { text: "q.1) Definition & Architecture", isHeader: true },
        { text: "Paging is a memory management scheme that eliminates the need", isHighlight: true, mark: "+1.0" },
        { text: "for contiguous allocation of physical memory. In paging, logical" },
        { text: "address space is divided into pages, and physical memory into frames.", isHighlight: true, mark: "+1.0" },
        { text: "The page table maps logical pages (p) to physical frames (f)." },
        { text: "Address translation splits address into page number (p) and offset (d).", isHighlight: true, mark: "+1.0" },
        { text: "Advantage: eliminates external fragmentation (internal frag may remain).", mark: "+1.5" }
      ],
      aiRubricFeedback: [
        { criteria: "1. Definition & Separation", mark: "1.0 / 1.0", note: "Accurately identifies non-contiguous mapping.", evidence: "eliminates contiguous allocation..." },
        { criteria: "2. Address Translation (p, d)", mark: "1.0 / 1.0", note: "Correctly describes logical-to-physical translation.", evidence: "page number (p) and offset (d)..." },
        { criteria: "3. Fragmentation Analysis", mark: "1.5 / 2.0", note: "Mentions external fragmentation; missed page boundary calculation.", evidence: "eliminates external frag..." }
      ]
    },
    {
      pageNumber: 2,
      title: "Q2. Types of Operating Systems",
      questionNumber: "2) Types of OS",
      confidence: "94%",
      awarded: "5.0 / 5.0",
      handwrittenLines: [
        { text: "2. Explain different types of Operating Systems (5 Marks)", isHeader: true },
        { text: "Definition: An OS is classified into types based on how it manages tasks:", isHighlight: true, mark: "+1.0" },
        { text: "1. Batch OS: executes jobs in batches without direct user interaction.", mark: "+1.0" },
        { text: "2. Time-Sharing OS: allows multiple users to share CPU time efficiently.", isHighlight: true, mark: "+1.0" },
        { text: "3. Distributed OS: manages multiple independent computers as single system.", mark: "+1.0" },
        { text: "4. Real-Time OS (RTOS): provides deterministic response within rigid deadlines.", isHighlight: true, mark: "+1.0" },
        { text: "Examples: Linux, UNIX, Windows, Android, and FreeRTOS." }
      ],
      aiRubricFeedback: [
        { criteria: "1. Core Definition & Taxonomy", mark: "1.0 / 1.0", note: "Clear categorization based on task scheduling.", evidence: "classified into types based on tasks..." },
        { criteria: "2. Multi-Paradigm Coverage", mark: "3.0 / 3.0", note: "Detailed batch, time-sharing, distributed, and RTOS models.", evidence: "batch, time-sharing, distributed, RTOS..." },
        { criteria: "3. Concrete Real-World Examples", mark: "1.0 / 1.0", note: "Accurate mapping to Linux, UNIX, FreeRTOS.", evidence: "FreeRTOS, Linux, Android..." }
      ]
    },
    {
      pageNumber: 3,
      title: "Q3. Four Conditions for Deadlock",
      questionNumber: "3. Process States & Deadlock",
      confidence: "95%",
      awarded: "4.0 / 5.0",
      handwrittenLines: [
        { text: "3. Four Necessary Conditions for Deadlock (Coffman Conditions)", isHeader: true },
        { text: "The 4 Coffman conditions for deadlock to occur are:", isHighlight: true, mark: "+1.0" },
        { text: "1. Mutual Exclusion: resources held in non-shareable mode.", mark: "+1.0" },
        { text: "2. Hold and Wait: process holds a resource while waiting for another.", mark: "+1.0" },
        { text: "3. No Preemption: resources cannot be preempted forcibly from a process.", mark: "+1.0" },
        { text: "4. Circular Wait: closed chain of processes waiting in a cycle.", isHighlight: true, mark: "+1.0" },
        { text: "If any condition is broken, deadlock cannot happen." }
      ],
      aiRubricFeedback: [
        { criteria: "1. Coffman Framework", mark: "1.0 / 1.0", note: "Correctly identifies Coffman theoretical model.", evidence: "4 Coffman conditions..." },
        { criteria: "2. All 4 Conditions Named & Defined", mark: "2.5 / 3.0", note: "Detailed Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.", evidence: "Mutual exclusion, hold and wait..." },
        { criteria: "3. Deadlock Prevention Strategy", mark: "0.5 / 1.0", note: "Briefly states breaking condition; lacks resource allocation graph proof.", evidence: "if any condition is broken..." }
      ]
    }
  ];

  const currentSample = samplePages[activeScriptPage - 1];

  // Workflow steps definition
  const workflowSteps = [
    {
      step: "01",
      badge: "DIGITIZE",
      title: "Batch Physical Script Upload",
      desc: "Scan collected paper answer sheets via sheet-fed scanner into PDF or high-resolution images. Upload individual scripts or batch zip folders directly.",
      icon: UploadCloud,
      color: "from-blue-600 to-indigo-600",
      highlight: "Supports 150-300 DPI multi-page PDF scripts",
      demoScreen: {
        title: "Script Digitization Queue",
        tag: "50 Answer Sheets Uploaded",
        data: [
          { label: "STU-1024 (Aarav Sharma)", status: "Digitized (4 Pages)", time: "Just now" },
          { label: "STU-1025 (Priya Nair)", status: "Digitized (3 Pages)", time: "1 min ago" },
          { label: "STU-1026 (Rohan Verma)", status: "Digitized (4 Pages)", time: "2 mins ago" }
        ]
      }
    },
    {
      step: "02",
      badge: "RECOGNIZE",
      title: "Handwriting OCR & Verification",
      desc: "RapidOCR recognizes diverse handwriting styles, ligatures, and question numbers (q.1), Q1), 1., etc.). Teacher verifies text side-by-side with scan before grading.",
      icon: ScanText,
      color: "from-amber-500 to-orange-600",
      highlight: "Recognizes 'q.1)', 'Q1)', '1)', 'Ans 1' & subtopics without dropping answers",
      demoScreen: {
        title: "OCR Verification Split Screen",
        tag: "Confidence: 94%",
        data: [
          { label: "Q1. Paging in Operating Systems", status: "Verified (118 words)", time: "Conf: 96%" },
          { label: "Q2. Semaphore vs Mutex", status: "Verified (84 words)", time: "Conf: 92%" },
          { label: "Q3. Deadlock Necessary Conditions", status: "Verified (142 words)", time: "Conf: 95%" }
        ]
      }
    },
    {
      step: "03",
      badge: "EVALUATE",
      title: "Semantic Rubric AI Marking",
      desc: "AI evaluates conceptual meaning against teacher-defined rubrics. Awards rubric partial marks, identifies missing points, and cites verbatim evidence from handwriting.",
      icon: Cpu,
      color: "from-indigo-600 to-violet-600",
      highlight: "Concept meaning evaluation, not rigid keyword matching",
      demoScreen: {
        title: "Semantic AI Rubric Evaluation",
        tag: "AI Score: 4.5 / 5.0",
        data: [
          { label: "1. Core Definition & Non-contiguous mapping", status: "Awarded: 1.0 / 1.0", time: "Evidence Cited" },
          { label: "2. Address Translation mechanism (p, d)", status: "Awarded: 1.0 / 1.0", time: "Evidence Cited" },
          { label: "3. Fragmentation Analysis", status: "Awarded: 0.5 / 1.0", time: "Internal frag missing" }
        ]
      }
    },
    {
      step: "04",
      badge: "AUTHORITY",
      title: "Teacher Review & Final Override",
      desc: "Teacher is in complete control. Inspect marks in split-screen, adjust any score with reasoning, approve in batch, or recalculate totals automatically.",
      icon: CheckSquare,
      color: "from-emerald-600 to-teal-600",
      highlight: "Teacher is 100% Final Authority; AI never publishes without approval",
      demoScreen: {
        title: "Teacher Review Console",
        tag: "Final Authority Active",
        data: [
          { label: "Score Adjustment", status: "Changed 4.0 → 4.5", time: "Overridden" },
          { label: "Audit Preserved", status: "Original AI log saved", time: "Audited" },
          { label: "Approval State", status: "Ready for Publication", time: "Teacher Approved" }
        ]
      }
    },
    {
      step: "05",
      badge: "INSIGHTS",
      title: "Publish & Student Learning Portal",
      desc: "Release approved marks to students. Students see question-wise scores, positive conceptual strengths, and specific personalized improvement suggestions.",
      icon: Share2,
      color: "from-violet-600 to-pink-600",
      highlight: "Rich educational feedback transforms grades into actionable learning",
      demoScreen: {
        title: "Student Knowledge Portal",
        tag: "Grade: 18.5 / 25.0 (A)",
        data: [
          { label: "Concept Mastery", status: "Paging & Memory (92%)", time: "Strength" },
          { label: "Improvement Area", status: "Deadlock Coffman Conditions", time: "Needs Review" },
          { label: "Feedback Note", status: "Revisit internal fragmentation", time: "Personalized" }
        ]
      }
    }
  ];

  // Features list
  const institutionalFeatures = [
    {
      title: "Universal Question Recognition",
      badge: "Handwriting OCR",
      desc: "Handles diverse student handwriting numbering styles: 'q.1)', 'Q1)', '1)', '1.', 'Q. 1)', 'Ans 1', and Roman numerals without dropping answers or misassigning.",
      icon: ScanText,
      points: [
        "Pre-trained on diverse cursive, block, and fast examination handwriting styles",
        "Subtopic header tolerance ('q.1) Definition', '1. Concept', 'Overview')",
        "Never confuses internal bullet points (e.g. '5. Terminated') for question markers",
        "Accurately flags unattempted questions as [Not Attempted / Blank]"
      ]
    },
    {
      title: "Semantic Rubric-Based Evaluation",
      badge: "AI Scoring",
      desc: "Evaluates conceptual understanding against discrete grading criteria rather than simple keyword matching. Awards justified partial marks with verbatim quotation.",
      icon: Cpu,
      points: [
        "Configurable multi-criteria rubrics per question with designated marks",
        "Cites verbatim evidence from student handwriting to justify points",
        "Off-topic and irrelevant answers receive 0.0 marks with mandatory human review flag",
        "Deterministic scoring consistency prevents fatigue and mood discrepancies"
      ]
    },
    {
      title: "Teacher Final Authority & Split Review",
      badge: "Human in the Loop",
      desc: "Designed with the principle that AI assists but teachers decide. Intuitive side-by-side workspace allows 1-click approval or instant mark overrides.",
      icon: CheckSquare,
      points: [
        "Clean mark replacement: teacher override cleanly replaces AI score without double-counting",
        "Immutable audit history preserves original AI score and teacher reasoning",
        "Synchronized total scores guarantee question sum always matches script total",
        "Filterable queue highlights low-confidence or borderline answer scripts"
      ]
    },
    {
      title: "Student Diagnostic Feedback Portal",
      badge: "Educational Impact",
      desc: "Transforms physical examination marks from a bare score into an actionable diagnostic learning experience for students.",
      icon: Award,
      points: [
        "Students view question-wise breakdown and conceptual rubric criteria",
        "Personalized strengths and knowledge gap highlights for each student",
        "Class analytics show question difficulty percentiles and topic mastery",
        "Self-service portal eliminates grading disputes and manual recount requests"
      ]
    },
    {
      title: "Institutional Analytics & CSV Export",
      badge: "Academic Admin",
      desc: "Comprehensive analytics for heads of department and faculty with instant multi-format data export across all curriculum assessments.",
      icon: BarChart2,
      points: [
        "1-click CSV and JSON export for marks, evaluations, and rubric criteria",
        "Score distribution histograms and standard deviation metrics",
        "Question-wise difficulty heatmaps to refine future curriculum teaching",
        "Batch processing status tracking for entire classroom cohorts"
      ]
    },
    {
      title: "Enterprise Grade Privacy & Integrity",
      badge: "Security",
      desc: "Operates with strict academic data isolation. Local RapidOCR execution ensures physical script scans remain secure on institutional premises.",
      icon: ShieldCheck,
      points: [
        "Role-based access control (RBAC) separating faculty and student views",
        "Local on-premise RapidOCR engine support with zero mandatory external API sharing",
        "Zero data hallucination: unreadable or faint text is flagged for human inspection",
        "Complete tamper-evident evaluation log for accreditation inspections"
      ]
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* Background Motion Graphics: Floating Gradient Orbs & Glowing Shapes */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-400/10 dark:bg-brand-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div className="absolute top-40 right-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[800px] left-10 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1s' }}></div>

      {/* Floating Academic Glyphs (Moving Objects) */}
      <div className="absolute top-24 left-8 text-slate-300/40 dark:text-slate-700/40 text-4xl font-serif select-none pointer-events-none animate-float-slow">
        &Sigma;
      </div>
      <div className="absolute top-48 right-16 text-slate-300/40 dark:text-slate-700/40 text-3xl font-mono select-none pointer-events-none animate-float-delayed">
        &int; dx
      </div>
      <div className="absolute top-96 left-16 text-slate-300/30 dark:text-slate-700/30 text-2xl font-mono select-none pointer-events-none animate-float-slow">
        p &rarr; d
      </div>
      <div className="absolute top-[500px] right-24 text-slate-300/30 dark:text-slate-700/30 text-3xl font-serif select-none pointer-events-none animate-float-delayed">
        &Delta;
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-b from-white via-indigo-50/25 to-slate-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Pill with Ping Animation */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 shadow-sm hover:scale-105 transition-transform cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>AI Evaluates. Teacher Verifies. Student Learns.</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.1] mb-6">
              See beyond <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-indigo-400 dark:to-violet-400">the answer.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
              AI-assisted examination evaluation that understands handwritten answers, evaluates concepts against custom rubrics, and keeps teachers in complete control of the final marks.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenTrial}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 group hover:shadow-emerald-500/40 hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span>Start 30-Day Free Trial</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 group hover:shadow-brand-500/40 hover:-translate-y-0.5"
              >
                <span>Get started</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <button
                onClick={() => setPromoModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all flex items-center justify-center space-x-2.5 group hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                  <Play className="w-2.5 h-2.5 fill-white translate-x-0.5" />
                </div>
                <span>Watch Commercial</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200/70 dark:bg-indigo-800/80 text-indigo-800 dark:text-indigo-200">
                  60s
                </span>
              </button>

              <button
                onClick={() => setFeaturesModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex items-center justify-center space-x-2 hover:-translate-y-0.5"
              >
                <Compass className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Explore Features</span>
              </button>
            </div>

            {/* Trial Guarantee Subtitle */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>30 Days Full Access</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Real-time Email OTP (sharveshofficialmicro@gmail.com)</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Custom Password & Institution Display</span>
              </span>
            </div>
          </div>

          {/* ADVANCED ANIMATED ANSWER SCRIPT MOCKUP WITH ACTIVE LASER SCANNING */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative">
            {/* Top Mockup Header Bar */}
            <div className="bg-slate-900 px-5 py-3.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-300">ExamLens Review Console — STU-1024 (Aarav Sharma)</span>
              </div>

              {/* Animated Interactive Page Selector */}
              <div className="flex items-center space-x-2 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Script Page:</span>
                {[1, 2, 3].map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setActiveScriptPage(pg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeScriptPage === pg 
                        ? 'bg-brand-600 text-white shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    Page {pg}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] flex items-center space-x-1 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>RapidOCR: {currentSample.confidence}</span>
                </span>
                <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">Teacher Authority Active</span>
              </div>
            </div>

            {/* Split Screen Layout Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950">
              {/* LEFT SIDE: Realistic Animated Handwritten Paper with Active Laser Scanner */}
              <div className="p-6 bg-amber-50/20 dark:bg-slate-900/40 flex flex-col justify-between relative overflow-hidden select-none">
                {/* Motion Graphic: Animated Cyan Laser Scan Line */}
                <div 
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 dark:via-cyan-300 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none z-20 animate-scan"
                ></div>

                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <ScanText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span>Answer Script Scan (Page {activeScriptPage} of 3)</span>
                    </span>
                    <span className="text-[11px] bg-brand-100 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 font-semibold px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                      {currentSample.questionNumber}
                    </span>
                  </div>

                  {/* Simulated Lined Examination Answer Sheet */}
                  <div className="p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative font-mono text-xs leading-relaxed space-y-3 transition-all duration-300">
                    {/* Red Margin Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-rose-300/40 dark:bg-rose-900/40 pointer-events-none"></div>

                    {currentSample.handwrittenLines.map((line, lIdx) => (
                      <div 
                        key={lIdx}
                        className={`relative pl-7 transition-all ${
                          line.isHeader 
                            ? 'font-bold text-brand-900 dark:text-brand-300 border-b border-slate-100 dark:border-slate-800 pb-1.5' 
                            : line.isHighlight 
                            ? 'bg-brand-50/70 dark:bg-brand-950/40 p-1.5 rounded text-slate-900 dark:text-slate-100 border border-brand-200/50 dark:border-brand-800/50' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <p>{line.text}</p>
                        {line.mark && (
                          <span className="absolute right-1 -top-1 font-serif text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-200/50">
                            {line.mark} &check;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating pill badge */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Universal Marker Tracking Active</span>
                  </span>
                  <span className="text-brand-600 dark:text-brand-400 font-medium">Original upload preserved</span>
                </div>
              </div>

              {/* RIGHT SIDE: AI Semantic Rubric Evaluation */}
              <div className="p-6 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Semantic Rubric Breakdown</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Awarded: <span className="text-brand-600 dark:text-brand-400 font-black">{currentSample.awarded}</span>
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {currentSample.aiRubricFeedback.map((crit, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-start justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{crit.criteria}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{crit.note}</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                          Evidence: "{crit.evidence}"
                        </p>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs border border-emerald-200/50 dark:border-emerald-800/50 ml-2 whitespace-nowrap">
                        {crit.mark}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Teacher Action Pill */}
                <div className="p-3.5 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-brand-900 dark:text-brand-200">Teacher Override Ready</p>
                    <p className="text-[11px] text-brand-700 dark:text-brand-400">Modify score or approve with 1 click.</p>
                  </div>
                  <button 
                    onClick={() => loginAsDemo('teacher')}
                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Approve Marks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED FEATURES SECTION (id="features") */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Institutional Evaluation Features
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              Engineered specifically for academic faculties, examination controllers, and university accreditation requirements.
            </p>
          </div>

          {/* 6 Feature Cards Grid with Motion Hover */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {institutionalFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx}
                  className="p-7 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-500 hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 border border-brand-200/60 dark:border-brand-800 px-2.5 py-0.5 rounded-full">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {feat.desc}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                    {feat.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px]">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Feature Explorer Trigger Banner */}
          <div className="mt-12 p-6 bg-gradient-to-r from-brand-50 via-indigo-50 to-slate-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-800 border border-brand-200 dark:border-slate-700 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Want to inspect technical architecture?</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">Open the interactive feature explorer modal with detailed explanations.</p>
              </div>
            </div>
            <button
              onClick={() => setFeaturesModalOpen(true)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center space-x-2 transition-all hover:-translate-y-0.5"
            >
              <span>Launch Feature Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* DEDICATED WORKFLOW SECTION (id="workflow" & id="how-it-works") */}
      <section id="workflow" className="py-24 bg-slate-50 dark:bg-slate-950 relative transition-colors">
        <div id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Workflow Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Physical Paper to Verified Marks in 5 Steps
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              Click through the five stages below to preview how ExamLens manages the entire evaluation lifecycle.
            </p>
          </div>

          {/* Interactive 5-Step Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            {workflowSteps.map((ws, sIdx) => {
              const Icon = ws.icon;
              const isActive = activeWorkflowStep === sIdx;
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setActiveWorkflowStep(sIdx)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 border-brand-500 dark:border-brand-400 shadow-md ring-2 ring-brand-500/20' 
                      : 'bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xl font-black ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-slate-700'}`}>
                      {ws.step}
                    </span>
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider block">
                      {ws.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {ws.title.split(' ')[0]} {ws.title.split(' ')[1] || ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Interactive Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">
                  <span>Step {workflowSteps[activeWorkflowStep].step}</span>
                  <span>&bull;</span>
                  <span>{workflowSteps[activeWorkflowStep].badge}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>

                <div className="p-3.5 bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-xs text-brand-900 dark:text-brand-300 font-medium mb-6 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                  <span>{workflowSteps[activeWorkflowStep].highlight}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveWorkflowStep(prev => (prev + 1) % workflowSteps.length)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                  >
                    <span>Next Stage: {workflowSteps[(activeWorkflowStep + 1) % workflowSteps.length].title.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWorkflowModalOpen(true)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                  >
                    Open Workflow Modal
                  </button>
                </div>
              </div>

              {/* Step Simulation Screen */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="font-bold text-slate-200">{workflowSteps[activeWorkflowStep].demoScreen.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-mono border border-brand-500/30">
                    {workflowSteps[activeWorkflowStep].demoScreen.tag}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {workflowSteps[activeWorkflowStep].demoScreen.data.map((row, rIdx) => (
                    <div key={rIdx} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-100">{row.label}</p>
                        <p className="text-[11px] text-slate-400">{row.status}</p>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800/50">
                        {row.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI EVALUATION SECTION (id="ai-evaluation") */}
      <section id="ai-evaluation" className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4">
                <Cpu className="w-4 h-4" />
                <span>Meaning-Based Evaluation</span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                Evaluating concepts, not rigid keyword matches
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Students explain ideas using diverse vocabulary, scientific metaphors, and phrasing. Traditional software penalizes anything different from the answer key. ExamLens AI understands the semantic meaning:
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Configurable Multi-Criteria Rubrics:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Every question has discrete grading criteria with designated marks and expected concepts.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Verbatim Evidence Citing:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">AI cites actual sentences from student handwriting to justify awarded or deducted points.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Fair Partial Marks:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Awards partial credit for partially correct reasoning rather than an all-or-nothing score.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Relevance Gate for Off-Topic Submissions:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Unrelated answers are automatically awarded 0.0 marks and flagged for mandatory teacher review.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 relative z-10">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm tracking-wide">Responsible AI Principles</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                  Teacher Final Authority
                </span>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed relative z-10">
                <p>
                  <strong className="text-white">1. AI is an Assistant, Not the Judge:</strong> AI never publishes scores directly to students without explicit teacher authorization.
                </p>
                <p>
                  <strong className="text-white">2. Immutable AI Audit History:</strong> When a teacher overrides marks, the original AI evaluation and explanation remain permanently preserved in the database audit log.
                </p>
                <p>
                  <strong className="text-white">3. Zero Data Hallucination:</strong> If an answer is blank, faint, or illegible, the system marks it as unreadable or skipped rather than inventing scores.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10">
                <span className="text-xs text-slate-400">Ready to test live?</span>
                <button
                  onClick={() => loginAsDemo('teacher')}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow transition-all hover:scale-105"
                >
                  Launch Demo Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 30-DAY FREE TRIAL SHOWCASE SECTION (id="free-trial") */}
      <section id="free-trial" className="py-24 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 relative overflow-hidden transition-colors border-t border-slate-200/80 dark:border-slate-800">
        {/* Ambient Backlight Orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4 shadow-sm hover:scale-105 transition-transform cursor-pointer">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Full Enterprise Pilot • Zero Setup Cost</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 dark:from-emerald-400 dark:via-teal-400 dark:to-brand-400">30-Day Free Trial</span> Today
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Equip your faculty with AI-assisted handwriting evaluation, verifiable question segmentation, and interactive review dashboards. Simply verify your mobile number via OTP to begin immediately.
            </p>
          </div>

          {/* Glassmorphism Cards Grid - Fully Responsive (Desktop, Tablet, Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: Handwriting OCR & Universal Markers */}
            <div className="glass-card glass-card-interactive gradient-border-glow rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-inner">
                  <ScanText className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    Engineered OCR
                  </span>
                  <span className="text-xs text-slate-400">Pre-trained</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Universal Handwriting OCR
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Recognizes any question format: <code className="text-brand-600 dark:text-brand-400 font-semibold font-mono">q.1)</code>, <code className="text-brand-600 dark:text-brand-400 font-semibold font-mono">Q1)</code>, <code className="text-brand-600 dark:text-brand-400 font-semibold font-mono">1.</code>, roman numerals, and cursive scripts without dropping blank-spaced answers.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-medium text-amber-700 dark:text-amber-400">
                <span>Multi-style Handwriting</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            {/* Card 2: Semantic Rubric AI Evaluation */}
            <div className="glass-card glass-card-interactive gradient-border-glow rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5 shadow-inner">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 px-2 py-0.5 rounded-full">
                    Semantic AI
                  </span>
                  <span className="text-xs text-slate-400">No Rigid Words</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Concept-Based Marking
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Grades student answers based on conceptual correctness and semantic understanding, not word-for-word memorization. Automatically flags off-topic responses with zero marks.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-medium text-brand-700 dark:text-brand-400">
                <span>Partial Credit Rubrics</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            {/* Card 3: Instant Email OTP & Workspace Creation */}
            <div className="glass-card glass-card-interactive gradient-border-glow rounded-3xl p-7 flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    Email OTP
                  </span>
                  <span className="text-xs text-slate-400">Instant Access</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Real-time Email Onboarding
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your email, create your password, and enter your institution. Receive a real-time 6-digit OTP from <strong className="text-brand-600 dark:text-brand-400">sharveshofficialmicro@gmail.com</strong> to instantly unlock your workspace with your institution name under the ExamLens logo.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span>Free 720 Hours Access</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Big CTA Glass Box */}
          <div className="mt-12 glass-card rounded-3xl p-8 sm:p-10 border border-emerald-200/70 dark:border-emerald-900/60 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Ready to transform physical exam grading at your institution?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Join over 25+ colleges and universities conducting fair, fast, and transparent handwritten evaluations.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenTrial}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>Open 30-Day Free Trial Modal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  Create Faculty Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="contact" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 relative transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3">
              <Mail className="w-3.5 h-3.5" />
              <span>Direct Institutional Support</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Contact Us & Institutional Pilot
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              Have questions, feedback, or interested in deploying ExamLens for your college or university? Reach out directly to our team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            {/* Left Card: Direct Email & Info */}
            <div className="lg:col-span-5 bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest bg-brand-500/20 px-2.5 py-1 rounded-full border border-brand-500/30">
                  Developer & Support Contact
                </span>
                <h3 className="text-2xl font-black mt-4 mb-2">Sharveshwaran</h3>
                <p className="text-xs text-indigo-200 leading-relaxed mb-6">
                  ExamLens Creator & Lead Architect. Reach out for technical integrations, feature requests, or institutional deployments.
                </p>

                {/* Email Box with 1-Click Copy */}
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-indigo-300">Official Contact Email:</p>
                  <a 
                    href={`mailto:${contactEmail}`} 
                    className="font-mono text-xs sm:text-sm text-white hover:text-brand-300 underline font-semibold break-all block"
                  >
                    {contactEmail}
                  </a>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      {isCopiedEmail ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Email Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-xs text-brand-300 hover:text-white flex items-center space-x-1"
                    >
                      <span>Open Mail Client</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/15 text-xs text-slate-300 space-y-2">
                <p className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>Response Time: Typically within 24 hours</span>
                </p>
                <p className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                  <span>100% Academic Confidentiality Guaranteed</span>
                </p>
              </div>
            </div>

            {/* Right Form: Interactive Contact Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Send a Message</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Fill in your details below and our team will get in touch regarding your institution's requirements.
                </p>

                {contactFormSubmitted ? (
                  <div className="p-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3 animate-in fade-in">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h5 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Message Received!</h5>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto leading-relaxed">
                      Thank you for contacting ExamLens. We have logged your query and will reply to you at <strong>{contactFormData.email || 'your email'}</strong> promptly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactFormSubmitted(false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={contactFormData.name}
                          onChange={e => setContactFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Prof. / Dr. / Student"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactFormData.email}
                          onChange={e => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="name@university.edu"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">College / University / Department</label>
                      <input
                        type="text"
                        value={contactFormData.institution}
                        onChange={e => setContactFormData(prev => ({ ...prev, institution: e.target.value }))}
                        placeholder="e.g. National Institute of Technology, Department of CSE"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Message or Assessment Query</label>
                      <textarea
                        required
                        rows={4}
                        value={contactFormData.message}
                        onChange={e => setContactFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your examination batches, subjects, or required OCR styles..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Message to Sharveshwaran</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH PROMINENT COPYRIGHT & DEVELOPER CREDITS */}
      <footer className="bg-slate-950 text-slate-400 py-14 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
            {/* Col 1: Brand Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
                  E
                </div>
                <span className="font-bold text-white text-base">ExamLens</span>
                <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-mono border border-brand-500/30">
                  v2.4 Production
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs max-w-md">
                AI-Assisted Physical Examination Evaluation Platform. Engineered specifically for authentic pen-and-paper examinations in colleges & universities with Teacher Final Authority.
              </p>
              <div className="pt-2">
                <p className="text-[11px] text-slate-300">
                  Lead Developer: <strong className="text-white">Sharveshwaran</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Email: <a href={`mailto:${contactEmail}`} className="text-brand-400 hover:text-brand-300 underline">{contactEmail}</a>
                </p>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Quick Navigation</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Platform Features</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">5-Step Workflow</a></li>
                <li><a href="#ai-evaluation" className="hover:text-white transition-colors">AI Rubric Logic</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Col 3: Institutional Compliance */}
            <div>
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Compliance & Trust</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>&bull; Teacher Final Authority Guarantee</li>
                <li>&bull; Immutable AI Audit Trail</li>
                <li>&bull; Local RapidOCR On-Premise</li>
                <li>&bull; Zero Student Data Sharing</li>
                <li>&bull; NAAC / NBA Accreditation Ready</li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>
              &copy; {new Date().getFullYear()} ExamLens. All rights reserved. Created & Developed by Sharveshwaran.
            </p>

            <div className="flex items-center space-x-6">
              <a href="#contact" className="hover:text-slate-300 transition-colors">Contact: {contactEmail}</a>
              <span>&bull;</span>
              <button onClick={() => setFeaturesModalOpen(true)} className="hover:text-slate-300 transition-colors">
                Architecture
              </button>
              <span>&bull;</span>
              <button onClick={() => setWorkflowModalOpen(true)} className="hover:text-slate-300 transition-colors">
                Workflow
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE FEATURE EXPLORER MODAL */}
      {featuresModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">ExamLens Feature Showcase</h3>
                  <p className="text-xs text-slate-400">Institutional Examination Capabilities & Architecture</p>
                </div>
              </div>
              <button 
                onClick={() => setFeaturesModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Tabs */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto space-x-4 pb-1">
                {institutionalFeatures.map((f, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFeatureTab(idx)}
                    className={`pb-2 border-b-2 whitespace-nowrap transition-colors ${
                      activeFeatureTab === idx 
                        ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold' 
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.title}
                  </button>
                ))}
              </div>

              {/* Active Tab Content */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{institutionalFeatures[activeFeatureTab].title}</h4>
                  <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-950 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                    {institutionalFeatures[activeFeatureTab].badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {institutionalFeatures[activeFeatureTab].desc}
                </p>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Technical Implementation:</h5>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {institutionalFeatures[activeFeatureTab].points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Live Demo Ready</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setFeaturesModalOpen(false); loginAsDemo('teacher'); }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl"
                >
                  Test in Teacher Dashboard
                </button>
                <button
                  onClick={() => setFeaturesModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE WORKFLOW MODAL */}
      {workflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">5-Step Examination Workflow</h3>
                  <p className="text-xs text-slate-400">Complete End-to-End Evaluation Flow</p>
                </div>
              </div>
              <button 
                onClick={() => setWorkflowModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {workflowSteps.map((ws, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-start space-x-4"
                >
                  <span className="text-2xl font-black text-brand-600/40 dark:text-brand-400/40">{ws.step}</span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{ws.title}</span>
                      <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                        {ws.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{ws.desc}</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{ws.highlight}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setWorkflowModalOpen(false)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE CONTACT US MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Contact ExamLens</h3>
                  <p className="text-xs text-slate-400">Direct Institutional Inquiries & Support</p>
                </div>
              </div>
              <button 
                onClick={() => setContactModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-brand-50 dark:bg-slate-800 rounded-2xl border border-brand-200 dark:border-slate-700 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Lead Developer Contact:
                </p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Sharveshwaran</p>
                <a 
                  href={`mailto:${contactEmail}`} 
                  className="font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline break-all block"
                >
                  {contactEmail}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="mt-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  {isCopiedEmail ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedEmail ? "Copied to clipboard!" : "Copy Email"}</span>
                </button>
              </div>

              <div className="text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <p>&bull; Institutional deployment & server setup</p>
                <p>&bull; Custom handwriting styles & question rubric training</p>
                <p>&bull; On-premise offline RapidOCR appliance installation</p>
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setContactModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 60s Official Promotional Video Modal */}
      <PromoVideoModal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        onOpenTrial={onOpenTrial}
      />
    </div>
  );
};
