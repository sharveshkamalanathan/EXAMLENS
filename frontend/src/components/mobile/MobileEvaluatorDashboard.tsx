import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Scan, 
  Search, 
  TrendingUp, 
  Activity, 
  Award, 
  ShieldCheck, 
  Play, 
  RotateCw, 
  Sliders, 
  Layers, 
  User as UserIcon, 
  LogOut, 
  Sun, 
  Moon, 
  ArrowUpRight, 
  Monitor, 
  Volume2, 
  VolumeX,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { soundEffects } from '../../utils/audioEffects';
import { AIParticlesCanvas } from './AIParticlesCanvas';
import { MobileEvaluatorCharts } from './MobileEvaluatorCharts';

interface MobileEvaluatorDashboardProps {
  onSwitchToDesktop?: () => void;
  onOpenWebsite?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const MobileEvaluatorDashboard: React.FC<MobileEvaluatorDashboardProps> = ({
  onSwitchToDesktop,
  onOpenWebsite,
  onNavigateTab
}) => {
  const { user, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Mobile Bottom Navigation Tabs: 'overview' | 'scripts' | 'rubric' | 'analytics'
  const [activeTab, setActiveTab] = useState<'overview' | 'scripts' | 'rubric' | 'analytics'>('overview');

  // Interactive state
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>('CS804');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(76);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Trigger interactive AI scan simulation
  const handleTriggerScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(15);
    if (soundEnabled) soundEffects.playOcrScanSound();

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          if (soundEnabled) soundEffects.playSuccessPing();
          return 100;
        }
        return prev + 17;
      });
    }, 280);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden pb-24 selection:bg-brand-500/20">
      {/* 1. FLOATING AI PARTICLES CANVAS (Subtle synaptic node field) */}
      <AIParticlesCanvas />

      {/* 2. SUBTLE BACKGROUND MOVEMENT: Drifting ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-600/25 via-indigo-600/15 to-transparent blur-3xl animate-ambient-mesh" />
        <div 
          className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-violet-600/20 via-purple-500/15 to-transparent blur-3xl animate-ambient-mesh"
          style={{ animationDelay: '-7s' }}
        />
        <div 
          className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/20 via-brand-500/10 to-transparent blur-3xl animate-ambient-mesh"
          style={{ animationDelay: '-14s' }}
        />
      </div>

      {/* 3. MOBILE HEADER: AI Advanced Evaluator Branding & Quick Controls */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 px-4 py-3 transition-colors shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* AI Advanced Evaluator Branding */}
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  AI Advanced Evaluator
                </h1>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded border border-brand-200 dark:border-brand-800">
                  v3.4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">
                {user?.institution || 'Academic Examination Campus'}
              </p>
            </div>
          </div>

          {/* Controls: Audio mute, Dark mode & Desktop switch */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                soundEffects.setMuted(!next);
              }}
              title={soundEnabled ? 'Mute AI Audio' : 'Enable AI Audio'}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-press cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-600 dark:text-brand-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-press cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {onSwitchToDesktop && (
              <button
                onClick={onSwitchToDesktop}
                title="Switch to Desktop Monitor View"
                className="px-2 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1 touch-press cursor-pointer"
              >
                <Monitor className="w-3 h-3 text-brand-500" />
                <span className="hidden xs:inline">Desktop</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 4. MAIN CONTENT AREA (Phone Ratio - max-w-md mx-auto) */}
      <main className="relative z-10 max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* WELCOME HERO CARD: Personalized Greetings & Live AI Engine Status */}
        <section className="glass-card gradient-border-glow rounded-3xl p-5 shadow-xl border border-white/40 dark:border-slate-800/80 animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
          {/* Glowing gradient accent blob */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Neural Evaluator Active</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {getGreeting()},{' '}
                <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
                  {user?.full_name?.split(' ')[0] || 'Evaluator'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Handwriting OCR & Semantic Rubric Engine are synchronized for{' '}
                <strong className="text-slate-900 dark:text-white">{user?.institution || 'SKCET'}</strong>.
              </p>
            </div>
            
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 shrink-0">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
          </div>

          {/* Quick Metrics Bar with Touch Hover & Animated Badges */}
          <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 touch-press">
              <span className="block text-sm font-extrabold text-slate-900 dark:text-white">48</span>
              <span className="block text-[9px] font-medium text-slate-500 uppercase">Digitized</span>
            </div>
            <div className="p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 touch-press">
              <span className="block text-sm font-extrabold text-brand-600 dark:text-brand-400">98.7%</span>
              <span className="block text-[9px] font-medium text-slate-500 uppercase">OCR Accuracy</span>
            </div>
            <div className="p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 touch-press">
              <span className="block text-sm font-extrabold text-emerald-600 dark:text-emerald-400">89.2%</span>
              <span className="block text-[9px] font-medium text-slate-500 uppercase">Rubric Attain</span>
            </div>
          </div>
        </section>

        {/* TAB 1: OVERVIEW & ACTIVE EVALUATION FEED */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* LIVE AI SCANNER SIMULATION & ANIMATED LOADING INDICATOR */}
            <section className="glass-card gradient-border-glow rounded-3xl p-4 shadow-xl border border-white/40 dark:border-slate-800/80 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Scan className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Physical Script AI Scanner
                    </h3>
                    <p className="text-[10px] text-slate-500">Real-time Handwriting Segmentation</p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-lg shadow-sm shadow-brand-500/25 flex items-center space-x-1 touch-press cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Test OCR'}</span>
                </button>
              </div>

              {/* Simulated Answer Sheet Snippet with Laser Scan Line */}
              <div className="relative rounded-2xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
                {/* Moving laser scan animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/80 animate-scan z-20" />
                )}

                <div className="space-y-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span>Q2: MergeSort Recurrence Analysis</span>
                    <span className="text-emerald-500 font-bold">Rubric Weight: 10M</span>
                  </div>
                  <p className="italic text-slate-800 dark:text-slate-200 font-serif leading-relaxed">
                    &ldquo;T(n) = 2T(n/2) + O(n). By Master Theorem Case 2, where a=2, b=2, log_b(a)=1, hence T(n) = &Theta;(n log n).&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-brand-600 dark:text-brand-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>AI Evaluated: 10.0 / 10.0 (Full Mark)</span>
                    </span>
                    <span className="text-slate-400">Confidence: 99.1%</span>
                  </div>
                </div>
              </div>

              {/* Animated Progress Indicator */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Batch OCR Pipeline Progress</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{scanProgress}% Completed</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 transition-all duration-500 shadow-sm"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            </section>

            {/* ANIMATED CHART VISUALIZATIONS WIDGET */}
            <MobileEvaluatorCharts />

            {/* ACTIVE EXAM BATCHES WITH EXPANDABLE CARD INTERACTIONS */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Examination Batches
                </h3>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">2 Batches</span>
              </div>

              {/* Batch 1: CS804 */}
              <div className="glass-card gradient-border-glow rounded-2xl overflow-hidden shadow-md border border-white/40 dark:border-slate-800 transition-all">
                <div
                  onClick={() => {
                    setExpandedBatchId(expandedBatchId === 'CS804' ? null : 'CS804');
                    soundEffects.playScanTick();
                  }}
                  className="p-3.5 flex items-center justify-between cursor-pointer touch-press"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-brand-500/20">
                      CS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        CS804: Data Structures & Algorithms
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Semester End Exam • 32 Scripts Digitized
                      </p>
                    </div>
                  </div>
                  {expandedBatchId === 'CS804' ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {expandedBatchId === 'CS804' && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-slate-400 block">AI Marking Status</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Completed (32/32)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-slate-400 block">Teacher Audit Needed</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">3 Low-confidence scripts</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('review-workspace');
                          else if (onSwitchToDesktop) onSwitchToDesktop();
                        }}
                        className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center space-x-1.5 touch-press cursor-pointer"
                      >
                        <span>Audit Marks</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('analytics');
                          else setActiveTab('analytics');
                        }}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 touch-press cursor-pointer"
                      >
                        Analytics
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch 2: MA801 */}
              <div className="glass-card gradient-border-glow rounded-2xl overflow-hidden shadow-md border border-white/40 dark:border-slate-800 transition-all">
                <div
                  onClick={() => {
                    setExpandedBatchId(expandedBatchId === 'MA801' ? null : 'MA801');
                    soundEffects.playScanTick();
                  }}
                  className="p-3.5 flex items-center justify-between cursor-pointer touch-press"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-violet-500/20">
                      MA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        MA801: Discrete Mathematics & Logic
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Midterm Exam • 16 Scripts Digitized
                      </p>
                    </div>
                  </div>
                  {expandedBatchId === 'MA801' ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {expandedBatchId === 'MA801' && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-slate-400 block">AI Marking Status</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">16 / 16 Verified</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-slate-400 block">Class Average</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">82.5% Attainment</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: PHYSICAL SCRIPTS & OCR VIEWER */}
        {activeTab === 'scripts' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="glass-card gradient-border-glow rounded-3xl p-4 shadow-xl border border-white/40 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Physical Answer Sheets
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Scanned physical exam sheets converted into verified digital text and bounding boxes.
              </p>

              <div className="space-y-2">
                {[
                  { id: 'STU-1024', name: 'Aarav Sharma', score: '94 / 100', status: 'Approved', badge: 'bg-emerald-100 text-emerald-700' },
                  { id: 'STU-1025', name: 'Priya Nair', score: '78 / 100', status: 'Approved', badge: 'bg-emerald-100 text-emerald-700' },
                  { id: 'STU-1026', name: 'Rohan Mehta', score: '58 / 100', status: 'Audit Needed', badge: 'bg-amber-100 text-amber-700' },
                ].map((s) => (
                  <div key={s.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between touch-press">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">({s.id})</span>
                      </div>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                        Score: {s.score}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.badge}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI RUBRIC INTELLIGENCE */}
        {activeTab === 'rubric' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="glass-card gradient-border-glow rounded-3xl p-4 shadow-xl border border-white/40 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Semantic Rubric Engine
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Multi-criteria partial marking weights validated with faculty benchmarks.
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Criterion 1: Theoretical Foundation</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Accurate asymptotic definition & recurrence breakdown</p>
                  <span className="text-[10px] text-slate-500">Weight: 40% (4.0 Marks)</span>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Criterion 2: Step-by-Step Derivation</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Master theorem application with matching cases</p>
                  <span className="text-[10px] text-slate-500">Weight: 40% (4.0 Marks)</span>
                </div>
                <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-900/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Criterion 3: Final Bound Conclusion</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Explicit Big-Theta theta notation formatting</p>
                  <span className="text-[10px] text-slate-500">Weight: 20% (2.0 Marks)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADVANCED ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MobileEvaluatorCharts />

            <div className="glass-card gradient-border-glow rounded-3xl p-4 shadow-xl border border-white/40 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Conceptual Gap Analysis
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Identified areas where students lost marks across question sections:
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
                  <span className="text-rose-800 dark:text-rose-200 font-medium text-[11px]">Q4: AVL Tree Rotations</span>
                  <span className="text-rose-600 font-bold text-[11px]">28% error rate</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-200 font-medium text-[11px]">Q2: Recurrence Boundary Cases</span>
                  <span className="text-amber-600 font-bold text-[11px]">14% error rate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Switcher Card for Desktop / Website */}
        <section className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
              Viewing Mobile Evaluator Mode
            </span>
            <span className="text-[10px] text-slate-500">Engineered for phone ratios & quick audits</span>
          </div>
          {onOpenWebsite && (
            <button
              onClick={onOpenWebsite}
              className="px-2.5 py-1 text-[10px] font-semibold bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-lg border border-slate-200 dark:border-slate-700 touch-press cursor-pointer"
            >
              Public Website
            </button>
          )}
        </section>
      </main>

      {/* 5. FLOATING MOBILE BOTTOM THUMB DOCK (Smooth tab transitions) */}
      <nav className="fixed bottom-3 inset-x-0 z-50 max-w-sm mx-auto px-4">
        <div className="glass-panel rounded-2xl p-1.5 shadow-2xl border border-white/40 dark:border-slate-800 flex items-center justify-around">
          <button
            onClick={() => {
              setActiveTab('overview');
              soundEffects.playScanTick();
            }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all touch-press ${
              activeTab === 'overview'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">Overview</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('scripts');
              soundEffects.playScanTick();
            }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all touch-press ${
              activeTab === 'scripts'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">Scripts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('rubric');
              soundEffects.playScanTick();
            }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all touch-press ${
              activeTab === 'rubric'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">Rubrics</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('analytics');
              soundEffects.playScanTick();
            }}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all touch-press ${
              activeTab === 'analytics'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[9px] font-bold mt-0.5">Charts</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
