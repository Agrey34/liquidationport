'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { resetPasswordForEmail } from '../../../auth/actions';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await resetPasswordForEmail(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[450px]"
      >
        <div className="bg-white p-8 w-full rounded-[20px] shadow-sm flex flex-col gap-2.5">
          <Link href="/admin-login" className="inline-flex items-center text-sm text-neutral-500 hover:text-[#2d79f3] transition-colors mb-4 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>

          <div className="mb-4 text-left">
            <h1 className="text-2xl font-bold text-[#151717]">Reset Password</h1>
            <p className="text-neutral-500 text-sm mt-2 leading-relaxed">
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2 flex items-center"
            >
              <span className="text-red-600 text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[#151717] font-semibold text-sm">Email Address</label>
              <div className="border-[1.5px] border-[#ecedec] rounded-[10px] h-[50px] flex items-center pl-3 transition-colors duration-200 focus-within:border-[#2d79f3]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 32 32" height="20" fill="#a0a0a0"><path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z"></path></svg>
                <input
                  name="email"
                  required
                  placeholder="admin@liquidation.com"
                  className="ml-2.5 rounded-[10px] border-none w-full h-full focus:outline-none bg-transparent text-sm placeholder:text-neutral-400 text-black"
                  type="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 mb-2 bg-[#151717] border-none text-white text-[15px] font-medium rounded-[10px] h-[50px] w-full cursor-pointer transition-colors hover:bg-black disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
