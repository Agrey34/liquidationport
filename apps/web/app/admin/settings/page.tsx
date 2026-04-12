import React from 'react';
import { Settings2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Platform Settings</h2>
          <p className="text-neutral-500 mt-1">Configure global application variables, Stripe keys, and webhooks.</p>
        </div>
      </div>

      <div className="bg-white border text-center border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <Settings2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900">Configuration Not Yet Initialized</h3>
        <p className="text-neutral-500 text-sm mt-2 max-w-sm">
          Platform-level settings such as shipping calculations and Stripe webhook endpoints will be configurable here.
        </p>
      </div>
    </div>
  );
}
