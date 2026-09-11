'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import { getCleanErrorMessage } from '../../../lib/error-utils';

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const isFormValid = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(getCleanErrorMessage(signInError, 'Unable to sign in. Please verify your credentials and try again.'));
        setIsLoading(false);
        return;
      }

      // Check user role for redirection
      const user = data.user;
      const role = user?.user_metadata?.role || user?.app_metadata?.role;

      if (role === 'admin') {
        const lastTab = localStorage.getItem('admin_last_tab');
        if (lastTab && lastTab.startsWith('/admin') && !lastTab.startsWith('/admin-login')) {
          window.location.href = lastTab;
        } else {
          window.location.href = '/admin';
        }
      } else if (next && next.startsWith('/')) {
        window.location.href = next;
      } else {
        window.location.href = '/';
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(getCleanErrorMessage(err, 'Unable to sign in. Please try again later.'));
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
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
        <h1 className="text-2xl font-bold text-center text-neutral-900 tracking-tight">
          Log in
        </h1>
        <p className="text-center text-sm text-neutral-700 mt-2 mb-6">
          No account?{' '}
          <Link href="/register" className="text-[#18113c] font-bold hover:underline">
            Sign up
          </Link>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-11 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-800 hover:text-neutral-950 cursor-pointer p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <Eye className="w-5 h-5 stroke-[2]" />
              ) : (
                <EyeOff className="w-5 h-5 stroke-[2]" />
              )}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-1 pb-2">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-neutral-900 hover:underline inline-block"
            >
              Forgot Your Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              isFormValid && !isLoading
                ? 'bg-[#18113c] hover:bg-[#251b5e] text-white active:scale-[0.99] cursor-pointer shadow-sm'
                : 'bg-[#dcdcdc] text-[#8e8e8e] cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              'Log in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-neutral-200/90 p-8 flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#18113c]/30 border-t-[#18113c] rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
