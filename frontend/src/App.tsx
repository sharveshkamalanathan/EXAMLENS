import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { FreeTrialModal } from './components/FreeTrialModal';
import { MobilePortalNotice } from './components/MobilePortalNotice';
import { MobileEvaluatorDashboard } from './components/mobile/MobileEvaluatorDashboard';

// Pages
import { LandingPage } from './pages/LandingPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { CreateExamModal } from './pages/CreateExamModal';
import { ExamListPage } from './pages/ExamListPage';
import { QuestionBuilderPage } from './pages/QuestionBuilderPage';
import { UploadCenterPage } from './pages/UploadCenterPage';
import { OCRVerificationPage } from './pages/OCRVerificationPage';
import { EvaluationQueuePage } from './pages/EvaluationQueuePage';
import { ReviewWorkspacePage } from './pages/ReviewWorkspacePage';
import { PublishResultsPage } from './pages/PublishResultsPage';
import { TeacherAnalyticsPage } from './pages/TeacherAnalyticsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentExamDetailPage } from './pages/StudentExamDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const AppContent: React.FC = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  
  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [createExamModalOpen, setCreateExamModalOpen] = useState<boolean>(false);
  const [featuresModalOpen, setFeaturesModalOpen] = useState<boolean>(false);
  const [workflowModalOpen, setWorkflowModalOpen] = useState<boolean>(false);
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [trialModalOpen, setTrialModalOpen] = useState<boolean>(false);

  // Viewport & Mobile Evaluator Mode State
  const [viewMode, setViewMode] = useState<'auto' | 'mobile' | 'desktop'>(() => {
    return (localStorage.getItem('examlens_view_mode') as any) || 'auto';
  });

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync tab with authentication role
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (currentTab === 'landing') {
          setCurrentTab(role === 'student' ? 'student-dashboard' : (role === 'admin' ? 'admin-dashboard' : 'dashboard'));
        }
      } else {
        if (currentTab !== 'landing') {
          setCurrentTab('landing');
        }
      }
    }
  }, [isAuthenticated, role, isLoading]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigate = (tab: string, meta?: any) => {
    if (typeof meta === 'string') {
      setSelectedExamId(meta);
    } else if (meta && meta.examId) {
      setSelectedExamId(meta.examId);
    }
    if (meta && meta.scriptId) {
      setSelectedScriptId(meta.scriptId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = (): { title: string; subtitle?: string } => {
    switch (currentTab) {
      case 'dashboard':
        return { 
          title: 'Faculty Evaluation Dashboard', 
          subtitle: 'Real-time overview of physical scripts, OCR pipeline, AI evaluations, and reviews' 
        };
      case 'exams':
        return { 
          title: 'Examinations Directory', 
          subtitle: 'Create, configure, and manage curriculum examination assessments' 
        };
      case 'question-builder':
        return { 
          title: 'Question Bank & Marking Rubrics', 
          subtitle: 'Define question criteria, reference answers, and semantic scoring weights' 
        };
      case 'upload':
        return { 
          title: 'Physical Script Digitization Center', 
          subtitle: 'Batch upload scanned pen-and-paper examination answer sheets' 
        };
      case 'ocr-verification':
        return { 
          title: 'Handwriting OCR Verification Workspace', 
          subtitle: 'Inspect digitized handwriting, correct OCR text, and verify question bounding segments' 
        };
      case 'evaluation-queue':
        return { 
          title: 'AI Semantic Evaluation Queue', 
          subtitle: 'Trigger rubric-based partial marking and semantic analysis on verified answers' 
        };
      case 'review-workspace':
        return { 
          title: 'Teacher Review & Final Authority Console', 
          subtitle: 'Audit AI explanations, override marks with full change-log, and approve final grades' 
        };
      case 'publishing':
        return { 
          title: 'Result Publication Center', 
          subtitle: 'Inspect pre-publication checklist, release verified grades to students, or export CSV' 
        };
      case 'analytics':
        return { 
          title: 'Academic Intelligence & Analytics', 
          subtitle: 'Score distributions, question difficulty index, and AI-identified conceptual gaps' 
        };
      case 'settings':
        return { 
          title: 'System Settings & AI Providers', 
          subtitle: 'Handwriting OCR backends, OpenAI-compatible LLM endpoints, and demo accounts' 
        };
      case 'admin-dashboard':
      case 'admin-messages':
        return { 
          title: 'Platform Master Console & Inquiries', 
          subtitle: 'System analytics, customer contact messages, user management, and OCR infrastructure' 
        };
      case 'student-dashboard':
      case 'student-results':
      case 'student-analytics':
      case 'student-feedback':
        return { 
          title: 'Student Academic Portal', 
          subtitle: 'Official examination results, faculty-approved grades, and educational AI feedback' 
        };
      case 'student-exam-detail':
        return { 
          title: 'Examination Scorecard & Feedback', 
          subtitle: 'Detailed question-by-question breakdown, criteria attainment, and revision tips' 
        };
      default:
        return { title: 'ExamLens', subtitle: 'See beyond the answer.' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800">ExamLens</h2>
          <p className="text-xs text-slate-500">Loading academic workspace...</p>
        </div>
      </div>
    );
  }

  // Check if Mobile Evaluator Dashboard should be displayed (disabled inside authenticated portal)
  const showMobileDashboard = 
    !isAuthenticated && (currentTab === 'mobile-dashboard' || viewMode === 'mobile');

  if (showMobileDashboard) {
    return (
      <MobileEvaluatorDashboard
        onSwitchToDesktop={() => {
          setViewMode('desktop');
          localStorage.setItem('examlens_view_mode', 'desktop');
          if (currentTab === 'mobile-dashboard') {
            setCurrentTab(isAuthenticated ? 'dashboard' : 'landing');
          }
        }}
        onOpenWebsite={() => {
          setCurrentTab('landing');
        }}
        onNavigateTab={(tab) => {
          if (tab === 'desktop') {
            setViewMode('desktop');
            localStorage.setItem('examlens_view_mode', 'desktop');
            setCurrentTab('dashboard');
          } else {
            handleNavigate(tab);
          }
        }}
      />
    );
  }

  // Public Landing Page
  if (currentTab === 'landing' || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Navbar 
          onOpenAuth={handleOpenAuth} 
          onNavigateTab={handleNavigate} 
          onOpenFeaturesModal={() => setFeaturesModalOpen(true)}
          onOpenWorkflowModal={() => setWorkflowModalOpen(true)}
          onOpenContactModal={() => setContactModalOpen(true)}
          onOpenTrial={() => setTrialModalOpen(true)}
        />
        <LandingPage 
          onOpenAuth={handleOpenAuth} 
          onNavigateTab={handleNavigate} 
          externalFeaturesOpen={featuresModalOpen}
          externalWorkflowOpen={workflowModalOpen}
          externalContactOpen={contactModalOpen}
          onOpenTrial={() => setTrialModalOpen(true)}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
        />
        <FreeTrialModal
          isOpen={trialModalOpen}
          onClose={() => setTrialModalOpen(false)}
          onActivated={() => {
            setTrialModalOpen(false);
            handleOpenAuth('login');
          }}
        />
      </div>
    );
  }

  const { title, subtitle } = getPageTitle();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      <MobilePortalNotice onBackToWebsite={() => setCurrentTab('landing')} />
      {/* Left Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={(tab) => handleNavigate(tab)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={title} 
          subtitle={subtitle}
          onOpenSettings={() => handleNavigate('settings')}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 dark:bg-slate-950">
          {/* Teacher Views */}
          {currentTab === 'dashboard' && (
            <TeacherDashboard 
              onNavigateTab={handleNavigate}
              onOpenCreateExam={() => setCreateExamModalOpen(true)}
            />
          )}

          {currentTab === 'exams' && (
            <ExamListPage 
              onNavigateTab={handleNavigate}
              onOpenCreateExam={() => setCreateExamModalOpen(true)}
            />
          )}

          {currentTab === 'question-builder' && (
            <QuestionBuilderPage 
              initialExamId={selectedExamId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'upload' && (
            <UploadCenterPage 
              initialExamId={selectedExamId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'ocr-verification' && (
            <OCRVerificationPage 
              initialExamId={selectedExamId}
              initialScriptId={selectedScriptId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'evaluation-queue' && (
            <EvaluationQueuePage 
              initialExamId={selectedExamId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'review-workspace' && (
            <ReviewWorkspacePage 
              initialExamId={selectedExamId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'publishing' && (
            <PublishResultsPage 
              initialExamId={selectedExamId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'analytics' && (
            <TeacherAnalyticsPage 
              initialExamId={selectedExamId}
              onNavigateTab={handleNavigate}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}

          {/* Administrator Master Console Views */}
          {(currentTab === 'admin-dashboard' || currentTab === 'admin-messages') && (
            <AdminDashboardPage 
              onNavigateTab={handleNavigate}
            />
          )}

          {/* Student Views */}
          {(currentTab === 'student-dashboard' || 
            currentTab === 'student-results' || 
            currentTab === 'student-analytics' || 
            currentTab === 'student-feedback') && (
            <StudentDashboard 
              activeTab={currentTab}
              onNavigateTab={(tab) => handleNavigate(tab)}
              onSelectExam={(examId) => {
                setSelectedExamId(examId);
                setCurrentTab('student-exam-detail');
              }}
            />
          )}

          {currentTab === 'student-exam-detail' && (
            <StudentExamDetailPage 
              examId={selectedExamId}
              onBack={() => setCurrentTab('student-dashboard')}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreateExamModal
        isOpen={createExamModalOpen}
        onClose={() => setCreateExamModalOpen(false)}
        onCreated={(newExam: any) => {
          setSelectedExamId(newExam.id);
          setCurrentTab('question-builder');
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      <FreeTrialModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onActivated={() => {
          setTrialModalOpen(false);
          handleOpenAuth('login');
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
