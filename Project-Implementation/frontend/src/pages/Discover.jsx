import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
  Search,
  Globe,
  Database,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  BookOpen,
  Calendar,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  FileEdit,
  Tag,
  Info,
  FolderPlus,
  Quote,
  GitCompare,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import CitationModal from '../components/CitationModal';
import AddToCollectionModal from '../components/AddToCollectionModal';

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || 'cloud computing microservices';
  const { showToast } = useToast();

  const [searchMode, setSearchMode] = useState('topic'); // 'topic' | 'abstract'
  const [query, setQuery] = useState(initialQuery);
  const [abstractText, setAbstractText] = useState('');
  const [source, setSource] = useState('openalex'); // 'openalex' | 'local'
  const [yearFilter, setYearFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const [papers, setPapers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importingId, setImportingId] = useState(null);
  const [importedMap, setImportedMap] = useState({});
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Modal states
  const [modalPaper, setModalPaper] = useState(null);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Load existing bookmarks
  useEffect(() => {
    api.get('/library/bookmarks')
      .then((res) => {
        if (res.data?.success) {
          const ids = new Set((res.data.data.bookmarks || []).map((b) => b.paperId?._id || b.paperId));
          setBookmarkedIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setNotice('');
    setSearchParams({ q: query.trim() });

    try {
      const res = await api.get(
        `/search?q=${encodeURIComponent(query.trim())}&source=${source}&perPage=12`
      );
      if (res.data.success) {
        setPapers(res.data.data.papers || []);
        setTotal(res.data.data.total || 0);
        if (res.data.data.notice) {
          setNotice(res.data.data.notice);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(
        err.response?.data?.error?.message ||
          (source === 'openalex'
            ? 'OpenAlex external API is temporarily unreachable. Displaying local library results.'
            : 'Search failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAbstractDiscover = async (e) => {
    if (e) e.preventDefault();
    if (!abstractText.trim()) {
      setError('Please paste or enter an abstract to discover contextual papers.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post('/recommendations/abstract', {
        abstract: abstractText.trim(),
        limit: 12,
      });

      if (res.data.success) {
        const recs = res.data.data.recommendations || [];
        const flatPapers = recs.map((r) => ({
          ...r.paper,
          similarityScore: r.score,
          sharedKeywords: r.sharedKeywords,
          matchReason: r.matchReason,
        }));
        setPapers(flatPapers);
        setTotal(flatPapers.length);
      }
    } catch (err) {
      console.error('Abstract discovery failed:', err);
      setError(err.response?.data?.error?.message || 'Failed to discover papers from abstract.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchMode === 'topic') {
      handleSearch();
    }
  }, [source, searchMode]);

  const handleBookmarkToggle = async (paper) => {
    const paperId = paper._id || paper.id;
    try {
      // If external OpenAlex paper, import first
      let targetId = paperId;
      if (!/^[0-9a-fA-F]{24}$/.test(paperId)) {
        const impRes = await api.post('/search/import', paper);
        if (impRes.data?.data?.paper?._id) {
          targetId = impRes.data.data.paper._id;
        }
      }

      if (bookmarkedIds.has(targetId)) {
        await api.delete(`/library/bookmarks/${targetId}`);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        showToast('Removed from bookmarks', 'info');
      } else {
        await api.post('/library/bookmarks', { paperId: targetId });
        setBookmarkedIds((prev) => new Set([...prev, targetId]));
        showToast('Saved to your research library!', 'success');
      }
    } catch (err) {
      showToast('Could not update bookmark', 'error');
    }
  };

  const handleOpenCitation = (paper) => {
    setModalPaper(paper);
    setShowCitationModal(true);
  };

  const handleOpenCollection = (paper) => {
    setModalPaper(paper);
    setShowCollectionModal(true);
  };

  const handleImport = async (paper) => {
    const key = paper.externalId || paper.title;
    setImportingId(key);
    try {
      const res = await api.post('/search/import', paper);
      if (res.data.success) {
        const newId = res.data.data.paper._id;
        setImportedMap((prev) => ({ ...prev, [key]: newId }));
        showToast('Imported into library catalog!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to import paper.', 'error');
    } finally {
      setImportingId(null);
    }
  };

  const trendingQueries = [
    'Kubernetes predictive autoscaling',
    'Distributed Raft consensus',
    'eBPF microservice telemetry',
    'Graph neural networks recommendation',
    'Zero-trust cloud architecture',
    'Serverless cold-start latency',
  ];

  // Client-side filtering & sorting
  const filteredPapers = papers
    .filter((p) => {
      if (yearFilter !== 'all') {
        const y = parseInt(yearFilter);
        if (y === 2020) {
          if ((p.publicationYear || 0) < 2020) return false;
        } else if (p.publicationYear !== y) {
          return false;
        }
      }
      if (domainFilter !== 'all') {
        if ((p.researchDomain || '').toLowerCase() !== domainFilter.toLowerCase()) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.publicationYear || 0) - (a.publicationYear || 0);
      }
      if (sortBy === 'citations') {
        return (b.citationCount || 0) - (a.citationCount || 0);
      }
      return 0; // relevance
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 border border-slate-800 p-8 shadow-2xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Global Academic Literature Search</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover Scientific Research
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Query over 250M+ scholarly publications via the live <strong className="text-indigo-400">OpenAlex API</strong>, search your local cluster repository, or discover literature by abstract semantic context.
          </p>
        </div>
      </div>

      {/* Discovery Mode Switcher */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-lg">
        <button
          type="button"
          onClick={() => {
            setSearchMode('topic');
            setError('');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
            searchMode === 'topic'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search by Topic & Keywords</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('abstract');
            setError('');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
            searchMode === 'abstract'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Contextual Discovery by Abstract</span>
        </button>
      </div>

      {/* Search Input Section */}
      <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        {searchMode === 'topic' ? (
          <>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by topic, paper title, keywords, authors, or DOI..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>

            {/* Trending Query Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Trending Topics:</span>
              {trendingQueries.map((tq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(tq);
                    setSearchParams({ q: tq });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-indigo-300 transition"
                >
                  {tq}
                </button>
              ))}
            </div>

            {/* Source & Filter Controls Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-semibold">Source:</span>
                <button
                  type="button"
                  onClick={() => setSource('openalex')}
                  className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
                    source === 'openalex'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>OpenAlex (Global 250M+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSource('local')}
                  className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition ${
                    source === 'local'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Local Library Database</span>
                </button>
              </div>

              {/* Year & Sort Filters */}
              <div className="flex items-center space-x-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2020">2020 & Newer</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="citations">Sort: Most Cited</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          /* Abstract Contextual Discovery Mode */
          <form onSubmit={handleAbstractDiscover} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paste Research Abstract or Problem Statement:
              </label>
              <textarea
                rows={5}
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="In cloud-native computing, containerized microservices face severe tail latency degradation under dynamic traffic spikes..."
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !abstractText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Discover Matching Literature</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Notifications & Fallback Notice */}
      {notice && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-300 flex items-center space-x-2">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Header */}
      {!loading && filteredPapers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Found {filteredPapers.length} publications (Total indexed: {total.toLocaleString()})</span>
        </div>
      )}

      {/* Results Cards Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Querying scholarly graph & calculating similarity metrics...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Research Papers Found</p>
          <p>Try refining your search terms or toggling between OpenAlex and Local Library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper, idx) => {
            const paperId = paper._id || paper.id || `p_${idx}`;
            const key = paper.externalId || paper.title;
            const importedId = importedMap[key];
            const isBookmarked = bookmarkedIds.has(importedId || paperId);

            return (
              <div
                key={paperId}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-indigo-500/50 transition flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 truncate max-w-[160px]">
                      {paper.researchDomain || 'Computer Science'}
                    </span>
                    <span className="font-medium">{paper.publicationYear || 'Recent'}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                    {paper.title}
                  </h3>

                  {/* Authors & Source */}
                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                    <span>
                      {(paper.authors || []).map((a) => (typeof a === 'string' ? a : a.name)).slice(0, 2).join(', ')}
                    </span>
                    {paper.journal && <span>• {paper.journal}</span>}
                    {paper.citationCount > 0 && (
                      <span className="text-emerald-400">• {paper.citationCount} cites</span>
                    )}
                  </div>

                  {/* Abstract Snippet */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {paper.abstract || 'No abstract text available in record.'}
                  </p>

                  {/* Keywords */}
                  {Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {paper.keywords.slice(0, 3).map((kw, ki) => (
                        <span key={ki} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Quick Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleBookmarkToggle(paper)}
                      title={isBookmarked ? 'Remove Bookmark' : 'Save to Library'}
                      className={`p-2 rounded-xl transition ${
                        isBookmarked
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCollection(paper)}
                      title="Add to Collection"
                      className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                    >
                      <FolderPlus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCitation(paper)}
                      title="Cite Paper"
                      className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                  </div>

                  {/* View Details Link */}
                  {importedId || (/^[0-9a-fA-F]{24}$/.test(paperId)) ? (
                    <Link
                      to={`/papers/${importedId || paperId}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                    >
                      <span>Examine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={importingId === key}
                      onClick={() => handleImport(paper)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      {importingId === key ? (
                        <span>Importing...</span>
                      ) : (
                        <>
                          <span>Catalog Paper</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
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
