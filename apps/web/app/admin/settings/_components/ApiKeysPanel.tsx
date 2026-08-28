'use client';

import React from 'react';

export function ApiKeysPanel() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h3 className="text-lg font-bold text-neutral-900">API Keys</h3>
            <p className="text-sm text-neutral-500">Manage programmable access keys for custom integrations.</p>
         </div>
         <button className="bg-neutral-900 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wide hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-2">
            <i className="fi fi-rr-plus" /> Generate Key
         </button>
      </div>
      
      <div className="bg-white border text-center border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <i className="fi fi-rr-key text-2xl flex items-center justify-center shrink-0" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900">No Custom API Keys</h3>
        <p className="text-neutral-500 text-sm mt-2 max-w-sm">
          You haven&apos;t generated any programmatic API keys yet. Generate a key to allow third-party services to access your data securely.
        </p>
      </div>

    </div>
  );
}
