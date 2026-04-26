'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { updatePassword } from '../../../auth/actions';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[450px]"
      >
        <div className="bg-white p-8 w-full rounded-[20px] shadow-sm flex flex-col gap-2.5">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-[#151717]">Create New Password</h1>
            <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
              Your identity has been verified. Please enter your new password below.
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
              <label className="text-[#151717] font-semibold text-sm">New Password</label>
              <div className="border-[1.5px] border-[#ecedec] rounded-[10px] h-[50px] flex items-center pl-3 transition-colors duration-200 focus-within:border-[#2d79f3]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="-64 0 512 512" height="20" fill="#a0a0a0"><path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"></path><path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"></path></svg>        
                <input
                  name="password"
                  required
                  placeholder="Min. 8 characters"
                  className="ml-2.5 rounded-[10px] border-none w-full h-full focus:outline-none bg-transparent text-sm placeholder:text-neutral-400 text-black"
                  type="password"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#151717] font-semibold text-sm">Confirm New Password</label>
              <div className="border-[1.5px] border-[#ecedec] rounded-[10px] h-[50px] flex items-center pl-3 transition-colors duration-200 focus-within:border-[#2d79f3]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="-64 0 512 512" height="20" fill="#a0a0a0"><path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"></path><path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0"></path></svg>        
                <input
                  name="confirmPassword"
                  required
                  placeholder="Repeat new password"
                  className="ml-2.5 rounded-[10px] border-none w-full h-full focus:outline-none bg-transparent text-sm placeholder:text-neutral-400 text-black"
                  type="password"
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
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
