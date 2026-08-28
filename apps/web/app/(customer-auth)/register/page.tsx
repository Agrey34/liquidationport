'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Building2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
     firstName: '',
     lastName: '',
     company: '',
     email: '',
     password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleOAuthSignUp = async (provider: 'google' | 'apple') => {
    try {
      setOauthLoading(provider);
      setError(null);
      const redirectTo = `${window.location.origin}/auth/callback?next=/account`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(null);
      }
    } catch (err: unknown) {
      console.error(`OAuth ${provider} error:`, err);
      setError(err instanceof Error ? err.message : `Failed to sign up with ${provider}.`);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: fullName,
            company: formData.company.trim(),
            role: 'customer',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        // Automatically signed in
        router.push('/account');
      } else {
        // Confirmation email sent
        setSuccessMsg('Account created! Please check your email to confirm your account, or sign in.');
        setIsLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-5xl bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm flex flex-row-reverse">
         
         {/* Right Side: Form */}
         <div className="w-full lg:w-1/2 p-8 sm:p-12">
            
            <div className="mb-6 text-center lg:text-left">
               <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Create Account</h1>
               <p className="text-neutral-500 font-medium text-sm">Join Liquidation Port to access exclusive wholesale pallets, track freight, and manage invoices.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Social OAuth Sign Up Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignUp('google')}
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 px-4 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 rounded-xl font-bold text-neutral-800 text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {oauthLoading === 'google' ? (
                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignUp('apple')}
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {oauthLoading === 'apple' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.84 1.45-.58.67-1.1 1.77-.96 2.82 1.12.09 2.22-.55 2.84-1.32" />
                    </svg>
                    <span>Apple</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-neutral-200 w-full" />
              <span className="bg-white px-3 text-xs font-bold text-neutral-400 uppercase tracking-wider shrink-0">or sign up with email</span>
              <div className="border-t border-neutral-200 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">First Name</label>
                     <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                        <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:bg-white focus:outline-none transition-all text-sm" placeholder="Dennis" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Last Name</label>
                     <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                        <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:bg-white focus:outline-none transition-all text-sm" placeholder="Smith" />
                     </div>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Company <span className="text-neutral-400 font-normal lowercase">(Optional)</span></label>
                  <div className="relative">
                     <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                     <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:bg-white focus:outline-none transition-all text-sm" placeholder="Your Company LLC" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                     <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                     <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:bg-white focus:outline-none transition-all text-sm" placeholder="you@example.com" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                     <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                     <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:bg-white focus:outline-none transition-all text-sm" placeholder="••••••••" />
                  </div>
               </div>
               
               <div className="pt-2">
                 <label className="flex items-start gap-3 mt-2">
                    <input type="checkbox" required className="w-4 h-4 mt-0.5 text-neutral-900 rounded border-neutral-300 focus:ring-neutral-900 shrink-0" />
                    <span className="text-xs text-neutral-600 leading-relaxed">
                       I agree to the <Link href="/terms" className="text-neutral-900 font-bold hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-neutral-900 font-bold hover:underline">Privacy Policy</Link>. I understand that liquidation sales are sold as manifested.
                    </span>
                 </label>
               </div>

               <button 
                 type="submit" 
                 disabled={isLoading || oauthLoading !== null}
                 className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20 disabled:opacity-70 flex justify-center items-center gap-2 mt-4 cursor-pointer"
               >
                 {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>Create Account <UserPlus className="w-4 h-4" /></>
                 )}
               </button>
            </form>

            <div className="mt-6 text-center text-sm font-medium text-neutral-600">
               Already have an account? <Link href="/login" className="text-neutral-900 font-bold hover:underline">Log in</Link>
            </div>
         </div>

         {/* Left Side: Promo Cover */}
         <div className="hidden lg:block lg:w-1/2 relative bg-neutral-900">
            <Image 
              src="https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=1000&auto=format&fit=crop" 
              alt="Inventory" 
              fill 
              className="object-cover opacity-40 mix-blend-overlay"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
            />
            <div className="absolute inset-0 flex flex-col justify-center p-16 text-white">
               
               <div className="space-y-8">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                        <i className="fi fi-rr-tags text-xl"></i>
                     </div>
                     <div>
                        <h3 className="font-bold text-lg mb-1">Direct from Retailers</h3>
                        <p className="text-white/70 text-sm leading-relaxed">Access authentic overstock and returns from top-tier brands and big-box store liquidations.</p>
                     </div>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                        <i className="fi fi-rr-document text-xl"></i>
                     </div>
                     <div>
                        <h3 className="font-bold text-lg mb-1">Detailed Manifests</h3>
                        <p className="text-white/70 text-sm leading-relaxed">Know what you are buying with comprehensive break-downs of lot contents, original MSRPs, and condition grades.</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                        <i className="fi fi-rr-truck-side text-xl"></i>
                     </div>
                     <div>
                        <h3 className="font-bold text-lg mb-1">Streamlined Freight</h3>
                        <p className="text-white/70 text-sm leading-relaxed">We orchestrate the logistics. Choose calculated LTL freight at checkout or arrange your own carrier.</p>
                     </div>
                  </div>
               </div>

            </div>
         </div>

      </div>
    </div>
  );
}
