import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  FileEdit,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export default function Upload() {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'abstract'
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [researchDomain, setResearchDomain] = useState('Cloud Computing');
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0: Idle, 1: Submitting, 2: Parsing/Extracting, 3: Completed
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const domainOptions = [
    'Cloud Computing',
    'Artificial Intelligence',
    'Machine Learning',
    'Distributed Systems',
    'Cybersecurity',
    'Software Engineering',
    'Data Science & Analytics',
    'Computer Vision',
    'Natural Language Processing',
  ];

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF research paper to upload.');
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are supported (.pdf).');
      return;
    }

    if (file.size === 0) {
      setError('The selected PDF file is empty (0 bytes). Please select a valid document.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit. Please upload a smaller document.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadStep(1); // Uploading to MinIO & MongoDB

    const formData = new FormData();
    formData.append('pdf', file);
    if (title.trim()) formData.append('title', title.trim());
    if (authors.trim()) formData.append('authors', authors.trim());
    if (abstract.trim()) formData.append('abstract', abstract.trim());
    if (keywords.trim()) formData.append('keywords', keywords.trim());
    formData.append('researchDomain', researchDomain);

    try {
      const res = await api.post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const paperId = res.data.data.paper._id;
        setUploadStep(2); // PyMuPDF text stream extraction

        setTimeout(() => {
          setUploadStep(3); // AI synthesis triggered
          setTimeout(() => {
            navigate(`/papers/${paperId}`);
          }, 1200);
        }, 1800);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(
        err.response?.data?.error?.message ||
          'PDF upload failed. Please verify that MinIO and microservices are running.'
      );
      setLoading(false);
      setUploadStep(0);
    }
  };

  const handleAbstractSubmit = async (e) => {
    e.preventDefault();
    if (!abstract || !abstract.trim()) {
      setError('Please enter or paste the research abstract.');
      return;
    }

    if (abstract.trim().length < 25) {
      setError('The abstract is too short. Please provide at least 25 characters for meaningful analysis.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadStep(1); // Creating paper record & indexing

    try {
      const res = await api.post('/papers/analyze-abstract', {
        title: title.trim(),
        abstract: abstract.trim(),
        authors: authors.trim(),
        keywords: keywords.trim(),
        researchDomain,
      });

      if (res.data.success) {
        const paperId = res.data.data.paper._id;
        setUploadStep(2); // AI Analysis processing

        setTimeout(() => {
          setUploadStep(3); // Completed
          setTimeout(() => {
            navigate(`/papers/${paperId}`);
          }, 1200);
        }, 1800);
      }
    } catch (err) {
      console.error('Abstract analysis submission failed:', err);
      setError(
        err.response?.data?.error?.message ||
          'Failed to submit abstract for AI analysis. Please try again.'
      );
      setLoading(false);
      setUploadStep(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
            {activeTab === 'pdf' ? <UploadCloud className="w-6 h-6" /> : <FileEdit className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {activeTab === 'pdf' ? 'Upload Research Paper' : 'Submit Research Abstract'}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {activeTab === 'pdf'
                ? 'Store PDF in MinIO S3 object storage, extract text with PyMuPDF, and trigger automated AI synthesis.'
                : 'Directly analyze any scientific abstract through the platform AI pipeline and extract structured insights.'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-lg">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setActiveTab('pdf');
            setError('');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
            activeTab === 'pdf'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload PDF Document</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setActiveTab('abstract');
            setError('');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
            activeTab === 'abstract'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Paste / Enter Abstract</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Stepper (Active during processing) */}
      {loading && (
        <div className="bg-slate-950 p-6 rounded-2xl border border-indigo-900/60 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <span className="text-sm font-bold text-white">
              {activeTab === 'pdf' ? (
                <>
                  {uploadStep === 1 && 'Uploading PDF to MinIO S3 Storage & Indexing in MongoDB...'}
                  {uploadStep === 2 && 'PyMuPDF Service Extracting Scientific Text Streams...'}
                  {uploadStep === 3 && 'Upload & AI Analysis Initialized! Opening Paper Details...'}
                </>
              ) : (
                <>
                  {uploadStep === 1 && 'Indexing Research Abstract in MongoDB...'}
                  {uploadStep === 2 && 'AI Service Analyzing Problem, Methodology, & Findings...'}
                  {uploadStep === 3 && 'Analysis Completed! Opening Paper Details...'}
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <div
              className={`p-2.5 rounded-xl border transition ${
                uploadStep >= 1
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              1. {activeTab === 'pdf' ? 'MinIO Upload' : 'Document Ingestion'}
            </div>
            <div
              className={`p-2.5 rounded-xl border transition ${
                uploadStep >= 2
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              2. {activeTab === 'pdf' ? 'PyMuPDF Extraction' : 'AI Scientific Engine'}
            </div>
            <div
              className={`p-2.5 rounded-xl border transition ${
                uploadStep >= 3
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              3. Synthesis Complete
            </div>
          </div>
        </div>
      )}

      {/* Form: PDF Upload Mode */}
      {activeTab === 'pdf' && (
        <form onSubmit={handlePdfUpload} className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          {/* PDF File Drag and Drop / Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select PDF Document *
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-900/60 hover:bg-slate-900 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,application/pdf"
                required
                disabled={loading}
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
              {file && (
                <p className="mt-3 text-xs text-indigo-400 font-semibold flex items-center justify-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </p>
              )}
            </div>
          </div>

          {/* Paper Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Paper Title (Optional - defaults to PDF filename)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="e.g., Adaptive Fault-Tolerance in Cloud-Native Microservices"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Authors (Comma-separated)
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              disabled={loading}
              placeholder="e.g., Dr. Jane Smith, Prof. Robert Brown"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Research Domain */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Research Domain
            </label>
            <select
              value={researchDomain}
              onChange={(e) => setResearchDomain(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {domainOptions.map((domain, i) => (
                <option key={i} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Keywords & Topics (Comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={loading}
              placeholder="e.g., Cloud Computing, Microservices, Kubernetes, Resilience"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Abstract / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Abstract or Description (Optional)
            </label>
            <textarea
              rows={3}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              disabled={loading}
              placeholder="Provide an abstract or leave blank for PyMuPDF text stream extraction..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Upload...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload PDF & Trigger AI Analysis</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Form: Abstract Submission Mode */}
      {activeTab === 'abstract' && (
        <form onSubmit={handleAbstractSubmit} className="bg-slate-950/80 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          {/* Paper Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Research Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="e.g., Decentralized Autoscaling and Failure Recovery in Kubernetes"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Abstract Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Research Abstract / Summary Text *
              </label>
              <span className="text-[11px] text-slate-500">
                {abstract.length} characters
              </span>
            </div>
            <textarea
              rows={6}
              required
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              disabled={loading}
              placeholder="Paste or enter the complete scientific abstract, methodology summary, or research contributions here..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed transition"
            />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Authors (Comma-separated)
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              disabled={loading}
              placeholder="e.g., Dr. Elena Rostova, David Chen"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Research Domain */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Research Domain
            </label>
            <select
              value={researchDomain}
              onChange={(e) => setResearchDomain(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              {domainOptions.map((domain, i) => (
                <option key={i} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Keywords (Comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={loading}
              placeholder="e.g., Kubernetes, Fault Tolerance, Autoscaling, Microservices"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !abstract.trim()}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing AI Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit Abstract & Run AI Synthesis</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
