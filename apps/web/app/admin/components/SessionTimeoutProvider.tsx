'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '../../../lib/supabase/client';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMs?: number; // Time before warning (default 14 mins)
  warningMs?: number; // Warning modal duration (default 1 min)
}

export default function SessionTimeoutProvider({
  children,
  timeoutMs = 14 * 60 * 1000,
  warningMs = 60 * 1000,
}: SessionTimeoutProviderProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.round(warningMs / 1000));

  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track showWarning in a ref so the activity handler can read it
  // without causing the useEffect to re-run (which would kill the interval)
  const showWarningRef = useRef(false);

  const supabase = createClient();

  const clearAllTimers = useCallback(() => {
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error logging out during session timeout:', err);
    }
    window.location.href = '/admin-login?message=Session expired due to inactivity';
  }, [supabase, clearAllTimers]);

  const startWarningTimer = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Reset displayed countdown
    setTimeLeft(Math.round(warningMs / 1000));

    // Auto-logout after warningMs
    warningTimerRef.current = setTimeout(() => {
      handleLogout();
    }, warningMs);

    // Tick every second
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMs, handleLogout]);

  const startTimeoutTimer = useCallback(() => {
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    timeoutTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      showWarningRef.current = true;
      startWarningTimer();
    }, timeoutMs);
  }, [timeoutMs, startWarningTimer]);

  const handleResetTimeout = useCallback(() => {
    setShowWarning(false);
    showWarningRef.current = false;
    clearAllTimers();
    startTimeoutTimer();
  }, [clearAllTimers, startTimeoutTimer]);

  // Register activity listeners once — use ref to avoid re-runs when modal opens
  useEffect(() => {
    const handleActivity = () => {
      if (!showWarningRef.current) {
        startTimeoutTimer();
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));

    // Kick off initial idle timer
    startTimeoutTimer();

    return () => {
      clearAllTimers();
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [startTimeoutTimer, clearAllTimers]); // ← showWarning intentionally removed

  return (
    <>
      {children}

      {/* Premium Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 border border-neutral-200/50 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
              <i className="fi fi-rr-shield-exclamation text-3xl flex items-center justify-center shrink-0" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-neutral-900">Session Expiring Soon</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                You have been inactive for a while. For security reasons, your admin session will expire in{' '}
                <span className="font-semibold text-neutral-900">{timeLeft} seconds</span>.
              </p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors border border-neutral-200/60"
              >
                Log Out
              </button>
              <button
                onClick={handleResetTimeout}
                className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
