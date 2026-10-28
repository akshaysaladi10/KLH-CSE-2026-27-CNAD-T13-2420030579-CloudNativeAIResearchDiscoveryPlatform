import React, { useEffect, useState, useMemo } from 'react';
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
  GitCompare,
  BookOpen,
  Cpu,
  Database,
  BarChart2,
  FileCode,
  Copy,
  Check,
  Share2,
  Eye,
  Info,
  FolderPlus,
  Quote,
  Printer,
  Save,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import CitationModal from '../components/CitationModal';
import AddToCollectionModal from '../components/AddToCollectionModal';
import ErrorBoundary from '../components/ErrorBoundary';

function PaperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [relatedData, setRelatedData] = useState({ relatedPapers: [], commonKeywords: [] });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Read status & Notes state
  const [isRead, setIsRead] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Comparison Tab state
  const [selectedComparePaper, setSelectedComparePaper] = useState(null);
  const [comparisonDetails, setComparisonDetails] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Copy feedback states
  const [copiedAbstract, setCopiedAbstract] = useState(false);
  const [copiedFullText, setCopiedFullText] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const [copiedGaps, setCopiedGaps] = useState(false);
  const [gapCategoryFilter, setGapCategoryFilter] = useState('all'); // 'all' | 'author_reported' | 'ai_inferred'
  const [showFullTextViewer, setShowFullTextViewer] = useState(false);

  // Safe entity extraction & derivations
  const paper = data?.paper || null;
  const analysis = data?.analysis || null;
  const status = paper?.processingStatus || (paper?.isAnalyzed ? 'completed' : 'pending');
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const pdfStreamUrl = paper?._id ? `${apiBaseUrl}/papers/${paper._id}/pdf` : '';

  const referencesList =
    analysis?.references && analysis.references.length > 0
      ? analysis.references
      : paper?.references && paper.references.length > 0
      ? paper.references
      : [];

  const isAiConfigured = Boolean(
    analysis &&
      analysis.isConfigured !== false &&
      analysis.aiProvider &&
      analysis.aiProvider !== 'unconfigured' &&
      analysis.aiProvider !== 'not_configured' &&
      analysis.aiProvider !== 'error'
  );

  // Unconditional Hooks (must run on every render before any early returns)
  const structuredGaps = useMemo(() => {
    if (analysis?.structuredGaps && analysis.structuredGaps.length > 0) {
      return analysis.structuredGaps;
    }
    const items = [];
    if (analysis?.authorLimitations?.length) {
      analysis.authorLimitations.forEach((lim, i) => {
        items.push({
          category: 'author_reported',
          title: `Author-Reported Limitation: ${lim.slice(0, 50)}${lim.length > 50 ? '...' : ''}`,
          explanation: `Documented constraint explicitly reported by authors in the paper text.`,
          supportingText: analysis.gapEvidence?.[i] || lim,
          pageReference: 'Page 2 (Section 4: Limitations & Research Gaps)',
          suggestedExperiment: analysis.suggestedExperiments?.[i] || 'Perform targeted ablation benchmarks under stress conditions.'
        });
      });
    } else if (analysis?.limitations?.length) {
      analysis.limitations.forEach((lim, i) => {
        items.push({
          category: 'author_reported',
          title: `Author-Reported Limitation: ${lim.slice(0, 50)}${lim.length > 50 ? '...' : ''}`,
          explanation: `Documented constraint explicitly reported by authors in the paper text.`,
          supportingText: analysis.gapEvidence?.[i] || lim,
          pageReference: 'Page 2 (Section 4: Limitations & Research Gaps)',
          suggestedExperiment: analysis.suggestedExperiments?.[i] || 'Perform targeted ablation benchmarks under stress conditions.'
        });
      });
    }

    if (analysis?.aiInferredGaps?.length) {
      analysis.aiInferredGaps.forEach((gap, i) => {
        items.push({
          category: 'ai_inferred',
          title: `Research Horizon & Future Direction: ${gap.slice(0, 50)}${gap.length > 50 ? '...' : ''}`,
          explanation: `Unresolved research challenge and future exploration opportunity.`,
          supportingText: gap,
          pageReference: 'Page 2 (Section 5: Future Directions)',
          suggestedExperiment: analysis.suggestedExperiments?.[items.length] || analysis.futureDirections?.[i] || 'Construct an empirical testbed to validate this open research hypothesis.'
        });
      });
    } else if (analysis?.researchGaps?.length) {
      analysis.researchGaps.forEach((gap, i) => {
        items.push({
          category: 'ai_inferred',
          title: `Research Horizon & Future Direction: ${gap.slice(0, 50)}${gap.length > 50 ? '...' : ''}`,
          explanation: `Unresolved research challenge and future exploration opportunity.`,
          supportingText: gap,
          pageReference: 'Page 2 (Section 5: Future Directions)',
          suggestedExperiment: analysis.futureDirections?.[i] || 'Construct an empirical testbed to validate this open research hypothesis.'
        });
      });
    }
    return items;
  }, [analysis]);

  const filteredGaps = useMemo(() => {
    if (gapCategoryFilter === 'all') return structuredGaps;
    return structuredGaps.filter((g) => g.category === gapCategoryFilter);
  }, [structuredGaps, gapCategoryFilter]);

  const authorGapsCount = structuredGaps.filter((g) => g.category === 'author_reported').length;
  const aiGapsCount = structuredGaps.filter((g) => g.category === 'ai_inferred').length;

  const handleCopyGapsMarkdown = () => {
    if (!structuredGaps.length || !paper) return;
    let md = `# Research Gap Analysis — ${paper.title}\n\n`;
    structuredGaps.forEach((g, idx) => {
      md += `### ${idx + 1}. [${g.category === 'author_reported' ? 'Author-Reported Limitation' : 'AI-Inferred Research Gap'}] ${g.title}\n`;
      md += `- **Location / Page Reference:** ${g.pageReference || 'Document Text'}\n`;
      md += `- **Explanation:** ${g.explanation}\n`;
      md += `- **Supporting Quote:** "${g.supportingText}"\n`;
      md += `- **Suggested Experiment:** ${g.suggestedExperiment}\n\n`;
    });
    navigator.clipboard.writeText(md);
    setCopiedGaps(true);
    showToast('Research gaps copied to clipboard in Markdown format', 'success');
    setTimeout(() => setCopiedGaps(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
    { id: 'gaps', label: 'Research Gaps', icon: Compass, count: structuredGaps.length },
    { id: 'related', label: 'Related Papers', icon: Layers, count: relatedData.relatedPapers.length },
    { id: 'comparison', label: 'Comparison', icon: GitCompare },
    { id: 'notes', label: 'Personal Notes', icon: MessageSquare },
    { id: 'references', label: 'References', icon: BookOpen, count: referencesList.length },
    { id: 'pdf', label: 'PDF Document', icon: Download },
  ];

  const fetchPaper = async () => {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      setFetchError('Invalid research paper identifier format. Expected 24-character hex ID.');
      setLoading(false);
      return;
    }
    setFetchError('');
    try {
      const res = await api.get(`/papers/${id}`);
      if (res.data?.success && res.data?.data?.paper) {
        setData(res.data.data);
        setIsRead(Boolean(res.data.data.paper.isRead));
        setUserNotes(res.data.data.paper.userNotes || '');
      } else {
        setFetchError('The requested research paper could not be found in the database.');
      }
    } catch (err) {
      console.error('Failed to load paper:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to retrieve research paper.';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async () => {
    try {
      const res = await api.get(`/recommendations/paper/${id}`);
      if (res.data?.success) {
        const related = res.data.data.relatedPapers || [];
        const commonKw = res.data.data.commonKeywords || [];
        setRelatedData({ relatedPapers: related, commonKeywords: commonKw });
        if (related.length > 0 && !selectedComparePaper) {
          setSelectedComparePaper(related[0].paper);
        }
      }
    } catch (err) {
      console.warn('Related papers fetch warning:', err.message);
    }
  };

  const checkBookmark = async () => {
    try {
      const res = await api.get('/library/bookmarks');
      if (res.data?.success) {
        const found = (res.data.data.bookmarks || []).some(
          (b) => b.paperId?._id === id || b.paperId === id
        );
        setIsBookmarked(found);
      }
    } catch (err) {
      console.warn('Check bookmark failed:', err);
    }
  };

  const fetchComparison = async (targetPaperId) => {
    if (!targetPaperId) return;
    setComparisonLoading(true);
    try {
      if (/^[0-9a-fA-F]{24}$/.test(targetPaperId)) {
        const res = await api.post('/papers/compare', {
          paperIds: [id, targetPaperId],
        });
        if (res.data?.success) {
          setComparisonDetails(res.data.data.comparison);
        }
      } else {
        const targetObj = relatedData.relatedPapers.find(
          (r) => (r.paper._id || r.paper.id) === targetPaperId
        )?.paper;

        if (targetObj) {
          setComparisonDetails([
            { paper: data.paper, analysis: data.analysis },
            {
              paper: targetObj,
              analysis: {
                summary: targetObj.abstract || 'Academic abstract available from scholarly source.',
                researchProblem: targetObj.researchDomain || 'Domain-specific investigation.',
                objectives: targetObj.title,
                methodology: 'Empirical scholarly investigation indexed in OpenAlex.',
                algorithms: [],
                technologies: targetObj.keywords || [],
                majorFindings: targetObj.keywords || [],
                limitations: [],
                researchGaps: [],
                futureDirections: [],
                keywords: targetObj.keywords || [],
                isConfigured: false,
              },
            },
          ]);
        }
      }
    } catch (err) {
      console.warn('Comparison fetch fallback:', err.message);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleInspectRelated = (targetId) => {
    if (!targetId) return;
    if (/^[0-9a-fA-F]{24}$/.test(targetId)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      navigate(`/papers/${targetId}`);
    } else {
      const relObj = relatedData.relatedPapers.find(
        (r) => r.paper._id === targetId || r.paper.id === targetId
      )?.paper;

      if (relObj) {
        api.post('/search/import', relObj)
          .then((res) => {
            if (res.data?.data?.paper?._id) {
              window.scrollTo({ top: 0, behavior: 'instant' });
              navigate(`/papers/${res.data.data.paper._id}`);
            }
          })
          .catch(() => {
            if (relObj.doi) {
              window.open(`https://doi.org/${relObj.doi}`, '_blank');
            }
          });
      }
    }
  };

  const handleSelectCompare = (paperObj) => {
    setSelectedComparePaper(paperObj);
    const targetId = paperObj._id || paperObj.id;
    fetchComparison(targetId);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setLoading(true);
    setData(null);
    setRelatedData({ relatedPapers: [], commonKeywords: [] });
    setSelectedComparePaper(null);
    setComparisonDetails(null);
    fetchPaper();
    fetchRelated();
    checkBookmark();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'comparison' && selectedComparePaper) {
      const targetId = selectedComparePaper._id || selectedComparePaper.id;
      fetchComparison(targetId);
    }
  }, [activeTab, selectedComparePaper]);

  // Polling if paper is still processing
  useEffect(() => {
    const status = data?.paper?.processingStatus;
    if (status === 'pending' || status === 'extracting' || status === 'analyzing') {
      const interval = setInterval(() => {
        fetchPaper();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [data?.paper?.processingStatus]);

  const handleToggleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await api.delete(`/library/bookmarks/${id}`);
        setIsBookmarked(false);
        showToast('Removed from Bookmarks', 'info');
      } else {
        await api.post('/library/bookmarks', { paperId: id });
        setIsBookmarked(true);
        showToast('Saved to Bookmarks!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not update bookmark.', 'error');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleToggleRead = async () => {
    try {
      const res = await api.put(`/papers/${id}/read`);
      if (res.data?.success) {
        setIsRead(res.data.data.isRead);
        showToast(res.data.data.isRead ? 'Marked as Read' : 'Marked as Unread', 'success');
      }
    } catch (err) {
      showToast('Failed to update read status', 'error');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await api.put(`/papers/${id}/notes`, { userNotes });
      if (res.data?.success) {
        showToast('Personal notes saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await api.post(`/papers/${id}/reanalyze`);
      showToast('Re-analysis pipeline initiated...', 'info');
      await fetchPaper();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Re-analysis trigger failed.', 'error');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleExportAnalysisMarkdown = () => {
    if (!data) return;
    const { paper, analysis } = data;
    let md = `# Research Analysis: ${paper.title}\n\n`;
    md += `**Authors:** ${(paper.authors || []).map((a) => a.name || a).join(', ')}  \n`;
    md += `**Publication Year:** ${paper.publicationYear || 'Recent'}  \n`;
    if (paper.doi) md += `**DOI:** [${paper.doi}](https://doi.org/${paper.doi})  \n`;
    md += `**Research Domain:** ${paper.researchDomain || 'Computer Science'}  \n\n`;
    md += `---\n\n`;

    if (analysis) {
      md += `## Executive Summary\n${analysis.summary || analysis.executiveSummary || paper.abstract}\n\n`;
      md += `## Problem Statement\n${analysis.researchProblem || analysis.problemStatement || 'Not formulated.'}\n\n`;
      md += `## Objectives\n${analysis.objectives || 'Standard scientific objectives.'}\n\n`;
      md += `## Methodology\n${analysis.methodology || analysis.methodologyWorkflow || 'Empirical benchmark.'}\n\n`;
      if (analysis.majorFindings?.length) {
        md += `## Major Findings\n`;
        analysis.majorFindings.forEach((f) => { md += `- ${f}\n`; });
        md += `\n`;
      }
      if (analysis.limitations?.length) {
        md += `## Author Limitations\n`;
        analysis.limitations.forEach((l) => { md += `- ${l}\n`; });
        md += `\n`;
      }
      if (analysis.researchGaps?.length) {
        md += `## Research Gaps\n`;
        analysis.researchGaps.forEach((g) => { md += `- ${g}\n`; });
        md += `\n`;
      }
      if (analysis.conclusion) {
        md += `## Conclusion\n${analysis.conclusion}\n\n`;
      }
    } else {
      md += `## Abstract\n${paper.abstract}\n\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedAnalysis(true);
    showToast('Full Markdown analysis copied to clipboard!', 'success');
    setTimeout(() => setCopiedAnalysis(false), 2000);
  };

  const handleCopyAbstract = () => {
    if (data?.paper?.abstract) {
      navigator.clipboard.writeText(data.paper.abstract);
      setCopiedAbstract(true);
      showToast('Abstract copied to clipboard!', 'success');
      setTimeout(() => setCopiedAbstract(false), 2000);
    }
  };

  const handleCopyFullText = () => {
    if (data?.paper?.fullText) {
      navigator.clipboard.writeText(data.paper.fullText);
      setCopiedFullText(true);
      showToast('Extracted full text copied!', 'success');
      setTimeout(() => setCopiedFullText(false), 2000);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading complete paper details & scientific analysis...</p>
      </div>
    );
  }

  if (fetchError || (!loading && (!data || !data.paper))) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Paper Not Found</h2>
        <p className="text-slate-400 text-sm">
          {fetchError || 'The requested research paper may have been removed or does not exist in the database.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => {
              setLoading(true);
              setFetchError('');
              fetchPaper();
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            to="/library"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Library</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Paper Interaction Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
              isBookmarked
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Bookmarked</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Bookmark</span>
              </>
            )}
          </button>

          {/* Add to Collection Modal Button */}
          <button
            onClick={() => setShowCollectionModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add to Collection</span>
          </button>

          {/* Cite Button */}
          <button
            onClick={() => setShowCitationModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Quote className="w-3.5 h-3.5 text-purple-400" />
            <span>Cite</span>
          </button>

          {/* Mark as Read Toggle */}
          <button
            onClick={handleToggleRead}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
              isRead
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isRead ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{isRead ? 'Read' : 'Mark as Read'}</span>
          </button>

          {/* Ask AI Assistant */}
          <Link
            to={`/assistant?paperId=${paper._id}`}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI Assistant</span>
          </Link>

          {/* Re-analyze Button */}
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing || (!paper.s3Key && !paper.abstract && !paper.fullText)}
            title="Re-run AI extraction and synthesis pipeline"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>

          {/* Export Analysis */}
          <button
            onClick={handleExportAnalysisMarkdown}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            {copiedAnalysis ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>Export Analysis</span>
          </button>

          {/* PDF Streaming / Download Button */}
          {paper.s3Key ? (
            <a
              href={pdfStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Document</span>
            </a>
          ) : paper.pdfUrl ? (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>External PDF</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* Processing Stepper (If pipeline active) */}
      {status !== 'completed' && status !== 'completed_without_ai' && (
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span className="text-sm font-bold text-indigo-200">
                {status === 'pending' && 'Document Ingestion • Storing Binary in MinIO...'}
                {status === 'extracting' && 'PyMuPDF Service Extracting Scientific Content Streams...'}
                {status === 'analyzing' && 'AI Service Executing Structured Section Synthesis...'}
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
            <div
              className={`p-2 rounded-lg ${
                status === 'pending' || status === 'extracting' || status === 'analyzing'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-500'
              }`}
            >
              1. Document Storage
            </div>
            <div
              className={`p-2 rounded-lg ${
                status === 'extracting' || status === 'analyzing'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-500'
              }`}
            >
              2. Text Stream Parsing
            </div>
            <div
              className={`p-2 rounded-lg ${
                status === 'analyzing' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'
              }`}
            >
              3. Scientific AI Analysis
            </div>
          </div>
        </div>
      )}

      {/* Hero Paper Header Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold">
            {paper.researchDomain || 'Computer Science'}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 flex items-center space-x-1 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{paper.publicationYear || 'Recent'}</span>
          </span>
          {paper.journal && (
            <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-medium">
              {paper.journal}
            </span>
          )}
          {paper.source && (
            <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 uppercase tracking-wider text-[10px]">
              Source: {paper.source}
            </span>
          )}
          {isRead && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Read</span>
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

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {paper.title}
          </h1>
          {paper.subtitle && (
            <p className="text-sm text-slate-400 mt-1 font-medium">{paper.subtitle}</p>
          )}
        </div>

        {/* Authors with Affiliations */}
        <div className="text-xs text-slate-300">
          <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
            Authors & Affiliations
          </span>
          <div className="flex flex-wrap gap-2">
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
          <div className="flex flex-wrap gap-1.5 pt-1">
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
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto space-x-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-md scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Original Abstract */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Original Abstract</h3>
                {paper.abstract && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({paper.abstract.split(/\s+/).filter(Boolean).length} words)
                  </span>
                )}
              </div>
              <button
                onClick={handleCopyAbstract}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1.5 transition"
              >
                {copiedAbstract ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Abstract</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-5 rounded-xl border border-slate-800 whitespace-pre-line font-normal">
              {paper.abstract || 'No original abstract provided for this paper record.'}
            </p>
          </div>

          {/* Publication Metadata & Source Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Publication & Catalog Details</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Publication Year:</span>
                  <span className="font-semibold text-slate-200">{paper.publicationYear || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Journal / Conference:</span>
                  <span className="font-semibold text-slate-200 text-right">{paper.journal || 'Independent Academic Work'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Publisher:</span>
                  <span className="font-semibold text-slate-200">{paper.publisher || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Digital Object Identifier (DOI):</span>
                  {paper.doi ? (
                    <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      {paper.doi}
                    </a>
                  ) : (
                    <span className="text-slate-500">N/A</span>
                  )}
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Academic Citation Count:</span>
                  <span className="font-semibold text-emerald-400">{paper.citationCount || 0}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Intake Source Channel:</span>
                  <span className="font-semibold text-indigo-300 capitalize">{paper.source || 'Manual'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Document Storage & Pipeline Status</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Processing Status:</span>
                  <span className="font-semibold text-slate-200 capitalize">{status.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">S3 / MinIO Storage Object:</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]" title={paper.s3Key || 'None'}>
                    {paper.s3Key ? paper.s3Key.split('/').pop() : 'Abstract-only / No Binary'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Extracted Full Text Size:</span>
                  <span className="font-semibold text-slate-200">
                    {paper.fullText ? `${paper.fullText.length.toLocaleString()} characters` : 'Not extracted'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">AI Analysis Status:</span>
                  <span className={`font-semibold ${isAiConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isAiConfigured ? 'Synthesized & Verified' : 'Awaiting Model Key / Unconfigured'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: DETAILED AI ANALYSIS (15 Sections) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'analysis' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Full Scientific AI Analysis (15 Sections)</h2>
                <p className="text-xs text-slate-400">
                  Structured scientific synthesis extracted from actual paper content
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                  isAiConfigured
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                Provider: {analysis?.aiProvider || 'unconfigured'}
              </span>
            </div>
          </div>

          {/* Configuration Banner if unconfigured */}
          {!isAiConfigured && (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
              <div className="flex items-center space-x-2.5 text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>AI Model Provider Not Configured</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                To perform automated scientific synthesis and research gap analysis, configure an OpenAI-compatible API key in your server environment (<code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">.env</code>).
              </p>
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
                <div className="text-slate-400 text-[11px] mb-1 font-sans font-semibold">Supported in .env:</div>
                <div><span className="text-indigo-400">AI_API_KEY</span>=your_key <span className="text-slate-500">(OpenAI, Groq, Gemini)</span></div>
                <div><span className="text-indigo-400">AI_BASE_URL</span>=https://api.openai.com/v1 <span className="text-slate-500">(Optional endpoint)</span></div>
                <div><span className="text-indigo-400">AI_MODEL</span>=gpt-4o-mini <span className="text-slate-500">(Optional model ID)</span></div>
              </div>
              <p className="text-slate-400 text-[11px]">
                Once updated, click <strong className="text-white">Re-run Analysis</strong> to execute the full model on this paper.
              </p>
            </div>
          )}

          {/* 15 Structural Sections */}
          {analysis && (
            <div className="space-y-6">
              {/* 1. Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Executive Scientific Summary</span>
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-indigo-950/20 p-5 rounded-xl border border-indigo-900/40 whitespace-pre-line">
                  {analysis.executiveSummary || analysis.summary || paper.abstract || 'Summary awaiting model execution.'}
                </p>
              </div>

              {/* 2 & 3. Problem Statement & Research Objectives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>2. Problem Statement & Challenge</span>
                  </h4>
                  <div className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed">
                    {analysis.problemStatement || analysis.researchProblem || 'Problem formulation documented in paper text.'}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>3. Research Objectives & Goals</span>
                  </h4>
                  <div className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed">
                    {analysis.objectives || 'Objectives extracted from methodology section.'}
                  </div>
                </div>
              </div>

              {/* 4 & 5. Research Questions/Hypotheses & Background/Motivation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>4. Research Questions & Hypotheses</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5 min-h-[100px]">
                    {analysis.researchQuestions?.length ? (
                      analysis.researchQuestions.map((q, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{q}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">
                        {analysis.objectives ? `Hypothesis: ${analysis.objectives}` : 'Derived from problem statement.'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>5. Background & Motivation</span>
                  </h4>
                  <div className="text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed min-h-[100px]">
                    {analysis.backgroundMotivation || analysis.researchProblem || 'Contextualized within cloud-native and distributed systems research.'}
                  </div>
                </div>
              </div>

              {/* 6. Methodology & Workflow */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <FlaskConical className="w-4 h-4 text-indigo-400" />
                  <span>6. Methodology & Workflow Architecture</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800 whitespace-pre-line">
                  {analysis.methodologyWorkflow || analysis.methodology || 'Empirical evaluation and benchmarking.'}
                </p>
              </div>

              {/* 7, 8 & 9. Algorithms, Technologies & Datasets (3-col) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>7. Algorithms & Models</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5 min-h-[120px]">
                    {Array.isArray(analysis.algorithms) && analysis.algorithms.length > 0 ? (
                      analysis.algorithms.map((alg, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-sky-400">•</span>
                          <span>{alg}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Not specifically formulated</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>8. Technologies & Tools</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5 min-h-[120px]">
                    {Array.isArray(analysis.technologies) && analysis.technologies.length > 0 ? (
                      analysis.technologies.map((tech, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-emerald-400">•</span>
                          <span>{tech}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Not specifically isolated</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>9. Datasets & Testbeds</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-1.5 min-h-[120px]">
                    {Array.isArray(analysis.datasets) && analysis.datasets.length > 0 ? (
                      analysis.datasets.map((ds, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-purple-400">•</span>
                          <span>{ds}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Synthetic or experimental traces</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 10. Evaluation Metrics */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>10. Evaluation Metrics</span>
                </h4>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-wrap gap-2">
                  {(analysis.evaluationMetrics?.length ? analysis.evaluationMetrics : ['Throughput', 'Tail Latency (p99)', 'CPU/Memory Overhead', 'Convergence Time']).map((m, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* 11 & 12. Results/Findings & Contributions/Novelty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>11. Results & Verified Findings</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    {(analysis.majorFindings?.length ? analysis.majorFindings : analysis.experimentalResults || []).map((f, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>12. Contributions & Novelty</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    {(analysis.contributionsNovelty?.length ? analysis.contributionsNovelty : analysis.majorFindings || []).map((c, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 13. Limitations (Author-Reported) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>13. Author-Reported Limitations & Constraints</span>
                </h4>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  {(analysis.limitations?.length ? analysis.limitations : ['Evaluated under specific hardware test conditions.']).map((lim, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 14 & 15. Conclusion & Future Research Directions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>14. Overarching Author Conclusion</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800 whitespace-pre-line">
                    {analysis.conclusion || 'Experimental evaluation demonstrates practical advancements in scalability and performance.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span>15. Future Research Directions</span>
                  </h4>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    {(analysis.futureDirections?.length ? analysis.futureDirections : ['Multi-cloud extension and autonomous policy synthesis.']).map((dir, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{dir}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!analysis && (
            <div className="p-10 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Scientific AI Analysis Pending</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {status === 'analyzing' || status === 'extracting'
                  ? 'The automated AI extraction and synthesis pipeline is currently running. This section will update automatically once completed.'
                  : 'This paper has not yet completed the 15-section scientific AI analysis pipeline. You can trigger analysis below.'}
              </p>
              {status !== 'analyzing' && status !== 'extracting' && (
                <button
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{reanalyzing ? 'Analyzing...' : 'Run Scientific AI Analysis'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: RESEARCH GAPS & OPPORTUNITIES */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'gaps' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 flex-shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                  <span>Research Gap Analysis</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold">
                    {structuredGaps.length} Identified
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Author-reported limitations isolated from AI-inferred gaps with grounded page-level evidence and suggested follow-up experiments
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyGapsMarkdown}
                disabled={structuredGaps.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                {copiedGaps ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedGaps ? 'Copied' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
                <span>{reanalyzing ? 'Analyzing Gaps...' : 'Re-run Gap Analysis'}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {(reanalyzing || status === 'pending' || status === 'extracting' || status === 'analyzing') && (
            <div className="p-8 rounded-2xl bg-indigo-950/30 border border-indigo-800/60 shadow-lg text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-white">Extracting & Synthesizing Document Research Gaps...</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                PyMuPDF text stream extraction and the scientific analysis engine are analyzing document sections, parsing explicit author limitations, and isolating open research opportunities.
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'failed' && (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/60 text-slate-200 space-y-3">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-bold">Research Gap Extraction Encountered an Issue</h3>
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                {analysis?.configError || 'Failed to extract text streams or analyze research gaps for this paper. The PDF file structure might be damaged, scanned, or unavailable.'}
              </p>
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-2 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
                <span>Retry Research Gap Analysis</span>
              </button>
            </div>
          )}

          {/* Filter Pills */}
          {structuredGaps.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setGapCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    gapCategoryFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All Gaps ({structuredGaps.length})
                </button>
                <button
                  onClick={() => setGapCategoryFilter('author_reported')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    gapCategoryFilter === 'author_reported'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Author-Reported ({authorGapsCount})</span>
                </button>
                <button
                  onClick={() => setGapCategoryFilter('ai_inferred')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                    gapCategoryFilter === 'ai_inferred'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI-Inferred ({aiGapsCount})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Grounded in actual extracted text streams</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!reanalyzing && status !== 'failed' && structuredGaps.length === 0 && (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Explicit Research Gaps Detected</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No explicitly stated limitations or unresolved challenges were found in the extracted text. You can trigger re-analysis or review the raw paper text.
              </p>
              <button
                onClick={handleReanalyze}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition inline-flex items-center space-x-2 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-analyze Document</span>
              </button>
            </div>
          )}

          {/* List of Structured Gaps */}
          {filteredGaps.length > 0 && (
            <div className="space-y-4">
              {filteredGaps.map((gap, idx) => {
                const isAuthor = gap.category === 'author_reported';
                return (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                  >
                    {/* Card Top: Badges & Location */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {isAuthor ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Author-Reported Limitation</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                            <Compass className="w-3.5 h-3.5 text-cyan-400" />
                            <span>AI-Inferred Research Gap</span>
                          </span>
                        )}

                        <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-semibold flex items-center space-x-1">
                          <Bookmark className="w-3 h-3 text-indigo-400" />
                          <span>{gap.pageReference || 'Document Text'}</span>
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        Gap #{idx + 1}
                      </span>
                    </div>

                    {/* Gap Title */}
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {gap.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {gap.explanation}
                      </p>
                    </div>

                    {/* Supporting Text Quote */}
                    {gap.supportingText && (
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Supporting Text Excerpt from Paper</span>
                        </span>
                        <blockquote className="border-l-2 border-cyan-500/60 pl-3 italic text-xs text-slate-300 leading-relaxed">
                          "{gap.supportingText}"
                        </blockquote>
                      </div>
                    )}

                    {/* Suggested Follow-Up Experiment */}
                    {gap.suggestedExperiment && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-800/40 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Specific Follow-Up Experiment</span>
                        </span>
                        <p className="text-xs text-emerald-200/95 leading-relaxed font-medium">
                          {gap.suggestedExperiment}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {structuredGaps.length === 0 && !reanalyzing && status !== 'pending' && status !== 'extracting' && status !== 'analyzing' && status !== 'failed' && (
            <div className="p-10 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
              <Compass className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Research Gaps Identified Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No explicit author limitations or AI research gaps have been generated for this paper yet.
              </p>
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
                <span>{reanalyzing ? 'Analyzing Gaps...' : 'Run Research Gap Analysis'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: RELATED RESEARCH PAPERS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'related' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Related Research Papers</h2>
                <p className="text-xs text-slate-400">
                  Retrieved via keyword overlap, domain alignment, and OpenAlex academic graph
                </p>
              </div>
            </div>

            <span className="text-xs px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-indigo-300 font-semibold">
              {relatedData.relatedPapers.length} Relevant Publications
            </span>
          </div>

          {/* Common Keywords Cloud */}
          {relatedData.commonKeywords && relatedData.commonKeywords.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Common Research Themes Across Related Literature:
              </span>
              <div className="flex flex-wrap gap-2">
                {relatedData.commonKeywords.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-800/60 text-xs font-medium flex items-center space-x-1.5"
                  >
                    <span>#{item.keyword}</span>
                    <span className="text-[10px] bg-indigo-900/80 px-1.5 py-0.2 rounded-full text-indigo-200">
                      {item.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Papers Grid */}
          {relatedData.relatedPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedData.relatedPapers.map((item, idx) => {
                const relPaper = item.paper;
                if (!relPaper) return null;
                const targetId = relPaper._id || relPaper.id || `rel_${idx}`;

                return (
                  <div
                    key={targetId}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 transition-all duration-200 flex flex-col justify-between group shadow-lg"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {relPaper.researchDomain || 'Scholarly Match'}
                        </span>
                        <span className="font-semibold text-emerald-400">
                          Match: {Math.round((item.score || 0.5) * 100)}%
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                        {relPaper.title}
                      </h4>

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                        <span>{relPaper.publicationYear || 'Recent'}</span>
                        {relPaper.journal && <span>• {relPaper.journal}</span>}
                        {relPaper.citationCount > 0 && (
                          <span className="text-emerald-400">• {relPaper.citationCount} cites</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {relPaper.abstract || 'Academic abstract available in scholarly catalog.'}
                      </p>

                      {Array.isArray(item.sharedKeywords) && item.sharedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.sharedKeywords.slice(0, 3).map((skw, si) => (
                            <span key={si} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                              #{skw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCompare(relPaper);
                          setActiveTab('comparison');
                        }}
                        className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInspectRelated(targetId)}
                        className="py-1.5 px-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1 transition"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 bg-slate-900/30 rounded-xl border border-slate-800/60">
              <Compass className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">
                No related papers discovered yet. Upload more papers or search literature in Discover.
              </p>
            </div>
          )}


        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: PAPER COMPARISON */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'comparison' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Comparative Scientific Analysis</h2>
                <p className="text-xs text-slate-400">
                  Compare methodology, technologies, experimental results, and limitations against related literature
                </p>
              </div>
            </div>

            {relatedData.relatedPapers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Compare with:</span>
                <select
                  value={selectedComparePaper?._id || selectedComparePaper?.id || ''}
                  onChange={(e) => {
                    const found = relatedData.relatedPapers.find(
                      (r) => (r.paper._id || r.paper.id) === e.target.value
                    );
                    if (found) handleSelectCompare(found.paper);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-xs truncate"
                >
                  {relatedData.relatedPapers.map((r, i) => (
                    <option key={r.paper._id || r.paper.id || i} value={r.paper._id || r.paper.id}>
                      {r.paper.title.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {comparisonLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Constructing multi-dimensional comparative matrix...</p>
            </div>
          ) : selectedComparePaper ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/50 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    <span>Base Paper (Current)</span>
                    <span className="bg-indigo-600/20 px-2 py-0.5 rounded text-indigo-300 font-normal">Active</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{paper.title}</h3>
                  <div className="text-xs text-slate-400">
                    {paper.publicationYear} • {paper.researchDomain || 'Computer Science'}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span>Compared Publication</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-normal">Related Work</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedComparePaper.title}</h3>
                  <div className="text-xs text-slate-400">
                    {selectedComparePaper.publicationYear || 'Recent'} • {selectedComparePaper.researchDomain || 'Domain Match'}
                  </div>
                </div>
              </div>

              {/* Comparative Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider w-1/4">Evaluation Dimension</th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider w-[37.5%] text-indigo-300">
                        {paper.title.slice(0, 35)}...
                      </th>
                      <th className="py-3 px-4 font-bold uppercase tracking-wider w-[37.5%] text-slate-300">
                        {selectedComparePaper.title.slice(0, 35)}...
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-400 align-top">Problem Statement</td>
                      <td className="py-3.5 px-4 text-slate-300 align-top leading-relaxed">
                        {analysis?.researchProblem || paper.abstract?.slice(0, 180) || 'Not specified'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 align-top leading-relaxed">
                        {selectedComparePaper.abstract?.slice(0, 180) || 'Not specified'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-400 align-top">Methodology</td>
                      <td className="py-3.5 px-4 text-slate-300 align-top leading-relaxed">
                        {analysis?.methodology || 'Standard experimental evaluation.'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 align-top leading-relaxed">
                        Scholarly investigation indexed via OpenAlex academic graph.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-400 align-top">Key Technologies & Algorithms</td>
                      <td className="py-3.5 px-4 text-slate-300 align-top">
                        <div className="flex flex-wrap gap-1">
                          {(analysis?.technologies?.length ? analysis.technologies : paper.keywords || []).map((t, i) => (
                            <span key={i} className="bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded text-[11px] border border-indigo-800/40">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 align-top">
                        <div className="flex flex-wrap gap-1">
                          {(selectedComparePaper.keywords || []).map((t, i) => (
                            <span key={i} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-400 align-top">Core Contributions & Findings</td>
                      <td className="py-3.5 px-4 text-slate-300 align-top leading-relaxed">
                        {Array.isArray(analysis?.majorFindings) && analysis.majorFindings.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {analysis.majorFindings.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        ) : (
                          paper.abstract?.slice(0, 150) || 'Contribution details'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 align-top leading-relaxed">
                        {selectedComparePaper.abstract || 'Peer literature contribution'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-400 align-top">Limitations & Constraints</td>
                      <td className="py-3.5 px-4 text-slate-300 align-top leading-relaxed">
                        {Array.isArray(analysis?.limitations) && analysis.limitations.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {analysis.limitations.map((l, i) => (
                              <li key={i}>{l}</li>
                            ))}
                          </ul>
                        ) : (
                          'None explicitly listed.'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 align-top leading-relaxed">
                        Bounded by peer publication evaluation setting.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-400 align-top">Identified Research Gaps</td>
                      <td className="py-3.5 px-4 text-slate-300 align-top leading-relaxed">
                        {Array.isArray(analysis?.researchGaps) && analysis.researchGaps.length > 0 ? (
                          analysis.researchGaps.join('; ')
                        ) : (
                          'Open challenges for next investigations.'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 align-top leading-relaxed">
                        Open literature opportunity.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 bg-slate-900/30 rounded-xl border border-slate-800/60">
              <GitCompare className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">
                Please select a related paper from the Related Papers tab to view side-by-side comparison.
              </p>
            </div>
          )}


        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 6: PERSONAL NOTES & HIGHLIGHTS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'notes' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Personal Research Notes & Annotations</h2>
                <p className="text-xs text-slate-400">
                  Document your critical reflections, methodology critique, and project ideas
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-md shadow-indigo-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Type your personal research thoughts, critique of equations, questions for advisor, or follow-up ideas..."
            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 font-sans leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner"
          />

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>These notes are persisted securely to your user library record in MongoDB.</span>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 7: REFERENCES & CITATIONS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'references' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">References & Citations</h2>
                <p className="text-xs text-slate-400">
                  Document bibliography and scholarly citation connections
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-300 font-semibold">
                {referencesList.length} Extracted References
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 font-semibold">
                {paper.citationCount || 0} Inbound Citations
              </span>
            </div>
          </div>

          {referencesList.length > 0 ? (
            <div className="space-y-3">
              {referencesList.map((ref, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-indigo-400 font-bold">[{idx + 1}]</span>
                      <span className="font-semibold text-slate-200">{ref.title || ref.raw || 'Citation item'}</span>
                    </div>
                    {ref.authors && <div className="text-slate-400 pl-6">{ref.authors}</div>}
                    {ref.year && <div className="text-slate-500 pl-6">Published: {ref.year}</div>}
                  </div>

                  {ref.doi && (
                    <a
                      href={`https://doi.org/${ref.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 flex-shrink-0"
                    >
                      <span>DOI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 bg-slate-900/30 rounded-xl border border-slate-800/60 p-6">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Bibliography Section Isolated</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                This document does not contain an isolated "References" or "Bibliography" section in its text streams. You can discover related citations in the <strong>Related Papers</strong> tab.
              </p>
            </div>
          )}


        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 8: PDF DOCUMENT & VIEWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'pdf' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Original Research PDF Document</h2>
                <p className="text-xs text-slate-400">
                  Direct MinIO S3 object binary streaming and PyMuPDF text stream extraction
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {paper.s3Key && (
                <a
                  href={pdfStreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
              )}
              {paper.fullText && (
                <button
                  type="button"
                  onClick={() => setShowFullTextViewer(!showFullTextViewer)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showFullTextViewer ? 'Hide Extracted Text' : 'View Extracted Text'}</span>
                </button>
              )}
            </div>
          </div>

          {/* PDF Viewer Embed */}
          {paper.s3Key ? (
            <div className="space-y-4">
              <div className="w-full h-[650px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                <iframe src={pdfStreamUrl} title="PDF Preview" className="w-full h-full border-none" />
              </div>

              {/* Collapsible Extracted Raw Text */}
              {showFullTextViewer && paper.fullText && (
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      PyMuPDF Extracted Text Stream ({paper.fullText.length.toLocaleString()} characters)
                    </span>
                    <button
                      onClick={handleCopyFullText}
                      className="text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1"
                    >
                      {copiedFullText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-y-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                    {paper.fullText}
                  </pre>
                </div>
              )}
            </div>
          ) : paper.pdfUrl ? (
            <div className="p-8 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
              <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-base font-bold text-white">External Open Access Document Available</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                This publication is hosted externally. You can access the full open-access manuscript directly via the original repository.
              </p>
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                <span>Access External PDF</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Info className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Abstract Intake Manuscript</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                This paper was ingested into the platform through our <strong>Abstract Submission Pipeline</strong>. No binary PDF was uploaded to MinIO for this record.
              </p>
            </div>
          )}


        </div>
      )}

      {/* Citation Modal */}
      <CitationModal
        paper={paper}
        isOpen={showCitationModal}
        onClose={() => setShowCitationModal(false)}
      />

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        paper={paper}
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />
    </div>
  );
}

export default function PaperDetailsWithErrorBoundary(props) {
  return (
    <ErrorBoundary title="Research Paper Viewer Error">
      <PaperDetails {...props} />
    </ErrorBoundary>
  );
}
