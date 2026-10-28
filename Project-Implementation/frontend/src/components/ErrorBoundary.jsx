import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-950 border border-rose-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {this.props.title || 'Component Rendering Error'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                An unexpected runtime error occurred while displaying this research view. The error has been captured safely to prevent a white screen.
              </p>
            </div>

            {/* Error Diagnostics Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="font-semibold text-rose-400">Diagnostic Details</span>
                <span className="text-slate-500">React Runtime Trace</span>
              </div>
              <p className="font-mono text-xs text-rose-300 break-words leading-relaxed select-all">
                {this.state.error?.toString() || 'Unknown error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <details className="text-[10px] text-slate-500 font-mono mt-2">
                  <summary className="cursor-pointer hover:text-slate-300 transition">
                    View Component Call Stack
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-950 rounded border border-slate-800/80 overflow-x-auto max-h-36 leading-tight whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Recovery Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-md shadow-indigo-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry / Reload View</span>
              </button>

              <a
                href="/library"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Library</span>
              </a>

              <a
                href="/dashboard"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
