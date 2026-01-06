"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// Toast types
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Hook to use toast
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

// Convenience hooks
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (message: string, duration?: number) =>
      addToast("success", message, duration),
    error: (message: string, duration?: number) =>
      addToast("error", message, duration),
    info: (message: string, duration?: number) =>
      addToast("info", message, duration),
    warning: (message: string, duration?: number) =>
      addToast("warning", message, duration),
  };
}

// Provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Individual toast component
function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast.duration) return;

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration - 300);

    const removeTimer = setTimeout(() => {
      onDismiss();
    }, toast.duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const typeStyles: Record<ToastType, string> = {
    success:
      "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
    warning:
      "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  };

  const icons: Record<ToastType, ReactNode> = {
    success: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`
        pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg
        transition-all duration-300
        ${typeStyles[toast.type]}
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
      role="alert"
    >
      <span className="shrink-0">{icons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Container for all toasts
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 sm:bottom-4 sm:right-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}





