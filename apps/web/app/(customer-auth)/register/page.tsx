'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Building2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/login'); // Redirect to login on success
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setFormData({...formData, [e.target.name]: e.target.value});
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-5xl bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm flex flex-row-reverse">
         
         {/* Right Side: Form (Reversed layout from login) */}
         <div className="w-full lg:w-1/2 p-8 sm:p-12">
            
            <div className="mb-8 text-center lg:text-left">
               <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Create Account</h1>
               <p className="text-neutral-500 font-medium text-sm">Join Liquidation Port today to access exclusive pallets, track shipments, and manage your invoices.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">First Name</label>
                     <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                        <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all text-sm" placeholder="Dennis" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Last Name</label>
                     <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                        <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all text-sm" placeholder="Smith" />
                     </div>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Company <span className="text-neutral-400 font-normal lowercase">(Optional)</span></label>
                  <div className="relative">
                     <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                     <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all text-sm" placeholder="Your LLC" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                     <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                     <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all text-sm" placeholder="you@example.com" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                     <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
                     <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all text-sm" placeholder="••••••••" />
                  </div>
               </div>
               
               <div className="pt-2">
                 <label className="flex items-start gap-3 mt-4">
                    <input type="checkbox" required className="w-4 h-4 mt-0.5 text-primary rounded border-neutral-300 focus:ring-primary shrink-0" />
                    <span className="text-xs text-neutral-600 leading-relaxed">
                       I agree to the <Link href="/terms" className="text-primary font-bold hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-primary font-bold hover:underline">Privacy Policy</Link>. I understand that all liquidation sales are final and items are sold AS-IS.
                    </span>
                 </label>
               </div>

               <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-primary/30 disabled:opacity-70 flex justify-center items-center gap-2 mt-6"
               >
                 {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>Create Account <UserPlus className="w-4 h-4" /></>
                 )}
               </button>
            </form>

            <div className="mt-6 text-center text-sm font-medium text-neutral-600">
               Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link>
            </div>
         </div>

         {/* Left Side: Promo Cover */}
         <div className="hidden lg:block lg:w-1/2 relative bg-primary">
            <Image 
              src="https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=1000&auto=format&fit=crop" 
              alt="Inventory" 
              fill 
              className="object-cover opacity-30 mix-blend-overlay"
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
