import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Eye,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ReadingHistory() {
  const { showToast } = useToast();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/papers/reading/history');
      if (res.data?.success) {
        setPapers(res.data.data.papers || []);
      }
    } catch (err) {
      showToast('Failed to load reading history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleToggleRead = async (paperId) => {
    try {
      const res = await api.put(`/papers/${paperId}/read`);
      if (res.data?.success) {
        showToast(
          res.data.data.isRead ? 'Marked paper as Read' : 'Marked paper as Unread',
          'success'
        );
        setPapers((prev) =>
          prev.map((p) =>
            p._id === paperId
              ? { ...p, isRead: res.data.data.isRead, readAt: res.data.data.readAt }
              : p
          )
        );
      }
    } catch (err) {
      showToast('Failed to update read status', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Clock className="w-7 h-7 text-indigo-400" />
            <span>Reading History & Activity</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track publications you have inspected, mark reading completion, and review viewing timeline.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading your reading activity...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Reading Activity Recorded</p>
          <p>As you explore, view, and annotate research papers, your reading activity will appear here.</p>
          <Link
            to="/discover"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition shadow"
          >
            Discover Literature
          </Link>
        </div>
      ) : (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="divide-y divide-slate-800/80">
            {papers.map((paper) => (
              <div
                key={paper._id}
                className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-900/60 rounded-xl transition gap-3"
              >
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center space-x-2">
                    {paper.isRead && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Read</span>
                      </span>
                    )}
                    <span className="text-[11px] text-indigo-400 font-semibold">
                      {paper.researchDomain || 'Computer Science'}
                    </span>
                    <span className="text-[11px] text-slate-500">•</span>
                    <span className="text-[11px] text-slate-500">{paper.publicationYear || 'Recent'}</span>
                  </div>

                  <Link
                    to={`/papers/${paper._id}`}
                    className="text-sm font-bold text-slate-200 hover:text-indigo-400 transition line-clamp-1 block"
                  >
                    {paper.title}
                  </Link>

                  <p className="text-[11px] text-slate-400">
                    {(paper.authors || []).map((a) => a.name || a).slice(0, 3).join(', ')}
                    {paper.lastViewedAt && ` • Last viewed ${new Date(paper.lastViewedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleRead(paper._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      paper.isRead
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {paper.isRead ? 'Mark Unread' : 'Mark as Read'}
                  </button>

                  <Link
                    to={`/papers/${paper._id}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
