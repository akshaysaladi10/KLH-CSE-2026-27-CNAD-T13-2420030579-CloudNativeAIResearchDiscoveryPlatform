import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Layers,
  Sparkles,
  BookOpen,
  FolderPlus,
  Plus,
  FileText,
  Pin,
  Clock,
  ArrowRight,
  Target,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Workspaces() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [recentPapers, setRecentPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectNote, setActiveProjectNote] = useState(
    localStorage.getItem('workspace_active_note') ||
      '## Current Research Focus: Adaptive Microservice Telemetry\nInvestigating whether eBPF kernel tracing reduces sidecar proxy overhead compared to Envoy access logging under dynamic traffic spikes.'
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colRes, paperRes] = await Promise.allSettled([
          api.get('/library/collections'),
          api.get('/papers?limit=6'),
        ]);

        if (colRes.status === 'fulfilled' && colRes.value.data.success) {
          setCollections(colRes.value.data.data.collections || []);
        }

        if (paperRes.status === 'fulfilled' && paperRes.value.data.success) {
          setRecentPapers(paperRes.value.data.data.papers || []);
        }
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveNotes = () => {
    localStorage.setItem('workspace_active_note', activeProjectNote);
    showToast('Workspace research notes saved locally!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Research Workspaces</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Dedicated project workbenches: curate publications, document active research questions, and synthesize literature drafts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/collections"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Manage Collections</span>
          </Link>
          <Link
            to="/assistant"
            className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Grid: Active Note Workbench & Pinned Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Notes & Scratchpad */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Project Hypothesis & Synthesis Workbench</h2>
            </div>
            <button
              onClick={handleSaveNotes}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Save Notes</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Keep track of active research questions, experimental design hypotheses, and working literature notes.
          </p>

          <textarea
            rows={10}
            value={activeProjectNote}
            onChange={(e) => setActiveProjectNote(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner"
            placeholder="Document your hypothesis, paper notes, or literature synthesis..."
          />
        </div>

        {/* Collections Overview */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Active Projects</h2>
            </div>
            <Link to="/collections" className="text-xs text-indigo-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading projects...</div>
          ) : collections.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-2">
              <p>No project collections created.</p>
              <Link
                to="/collections"
                className="text-xs text-indigo-400 font-semibold hover:underline"
              >
                + Create new project collection
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.map((col) => (
                <Link
                  key={col._id}
                  to={`/collections`}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between group block"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color || '#6366f1' }}
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 truncate">
                        {col.name}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {col.paperIds?.length || 0} {(col.paperIds?.length || 0) === 1 ? 'paper' : 'papers'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Next Actions */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Quick Literature Discovery for this Workspace</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentPapers.slice(0, 3).map((p) => (
            <div
              key={p._id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  {p.researchDomain || 'Computer Science'}
                </span>
                <h4 className="text-xs font-bold text-slate-200 mt-2 line-clamp-2">{p.title}</h4>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">{p.publicationYear || 'Recent'}</span>
                <Link
                  to={`/papers/${p._id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <span>Examine</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
