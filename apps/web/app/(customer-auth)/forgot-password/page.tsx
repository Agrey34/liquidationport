'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
         
         <Link href="/login" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors mb-8">
            <ArrowLeft className="w-3 h-3" /> Back to log in
         </Link>

         {isSubmitted ? (
            <div className="text-center animate-in fade-in zoom-in duration-500 mb-4">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="w-7 h-7 text-emerald-500" />
               </div>
               <h1 className="text-2xl font-black text-neutral-900 mb-2">Check your email</h1>
               <p className="text-neutral-600 text-sm leading-relaxed mb-8">
                  We&apos;ve sent a password reset link to <br/>
                  <span className="font-bold text-neutral-900">{email}</span>
               </p>
               <button 
                 onClick={() => setIsSubmitted(false)}
                 className="text-sm font-bold text-neutral-500 hover:text-neutral-900 underline"
               >
                 Didn&apos;t receive the email? Click to try again
               </button>
            </div>
         ) : (
            <div className="animate-in fade-in duration-500">
               <div className="mb-8">
                  <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Reset Password</h1>
                  <p className="text-neutral-500 font-medium text-sm">Enter the email associated with your account and we&apos;ll send you a link to reset your password.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2">Email Address</label>
                     <div className="relative">
                        <Mail className="w-5 h-5 absolute left-4 top-3.5 text-neutral-400" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com" 
                          className="w-full pl-12 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all" 
                        />
                     </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading || !email}
                    className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20 disabled:opacity-70 mt-4"
                  >
                    {isLoading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                       "Send Reset Link"
                    )}
                  </button>
               </form>
            </div>
         )}
      </div>
    </div>
  );
}
