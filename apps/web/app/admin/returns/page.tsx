'use client';

import React, { useState } from 'react';

const MOCK_RETURNS = [
  { id: 'RMA-9021', orderId: 'ORD-1204', customer: 'Sarah Jenkins', amount: 145.50, reason: 'Damaged in transit', date: '2025-05-12', status: 'Pending Review' },
  { id: 'RMA-8834', orderId: 'ORD-0932', customer: 'Marcus Teller', amount: 890.00, reason: 'Wrong item shipped', date: '2025-05-10', status: 'Approved' },
  { id: 'RMA-7721', orderId: 'ORD-0822', customer: 'Eleanor Rigby', amount: 25.00, reason: 'Changed mind', date: '2025-05-08', status: 'Rejected' },
];

export default function ReturnsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Returns & Refunds</h2>
          <p className="text-neutral-500 mt-1">Manage RMAs, process partial/full refunds, and handle disputes.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm w-full sm:w-auto justify-center">
              <i className="fi fi-rr-download" /> Export Log
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-neutral-500 mb-1">Pending Returns</p>
            <p className="text-2xl font-black text-neutral-900">12</p>
            <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1"><i className="fi fi-rr-arrow-trend-up" /> +3 this week</p>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-neutral-500 mb-1">Approved Returns</p>
            <p className="text-2xl font-black text-neutral-900">45</p>
            <p className="text-xs font-semibold text-emerald-500 mt-2 flex items-center gap-1"><i className="fi fi-rr-check-circle" /> Historical total</p>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-neutral-500 mb-1">Total Refunded</p>
            <p className="text-2xl font-black text-neutral-900">$12,450</p>
            <p className="text-xs font-semibold text-neutral-400 mt-2">YTD Output</p>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-neutral-500 mb-1">Avg Process Time</p>
            <p className="text-2xl font-black text-neutral-900">2.4 Days</p>
            <p className="text-xs font-semibold text-emerald-500 mt-2 flex items-center gap-1"><i className="fi fi-rr-arrow-trend-down" /> -0.5 days improved</p>
         </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
             <div className="relative">
                <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
                <input 
                   type="text" 
                   placeholder="Search RMAs or Orders..." 
                   className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all w-64"
                />
             </div>
             <div className="flex gap-2">
                <select className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900">
                   <option>All Statuses</option>
                   <option>Pending Review</option>
                   <option>Approved</option>
                   <option>Rejected</option>
                </select>
             </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
                     <tr>
                        <th className="px-6 py-4 font-bold">RMA ID</th>
                        <th className="px-6 py-4 font-bold">Order Ref</th>
                        <th className="px-6 py-4 font-bold">Customer</th>
                        <th className="px-6 py-4 font-bold">Reason</th>
                        <th className="px-6 py-4 font-bold">Amount</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                     {MOCK_RETURNS.map((ret, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50 transition-colors group">
                           <td className="px-6 py-4 font-bold text-neutral-900 font-mono">{ret.id}</td>
                           <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer">{ret.orderId}</td>
                           <td className="px-6 py-4 text-neutral-600 font-medium">{ret.customer}</td>
                           <td className="px-6 py-4 text-neutral-500 italic max-w-[200px] truncate" title={ret.reason}>{ret.reason}</td>
                           <td className="px-6 py-4 font-bold text-neutral-900">${ret.amount.toFixed(2)}</td>
                           
                           <td className="px-6 py-4">
                              {ret.status === 'Pending Review' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                                </span>
                              )}
                              {ret.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved
                                </span>
                              )}
                              {ret.status === 'Rejected' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Rejected
                                </span>
                              )}
                           </td>
                           
                           <td className="px-6 py-4 text-right">
                              <button className="px-3 py-1.5 bg-neutral-100 text-neutral-700 font-bold rounded-lg text-xs hover:bg-neutral-200 transition-colors">
                                 Process
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
