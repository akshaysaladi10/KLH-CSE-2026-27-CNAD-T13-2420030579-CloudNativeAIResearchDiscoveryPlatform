import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  GitCompare,
  FolderPlus,
  Quote,
  CheckCircle2,
  Check,
  Plus,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import CitationModal from '../components/CitationModal';
import AddToCollectionModal from '../components/AddToCollectionModal';

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab); // 'all' | 'uploads' | 'bookmarks' | 'read'
  const [papers, setPapers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [modalPaper, setModalPaper] = useState(null);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['all', 'uploads', 'bookmarks', 'read'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSelectedIds([]);
    setSearchParams({ tab: newTab });
  };

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookmarks') {
        const res = await api.get('/library/bookmarks');
        if (res.data.success) {
          const list = (res.data.data.bookmarks || [])
            .map((b) => ({
              ...b.paperId,
              bookmarkId: b._id,
              bookmarkedAt: b.createdAt,
            }))
            .filter((p) => p && p.title);
          setPapers(list);
        }
      } else if (activeTab === 'uploads') {
        const res = await api.get(`/papers/user/${user.id || user._id}`);
        if (res.data.success) {
          setPapers(res.data.data.papers || []);
        }
      } else if (activeTab === 'read') {
        const res = await api.get('/papers/reading/history');
        if (res.data.success) {
          setPapers((res.data.data.papers || []).filter((p) => p.isRead));
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
      showToast('Removed bookmark', 'info');
      setPapers((prev) => prev.filter((p) => (p._id || p.id) !== paperId));
    } catch (err) {
      showToast('Failed to remove bookmark.', 'error');
    }
  };

  const handleDeletePaper = async (paperId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this paper from your library?')) return;
    try {
      await api.delete(`/papers/${paperId}`);
      showToast('Paper deleted', 'success');
      setPapers((prev) => prev.filter((p) => (p._id || p.id) !== paperId));
    } catch (err) {
      showToast('Failed to delete paper.', 'error');
    }
  };

  const handleToggleSelect = (paperId, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId]
    );
  };

  const handleCompareSelected = () => {
    if (selectedIds.length < 2) {
      showToast('Select at least 2 papers to compare', 'info');
      return;
    }
    navigate(`/compare?ids=${selectedIds.slice(0, 4).join(',')}`);
  };

  const displayedPapers = papers.filter((p) => {
    if (!query) return true;
    const title = p.title || '';
    const domain = p.researchDomain || '';
    return title.toLowerCase().includes(query.toLowerCase()) || domain.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            <span>Research Library</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your cataloged publications, user PDF uploads, bookmarks, and reading progress.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedIds.length >= 2 && (
            <button
              onClick={handleCompareSelected}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-purple-600/30"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Selected ({selectedIds.length})</span>
            </button>
          )}

          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-md shadow-indigo-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New PDF</span>
          </Link>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-lg">
        {/* Tab Buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Papers
          </button>
          <button
            onClick={() => handleTabChange('uploads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'uploads'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Uploads
          </button>
          <button
            onClick={() => handleTabChange('bookmarks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'bookmarks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bookmarks
          </button>
          <button
            onClick={() => handleTabChange('read')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'read'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Read Papers
          </button>
        </div>

        {/* Search inside library */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter library papers..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading research library publications...</p>
        </div>
      ) : displayedPapers.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800 p-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">
            {activeTab === 'bookmarks'
              ? 'No bookmarked papers yet'
              : activeTab === 'uploads'
              ? 'No uploaded PDFs found'
              : activeTab === 'read'
              ? 'No read papers recorded'
              : 'No papers found in library'}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {activeTab === 'bookmarks'
              ? 'Bookmark interesting papers from Discovery or Paper Details to access them here.'
              : activeTab === 'uploads'
              ? 'Upload research PDFs to have PyMuPDF extract text streams and AI generate automated analysis.'
              : 'Upload a PDF or discover external papers from OpenAlex.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedPapers.map((paper) => {
            const paperId = paper._id || paper.id;
            const isSelected = selectedIds.includes(paperId);

            return (
              <div
                key={paperId}
                className={`bg-slate-950/70 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group shadow-lg ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelect(paperId, e)}
                        title="Select to compare"
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-indigo-400 font-semibold truncate max-w-[150px]">
                        {paper.researchDomain || 'Computer Science'}
                      </span>
                    </div>
                    <span className="flex items-center space-x-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{paper.publicationYear || 'Recent'}</span>
                    </span>
                  </div>

                  <Link
                    to={`/papers/${paperId}`}
                    className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition line-clamp-2 mb-2 leading-snug block"
                  >
                    {paper.title}
                  </Link>

                  <p className="text-xs text-slate-400 mb-3 line-clamp-1">
                    {Array.isArray(paper.authors) && paper.authors.length > 0
                      ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')
                      : 'Scholarly Authors'}
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
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-4 mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {paper.isAnalyzed && (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                        AI Ready
                      </span>
                    )}
                    {paper.isRead && (
                      <span className="text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
                        Read
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setModalPaper(paper);
                        setShowCitationModal(true);
                      }}
                      title="Cite Paper"
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setModalPaper(paper);
                        setShowCollectionModal(true);
                      }}
                      title="Add to Collection"
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-indigo-400 transition"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>

                    {activeTab === 'bookmarks' && (
                      <button
                        onClick={(e) => handleRemoveBookmark(paperId, e)}
                        title="Remove Bookmark"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {activeTab === 'uploads' && (
                      <button
                        onClick={(e) => handleDeletePaper(paperId, e)}
                        title="Delete Paper"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <Link
                      to={`/papers/${paperId}`}
                      className="text-xs text-indigo-400 font-semibold flex items-center space-x-1 group-hover:translate-x-0.5 transition"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Citation Modal */}
      <CitationModal
        paper={modalPaper}
        isOpen={showCitationModal}
        onClose={() => setShowCitationModal(false)}
      />

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        paper={modalPaper}
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />
    </div>
  );
}
