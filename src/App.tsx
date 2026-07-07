import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Compass,
  Play,
  Award,
  History as HistoryIcon,
  Settings as SettingsIcon,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { LoadingScreen } from './components/LoadingScreen';
import { PrintableReport } from './components/PrintableReport';

// Lazy load route pages for bundle splitting and production performance
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const InterviewSetup = lazy(() => import('./components/InterviewSetup').then(m => ({ default: m.InterviewSetup })));
const AIInterview = lazy(() => import('./components/AIInterview').then(m => ({ default: m.AIInterview })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const History = lazy(() => import('./components/History').then(m => ({ default: m.History })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const Roadmap = lazy(() => import('./components/Roadmap').then(m => ({ default: m.Roadmap })));
const CareerInsights = lazy(() => import('./components/CareerInsights').then(m => ({ default: m.CareerInsights })));
const Replay = lazy(() => import('./components/Replay').then(m => ({ default: m.Replay })));
const NotFound = lazy(() => import('./components/NotFound').then(m => ({ default: m.NotFound })));

// Simple fallback spinner for route transition suspension
const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center select-none w-full">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-xs text-text-secondary font-medium animate-pulse">Loading page...</p>
  </div>
);

// Header Navigation component to handle location active classes
function NavigationHeader({ hasActiveSession }: { hasActiveSession: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Explore', icon: Compass },
    { path: '/setup', label: 'Practice', icon: Play },
    { path: '/dashboard', label: 'Dashboard', icon: Award },
    { path: '/insights', label: 'Career Insights', icon: Sparkles },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-navbar shadow-navbar backdrop-blur-md no-print">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <span className="text-xl font-extrabold tracking-tight font-display text-text-bright flex items-center gap-1.5">
            ✈️ InterviewPilot <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3.5 py-1.75 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive(link.path)
                    ? 'bg-card text-primary border border-border'
                    : 'text-text-secondary hover:text-text-bright'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-text-bright"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-navbar px-4 py-4 space-y-2"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold ${
                    isActive(link.path)
                      ? 'bg-card text-primary'
                      : 'text-text-secondary hover:text-text-bright'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Sub-component to manage active session banner trigger
function ActiveSessionBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const active = window.localStorage.getItem('interviewpilot_active_session');
      setHasSession(!!active);
    };

    checkSession();
    // Periodically inspect or listen to state
    window.addEventListener('storage', checkSession);
    return () => window.removeEventListener('storage', checkSession);
  }, [location]);

  if (!hasSession || location.pathname === '/interview') return null;

  return (
    <div className="bg-primary/10 border-b border-primary/25 px-4 py-2 text-center text-xs text-primary-hover flex items-center justify-center gap-2 no-print">
      <AlertTriangle className="w-3.5 h-3.5 text-primary animate-pulse" />
      <span>You have an ongoing mock interview session.</span>
      <button
        onClick={() => navigate('/interview')}
        className="font-bold underline text-blue-300 hover:text-blue-200 ml-1 flex items-center gap-0.5 cursor-pointer"
      >
        Resume Session <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export function AppContent() {
  const location = useLocation();
  const isInterviewPage = location.pathname === '/interview';

  // Global States
  const [isStartupLoading, setIsStartupLoading] = useState(true);
  const [apiKey, setApiKey] = useState(() => {
    return window.localStorage.getItem('interviewpilot_api_key') || '';
  });

  const [activeSetup, setActiveSetup] = useState<{
    role: string;
    category: string;
    difficulty: string;
    length: number;
    company: string;
  } | null>(null);

  const [activeRecord, setActiveRecord] = useState<{ interview: any; evaluation: any } | null>(() => {
    const saved = window.localStorage.getItem('interviewpilot_active_record');
    return saved ? JSON.parse(saved) : null;
  });

  const [history, setHistory] = useState<Array<{ interview: any; evaluation: any }>>(() => {
    const saved = window.localStorage.getItem('interviewpilot_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Load active theme settings
  useEffect(() => {
    const theme = window.localStorage.getItem('interviewpilot_theme');
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    window.localStorage.setItem('interviewpilot_api_key', key);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveRecord(null);
    window.localStorage.removeItem('interviewpilot_history');
    window.localStorage.removeItem('interviewpilot_active_record');
    window.localStorage.removeItem('interviewpilot_active_session');
  };

  const handleFinishInterview = (record: { interview: any; evaluation: any }) => {
    // Append to history
    const updatedHistory = [record, ...history];
    setHistory(updatedHistory);
    window.localStorage.setItem('interviewpilot_history', JSON.stringify(updatedHistory));

    // Set active record
    setActiveRecord(record);
    window.localStorage.setItem('interviewpilot_active_record', JSON.stringify(record));

    // Clear active setup to prevent direct /interview navigation reuse
    setActiveSetup(null);
  };

  const handleSelectHistoryRecord = (record: { interview: any; evaluation: any }) => {
    setActiveRecord(record);
    window.localStorage.setItem('interviewpilot_active_record', JSON.stringify(record));
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const updatedHistory = history.filter((item) => item.interview.id !== id);
    setHistory(updatedHistory);
    window.localStorage.setItem('interviewpilot_history', JSON.stringify(updatedHistory));
    if (activeRecord && activeRecord.interview.id === id) {
      setActiveRecord(null);
      window.localStorage.removeItem('interviewpilot_active_record');
    }
  };

  const handleUpdateHistoryRecord = (id: string, updatedRecord: any) => {
    const updatedHistory = history.map((item) => item.interview.id === id ? updatedRecord : item);
    setHistory(updatedHistory);
    window.localStorage.setItem('interviewpilot_history', JSON.stringify(updatedHistory));
    
    if (activeRecord && activeRecord.interview.id === id) {
      setActiveRecord(updatedRecord);
      window.localStorage.setItem('interviewpilot_active_record', JSON.stringify(updatedRecord));
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isStartupLoading ? (
        <LoadingScreen key="startup-loader" startup onComplete={() => setIsStartupLoading(false)} />
      ) : (
        <motion.div
          key="app-root"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col min-h-screen"
        >
          <NavigationHeader hasActiveSession={false} />
          <ActiveSessionBanner />
          
          <main className="flex-1 bg-background text-text no-print">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/setup"
                  element={
                    <InterviewSetup
                      apiKey={apiKey}
                      onStartInterview={(setup) => setActiveSetup(setup)}
                    />
                  }
                />
                <Route
                  path="/interview"
                  element={
                    <AIInterview
                      apiKey={apiKey}
                      setup={activeSetup}
                      onFinish={handleFinishInterview}
                    />
                  }
                />
                <Route path="/dashboard" element={<Dashboard activeRecord={activeRecord} />} />
                <Route path="/replay" element={<Replay activeRecord={activeRecord} />} />
                <Route
                  path="/history"
                  element={
                    <History
                      history={history}
                      onSelectRecord={handleSelectHistoryRecord}
                      onDeleteRecord={handleDeleteHistoryRecord}
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      apiKey={apiKey}
                      onSaveApiKey={handleSaveApiKey}
                      onClearHistory={handleClearHistory}
                    />
                  }
                />
                <Route path="/roadmap" element={<Roadmap activeRecord={activeRecord} />} />
                <Route
                  path="/insights"
                  element={
                    <CareerInsights
                      apiKey={apiKey}
                      activeRecord={activeRecord}
                      history={history}
                      onUpdateRecord={handleUpdateHistoryRecord}
                    />
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

      {!isInterviewPage && (
        <footer className="border-t border-border bg-background py-12 px-6 no-print transition-colors">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* About Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-left">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-sm font-semibold tracking-wider text-text-secondary uppercase">About the Developer</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  InterviewPilot AI is an AI-powered mock interview platform designed and developed by{' '}
                  <span className="font-bold text-text-bright">Yash Mohite</span>, a B.Tech Computer Science (AI/ML)
                  student passionate about Artificial Intelligence, Machine Learning, Java, React, and Full Stack
                  Development. The goal of this project is to help students and job seekers prepare for technical
                  interviews using modern AI.
                </p>
              </div>
              <div className="space-y-3 font-sans">
                <h3 className="text-sm font-semibold tracking-wider text-text-secondary uppercase">Built With</h3>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-text-secondary font-medium">
                  <span className="px-2.5 py-1 rounded bg-card border border-input-border/30">React</span>
                  <span className="px-2.5 py-1 rounded bg-card border border-input-border/30">TypeScript</span>
                  <span className="px-2.5 py-1 rounded bg-card border border-input-border/30">Tailwind CSS</span>
                  <span className="px-2.5 py-1 rounded bg-card border border-input-border/30">Gemini AI</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60" />

            {/* Bottom copyrights and links */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-semibold text-text-secondary">© 2026 InterviewPilot AI</p>
                <p className="text-[10px]">Designed & Developed by Yash Mohite</p>
              </div>
              
              <div className="flex gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    />
                  </svg>
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

        {/* Hidden layout rendered exclusively for print calls */}
        <PrintableReport activeRecord={activeRecord} />
        {import.meta.env.DEV && <DevRequestCounter />}
      </motion.div>
    )}
  </AnimatePresence>
  );
}

function DevRequestCounter() {
  const [count, setCount] = useState(() => {
    return (window as any).geminiRequestCount || 0;
  });

  useEffect(() => {
    const handleEvent = (e: any) => {
      setCount(e.detail.count);
    };
    window.addEventListener('gemini-request-sent', handleEvent);
    return () => window.removeEventListener('gemini-request-sent', handleEvent);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 px-3 py-1.5 bg-card/90 border border-border text-[10px] font-bold font-mono text-primary rounded-lg shadow-lg select-none no-print pointer-events-none animate-pulse">
      ⚡ Gemini Requests: {count}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
