'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Package, Truck, Download, BellRing } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Only show confetti for 5 seconds to not annoy the user
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="flex justify-center mb-8">
         <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center -rotate-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 shadow-sm" />
         </div>
      </div>

      <div className="text-center mb-10">
        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-2">Order Confirmed</p>
        <h1 className="text-4xl font-black text-neutral-900 mb-4 tracking-tight">Thank You for Your Order!</h1>
        <p className="text-lg text-neutral-600 max-w-lg mx-auto">
           Your order <span className="font-bold text-neutral-900">#LP-84729</span> has been placed successfully. A confirmation email has been sent to <span className="font-semibold text-neutral-900">customer@example.com</span>.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
         <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
            <h2 className="font-bold text-neutral-900">Order Updates</h2>
         </div>
         <div className="p-6">
            <p className="text-sm text-neutral-600 mb-6">You will receive shipping and tracking updates via email. You can also track your order status live from your account.</p>
            
            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-neutral-100">
               <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm">
                     <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="pt-2">
                     <h4 className="text-sm font-bold text-neutral-900">Order Placed</h4>
                     <p className="text-xs text-neutral-500 mt-1">Payment successfully processed via Stripe.</p>
                  </div>
               </div>
               
               <div className="relative flex items-start gap-4 opacity-50 grayscale">
                  <div className="w-10 h-10 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center shrink-0 z-10">
                     <Package className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="pt-2">
                     <h4 className="text-sm font-bold text-neutral-900">Processing at Facility</h4>
                     <p className="text-xs text-neutral-500 mt-1">Pallets are being wrapped and secured for transit.</p>
                  </div>
               </div>

               <div className="relative flex items-start gap-4 opacity-50 grayscale">
                  <div className="w-10 h-10 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center shrink-0 z-10">
                     <Truck className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="pt-2">
                     <h4 className="text-sm font-bold text-neutral-900">Freight Shipped</h4>
                     <p className="text-xs text-neutral-500 mt-1">Carrier BOL and tracking will be provided.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
         <button className="px-6 py-4 bg-white border border-neutral-300 text-neutral-700 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-neutral-50 transition-colors">
            <Download className="w-4 h-4" /> Download Invoice
         </button>
         <Link href="/products" className="px-6 py-4 bg-neutral-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20 hover:-translate-y-0.5">
            Continue Shopping <ChevronRight className="w-4 h-4" />
         </Link>
      </div>

      <div className="mt-12 text-center">
         <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <BellRing className="w-4 h-4" /> Want SMS Updates? Track this order in your <Link href="/account" className="underline hover:text-blue-900">Dashboard</Link>.
         </div>
      </div>

    </div>
  );
}
