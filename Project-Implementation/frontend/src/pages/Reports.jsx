import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  FileBarChart,
  BarChart2,
  TrendingUp,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [papers, setPapers] = useState([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState([]);
  const [reportTitle, setReportTitle] = useState('Executive Literature Synthesis & Comparative Analysis');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/analytics/dashboard'),
      api.get('/papers?limit=30'),
    ]).then(([dashRes, papersRes]) => {
      if (dashRes.status === 'fulfilled' && dashRes.value.data?.success) {
        setStats(dashRes.value.data.data);
      }
      if (papersRes.status === 'fulfilled' && papersRes.value.data?.success) {
        const pList = papersRes.value.data.data.papers || [];
        setPapers(pList);
        // Default select top 4 papers
        setSelectedPaperIds(pList.slice(0, 4).map((p) => p._id));
      }
      setLoading(false);
    });
  }, []);

  const handleTogglePaper = (id) => {
    setSelectedPaperIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerateReport = async () => {
    if (!selectedPaperIds.length) {
      showToast('Select at least one paper for report generation', 'info');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/papers/report/generate', {
        paperIds: selectedPaperIds,
        title: reportTitle.trim() || 'Research Synthesis Report',
      });

      if (res.data?.success) {
        setGeneratedReport(res.data.data.report);
        showToast('Research report generated successfully!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Report generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (generatedReport?.markdown) {
      navigator.clipboard.writeText(generatedReport.markdown);
      setCopied(true);
      showToast('Markdown report copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Aggregating research analytics & report data...</p>
      </div>
    );
  }

  const yearDistribution = stats?.yearDistribution || [];
  const topTopics = stats?.topTopics || [];
  const maxYearVal = Math.max(...yearDistribution.map((y) => y.count), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <FileBarChart className="w-7 h-7 text-indigo-400" />
            <span>Research Analytics & Synthesis Reports</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Empirical distribution statistics, keyword trends, and automated multi-document literature report generation.
          </p>
        </div>

        {generatedReport && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Markdown</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Analytics Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year Distribution Chart */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Publication Year Distribution</h2>
          </div>

          {yearDistribution.length > 0 ? (
            <div className="space-y-3 pt-2">
              {yearDistribution.map((item) => {
                const pct = Math.round((item.count / maxYearVal) * 100);
                return (
                  <div key={item.year} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">{item.year}</span>
                      <span className="text-indigo-400 font-bold">{item.count} papers</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-gradient-to-r from-indigo-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">No publication years cataloged yet.</div>
          )}
        </div>

        {/* Top Research Domain Frequencies */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Domain & Concept Frequency Matrix</h2>
          </div>

          {topTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {topTopics.map((t, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2"
                >
                  <span className="text-xs font-semibold text-slate-200">{t.topic}</span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">No research concepts extracted yet.</div>
          )}
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Generate Structured Research Synthesis Report</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-300">Report Document Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={generating || !selectedPaperIds.length}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Synthesizing...' : 'Generate Research Report'}</span>
            </button>
          </div>
        </div>

        {/* Paper Selection Chips */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Select Papers for Synthesis ({selectedPaperIds.length} chosen):</span>
            <button
              onClick={() => setSelectedPaperIds(papers.map((p) => p._id))}
              className="text-indigo-400 hover:underline"
            >
              Select All
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {papers.map((p) => {
              const isSelected = selectedPaperIds.includes(p._id);
              return (
                <button
                  key={p._id}
                  onClick={() => handleTogglePaper(p._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition border ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate max-w-[220px]">{p.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Automated Synthesis Deliverable
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{generatedReport.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {generatedReport.paperCount} Publications Analyzed • {generatedReport.generatedDate}
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs leading-relaxed font-sans space-y-4">
            <pre className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {generatedReport.markdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
