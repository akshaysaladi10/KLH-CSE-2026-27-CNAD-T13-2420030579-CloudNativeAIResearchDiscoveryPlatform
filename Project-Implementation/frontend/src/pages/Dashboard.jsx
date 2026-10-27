import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Aggregating live cluster telemetry & statistics...</p>
      </div>
    );
  }

  const statItems = [
    {
      title: 'Platform Papers',
      value: stats?.stats?.totalPlatformPapers ?? 0,
      icon: BookOpen,
      color: 'from-blue-600 to-cyan-500',
      desc: 'Indexed scientific papers in MongoDB',
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
      desc: 'PyMuPDF + LLM extracted insights',
      to: '/library?tab=all',
    },
    {
      title: 'Saved Bookmarks',
      value: stats?.stats?.bookmarkedPapers ?? 0,
      icon: Bookmark,
      color: 'from-amber-600 to-orange-500',
      desc: 'Personal researcher reading list',
      to: '/library?tab=bookmarks',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border border-slate-800 p-8 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Cloud-Native Microservices Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Research Intelligence Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Real-time telemetry and metadata from the Auth, Paper, Search, PDF, and AI services. Upload a research PDF or discover live papers from OpenAlex.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/discover"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Discover Papers</span>
          </Link>
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards - Interactive Links to Library */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statItems.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.to}
              className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-900/60 transition shadow-lg relative overflow-hidden group block cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-400 uppercase tracking-wide transition">
                  {stat.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow group-hover:scale-105 transition`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-black text-white tracking-tight">
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

      {/* Main Grid: Recent Uploads & Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Papers */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Recent Research Papers</h2>
            </div>
            <Link
              to="/library"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View All Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recentPapers?.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {stats.recentPapers.map((paper) => (
                <Link
                  key={paper._id}
                  to={`/papers/${paper._id}`}
                  className="py-3.5 px-2 flex items-center justify-between hover:bg-slate-900/60 rounded-xl transition group"
                >
                  <div className="pr-4 overflow-hidden">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition truncate">
                      {paper.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {paper.researchDomain || 'Computer Science'} • {paper.publicationYear || 'Recent'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {paper.isAnalyzed && (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                        AI Ready
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No papers found yet. Use "Upload Paper" or "Discover Research" to add papers.
            </div>
          )}
        </div>

        {/* Top Research Topics */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Top Research Topics</h2>
          </div>

          {stats?.topTopics?.length > 0 ? (
            <div className="space-y-3">
              {stats.topTopics.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                >
                  <span className="text-xs font-semibold text-slate-300 truncate pr-2">
                    {t.topic}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {t.count} {t.count === 1 ? 'paper' : 'papers'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Keywords and topic frequencies will display as papers are uploaded.
            </div>
          )}
        </div>
      </div>

      {/* Recommended Papers Section */}
      {recommendations.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Recommended Papers (Keyword Similarity Engine)</h2>
            </div>
            <span className="text-xs text-slate-400">Based on your uploads & bookmarks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec, i) => {
              const paper = rec.paper;
              if (!paper) return null;
              return (
                <Link
                  key={i}
                  to={`/papers/${paper._id}`}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="text-indigo-400 font-semibold">{rec.reason || 'Keyword match'}</span>
                      <span>Score: {Math.round(rec.score * 100)}%</span>
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
    </div>
  );
}
