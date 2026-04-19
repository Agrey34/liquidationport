'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, LogIn, ChevronRight } from 'lucide-react';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/account'; // Redirect to customer dashboard
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm flex">
         
         {/* Left Side: Form */}
         <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16">
            
            <div className="mb-10 text-center lg:text-left">
               <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Welcome Back</h1>
               <p className="text-neutral-500 font-medium">Log in to view your orders, saved pallets, and access your exclusive dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

               <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Password</label>
                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                     <Lock className="w-5 h-5 absolute left-4 top-3.5 text-neutral-400" />
                     <input 
                       type="password" 
                       required
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••" 
                       className="w-full pl-12 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all" 
                     />
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20 disabled:opacity-70 flex justify-center items-center gap-2 mt-4"
               >
                 {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>Log In <LogIn className="w-4 h-4" /></>
                 )}
               </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-neutral-600">
               Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Sign up for free</Link>
            </div>
         </div>

         {/* Right Side: Promo Cover */}
         <div className="hidden lg:block lg:w-1/2 relative bg-neutral-900">
            <Image 
              src="https://images.unsplash.com/photo-1586528116311-ad8ed745330e?q=80&w=1000&auto=format&fit=crop" 
              alt="Warehouse pallets" 
              fill 
              className="object-cover opacity-60 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-16">
               <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 w-max rounded-lg text-white text-xs font-bold uppercase tracking-wider mb-4">Buyer Portal</span>
               <h2 className="text-3xl font-black text-white leading-tight mb-2">Track real-time drops & exclusive deals.</h2>
               <p className="text-white/80 font-medium">Create your buyer profile to streamline checkout and securely receive fright notifications.</p>
            </div>
         </div>

      </div>
    </div>
  );
}
