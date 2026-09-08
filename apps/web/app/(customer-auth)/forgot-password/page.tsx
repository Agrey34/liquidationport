'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Send, AlertCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

export default function CustomerForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const redirectTo = `${window.location.origin}/login?message=Check your email for reset instructions`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden p-6 sm:p-7 transition-all">
      {/* Header with Brand Logo & Close Icon */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-xl sm:text-[22px] font-black tracking-tight text-[#18113c] font-sans">
            Liquidation Port
          </span>
        </Link>
        <button
          type="button"
          onClick={handleClose}
          className="p-1 text-neutral-800 hover:text-neutral-500 rounded-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Content */}
      <div className="pt-6 pb-2">
        {isSubmitted ? (
          <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <Send className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">
              Check your email
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              We&apos;ve sent password reset instructions to <br />
              <strong className="text-neutral-900">{email}</strong>
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 px-4 bg-[#18113c] hover:bg-[#251b5e] text-white rounded-xl text-sm font-bold transition-all text-center"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-center text-neutral-900 tracking-tight mb-2">
              Forgot Password
            </h1>
            <p className="text-center text-sm text-neutral-600 mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
                />
              </div>

              <div className="text-center pt-1 pb-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-neutral-900 hover:underline inline-block"
                >
                  Remember your password? Log in
                </Link>
              </div>

              <button
                type="submit"
                disabled={!email.trim() || isLoading}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  email.trim() && !isLoading
                    ? 'bg-[#18113c] hover:bg-[#251b5e] text-white active:scale-[0.99] cursor-pointer shadow-sm'
                    : 'bg-[#dcdcdc] text-[#8e8e8e] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
