'use client';

import React from 'react';

export function PaymentSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-neutral-900">Payment Processors</h3>
        <p className="text-sm text-neutral-500 mb-4">Configure your Stripe integration and webhook handlers.</p>
        
        <div className="bg-white border border-neutral-200 rounded-2xl p-6">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <i className="fi fi-rr-credit-card text-xl" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-neutral-900">Stripe Standard</h4>
                    <p className="text-xs text-neutral-500">Connected to liqport_llc</p>
                 </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
              </div>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Publishable Key</label>
                 <input type="text" defaultValue="pk_live_51O..." readOnly className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 text-sm font-mono cursor-not-allowed" />
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Secret Key</label>
                 <div className="flex gap-2">
                    <input type="password" defaultValue="sk_live_51O..." readOnly className="w-full flex-1 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 text-sm font-mono cursor-not-allowed" />
                    <button className="px-4 bg-white border border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shrink-0">
                       Reveal
                    </button>
                    <button className="px-4 bg-white border border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shrink-0 text-rose-600">
                       Revoke
                    </button>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Webhook Secret</label>
                 <input type="password" defaultValue="whsec_..." readOnly className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 text-sm font-mono cursor-not-allowed" />
                 <p className="text-xs text-neutral-500 mt-1">Endpoint: https://api.liquidationport.com/v1/webhooks/stripe</p>
              </div>
           </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-neutral-900">Checkout Preferences</h3>
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 mt-4 space-y-4">
           {/* Mock Toggle switches */}
           <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                 <p className="text-sm font-bold text-neutral-900">Require Billing Address</p>
                 <p className="text-xs text-neutral-500">Collect full billing address during checkout to reduce fraud.</p>
              </div>
              <button className="w-11 h-6 bg-emerald-500 rounded-full relative transition-colors cursor-pointer shrink-0 border border-emerald-600 shadow-inner">
                 <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
           </div>
           
           <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                 <p className="text-sm font-bold text-neutral-900">Enable Apple Pay / Google Pay</p>
                 <p className="text-xs text-neutral-500">Allow customers to pay via mobile wallets.</p>
              </div>
              <button className="w-11 h-6 bg-emerald-500 rounded-full relative transition-colors cursor-pointer shrink-0 border border-emerald-600 shadow-inner">
                 <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
           </div>

           <div className="flex items-center justify-between">
              <div>
                 <p className="text-sm font-bold text-neutral-900">Capture Payments Automatically</p>
                 <p className="text-xs text-neutral-500">If disabled, payments will be authorized but you must manually capture them within 7 days.</p>
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
