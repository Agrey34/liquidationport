'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toastManager, ToastItem } from '@/lib/toast';

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((items) => {
      setToasts(items);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      aria-live="polite"
      role="region"
      aria-label="Notifications"
      className="fixed top-5 right-5 z-99999 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => {
          const isSuccess = item.type === 'success';
          const isError = item.type === 'error';
          const isWarning = item.type === 'warning';
          const isInfo = item.type === 'info';

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all flex items-start gap-3 bg-white/95 text-neutral-900 ${
                isSuccess
                  ? 'border-emerald-300 shadow-emerald-500/10'
                  : isError
                  ? 'border-rose-300 shadow-rose-500/10'
                  : isWarning
                  ? 'border-amber-300 shadow-amber-500/10'
                  : 'border-blue-300 shadow-blue-500/10'
              }`}
            >
              {/* Status Icon */}
              <div
                className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                    : isError
                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                    : isWarning
                    ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                    : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                {isError && <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
                {isWarning && <AlertTriangle className="w-5 h-5 stroke-[2.5]" />}
                {isInfo && <Info className="w-5 h-5 stroke-[2.5]" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-neutral-900 leading-snug">
                  {item.message}
                </p>
                {item.description && (
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => toastManager.dismiss(item.id)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
