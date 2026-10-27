import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
  Search,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab); // 'all' | 'uploads' | 'bookmarks'
  const [papers, setPapers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['all', 'uploads', 'bookmarks'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookmarks') {
        const res = await api.get('/library/bookmarks');
        if (res.data.success) {
          const list = (res.data.data.bookmarks || []).map((b) => ({
            ...b.paperId,
            bookmarkId: b._id,
            bookmarkedAt: b.createdAt,
          })).filter(p => p && p.title);
          setPapers(list);
        }
      } else if (activeTab === 'uploads') {
        const res = await api.get(`/papers/user/${user.id || user._id}`);
        if (res.data.success) {
          setPapers(res.data.data.papers || []);
        }
      } else {
        const endpoint = query
          ? `/search?q=${encodeURIComponent(query)}&source=local`
          : '/papers?limit=50';
        const res = await api.get(endpoint);
        setPapers(res.data.data.papers || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLibrary();
  };

  const handleRemoveBookmark = async (paperId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/library/bookmarks/${paperId}`);
      setPapers((prev) => prev.filter((p) => (p._id || p.id) !== paperId));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove bookmark.');
    }
  };

  const handleDeletePaper = async (paperId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this paper from your library?')) return;
    try {
      await api.delete(`/papers/${paperId}`);
      setPapers((prev) => prev.filter((p) => (p._id || p.id) !== paperId));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete paper.');
    }
  };

  // Filter papers locally by query if in bookmarks or uploads tab
  const displayedPapers =
    activeTab === 'all'
      ? papers
      : papers.filter(
          (p) =>
            p.title?.toLowerCase().includes(query.toLowerCase()) ||
            p.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase())) ||
            p.researchDomain?.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Research Library</h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse indexed scientific publications, your uploaded research PDFs, and saved bookmarks.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Paper</span>
        </Link>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Platform Papers</span>
            </button>

            <button
              onClick={() => handleTabChange('uploads')}
              className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'uploads'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>My Uploads</span>
            </button>

            <button
              onClick={() => handleTabChange('bookmarks')}
              className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'bookmarks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Bookmarks</span>
            </button>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter library..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </form>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading library records from MongoDB...</p>
        </div>
      ) : displayedPapers.length === 0 ? (
        <div className="py-20 text-center bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">
            {activeTab === 'bookmarks'
              ? 'No bookmarked papers yet'
              : activeTab === 'uploads'
              ? 'No uploaded PDFs found'
              : 'No papers found in library'}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {activeTab === 'bookmarks'
              ? 'Bookmark interesting papers from Discovery or Paper Details to access them here.'
              : activeTab === 'uploads'
              ? 'Upload research PDFs to have PyMuPDF extract text and AI generate automated analysis.'
              : 'Try a different search query or discover external papers from OpenAlex.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedPapers.map((paper) => {
            const paperId = paper._id || paper.id;
            return (
              <Link
                key={paperId}
                to={`/papers/${paperId}`}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="text-indigo-400 font-semibold">
                      {paper.researchDomain || 'Computer Science'}
                    </span>
                    <span className="flex items-center space-x-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{paper.publicationYear || 'Recent'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition line-clamp-2 mb-2 leading-snug">
                    {paper.title}
                  </h3>

                  <p className="text-xs text-slate-400 mb-3 line-clamp-1">
                    {Array.isArray(paper.authors) && paper.authors.length > 0
                      ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')
                      : 'Unknown Authors'}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                    {paper.abstract || 'No abstract preview available.'}
                  </p>

                  {Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {paper.keywords.slice(0, 3).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[11px]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {paper.isAnalyzed && (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                        AI Analyzed
                      </span>
                    )}
                    {paper.source === 'upload' && (
                      <span className="text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">
                        Uploaded PDF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {activeTab === 'bookmarks' && (
                      <button
                        onClick={(e) => handleRemoveBookmark(paperId, e)}
                        title="Remove Bookmark"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {activeTab === 'uploads' && (
                      <button
                        onClick={(e) => handleDeletePaper(paperId, e)}
                        title="Delete Paper"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="text-xs text-indigo-400 font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition">
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
