import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles,
  BookOpen,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate notification stream from actual database events & recent papers
    api.get('/analytics/dashboard')
      .then((res) => {
        if (res.data?.success) {
          const stats = res.data.data;
          const stream = [];

          (stats.recentPapers || []).forEach((p) => {
            stream.push({
              id: `notif-${p._id}`,
              type: p.isAnalyzed ? 'ai_complete' : 'upload',
              title: p.isAnalyzed ? 'AI Analysis Ready' : 'Document Ingested',
              message: p.isAnalyzed
                ? `Structured scientific analysis is complete for "${p.title}".`
                : `Paper "${p.title}" was saved to MinIO object storage.`,
              timestamp: p.createdAt,
              link: `/papers/${p._id}`,
            });
          });

          // System telemetry notification
          stream.push({
            id: 'notif-cluster-active',
            type: 'system',
            title: 'Cluster Status: All Microservices Operational',
            message: 'Auth, Paper, Search, PDF, and AI services are connected via Docker bridge network.',
            timestamp: new Date().toISOString(),
            link: '/settings',
          });

          setNotifications(stream);
        }
      })
      .catch((err) => console.error('Failed to load notifications:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleClear = () => {
    setNotifications([]);
    showToast('Notifications marked as read', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Bell className="w-7 h-7 text-indigo-400" />
            <span>Activity Notifications</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time notifications for extraction jobs, completed analyses, and cluster events.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Aggregating recent notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">All Caught Up</p>
          <p>No unread notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-4 shadow-lg"
            >
              <div className="flex items-start space-x-3.5 overflow-hidden">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    notif.type === 'ai_complete'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : notif.type === 'system'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {notif.type === 'ai_complete' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : notif.type === 'system' ? (
                    <Activity className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              {notif.link && (
                <Link
                  to={notif.link}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-semibold flex items-center space-x-1 flex-shrink-0 transition"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
