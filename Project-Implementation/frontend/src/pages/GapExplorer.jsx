import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Target,
  Compass,
  AlertTriangle,
  Lightbulb,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function GapExplorer() {
  const [papers, setPapers] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'author_reported' | 'ai_inferred'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const loadGaps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/papers?limit=50');
      if (res.data?.success) {
        const list = res.data.data.papers || [];
        const detailed = await Promise.allSettled(
          list.map((p) => api.get(`/papers/${p._id}`))
        );
        const aggregated = [];
        detailed.forEach((d) => {
          if (d.status === 'fulfilled' && d.value.data?.success) {
            const { paper, analysis } = d.value.data.data;
            if (analysis) {
              const hasGaps = (analysis.structuredGaps && analysis.structuredGaps.length > 0) ||
                              (analysis.limitations && analysis.limitations.length > 0) ||
                              (analysis.researchGaps && analysis.researchGaps.length > 0) ||
                              (analysis.authorLimitations && analysis.authorLimitations.length > 0) ||
                              (analysis.futureDirections && analysis.futureDirections.length > 0);
              if (hasGaps) {
                // Normalize structured gaps
                let gaps = analysis.structuredGaps || [];
                if (!gaps.length) {
                  (analysis.authorLimitations || analysis.limitations || []).forEach((lim, i) => {
                    gaps.push({
                      category: 'author_reported',
                      title: `Author Limitation: ${lim.slice(0, 50)}${lim.length > 50 ? '...' : ''}`,
                      explanation: `Documented constraint reported by the authors.`,
                      supportingText: analysis.gapEvidence?.[i] || lim,
                      pageReference: 'Document Text (Section: Limitations)',
                      suggestedExperiment: analysis.suggestedExperiments?.[i] || 'Perform targeted ablation benchmarks under stress conditions.'
                    });
                  });
                  (analysis.aiInferredGaps || analysis.researchGaps || []).forEach((gap, i) => {
                    gaps.push({
                      category: 'ai_inferred',
                      title: `Research Horizon: ${gap.slice(0, 50)}${gap.length > 50 ? '...' : ''}`,
                      explanation: `Unresolved research challenge and future exploration opportunity.`,
                      supportingText: gap,
                      pageReference: 'Document Text (Section: Future Directions)',
                      suggestedExperiment: analysis.futureDirections?.[i] || 'Construct an empirical testbed to validate this open research hypothesis.'
                    });
                  });
                }
                aggregated.push({ paper, analysis, gaps });
              }
            }
          }
        });
        setPapers(aggregated);
      }
    } catch (err) {
      console.error('Failed to load gaps:', err);
      setError('Failed to aggregate research gaps across literature. Please verify service health and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGaps();
  }, []);

  const domains = ['All', ...new Set(papers.map((p) => p.paper.researchDomain).filter(Boolean))];

  const filteredPapers = papers
    .filter((p) => selectedDomain === 'All' || p.paper.researchDomain === selectedDomain)
    .map((p) => {
      const matchingGaps = selectedCategory === 'all'
        ? p.gaps
        : p.gaps.filter((g) => g.category === selectedCategory);
      return { ...p, matchingGaps };
    })
    .filter((p) => p.matchingGaps.length > 0);

  const totalGapsCount = papers.reduce((acc, p) => acc + p.gaps.length, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Target className="w-7 h-7 text-indigo-400" />
            <span>Research Gap Explorer</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Synthesize author-reported limitations, open research gaps, and concrete follow-up experiments across indexed papers.
          </p>
        </div>

        {/* Filter Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Gaps & Limitations</option>
            <option value="author_reported">Author-Reported Only</option>
            <option value="ai_inferred">AI-Inferred Only</option>
          </select>

          {/* Domain Filter */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  Domain: {d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadGaps}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition flex items-center justify-center"
            title="Refresh Research Gaps"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">Aggregating cross-document research gaps & empirical limitations...</p>
          <p className="text-slate-500 text-xs">Parsing page-level quotes and concrete follow-up experiments from paper analyses.</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/60 text-slate-200 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold">Failed to Load Research Gaps</h3>
          </div>
          <p className="text-xs text-rose-300">{error}</p>
          <button
            onClick={loadGaps}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-2 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading Gaps</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPapers.length === 0 && (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <Target className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Research Gaps Match Selected Criteria</p>
          <p>Upload research papers or run AI analysis on existing papers to identify scientific gaps.</p>
          <Link
            to="/upload"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition shadow"
          >
            Upload Paper
          </Link>
        </div>
      )}

      {/* Grid of Papers with Structured Gaps */}
      {!loading && !error && filteredPapers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPapers.map(({ paper, analysis, matchingGaps }) => (
            <div
              key={paper._id}
              className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Paper Header */}
                <div className="border-b border-slate-800/80 pb-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="text-indigo-400 font-semibold">{paper.researchDomain || 'Computer Science'}</span>
                    <span>{paper.publicationYear || 'Recent'}</span>
                  </div>
                  <Link
                    to={`/papers/${paper._id}?tab=gaps`}
                    className="text-sm font-bold text-white hover:text-indigo-400 transition line-clamp-2 leading-snug"
                  >
                    {paper.title}
                  </Link>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {Array.isArray(paper.authors) ? paper.authors.map(a => a.name || a).join(', ') : 'Researchers'}
                  </p>
                </div>

                {/* Gaps List */}
                <div className="space-y-3">
                  {matchingGaps.slice(0, 3).map((gap, gIdx) => {
                    const isAuthor = gap.category === 'author_reported';
                    return (
                      <div
                        key={gIdx}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAuthor
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                          }`}>
                            {isAuthor ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <Compass className="w-3 h-3 text-cyan-400" />}
                            <span>{isAuthor ? 'Author Limitation' : 'AI-Inferred Gap'}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Bookmark className="w-2.5 h-2.5 text-indigo-400" />
                            <span>{gap.pageReference || 'Document Text'}</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-200">
                          {gap.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {gap.explanation}
                        </p>

                        {gap.supportingText && (
                          <blockquote className="border-l-2 border-cyan-500/50 pl-2 text-[11px] italic text-slate-400 leading-relaxed">
                            "{gap.supportingText}"
                          </blockquote>
                        )}

                        {gap.suggestedExperiment && (
                          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-300 flex items-start space-x-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Experiment:</strong> {gap.suggestedExperiment}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {matchingGaps.length} gap{matchingGaps.length > 1 ? 's' : ''} isolated
                </span>
                <Link
                  to={`/papers/${paper._id}?tab=gaps`}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition"
                >
                  <span>Explore All Gaps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
