'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import InternationalPhoneInput from '@/app/components/ui/InternationalPhoneInput';
import { apiFetch, ApiError } from '@/lib/api';
import { getCleanErrorMessage, isAccountConflictError } from '@/lib/error-utils';

export default function CustomerRegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountConflict, setAccountConflict] = useState<{
    isConflict: boolean;
    message: string;
    conflictField?: string;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
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
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (!isFormValid) return;

    try {
      setIsLoading(true);
      setError(null);
      setAccountConflict(null);
      setSuccessMsg(null);

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const combinedFullName = `${trimmedFirst} ${trimmedLast}`.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const standardizedPhone = phone.trim() || undefined;

      // STEP 1: Backend Pre-Flight Unique Account Verification (HTTP 409)
      try {
        await apiFetch('/auth/check-account', {
          method: 'POST',
          body: JSON.stringify({
            email: normalizedEmail,
            phone: standardizedPhone,
          }),
        });
      } catch (checkErr: any) {
        // Intercept HTTP 409 Conflict status or structured duplicate error
        if (
          checkErr?.status === 409 ||
          checkErr?.data?.status === 'error' ||
          checkErr?.message?.toLowerCase().includes('already associated') ||
          checkErr?.message?.toLowerCase().includes('already registered')
        ) {
          setAccountConflict({
            isConflict: true,
            message: checkErr?.data?.message || 'This email or phone number is already associated with an account.',
            conflictField: checkErr?.data?.conflictField,
          });
          setIsLoading(false);
          return;
        }
      }

      // STEP 2: Supabase Auth Creation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: combinedFullName,
            phone: standardizedPhone,
            role: 'customer',
          },
        },
      });

      if (signUpError) {
        if (isAccountConflictError(signUpError)) {
          setAccountConflict({
            isConflict: true,
            message: 'This email or phone number is already associated with an account.',
          });
        } else {
          setError(getCleanErrorMessage(signUpError, 'Unable to create account. Please try again shortly.'));
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        window.location.href = '/';
      } else {
        setSuccessMsg('Account created successfully! Please check your email to verify.');
        setIsLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      if (isAccountConflictError(err)) {
        setAccountConflict({
          isConflict: true,
          message: (err instanceof ApiError && err.data?.message) || 'This email or phone number is already associated with an account.',
        });
      } else {
        setError(getCleanErrorMessage(err, 'Registration failed. Please try again.'));
      }
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

        {/* Targeted Account Conflict Warning Banner */}
        {accountConflict?.isConflict && (
          <div className="mb-4 p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-950 text-xs shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-bold leading-snug">
                  {accountConflict.message}
                </p>
                <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                  <Link
                    href="/login"
                    className="font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    Log In instead &rarr;
                  </Link>
                  <span className="text-amber-300">•</span>
                  <Link
                    href="/forgot-password"
                    className="font-bold text-neutral-700 hover:text-neutral-950 underline underline-offset-2 cursor-pointer"
                  >
                    Reset Password
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="First name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone Number (International E.164) */}
          <div>
            <InternationalPhoneInput
              id="register-phone"
              value={phone}
              onChange={(e164, result) => {
                setPhone(e164);
                if (result.digits && !result.isValid) {
                  setPhoneError(result.error || 'Please enter a valid phone number.');
                } else {
                  setPhoneError(null);
                }
              }}
              error={phoneError}
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
