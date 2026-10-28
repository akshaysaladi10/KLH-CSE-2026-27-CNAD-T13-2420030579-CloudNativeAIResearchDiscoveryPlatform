import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Home,
  Compass,
  BookOpen,
  UploadCloud,
  FolderKanban,
  Layers,
  Bot,
  GitCompare,
  Target,
  Clock,
  BookmarkCheck,
  FileBarChart,
  Bell,
  Settings,
  LogOut,
  User,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Upload from './pages/Upload';
import Library from './pages/Library';
import PaperDetails from './pages/PaperDetails';
import Collections from './pages/Collections';
import Workspaces from './pages/Workspaces';
import Assistant from './pages/Assistant';
import Compare from './pages/Compare';
import GapExplorer from './pages/GapExplorer';
import ReadingHistory from './pages/ReadingHistory';
import Bookmarks from './pages/Bookmarks';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/Settings';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // If not logged in, render child route (Login or Register) directly
  if (!token) {
    return <>{children}</>;
  }

  const navSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: Home },
        { label: 'Discover Research', path: '/discover', icon: Compass },
        { label: 'My Library', path: '/library', icon: BookOpen },
        { label: 'Upload Paper', path: '/upload', icon: UploadCloud },
      ]
    },
    {
      title: 'RESEARCH & AI TOOLS',
      items: [
        { label: 'Collections', path: '/collections', icon: FolderKanban },
        { label: 'Research Workspaces', path: '/workspaces', icon: Layers },
        { label: 'AI Assistant', path: '/assistant', icon: Bot },
        { label: 'Compare Papers', path: '/compare', icon: GitCompare },
        { label: 'Research Gap Explorer', path: '/gaps', icon: Target },
      ]
    },
    {
      title: 'ANALYTICS & SETTINGS',
      items: [
        { label: 'Reading History', path: '/history', icon: Clock },
        { label: 'Bookmarks & Notes', path: '/bookmarks', icon: BookmarkCheck },
        { label: 'Research Reports', path: '/reports', icon: FileBarChart },
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 antialiased font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-sm">Research AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo / Brand */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-white text-base tracking-tight leading-tight">Research AI</div>
                <div className="text-[11px] text-indigo-400 font-semibold tracking-wide">Discovery & Analysis</div>
              </div>
            </div>
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Nav Links - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* User Card & Logout */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-2 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-700/50 flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Researcher'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Authenticated'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-900 overflow-y-auto p-4 sm:p-6 md:p-8 pt-18 md:pt-8 relative custom-scrollbar">
        {children}
      </main>
    </div>
  );
};

// Protected route wrapper
const Protected = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Public route wrapper (redirects to dashboard if logged in)
const PublicOnly = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ErrorBoundary title="Research AI Platform Application Error">
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            
            {/* Core Routes */}
            <Route path="/dashboard" element={<Protected><ErrorBoundary title="Dashboard Error"><Dashboard /></ErrorBoundary></Protected>} />
            <Route path="/discover" element={<Protected><ErrorBoundary title="Discover Error"><Discover /></ErrorBoundary></Protected>} />
            <Route path="/library" element={<Protected><ErrorBoundary title="Library Error"><Library /></ErrorBoundary></Protected>} />
            <Route path="/upload" element={<Protected><ErrorBoundary title="Upload Error"><Upload /></ErrorBoundary></Protected>} />
            <Route path="/papers/:id" element={<Protected><ErrorBoundary title="Paper Details Error"><PaperDetails /></ErrorBoundary></Protected>} />

            {/* Research & AI Modules */}
            <Route path="/collections" element={<Protected><ErrorBoundary title="Collections Error"><Collections /></ErrorBoundary></Protected>} />
            <Route path="/workspaces" element={<Protected><ErrorBoundary title="Workspaces Error"><Workspaces /></ErrorBoundary></Protected>} />
            <Route path="/assistant" element={<Protected><ErrorBoundary title="AI Assistant Error"><Assistant /></ErrorBoundary></Protected>} />
            <Route path="/compare" element={<Protected><ErrorBoundary title="Comparison Error"><Compare /></ErrorBoundary></Protected>} />
            <Route path="/gaps" element={<Protected><ErrorBoundary title="Gap Explorer Error"><GapExplorer /></ErrorBoundary></Protected>} />

            {/* Tracking & Insights Modules */}
            <Route path="/history" element={<Protected><ErrorBoundary title="Reading History Error"><ReadingHistory /></ErrorBoundary></Protected>} />
            <Route path="/bookmarks" element={<Protected><ErrorBoundary title="Bookmarks Error"><Bookmarks /></ErrorBoundary></Protected>} />
            <Route path="/reports" element={<Protected><ErrorBoundary title="Reports Error"><Reports /></ErrorBoundary></Protected>} />
            <Route path="/notifications" element={<Protected><ErrorBoundary title="Notifications Error"><Notifications /></ErrorBoundary></Protected>} />
            <Route path="/settings" element={<Protected><ErrorBoundary title="Settings Error"><SettingsPage /></ErrorBoundary></Protected>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;