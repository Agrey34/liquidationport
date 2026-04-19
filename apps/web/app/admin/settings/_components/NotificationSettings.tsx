'use client';

import React from 'react';

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-neutral-900">Admin Email Alerts</h3>
        <p className="text-sm text-neutral-500 mb-4">Select which system events trigger an email to administrators.</p>
        
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
           <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                 <p className="text-sm font-bold text-neutral-900">New Order Received</p>
                 <p className="text-xs text-neutral-500">Sent immediately when a customer completes checkout.</p>
              </div>
              <button className="w-11 h-6 bg-emerald-500 rounded-full relative transition-colors cursor-pointer shrink-0 border border-emerald-600 shadow-inner">
                 <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
           </div>
           
           <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                 <p className="text-sm font-bold text-neutral-900">Low Stock Warning</p>
                 <p className="text-xs text-neutral-500">Sent when a product variant's stock drops to 0.</p>
              </div>
              <button className="w-11 h-6 bg-emerald-500 rounded-full relative transition-colors cursor-pointer shrink-0 border border-emerald-600 shadow-inner">
                 <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
           </div>

           <div className="flex items-center justify-between">
              <div>
                 <p className="text-sm font-bold text-neutral-900">Daily Digest</p>
                 <p className="text-xs text-neutral-500">A single summary email every morning covering sales and analytics.</p>
              </div>
              <button className="w-11 h-6 bg-neutral-200 rounded-full relative transition-colors cursor-pointer shrink-0 border border-neutral-300 shadow-inner">
                 <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
