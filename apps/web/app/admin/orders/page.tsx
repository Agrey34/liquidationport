import React from 'react';
import { PackageSearch } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Orders Management</h2>
          <p className="text-neutral-500 mt-1">View, track, and process customer orders.</p>
        </div>
        <button className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          Export CSV
        </button>
      </div>

      {/* Placeholder Empty State */}
      <div className="bg-white border text-center border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900">No recent orders selected</h3>
        <p className="text-neutral-500 text-sm mt-2 max-w-sm">
          Select an order from the list or wait for incoming purchases to populate this view.
        </p>
      </div>
    </div>
  );
}
