'use client';

import React, { useState } from 'react';

const MOCK_REVIEWS = [
  { id: '1', product: 'Premium Home Tools Pallet', user: 'jack.thompson@gmail.com', rating: 5, comment: "Excellent condition, highly profitable pallet.", date: '2025-05-15', status: 'Pending' },
  { id: '2', product: 'Refurbished Laptops Batch', user: 'sarah.m@retailx.com', rating: 2, comment: "Several units were missing chargers despite the manifest stating otherwise.", date: '2025-05-14', status: 'Pending' },
  { id: '3', product: 'Assorted Summer Apparel', user: 'boutique_owner12@yahoo.com', rating: 5, comment: "Fast shipping and great quality.", date: '2025-05-12', status: 'Approved' },
  { id: '4', product: 'Returns: Small Electronics', user: 'spam_bot88@tempmail.org', rating: 1, comment: "CLICK HERE FOR FREE IPHONE -> http://spam.link", date: '2025-05-10', status: 'Rejected' },
];

export default function ReviewsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Review Moderation</h2>
          <p className="text-neutral-500 mt-1">Approve, reject, or reply to customer product feedback.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Needs Review</p>
               <p className="text-2xl font-black text-rose-500">2</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
               <i className="fi fi-rr-comment-alt-middle text-2xl" />
            </div>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Average Store Rating</p>
               <p className="text-2xl font-black text-neutral-900 flex items-baseline gap-1">4.6 <span className="text-sm font-semibold text-neutral-400">/ 5.0</span></p>
            </div>
            <div className="text-amber-400 flex text-lg">
               <i className="fi fi-sr-star" /><i className="fi fi-sr-star" /><i className="fi fi-sr-star" /><i className="fi fi-sr-star" /><i className="fi fi-rs-star-half" />
            </div>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Auto-Reject Rate</p>
               <p className="text-2xl font-black text-neutral-900">4.2%</p>
            </div>
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500">
               <i className="fi fi-rr-shield-check text-2xl" />
            </div>
         </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
             <div className="flex gap-2">
                <select className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900">
                   <option>Pending Moderation</option>
                   <option>Approved</option>
                   <option>Rejected</option>
                   <option>All Reviews</option>
                </select>
             </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
                     <tr>
                        <th className="px-6 py-4 font-bold">Product</th>
                        <th className="px-6 py-4 font-bold">Rating</th>
                        <th className="px-6 py-4 font-bold w-1/3">Review Comment</th>
                        <th className="px-6 py-4 font-bold">User</th>
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold text-right">Moderation</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                     {MOCK_REVIEWS.map((review, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50 transition-colors group">
                           <td className="px-6 py-4 font-bold text-neutral-900 truncate max-w-[200px]">{review.product}</td>
                           <td className="px-6 py-4">
                              <div className="flex gap-0.5 text-amber-400">
                                 {Array.from({ length: 5 }).map((_, i) => (
                                   <i key={i} className={`fi ${i < review.rating ? 'fi-sr-star' : 'fi-rr-star text-neutral-300'}`} />
                                 ))}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-neutral-600 italic">{review.comment}</td>
                           <td className="px-6 py-4 text-neutral-500 text-xs truncate max-w-[150px]">{review.user}</td>
                           <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">{review.date}</td>
                           
                           <td className="px-6 py-4 text-right">
                              {review.status === 'Pending' ? (
                                <div className="flex justify-end gap-2">
                                   <button className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors flex items-center justify-center border border-emerald-200">
                                      <i className="fi fi-rr-check" />
                                   </button>
                                   <button className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors flex items-center justify-center border border-rose-200">
                                      <i className="fi fi-rr-cross" />
                                   </button>
                                </div>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${review.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                   {review.status}
                                </span>
                              )}
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
