import React from 'react';
import { BoxSelect } from 'lucide-react';

export default function ProductsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Pallets & Products</h2>
          <p className="text-neutral-500 mt-1">Manage inventory, manifest details, and pricing.</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          + Add New Pallet
        </button>
      </div>

      <div className="bg-white border text-center border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <BoxSelect className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900">Inventory Dashboard Coming Soon</h3>
        <p className="text-neutral-500 text-sm mt-2 max-w-sm">
          This panel will contain full CRUD capabilities for updating stock levels, images, and item conditions.
        </p>
      </div>
    </div>
  );
}
