'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center justify-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="w-14 h-14 bg-neutral-900 text-white flex items-center justify-center rounded-2xl shadow-xl text-2xl font-black mb-4">
              LP
           </div>
           <h1 className="text-2xl font-black tracking-tight text-neutral-900">Account Recovery</h1>
           <p className="text-sm text-neutral-500 font-semibold tracking-wide">RESET ADMINISTRATOR PASSWORD</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
           
           {!submitted ? (
             <div className="p-8 space-y-6">
                <div className="text-center space-y-2 mb-2">
                   <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fi fi-rr-unlock text-2xl text-amber-600"></i>
                   </div>
                   <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                     Enter the email address associated with your administrative account to receive a secure reset link.
                   </p>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-sm font-bold text-neutral-900">Email Address</label>
                      <div className="relative">
                         <i className="fi fi-rr-envelope absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 mt-0.5" />
                         <input 
                           type="email" 
                           placeholder="admin@liqport.com" 
                           className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm transition-all"
                         />
                      </div>
                   </div>
                </div>

                <button 
                   onClick={() => setSubmitted(true)}
                   className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                   Send Reset Link
                   <i className="fi fi-rr-paper-plane transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </button>
             </div>
           ) : (
             <div className="p-8 space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                   <i className="fi fi-rr-envelope-open text-3xl text-emerald-600"></i>
                </div>
                <div>
                   <h2 className="text-xl font-bold text-neutral-900 mb-2">Check your inbox</h2>
                   <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                     We've sent password reset instructions to your email address. It may take a few minutes to arrive.
                   </p>
                </div>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="w-full py-3.5 bg-white border border-neutral-200 text-neutral-900 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-all duration-200"
                >
                   Try another email address
                </button>
             </div>
           )}

           <div className="bg-neutral-50 p-6 border-t border-neutral-100 flex items-center justify-center flex-col gap-2">
              <p className="text-xs text-neutral-500 font-medium">If you lost access to your email, contact Super Admin.</p>
           </div>
        </div>
        
        <div className="mt-8 text-center animate-in fade-in duration-700 delay-300">
           <Link href="/admin-login" className="text-sm font-semibold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2">
              <i className="fi fi-rr-arrow-left" /> Back to Login
           </Link>
        </div>
      </div>
    </div>
  );
}
