import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900/90 text-indigo-300 border-indigo-700'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="flex-1 text-xs">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log('Toast:', msg),
    };
  }
  return context;
};
