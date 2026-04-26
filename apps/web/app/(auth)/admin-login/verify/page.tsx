'use client'

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function VerifyContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || "Please check your email for a verification link to continue.";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[450px]"
    >
      <div className="bg-white p-8 w-full rounded-[20px] shadow-sm flex flex-col gap-2.5 text-center">
        
        <div className="w-16 h-16 bg-[#2d79f3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" viewBox="0 0 32 32" height="28" fill="#2d79f3"><path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z"></path></svg>
        </div>

        <h1 className="text-2xl font-bold text-[#151717] mb-2">Check Your Email</h1>
        
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          {message}
        </p>

        <div className="pt-4 border-t border-gray-100">
          <Link 
            href="/admin-login" 
            className="inline-flex items-center text-sm font-medium text-[#2d79f3] hover:underline transition-colors group justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-black">
      <Suspense fallback={
        <div className="w-full max-w-[450px] bg-white rounded-[20px] shadow-sm p-8 flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#2d79f3]/30 border-t-[#2d79f3] rounded-full animate-spin" />
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
