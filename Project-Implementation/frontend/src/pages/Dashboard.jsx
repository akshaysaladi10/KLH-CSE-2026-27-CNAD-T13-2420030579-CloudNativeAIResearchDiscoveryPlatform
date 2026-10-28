import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  FileText,
  Activity,
  Bookmark,
  Layers,
  Sparkles,
  Compass,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  Clock,
  BookOpen,
  Calendar,
  Search,
  Bot,
  GitCompare,
  FolderPlus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Download,
  BarChart2,
  RefreshCw,
  Folder,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartMetric, setActiveChartMetric] = useState('both'); // 'both', 'uploads', 'analyses'

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchDashboard = async () => {
    try {
      const [dashRes, recRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/recommendations'),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
        setStats(dashRes.value.data.data);
      }

      if (recRes.status === 'fulfilled' && recRes.value.data.success) {
        setRecommendations(recRes.value.data.data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Aggregating live cluster telemetry & research statistics...</p>
      </div>
    );
  }

  const statItems = [
    {
      title: 'Platform Papers',
      value: stats?.stats?.totalPlatformPapers ?? 0,
      icon: BookOpen,
      color: 'from-blue-600 to-cyan-500',
      desc: 'Cataloged publications in repository',
      to: '/library?tab=all',
    },
    {
      title: 'Uploaded Papers',
      value: stats?.stats?.uploadedPapers ?? 0,
      icon: UploadCloud,
      color: 'from-indigo-600 to-purple-500',
      desc: 'PDFs stored in MinIO object storage',
      to: '/library?tab=uploads',
    },
    {
      title: 'AI Analyzed',
      value: stats?.stats?.analyzedPapers ?? 0,
      icon: Activity,
      color: 'from-emerald-600 to-teal-500',
      desc: 'PyMuPDF + Scientific NLP insights',
      to: '/library?tab=all',
    },
    {
      title: 'Saved Bookmarks',
      value: stats?.stats?.bookmarkedPapers ?? 0,
      icon: Bookmark,
      color: 'from-amber-600 to-orange-500',
      desc: 'Personal researcher reading list',
      to: '/bookmarks',
    },
    {
      title: 'Collections',
      value: stats?.stats?.totalCollections ?? 0,
      icon: Folder,
      color: 'from-fuchsia-600 to-pink-500',
      desc: 'Organized topical research workspaces',
      to: '/collections',
    },
  ];

  const quickActions = [
    { label: 'Upload Paper', desc: 'Ingest PDF or scientific abstract', icon: UploadCloud, to: '/upload', color: 'bg-indigo-600 text-white' },
    { label: 'Discover Research', desc: 'Search 250M+ OpenAlex scholarly records', icon: Compass, to: '/discover', color: 'bg-slate-800 text-indigo-400' },
    { label: 'AI Assistant', desc: 'Ask questions grounded in literature', icon: Bot, to: '/assistant', color: 'bg-slate-800 text-cyan-400' },
    { label: 'Compare Papers', desc: 'Side-by-side multi-paper matrix', icon: GitCompare, to: '/compare', color: 'bg-slate-800 text-purple-400' },
    { label: 'Create Collection', desc: 'Organize research projects & notes', icon: FolderPlus, to: '/collections', color: 'bg-slate-800 text-emerald-400' },
  ];

  const activityData = stats?.activityOverTime || [];
  const maxActivityVal = Math.max(
    ...activityData.map((d) => Math.max(d.uploads || 0, d.analyses || 0)),
    4
  );

  const processingOverview = stats?.processingOverview || {
    completed: 0,
    analyzing: 0,
    extracting: 0,
    pending: 0,
    completed_without_ai: 0,
    failed: 0,
  };

  const isEmptyState = (stats?.stats?.totalPlatformPapers ?? 0) === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Personalized Welcome Header & Global Research Search Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 border border-slate-800 p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Cloud-Native Microservices Operational</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Researcher'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Access your scientific workspace, examine real-time extraction telemetry, synthesize findings with NLP, and query academic publications.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/upload"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF</span>
            </Link>
            <Link
              to="/discover"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Discover Research</span>
            </Link>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="relative max-w-3xl">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-indigo-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across title, author, keyword, DOI, or abstract (e.g. 'Kubernetes autoscaling', 'Distributed consensus')..."
              className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statItems.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.to}
              className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-900/60 transition shadow-lg relative overflow-hidden group block cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-400 uppercase tracking-wide transition">
                  {stat.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow group-hover:scale-105 transition`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {stat.value.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed truncate">
                  {stat.desc}
                </p>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Quick Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((qa, idx) => {
          const Icon = qa.icon;
          return (
            <Link
              key={idx}
              to={qa.to}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition flex items-center space-x-3 group"
            >
              <div className={`w-8 h-8 rounded-xl ${qa.color} flex items-center justify-center flex-shrink-0 shadow`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition truncate">
                  {qa.label}
                </h4>
                <p className="text-[10px] text-slate-500 truncate">{qa.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 4. Research Activity Chart & Processing Pipeline Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-white">Research Activity Over Time</h2>
                <p className="text-xs text-slate-400">Actual document uploads and AI analyses</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveChartMetric('both')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeChartMetric === 'both' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveChartMetric('uploads')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeChartMetric === 'uploads' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Uploads
              </button>
              <button
                onClick={() => setActiveChartMetric('analyses')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeChartMetric === 'analyses' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Analyses
              </button>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="pt-2">
            <div className="h-44 w-full flex items-end justify-between gap-3 px-2">
              {activityData.map((month, i) => {
                const upHeight = Math.max(6, Math.round((month.uploads / maxActivityVal) * 120));
                const anHeight = Math.max(6, Math.round((month.analyses / maxActivityVal) * 120));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      {(activeChartMetric === 'both' || activeChartMetric === 'uploads') && (
                        <div
                          style={{ height: `${upHeight}px` }}
                          title={`Uploads: ${month.uploads}`}
                          className="w-1/2 max-w-[18px] bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-md transition-all group-hover:brightness-125"
                        />
                      )}
                      {(activeChartMetric === 'both' || activeChartMetric === 'analyses') && (
                        <div
                          style={{ height: `${anHeight}px` }}
                          title={`Analyses: ${month.analyses}`}
                          className="w-1/2 max-w-[18px] bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-md transition-all group-hover:brightness-125"
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{month.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-slate-800/60 mt-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-indigo-500" />
                <span>Document Uploads</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>Scientific AI Analyses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Pipeline Indicators */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <Activity className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Pipeline Telemetry</h2>
              <p className="text-xs text-slate-400">Status of extraction & AI jobs</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">Completed Analyses</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {processingOverview.completed}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs font-semibold text-slate-200">Analyzing (Active NLP)</span>
              </div>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {processingOverview.analyzing}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">PyMuPDF Extracting</span>
              </div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {processingOverview.extracting}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">Extracted Without AI</span>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {processingOverview.completed_without_ai}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-slate-200">Failed Extraction Jobs</span>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                {processingOverview.failed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recently Uploaded Papers & Top Research Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Papers */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-white">Recently Uploaded Papers</h2>
                <p className="text-xs text-slate-400">Latest research papers indexed in repository</p>
              </div>
            </div>
            <Link
              to="/library"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recentPapers?.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {stats.recentPapers.map((paper) => (
                <div
                  key={paper._id}
                  className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-900/60 rounded-xl transition gap-3"
                >
                  <div className="pr-4 overflow-hidden">
                    <Link
                      to={`/papers/${paper._id}`}
                      className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition line-clamp-1"
                    >
                      {paper.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {paper.researchDomain || 'Computer Science'} • {paper.publicationYear || 'Recent'} • Source: <span className="capitalize">{paper.source || 'upload'}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {paper.isAnalyzed ? (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                        AI Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">
                        {paper.processingStatus || 'Extracted'}
                      </span>
                    )}

                    <Link
                      to={`/papers/${paper._id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No research papers found in repository.</p>
              <Link
                to="/upload"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition shadow"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload your first paper</span>
              </Link>
            </div>
          )}
        </div>

        {/* Top Research Topics */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Research Topics</h2>
              <p className="text-xs text-slate-400">Extracted domain frequencies</p>
            </div>
          </div>

          {stats?.topTopics?.length > 0 ? (
            <div className="space-y-2.5">
              {stats.topTopics.map((t, idx) => (
                <Link
                  key={idx}
                  to={`/discover?q=${encodeURIComponent(t.topic)}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition group"
                >
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-400 transition truncate pr-2">
                    {t.topic}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {t.count} {t.count === 1 ? 'paper' : 'papers'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Topic frequencies will populate as research papers are cataloged.
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent Activity Timeline */}
      {stats?.recentActivity?.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-white">Recent Research Activity Timeline</h2>
                <p className="text-xs text-slate-400">Real events recorded in platform telemetry</p>
              </div>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.recentActivity.slice(0, 8).map((act, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    act.type === 'upload' ? 'bg-indigo-500/20 text-indigo-300' :
                    act.type === 'bookmark' ? 'bg-amber-500/20 text-amber-300' :
                    act.type === 'collection' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {act.type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                  {act.title}
                </h4>
                {act.paperId && (
                  <Link
                    to={`/papers/${act.paperId}`}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 pt-1"
                  >
                    <span>Inspect Paper</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Recommended Papers Section */}
      {recommendations.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-white">Recommended Papers (Keyword Similarity Engine)</h2>
                <p className="text-xs text-slate-400">Grounded matching based on your library content</p>
              </div>
            </div>
            <Link
              to="/discover"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec, i) => {
              const paper = rec.paper;
              if (!paper) return null;
              return (
                <Link
                  key={i}
                  to={`/papers/${paper._id || paper.id}`}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="text-indigo-400 font-semibold truncate max-w-[180px]">{rec.reason || 'Keyword match'}</span>
                      <span className="text-emerald-400 font-bold">Match: {Math.round((rec.score || 0.8) * 100)}%</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition line-clamp-2">
                      {paper.title}
                    </h4>
                  </div>
                  <div className="mt-3 text-xs text-indigo-400 font-semibold flex items-center space-x-1">
                    <span>View Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboarding State if empty */}
      {isEmptyState && (
        <div className="p-8 rounded-3xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-indigo-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Research Workspace is Ready</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Get started by uploading a sample research PDF, submitting an abstract for instant analysis, or discovering scholarly papers from OpenAlex.
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <Link
              to="/upload"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
            >
              Upload PDF
            </Link>
            <Link
              to="/discover"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Discover Papers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
