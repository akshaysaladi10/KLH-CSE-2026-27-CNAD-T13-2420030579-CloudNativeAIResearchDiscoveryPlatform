import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Search,
  Globe,
  Database,
  Bookmark,
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
} from 'lucide-react';

export default function Discover() {
  const [searchMode, setSearchMode] = useState('topic'); // 'topic' | 'abstract'
  const [query, setQuery] = useState('cloud computing microservices');
  const [abstractText, setAbstractText] = useState('');
  const [source, setSource] = useState('openalex'); // 'openalex' | 'local'
  const [papers, setPapers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [importingId, setImportingId] = useState(null);
  const [importedMap, setImportedMap] = useState({});
  const [extractedKeywords, setExtractedKeywords] = useState([]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}&source=${source}&perPage=12`);
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
            ? 'OpenAlex external research API is temporarily unreachable. Try switching to Local Library.'
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
        setExtractedKeywords(res.data.data.extractedKeywords || []);
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

  const handleImport = async (paper) => {
    const key = paper.externalId || paper.title;
    setImportingId(key);
    try {
      const res = await api.post('/search/import', {
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        publicationYear: paper.publicationYear,
        journal: paper.journal,
        doi: paper.doi,
        keywords: paper.keywords,
        externalId: paper.externalId,
        pdfUrl: paper.pdfUrl,
        citationCount: paper.citationCount,
        researchDomain: paper.researchDomain || 'Computer Science',
      });
      if (res.data.success) {
        setImportedMap((prev) => ({
          ...prev,
          [key]: res.data.data.paper._id,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to import paper into platform library.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Global Scientific Literature Discovery</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Discover Research Papers
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Search across millions of verified academic publications via the live <strong className="text-indigo-400">OpenAlex API</strong>, explore indexed platform papers, or discover research by abstract context.
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
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        {searchMode === 'topic' ? (
          <>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by topic, paper title, keywords, or authors..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2"
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

            {/* Source Toggle Tabs */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-medium">Search Catalog:</span>
                <button
                  onClick={() => setSource('openalex')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    source === 'openalex'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>OpenAlex (Global Works)</span>
                </button>
                <button
                  onClick={() => setSource('local')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    source === 'local'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Platform Library (Local)</span>
                </button>
              </div>

              <div className="text-slate-400 hidden sm:block">
                {total > 0 && <span>Found ~{total.toLocaleString()} publications</span>}
              </div>
            </div>
          </>
        ) : (
          /* Abstract Contextual Discovery Form */
          <form onSubmit={handleAbstractDiscover} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Paste Research Abstract or Problem Statement
              </label>
              <textarea
                rows={4}
                required
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="Paste an abstract or research problem statement to automatically extract key concepts and retrieve relevant scientific literature..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {extractedKeywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Extracted Concepts:</span>
                  {extractedKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-900/50 text-indigo-300 text-[11px] border border-indigo-700/40">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !abstractText.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 ml-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing & Matching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Find Contextual Research Papers</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Fallback Notice */}
      {notice && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-3">
          <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">
            {searchMode === 'abstract'
              ? 'Analyzing abstract semantics & discovering relevant research...'
              : source === 'openalex'
              ? 'Querying OpenAlex scientific knowledge graph...'
              : 'Searching local MongoDB repository...'}
          </p>
        </div>
      ) : papers.length === 0 ? (
        <div className="py-20 text-center bg-slate-950/40 rounded-2xl border border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No research papers found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {searchMode === 'abstract'
              ? 'Paste a longer abstract or one with more specific technical terms to find related publications.'
              : 'Try a different search query such as "machine learning", "cloud native", "kubernetes", or switch catalogs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {papers.map((paper, index) => {
            const paperId = paper._id || paper.id;
            const key = paper.externalId || paper.title;
            const isImported = importedMap[key] || (source === 'local' || paper.source === 'upload' || paper.source === 'abstract' ? paperId : null);

            return (
              <div
                key={paperId || index}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition group"
              >
                <div>
                  {/* Metadata Header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center space-x-1 font-semibold text-indigo-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{paper.publicationYear || 'Recent'}</span>
                    </span>
                    {paper.similarityScore !== undefined ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                        Score: {Math.round(paper.similarityScore * 100)}%
                      </span>
                    ) : paper.citationCount !== undefined ? (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{paper.citationCount} citations</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition line-clamp-2 mb-2 leading-snug">
                    {paper.title}
                  </h3>

                  {/* Authors */}
                  <p className="text-xs text-slate-400 mb-3 line-clamp-1">
                    {Array.isArray(paper.authors) && paper.authors.length > 0
                      ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')
                      : 'Unknown Authors'}
                  </p>

                  {/* Match Reason if abstract recommendation */}
                  {paper.matchReason && (
                    <div className="mb-2 text-[11px] text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                      {paper.matchReason}
                    </div>
                  )}

                  {/* Abstract snippet */}
                  <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                    {paper.abstract || 'No abstract preview available for this publication.'}
                  </p>

                  {/* Keywords */}
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

                {/* Card Action Footer */}
                <div className="border-t border-slate-800/80 pt-4 mt-2 flex items-center justify-between">
                  {source === 'local' || isImported || paperId ? (
                    <Link
                      to={`/papers/${isImported || paperId}`}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <span>View Paper & AI Insights</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="flex items-center space-x-2 w-full">
                      <button
                        onClick={() => handleImport(paper)}
                        disabled={importingId === key}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow"
                      >
                        {importingId === key ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save to Library</span>
                          </>
                        )}
                      </button>

                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open DOI Link"
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
