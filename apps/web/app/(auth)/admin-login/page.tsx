'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
      <div className="w-full max-w-[400px]">
        {/* Brand/Logo */}
        <div className="flex flex-col items-center justify-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="w-14 h-14 bg-neutral-900 text-white flex items-center justify-center rounded-2xl shadow-xl text-2xl font-black mb-4">
              LP
           </div>
           <h1 className="text-2xl font-black tracking-tight text-neutral-900">LiquidationPort</h1>
           <p className="text-sm text-neutral-500 font-semibold tracking-wide">ADMINISTRATIVE PORTAL</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
           <div className="p-8 space-y-6">
              
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

                 <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                       <label className="text-sm font-bold text-neutral-900">Password</label>
                    </div>
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
              </div>

              <button className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group">
                 Sign In to Dashboard
                 <i className="fi fi-rr-arrow-right transition-transform group-hover:translate-x-1" />
              </button>

           </div>
           
           <div className="bg-neutral-50 p-6 border-t border-neutral-100 flex items-center justify-center flex-col gap-2">
              <p className="text-xs text-neutral-500 font-medium">Secure connection protected by 256-bit encryption.</p>
              <div className="flex gap-1 text-emerald-600">
                 <i className="fi fi-rr-shield-check" />
              </div>
           </div>
        </div>
        
        <div className="mt-8 text-center animate-in fade-in duration-700 delay-300">
           <Link href="/" className="text-sm font-semibold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2">
              <i className="fi fi-rr-arrow-left" /> Return to Storefront
           </Link>
        </div>
      </div>
    </div>
  );
}
