import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Quote, BookOpen } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function CitationModal({ paper, isOpen, onClose }) {
  const [citations, setCitations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFormat, setActiveFormat] = useState('apa');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && paper) {
      setLoading(true);
      setCitations(null);
      setCopied(false);

      const paperId = paper._id || paper.id;
      if (paperId && /^[0-9a-fA-F]{24}$/.test(paperId)) {
        api.get(`/papers/${paperId}/citation`)
          .then((res) => {
            if (res.data?.success) {
              setCitations(res.data.data.citations);
            }
          })
          .catch(() => {
            // Local fallback formulation
            generateLocalCitations();
          })
          .finally(() => setLoading(false));
      } else {
        generateLocalCitations();
        setLoading(false);
      }
    }
  }, [isOpen, paper]);

  const generateLocalCitations = () => {
    if (!paper) return;
    const authors = (paper.authors || []).map((a) => (typeof a === 'string' ? a : a.name || 'Author')).filter(Boolean);
    const authorStr = authors.length > 0 ? authors.join(', ') : 'Scholarly Researcher';
    const year = paper.publicationYear || 'Recent';
    const title = paper.title || 'Research Document';
    const journal = paper.journal || 'Academic Research Archive';
    const doi = paper.doi ? `https://doi.org/${paper.doi}` : '';

    const firstSurname = (authors[0] || 'research').split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
    const citeKey = `${firstSurname}${year}`;

    setCitations({
      apa: `${authorStr} (${year}). ${title}. ${journal}.${doi ? ` ${doi}` : ''}`,
      ieee: `${authorStr}, "${title}," ${journal}, ${year}.${paper.doi ? ` doi: ${paper.doi}.` : ''}`,
      mla: `${authorStr}. "${title}." ${journal}, ${year}.${doi ? ` ${doi}` : ''}`,
      chicago: `${authorStr}. "${title}." ${journal} (${year}).${doi ? ` ${doi}` : ''}`,
      bibtex: `@article{${citeKey},
  title = {${title}},
  author = {${authors.join(' and ')}},
  journal = {${journal}},
  year = {${year}}${paper.doi ? `,\n  doi = {${paper.doi}}` : ''}
}`,
    });
  };

  if (!isOpen || !paper) return null;

  const currentCitationText = citations ? citations[activeFormat] || '' : '';

  const handleCopy = () => {
    if (currentCitationText) {
      navigator.clipboard.writeText(currentCitationText);
      setCopied(true);
      showToast(`Copied ${activeFormat.toUpperCase()} citation to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formats = [
    { id: 'apa', label: 'APA 7th' },
    { id: 'bibtex', label: 'BibTeX' },
    { id: 'ieee', label: 'IEEE' },
    { id: 'mla', label: 'MLA 9th' },
    { id: 'chicago', label: 'Chicago' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cite Research Paper</h3>
              <p className="text-xs text-slate-400 truncate max-w-md">{paper.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-5 pt-4 flex space-x-1 border-b border-slate-800/80 bg-slate-950/40">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFormat(f.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                activeFormat === f.id
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Citation Box */}
        <div className="p-5 flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              Generating bibliographic citations...
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap break-words max-h-60 overflow-y-auto leading-relaxed">
                {currentCitationText || 'No citation formatted.'}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Export directly to Zotero, Mendeley, or LaTeX
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              disabled={loading || !currentCitationText}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center space-x-1.5 transition shadow-md shadow-indigo-600/30"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Citation' : 'Copy Citation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
