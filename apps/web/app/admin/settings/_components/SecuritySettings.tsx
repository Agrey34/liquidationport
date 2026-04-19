'use client';

import React from 'react';

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-neutral-900">Authentication & Access</h3>
        <p className="text-sm text-neutral-500 mb-4">Global security controls for dashboard access.</p>
        
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5">
           
           <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <i className="fi fi-rr-shield-check text-neutral-500" />
                    <p className="text-sm font-bold text-neutral-900">Two-Factor Authentication (2FA)</p>
                 </div>
                 <p className="text-xs text-neutral-500 max-w-sm">Require all Admin and Super Admin roles to enable 2FA via an authenticator app.</p>
              </div>
              <button className="w-11 h-6 bg-emerald-500 rounded-full relative transition-colors cursor-pointer shrink-0 border border-emerald-600 shadow-inner">
                 <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
           </div>
           
           <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <i className="fi fi-rr-clock-three text-neutral-500" />
                    <p className="text-sm font-bold text-neutral-900">Session Timeout</p>
                 </div>
                 <p className="text-xs text-neutral-500 max-w-sm">Automatically log out idle administrative users after a set duration.</p>
              </div>
              <div className="flex items-center gap-2">
                 <select className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm appearance-none pr-8 relative">
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="240">4 Hours</option>
                 </select>
              </div>
           </div>

           <div className="flex items-center justify-between">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <i className="fi fi-rr-globe text-neutral-500" />
                    <p className="text-sm font-bold text-neutral-900">IP Allowlist Restriction</p>
                 </div>
                 <p className="text-xs text-neutral-500 max-w-sm">Restrict admin dashboard access to specific trusted IP addresses or CIDR blocks.</p>
              </div>
              <button className="px-4 py-1.5 bg-white border border-neutral-200 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors">
                  Configure
              </button>
           </div>

        </div>
      </div>

    </div>
  );
}
