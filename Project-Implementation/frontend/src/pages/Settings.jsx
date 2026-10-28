import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Info,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { showToast } = useToast();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Health check via API gateway
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
    fetch(`${apiBase}/health`)
      .then((r) => r.json())
      .then((data) => setHealthData(data))
      .catch((err) => console.warn('Health check query failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const isAiConfigured = healthData?.services?.ai?.isConfigured;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <SettingsIcon className="w-7 h-7 text-indigo-400" />
          <span>Platform Settings & Cluster Configuration</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review researcher identity, inspect microservice health status, and manage LLM API keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900/80 text-indigo-300 flex items-center justify-center font-bold text-lg border border-indigo-700/50">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user?.name || 'Researcher'}</h2>
              <p className="text-xs text-indigo-400">{user?.role || 'Academic Researcher'}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">Email Address</span>
              <span className="text-slate-200 font-medium">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">Affiliated Institution</span>
              <span className="text-slate-200 font-medium">{user?.institution || 'Cloud-Native Institute'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">Access Token Session</span>
              <span className="text-emerald-400 font-medium flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active JWT Session (7-Day Expiry)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Model Provider & S3 Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Model Configuration Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">AI Model Provider Configuration</h3>
              </div>
              {isAiConfigured ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configured & Active</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unconfigured in .env</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The AI service uses standard OpenAI-compatible endpoints to execute structured scientific section extraction, limitation analysis, and conversational research Q&A.
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">How to configure your API Key:</h4>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Open the <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">.env</code> file in your repository root.</li>
                <li>Set <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">AI_API_KEY=your_actual_key</code></li>
                <li>(Optional) Set <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">AI_MODEL=gpt-4o-mini</code> or your chosen model.</li>
                <li>(Optional) Set <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">AI_BASE_URL</code> to Groq, OpenRouter, or Gemini's endpoint.</li>
                <li>Re-run analysis on any paper from the Paper Details page.</li>
              </ol>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 leading-relaxed">
              <Info className="w-4 h-4 inline-block mr-1 text-indigo-400" />
              <strong>Offline Resilience:</strong> Even when no API key is provided, the platform operates deterministically using local PyMuPDF text stream extraction, bibliographic regex parsing, and Jaccard similarity recommendations.
            </div>
          </div>

          {/* Microservices Cluster Health */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
              <Server className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Microservices Cluster Topology</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {healthData?.services &&
                Object.entries(healthData.services).map(([name, s]) => (
                  <div
                    key={name}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 capitalize">{name} Service</h4>
                      <p className="text-[10px] text-slate-500">Status: {s.status}</p>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        s.reachable ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
