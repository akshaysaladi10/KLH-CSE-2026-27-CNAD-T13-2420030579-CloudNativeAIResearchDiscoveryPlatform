import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Home,
  Compass,
  BookOpen,
  UploadCloud,
  LogOut,
  User,
  Sparkles,
  Layers
} from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Upload from './pages/Upload';
import Library from './pages/Library';
import PaperDetails from './pages/PaperDetails';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Discover Research', path: '/discover', icon: Compass },
    { label: 'My Library & Bookmarks', path: '/library', icon: BookOpen },
    { label: 'Upload Paper', path: '/upload', icon: UploadCloud },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 antialiased font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none">
        <div>
          {/* Logo / Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight leading-tight">Research AI</div>
              <div className="text-xs text-indigo-400 font-medium">Cloud-Native Platform</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${active ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-2 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/80 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-700/50">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Researcher'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'Authenticated'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-900 overflow-y-auto p-8 relative">
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
    <Layout>
      <Routes>
        <Route path="/" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/discover" element={<Protected><Discover /></Protected>} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/upload" element={<Protected><Upload /></Protected>} />
        <Route path="/papers/:id" element={<Protected><PaperDetails /></Protected>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
