'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MapPin, CreditCard, ChevronRight } from 'lucide-react';

export default function CustomerDashboardOverview() {
  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end mb-8">
         <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Overview</h1>
      </div>

      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 md:gap-6 scrollbar-hide">
         {/* Metric Card */}
         <div className="w-[85%] sm:w-[300px] md:w-auto shrink-0 snap-center bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
               <Package className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Active Orders</p>
            <p className="text-3xl font-black text-neutral-900">2</p>
         </div>

         {/* Metric Card */}
         <div className="w-[85%] sm:w-[300px] md:w-auto shrink-0 snap-center bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
               <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Lifetime Spend</p>
            <p className="text-3xl font-black text-neutral-900">$3,450</p>
         </div>

         {/* Metric Card */}
         <div className="w-[85%] sm:w-[300px] md:w-auto shrink-0 snap-center bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
               <MapPin className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">Saved Addresses</p>
            <p className="text-3xl font-black text-neutral-900">1</p>
         </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm mt-8">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Recent Tracking</h2>
            <Link href="/account/orders" className="text-sm font-bold text-primary hover:underline">View all orders</Link>
         </div>
         
         {/* Active Order Line Item */}
         <div className="border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 transition-colors bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-neutral-400" />
               </div>
               <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Order #LP-84729</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                     <p className="text-xs font-semibold text-neutral-500">Processing at Facility</p>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                  <p className="text-xs text-neutral-500 font-medium">Estimated Delivery</p>
                  <p className="text-sm font-bold text-neutral-900">May 12, 2026</p>
               </div>
               <Link href="/account/orders/LP-84729" className="w-full md:w-auto px-4 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center justify-center gap-1">
                 Track <ChevronRight className="w-4 h-4" />
               </Link>
            </div>
         </div>
      </div>

    </div>
  );
}
