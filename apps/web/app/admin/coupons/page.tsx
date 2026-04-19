'use client';

import React, { useState } from 'react';

const MOCK_COUPONS = [
  { id: '1', code: 'SUMMER2025', type: 'percentage', discount: 15, usageLimit: 1000, used: 450, expires: '2025-08-31', status: 'Active' },
  { id: '2', code: 'WELCOME10', type: 'fixed', discount: 10, usageLimit: null, used: 2150, expires: null, status: 'Active' },
  { id: '3', code: 'FLASH50', type: 'percentage', discount: 50, usageLimit: 100, used: 100, expires: '2024-11-25', status: 'Expired' },
];

export default function CouponsPage() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [discountType, setDiscountType] = useState('percentage');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Discounts & Coupons</h2>
          <p className="text-neutral-500 mt-1">Manage promotional codes, pricing rules, and limits.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm w-full sm:w-auto justify-center">
              <i className="fi fi-rr-ticket" /> Generate Coupon
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Active Promotions</p>
               <p className="text-3xl font-black text-neutral-900">2</p>
            </div>
            <div className="text-emerald-500 shrink-0 opacity-80 flex items-center justify-center">
               <i className="fi fi-rr-badge-percent text-4xl" />
            </div>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Total Usage Count</p>
               <p className="text-3xl font-black text-neutral-900">2,700</p>
            </div>
            <div className="text-blue-500 shrink-0 opacity-80 flex items-center justify-center">
               <i className="fi fi-rr-shopping-cart-check text-4xl" />
            </div>
         </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
             <div className="relative">
                <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
                <input 
                   type="text" 
                   placeholder="Search codes..." 
                   className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all w-64"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
                     <tr>
                        <th className="px-6 py-4 font-bold">Code</th>
                        <th className="px-6 py-4 font-bold">Discount</th>
                        <th className="px-6 py-4 font-bold">Usage</th>
                        <th className="px-6 py-4 font-bold">Expires</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                     {MOCK_COUPONS.map(coupon => (
                        <tr key={coupon.id} className="hover:bg-neutral-50/50 transition-colors group">
                           <td className="px-6 py-4 font-bold text-neutral-900 font-mono text-base">{coupon.code}</td>
                           <td className="px-6 py-4 font-medium text-neutral-900">
                              {coupon.type === 'percentage' ? `${coupon.discount}% off` : `$${coupon.discount} off`}
                           </td>
                           <td className="px-6 py-4 text-neutral-500">
                              {coupon.used} / {coupon.usageLimit || '∞'}
                           </td>
                           <td className="px-6 py-4 text-neutral-500">
                              {coupon.expires ? new Date(coupon.expires).toLocaleDateString() : 'Never'}
                           </td>
                           <td className="px-6 py-4">
                              {coupon.status === 'Active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Expired
                                </span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Create Coupon Drawer */}
      {isDrawerOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-full shadow-2xl relative animate-in slide-in-from-right duration-300 flex flex-col">
               <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                  <h3 className="text-lg font-bold text-neutral-900">Generate Coupon</h3>
                  <button onClick={() => setDrawerOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100">
                     <i className="fi fi-rr-cross-small text-xl flex" />
                  </button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">Discount Code</label>
                     <div className="flex gap-2">
                         <input type="text" placeholder="e.g. VIP2025" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono uppercase" />
                         <button className="px-4 bg-white border border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shrink-0">
                            Auto
                         </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-sm font-semibold text-neutral-900">Discount Type</label>
                     <div className="grid grid-cols-2 gap-3">
                         <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${discountType === 'percentage' ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-300'}`} onClick={() => setDiscountType('percentage')}>
                             <i className={`fi fi-rr-percentage text-xl ${discountType === 'percentage' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                             <span className={`text-sm font-bold ${discountType === 'percentage' ? 'text-neutral-900' : 'text-neutral-500'}`}>Percentage</span>
                         </label>
                         <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${discountType === 'fixed' ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-300'}`} onClick={() => setDiscountType('fixed')}>
                             <i className={`fi fi-rr-dollar text-xl ${discountType === 'fixed' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                             <span className={`text-sm font-bold ${discountType === 'fixed' ? 'text-neutral-900' : 'text-neutral-500'}`}>Fixed Amount</span>
                         </label>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">Discount Value</label>
                     <div className="relative">
                        {discountType === 'fixed' && <i className="fi fi-rr-dollar text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />}
                        {discountType === 'percentage' && <i className="fi fi-rr-percentage text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 mt-0.5" />}
                        <input type="number" placeholder="0.00" className={`w-full py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono ${discountType === 'fixed' ? 'pl-8 pr-3' : 'pl-3 pr-8'}`} />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                         <label className="text-sm font-semibold text-neutral-900">Usage Limit</label>
                         <input type="number" placeholder="100" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-sm font-semibold text-neutral-900">Expires At</label>
                         <input type="date" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono" />
                      </div>
                  </div>
               </div>

               <div className="p-6 bg-neutral-50 border-t border-neutral-100 shrink-0">
                  <button onClick={() => setDrawerOpen(false)} className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold shadow-sm hover:bg-neutral-800 transition-colors">
                     Create Coupon
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
