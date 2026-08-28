'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

export function GeneralSettings() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-neutral-900">Store Profile</h3>
        <p className="text-sm text-neutral-500 mb-4">Manage your store&apos;s public information and contact details.</p>
        
        <div className="bg-white border text-center border-neutral-200 rounded-2xl p-6  min-h-[200px]">
           <div className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">Store Name</label>
                     <input type="text" defaultValue="LiquidationPort" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm transition-all" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">Admin / Contact Email</label>
                     <input type="email" value={email || 'Loading...'} readOnly className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 focus:outline-none text-sm transition-all" />
                  </div>
              </div>
              
              <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-900">Store Description</label>
                  <textarea rows={3} defaultValue="Premium liquidation pallets and overstock sourcing for B2B retailers." className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm transition-all resize-none" />
              </div>
           </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-neutral-900">Brand Assets</h3>
        <p className="text-sm text-neutral-500 mb-4">Upload your logo and favicon.</p>
        
        <div className="bg-white border text-center border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">
                    <i className="fi fi-rr-picture text-2xl" />
                </div>
                <div className="text-left space-y-2">
                    <p className="text-sm font-semibold text-neutral-900">Logo Image</p>
                    <p className="text-xs text-neutral-500">Recommended size: 512x512px. Max size 2MB.</p>
                    <button className="px-4 py-1.5 bg-white border border-neutral-200 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors">
                        Upload Logo
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
         <button className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide hover:bg-neutral-800 transition-colors shadow-sm">
            Save Changes
         </button>
      </div>

    </div>
  );
}
