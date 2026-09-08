'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

export default function CustomerRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword &&
    agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Use and Privacy Policy.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isFormValid) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      const trimmedName = fullName.trim();
      const nameParts = trimmedName.split(' ');
      const firstName = nameParts[0] || trimmedName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: trimmedName,
            first_name: firstName,
            last_name: lastName,
            phone: phone.trim() || undefined,
            role: 'customer',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = '/account';
      } else {
        setSuccessMsg('Account created successfully! Please check your email to verify.');
        setIsLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
      <div className="pt-4 pb-2">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-4">
          Sign up
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div>
            <input
              type="text"
              placeholder="Full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
            />
          </div>

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

          {/* Password Confirmation */}
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Password confirmation"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-11 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-800 hover:text-neutral-950 cursor-pointer p-0.5"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <Eye className="w-5 h-5 stroke-[2]" />
              ) : (
                <EyeOff className="w-5 h-5 stroke-[2]" />
              )}
            </button>
          </div>

          {/* Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 rounded border-2 border-neutral-900 text-[#18113c] focus:ring-0 cursor-pointer accent-[#18113c]"
              />
              <span className="text-xs text-neutral-800 leading-snug">
                I agree to{' '}
                <Link href="/terms" className="text-blue-700 hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="text-blue-700 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Already have an account */}
          <div className="text-center pt-2 pb-2">
            <span className="text-xs text-neutral-800">Already have an account? </span>
            <Link href="/login" className="text-xs font-bold text-[#18113c] hover:underline">
              Log in
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
              "Let's GO"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
