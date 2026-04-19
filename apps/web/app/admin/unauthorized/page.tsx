'use client';

import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
       <div className="w-24 h-24 bg-rose-50 rounded-full flex flex-col items-center justify-center mb-6 text-rose-500 shadow-sm border border-rose-100">
          <i className="fi fi-rr-ban text-4xl block mt-2"></i>
       </div>
       
       <h1 className="text-4xl font-black text-neutral-900 tracking-tight mb-3">Access Denied</h1>
       <p className="text-neutral-500 font-medium max-w-md mx-auto mb-8 text-sm leading-relaxed">
         You are attempting to access a secured administrative zone but your account lacks the necessary <strong className="text-neutral-900 border-b border-neutral-300 pb-0.5">Role-Based Access Control (RBAC)</strong> permissions.
       </p>
       
       <div className="flex gap-4">
          <Link href="/admin-login" className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl shadow-sm hover:bg-neutral-800 transition-colors text-sm flex items-center gap-2">
             <i className="fi fi-rr-arrow-left" /> Back to Login
          </Link>
          <Link href="/" className="px-6 py-3 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-xl shadow-sm hover:bg-neutral-50 transition-colors text-sm flex items-center gap-2">
             <i className="fi fi-rr-shop" /> Return to Storefront
          </Link>
       </div>

       <div className="mt-16 text-xs font-mono text-neutral-400 bg-neutral-100 px-4 py-2 rounded-lg border border-neutral-200">
         ERR_HTTP_403_FORBIDDEN • Auth Check Failed
       </div>
    </div>
  );
}
