/**
 * Unified Toast - Single Source of Truth for All Notifications
 * 
 * Consolidates: Toast, PremiumToast, SmartNotificationCenter
 * Features: Intelligent positioning, viral sharing, performance optimization
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";

interface ToastData {
  id: string;
  type: "success" | "error" | "warning" | "info" | "achievement";
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  shareData?: {
    title: string;
    text: string;
    url?: string;
  };
  icon?: ReactNode;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, "id">) => {
    // id generation is impure but only runs when a toast is dispatched
    // (event-driven, not during render). The crypto.randomUUID branch
    // is preferred; Math.random is the SSR-safe fallback.
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : // eslint-disable-next-line react-hooks/purity
          Math.random().toString(36).slice(2, 11);
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === "error" ? 6000 : 4000),
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration (unless persistent)
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Individual Toast Component
function Toast({ toast, onRemove }: { toast: ToastData; onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleShare = async () => {
    if (!toast.shareData) return;

    if ("share" in navigator) {
      try {
        await navigator.share({
          title: toast.shareData.title,
          text: toast.shareData.text,
          url: toast.shareData.url || window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        const shareText = `${toast.shareData.title}\n${toast.shareData.text}\n${toast.shareData.url || window.location.href}`;
        navigator.clipboard?.writeText(shareText);
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300); // Wait for exit animation
  };

  // Type-specific styling
  const getTypeStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-green-500/90 to-emerald-500/90",
          border: "border-green-400/50",
          icon: "✅",
        };
      case "error":
        return {
          bg: "bg-gradient-to-r from-red-500/90 to-pink-500/90",
          border: "border-red-400/50",
          icon: "❌",
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-yellow-500/90 to-orange-500/90",
          border: "border-yellow-400/50",
          icon: "⚠️",
        };
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-500/90 to-cyan-500/90",
          border: "border-blue-400/50",
          icon: "ℹ️",
        };
      case "achievement":
        return {
          bg: "bg-gradient-to-r from-violet-500/90 to-gold-500/90",
          border: "border-violet-400/50",
          icon: "🏆",
        };
      default:
        return {
          bg: "bg-white/10",
          border: "border-white/20",
          icon: "📢",
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative max-w-sm w-full rounded-xl border backdrop-blur-xl",
        "shadow-lg shadow-black/20 overflow-hidden",
        styles.bg,
        styles.border
      )}
    >
      {/* Progress bar for timed toasts */}
      {!toast.persistent && toast.duration && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-white/30"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: toast.duration / 1000, ease: "linear" }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 text-xl">
            {toast.icon || styles.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="font-semibold text-white mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-white/90 leading-relaxed">
              {toast.message}
            </p>

            {/* Actions */}
            {(toast.action || toast.shareData) && (
              <div className="flex gap-2 mt-3">
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    {toast.action.label}
                  </button>
                )}
                {toast.shareData && (
                  <button
                    onClick={handleShare}
                    className="px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>📤</span>
                    Share
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-white/60 hover:text-white/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Toast Container Component
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Convenience hooks for common toast types
export function useSuccessToast() {
  const { addToast } = useToast();

  return (message: string, options?: Partial<ToastData>) => {
    return addToast({
      type: "success",
      message,
      ...options,
    });
  };
}

export function useErrorToast() {
  const { addToast } = useToast();

  return (message: string, options?: Partial<ToastData>) => {
    return addToast({
      type: "error",
      message,
      ...options,
    });
  };
}

export function useAchievementToast() {
  const { addToast } = useToast();

  return (message: string, shareData?: ToastData["shareData"]) => {
    return addToast({
      type: "achievement",
      title: "Achievement Unlocked!",
      message,
      shareData,
      duration: 6000,
    });
  };
}

/**
 * Stable callback for callers that only need to push toasts (no read of the list).
 * Returns a function with the same signature as the legacy useUIStore().addToast.
 * Must be used inside <ToastProvider>, which wraps every page in the root layout.
 */
export function useAddToast() {
  const { addToast } = useToast();
  return (toast: {
    type: ToastData["type"];
    message: string;
    title?: string;
    duration?: number;
    action?: ToastData["action"];
  }) =>
    addToast({
      type: toast.type,
      message: toast.message,
      title: toast.title,
      duration: toast.duration,
      action: toast.action,
    });
}

// Export the main components
export { ToastContainer };
export default ToastProvider;