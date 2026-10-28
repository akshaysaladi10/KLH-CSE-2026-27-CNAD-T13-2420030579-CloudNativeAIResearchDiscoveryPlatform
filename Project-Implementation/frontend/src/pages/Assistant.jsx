import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FlaskConical,
  Target,
  FileText,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  RefreshCw,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Assistant() {
  const [searchParams] = useSearchParams();
  const initialPaperId = searchParams.get('paperId') || '';
  const { showToast } = useToast();

  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I am your AI Research Assistant. You can ask me to explain methodologies, find evidence, compare architectures, suggest follow-up experiments, or draft literature reviews grounded in your scientific publications.\n\nSelect a specific paper from the dropdown above or ask questions across your library.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load library papers for dropdown selector
    api.get('/papers?limit=50')
      .then((res) => {
        if (res.data?.success) {
          setPapers(res.data.data.papers || []);
        }
      })
      .catch((err) => console.error('Failed to load papers:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText = inputQuery) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/assistant', {
        query: q,
        paperId: selectedPaperId || '',
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });

      if (res.data?.success || res.data?.answer) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.answer,
            sources: res.data.sources || [],
            provider: res.data.provider,
            isConfigured: res.data.isConfigured,
          },
        ]);
      } else {
        throw new Error(res.data?.error || 'No answer generated');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err.response?.data?.error?.message ||
            err.message ||
            'Failed to contact AI Assistant service. Please verify your backend connection.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { label: 'Summarize Methodology', query: 'Can you summarize the primary methodology, experimental setup, and architectural workflow used in this research?' },
    { label: 'Extract Findings & Numbers', query: 'What are the major quantitative results, benchmark percentages, and verified findings reported by the authors?' },
    { label: 'Identify Author Limitations', query: 'What limitations and constraints are explicitly acknowledged by the authors in this paper?' },
    { label: 'Suggest Experiments', query: 'Based on the limitations and future scope stated in this research, what concrete follow-up experiments would you recommend?' },
    { label: 'Draft Literature Review', query: 'Draft a rigorous two-paragraph literature review excerpt citing this publication and explaining its primary contribution.' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Header & Paper Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center space-x-2">
              <span>AI Research Assistant</span>
              <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Grounded Literature Intelligence
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Answers strictly anchored to extracted paper content and academic citations
            </p>
          </div>
        </div>

        {/* Paper Target Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Target Document:</label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-xs truncate"
          >
            <option value="">All Library Papers (Broad Synthesis)</option>
            {papers.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Suggested:</span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSendMessage(preset.query)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 text-[11px] font-medium text-slate-300 hover:text-indigo-300 whitespace-nowrap transition"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 overflow-y-auto space-y-4 shadow-xl">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-800/80 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md'
                    : msg.isError
                    ? 'bg-rose-950/40 border border-rose-800/80 text-rose-200 rounded-bl-sm'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-sm shadow-inner'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Sources Pill / Attribution */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Grounded Sources:</span>
                    {msg.sources.map((s, si) => (
                      <Link
                        key={si}
                        to={`/papers/${s.id}`}
                        className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 hover:underline flex items-center space-x-1"
                      >
                        <span className="truncate max-w-[140px]">{s.title || 'Paper'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing paper literature & synthesizing grounded response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex-shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            selectedPaperId
              ? "Ask a question about the selected paper's methodology, metrics, limitations..."
              : "Ask a research question across all indexed papers..."
          }
          className="w-full pl-4 pr-24 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xl transition"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
