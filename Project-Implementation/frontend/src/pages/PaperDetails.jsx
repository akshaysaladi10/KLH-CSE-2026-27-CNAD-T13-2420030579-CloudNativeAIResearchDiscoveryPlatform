import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  FileText,
  Download,
  Bookmark,
  BookmarkCheck,
  Bot,
  Sparkles,
  Calendar,
  Layers,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Tag,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Target,
  FlaskConical,
  Compass,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export default function PaperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [relatedPapers, setRelatedPapers] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPaper = async () => {
    try {
      const res = await api.get(`/papers/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load paper:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async () => {
    try {
      const res = await api.get(`/recommendations/paper/${id}`);
      if (res.data.success) {
        setRelatedPapers(res.data.data.relatedPapers || []);
      }
    } catch (err) {
      console.warn('Related papers fetch warning:', err.message);
    }
  };

  const checkBookmark = async () => {
    try {
      const res = await api.get('/library/bookmarks');
      if (res.data.success) {
        const found = (res.data.data.bookmarks || []).some(
          (b) => b.paperId?._id === id || b.paperId === id
        );
        setIsBookmarked(found);
      }
    } catch (err) {
      console.warn('Check bookmark failed:', err);
    }
  };

  const handleInspectRelated = (targetId) => {
    if (!targetId) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/papers/${targetId}`);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setLoading(true);
    setData(null);
    setRelatedPapers([]);
    fetchPaper();
    fetchRelated();
    checkBookmark();
  }, [id]);

  // Poll if paper is in processing state
  useEffect(() => {
    const status = data?.paper?.processingStatus;
    if (status === 'pending' || status === 'extracting' || status === 'analyzing') {
      const interval = setInterval(() => {
        fetchPaper();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [data?.paper?.processingStatus]);

  const handleToggleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await api.delete(`/library/bookmarks/${id}`);
        setIsBookmarked(false);
      } else {
        await api.post('/library/bookmarks', { paperId: id });
        setIsBookmarked(true);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not update bookmark.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await api.post(`/papers/${id}/reanalyze`);
      await fetchPaper();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Re-analysis trigger failed.');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading paper metadata & AI analysis...</p>
      </div>
    );
  }

  if (!data || !data.paper) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Paper Not Found</h2>
        <p className="text-slate-400 text-sm">
          The requested paper may have been removed or does not exist in the database.
        </p>
        <Link
          to="/library"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Library</span>
        </Link>
      </div>
    );
  }

  const { paper, analysis } = data;
  const status = paper.processingStatus || (paper.isAnalyzed ? 'completed' : 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-3">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
              isBookmarked
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
                <span>Bookmarked</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Bookmark Paper</span>
              </>
            )}
          </button>

          {/* View PDF Button (Direct stream via API Gateway / MinIO) */}
          {paper.s3Key && (
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/papers/${paper._id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow"
            >
              <Download className="w-4 h-4" />
              <span>View / Download PDF</span>
            </a>
          )}

          {paper.pdfUrl && !paper.s3Key && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>External PDF Link</span>
            </a>
          )}
        </div>
      </div>

      {/* Processing Stepper Banner (If in progress) */}
      {status !== 'completed' && status !== 'completed_without_ai' && (
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span className="text-sm font-bold text-indigo-200">
                {status === 'pending' && 'PDF Stored in MinIO • Awaiting Text Extraction...'}
                {status === 'extracting' && 'PyMuPDF Service Extracting Scientific Text...'}
                {status === 'analyzing' && 'AI Service Generating Deep Paper Insights...'}
                {status === 'failed' && 'Processing Encountered an Issue'}
              </span>
            </div>
            <button
              onClick={fetchPaper}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pt-1">
            <div className={`p-2 rounded-lg ${status === 'pending' || status === 'extracting' || status === 'analyzing' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
              1. MinIO Storage
            </div>
            <div className={`p-2 rounded-lg ${status === 'extracting' || status === 'analyzing' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
              2. PyMuPDF Parse
            </div>
            <div className={`p-2 rounded-lg ${status === 'analyzing' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
              3. AI Analysis
            </div>
          </div>
        </div>
      )}

      {/* Paper Header & Metadata */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold">
            {paper.researchDomain || 'Computer Science'}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 flex items-center space-x-1 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{paper.publicationYear || 'Recent'}</span>
          </span>
          {paper.journal && (
            <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
              {paper.journal}
            </span>
          )}
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full bg-slate-900 text-indigo-400 hover:underline border border-slate-800 flex items-center space-x-1"
            >
              <span>DOI: {paper.doi}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {paper.title}
        </h1>

        {/* Authors */}
        <div className="text-xs text-slate-300">
          <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1">
            Authors & Affiliations
          </span>
          <div className="flex flex-wrap gap-3">
            {Array.isArray(paper.authors) && paper.authors.length > 0 ? (
              paper.authors.map((a, i) => {
                const name = typeof a === 'string' ? a : a.name;
                const aff = typeof a === 'object' ? a.affiliation : '';
                return (
                  <div key={i} className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-200">{name}</span>
                    {aff && <span className="text-slate-500 ml-1.5">({aff})</span>}
                  </div>
                );
              })
            ) : (
              <span className="text-slate-500">Authors not specified</span>
            )}
          </div>
        </div>

        {/* Keywords */}
        {Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {paper.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 text-xs font-medium border border-slate-800"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* Abstract */}
        <div className="border-t border-slate-800/80 pt-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Original Abstract
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800 whitespace-pre-line">
            {paper.abstract || 'No original abstract available for this paper.'}
          </p>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">AI Analysis & Synthesis</h2>
              <p className="text-xs text-slate-400">
                Extracted by PyMuPDF and analyzed using OpenAI-compatible LLM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {analysis?.aiProvider && (
              <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                analysis.aiProvider === 'unconfigured'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : analysis.aiProvider === 'error'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                Provider: {analysis.aiProvider}
              </span>
            )}
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing || (!paper.s3Key && !paper.abstract && !paper.fullText)}
              title={!paper.s3Key && !paper.abstract ? 'Paper has no content to re-analyze' : 'Re-run AI extraction'}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Triggering...' : 'Re-run Analysis'}</span>
            </button>
          </div>
        </div>

        {/* If Analysis is available */}
        {analysis ? (
          <div className="space-y-6">
            {/* Unconfigured Alert Banner */}
            {analysis.aiProvider === 'unconfigured' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>AI API Key Configuration Pending</span>
                </div>
                <p className="text-slate-300">
                  Text extraction succeeded via PyMuPDF. To enable automated synthesis, add an <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">AI_API_KEY</code> to your <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">.env</code> file (compatible with OpenAI, Groq, Ollama, DeepSeek, or Gemini) and click "Re-run Analysis".
                </p>
              </div>
            )}

            {/* AI Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Executive AI Summary</span>
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-indigo-950/20 p-5 rounded-xl border border-indigo-900/40">
                {analysis.summary}
              </p>
            </div>

            {/* Problem & Objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Research Problem</span>
                </h4>
                <div className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed">
                  {analysis.researchProblem || 'Problem definition not explicitly isolated.'}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Core Objectives</span>
                </h4>
                <div className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed">
                  {analysis.objectives || 'Objectives extracted from methodology section.'}
                </div>
              </div>
            </div>

            {/* Methodology */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <span>Methodology & Techniques</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                {analysis.methodology || 'N/A'}
              </p>
            </div>

            {/* Major Findings & Limitations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Key Findings & Results</span>
                </h4>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  {Array.isArray(analysis.majorFindings) && analysis.majorFindings.length > 0 ? (
                    analysis.majorFindings.map((f, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{f}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No explicit findings listed.</span>
                  )}
                </div>
              </div>

              {/* Limitations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Limitations & Constraints</span>
                </h4>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  {Array.isArray(analysis.limitations) && analysis.limitations.length > 0 ? (
                    analysis.limitations.map((lim, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{lim}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None documented by authors.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Future Directions */}
            {Array.isArray(analysis.futureDirections) && analysis.futureDirections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span>Future Research Directions</span>
                </h4>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  {analysis.futureDirections.map((dir, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <span>{dir}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3 bg-slate-900/30 rounded-xl border border-slate-800/60">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">
              The AI service is currently analyzing this research paper. Analysis cards will display once finished.
            </p>
          </div>
        )}
      </div>

      {/* Recommendations / Related Papers */}
      {relatedPapers.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <Compass className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-extrabold text-white">Related Research Papers</h2>
              <p className="text-xs text-slate-400">
                Recommended based on shared research domain, topics, and keyword cosine similarity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedPapers.map((item, idx) => {
              const relPaper = item.paper;
              if (!relPaper) return null;
              const targetId = relPaper._id || relPaper.id;
              if (!targetId) return null;

              return (
                <div
                  key={targetId || idx}
                  onClick={() => handleInspectRelated(targetId)}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span className="text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {relPaper.researchDomain || 'Domain Match'}
                      </span>
                      <span className="font-semibold text-emerald-400">Match: {Math.round(item.score * 100)}%</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                      {relPaper.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {relPaper.abstract || 'No abstract preview available for this publication.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectRelated(targetId);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
                    >
                      <span>Inspect Paper</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
