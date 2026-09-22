"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Small confirmations, bottom-left, one line each. Used for "added to your
 * bag", "saved", "address removed". Never for errors that need a decision:
 * those belong inline, next to the thing that failed.
 */

interface Toast {
  id: number;
  message: string;
  tone: "neutral" | "success" | "error";
}

interface ToastContextValue {
  toast: (message: string, tone?: Toast["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: Toast["tone"] = "neutral") => {
      const id = (nextId.current += 1);
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-6 left-4 z-[70] flex flex-col gap-2 md:left-8"
      >
        {toasts.map((entry) => (
          <ToastRow key={entry.id} toast={entry} onDismiss={() => dismiss(entry.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const timer = setTimeout(onDismiss, 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 border border-stone bg-paper px-4 py-3 shadow-[0_1px_0_rgba(31,28,25,0.04)] transition-all duration-[240ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {toast.tone === "success" ? (
        <CheckIcon className="h-4 w-4 shrink-0 text-success" />
      ) : null}
      <p
        className={cn(
          "text-[0.8125rem]",
          toast.tone === "error" ? "text-danger" : "text-ink",
        )}
      >
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-2 text-taupe transition-colors hover:text-ink"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
