'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center justify-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="w-14 h-14 bg-neutral-900 text-white flex items-center justify-center rounded-2xl shadow-xl text-2xl font-black mb-4">
              LP
           </div>
           <h1 className="text-2xl font-black tracking-tight text-neutral-900">Create New Password</h1>
           <p className="text-sm text-neutral-500 font-semibold tracking-wide">SECURE YOUR ADMIN ACCOUNT</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
           <div className="p-8 space-y-6">
              
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-900">New Password</label>
                    <div className="relative">
                       <i className="fi fi-rr-lock absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 mt-0.5" />
                       <input 
                         type={showPassword ? 'text' : 'password'} 
                         placeholder="••••••••" 
                         className="w-full pl-11 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm transition-all tracking-widest font-mono"
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors mt-0.5"
                       >
                         {showPassword ? <i className="fi fi-rr-eye-crossed" /> : <i className="fi fi-rr-eye" />}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-sm font-bold text-neutral-900">Confirm New Password</label>
                    <div className="relative">
                       <i className="fi fi-rr-lock absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 mt-0.5" />
                       <input 
                         type={showConfirmPassword ? 'text' : 'password'} 
                         placeholder="••••••••" 
                         className="w-full pl-11 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm transition-all tracking-widest font-mono"
                       />
                       <button 
                         type="button"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors mt-0.5"
                       >
                         {showConfirmPassword ? <i className="fi fi-rr-eye-crossed" /> : <i className="fi fi-rr-eye" />}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-neutral-50 p-4 rounded-xl space-y-2 border border-neutral-100">
                 <p className="text-xs font-bold text-neutral-700">Password Requirements:</p>
                 <ul className="text-xs text-neutral-500 space-y-1 font-medium">
                    <li className="flex items-center gap-2"><i className="fi fi-rr-check text-emerald-500" /> Minimum 12 characters</li>
                    <li className="flex items-center gap-2"><i className="fi fi-rr-check text-neutral-300" /> At least one uppercase letter</li>
                    <li className="flex items-center gap-2"><i className="fi fi-rr-check text-neutral-300" /> At least one special character</li>
                 </ul>
              </div>

              <button 
                onClick={() => router.push('/admin-login')}
                className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                 Update Password
                 <i className="fi fi-rr-check transition-transform group-hover:scale-110" />
              </button>

           </div>
           
           <div className="bg-neutral-50 p-6 border-t border-neutral-100 flex items-center justify-center flex-col gap-2">
              <p className="text-xs text-neutral-500 font-medium">You will be required to re-authenticate after success.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
