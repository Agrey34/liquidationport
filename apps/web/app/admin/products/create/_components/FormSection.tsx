import React from 'react';

// ─── Shared style tokens ──────────────────────────────────────────────────────

export const inputCls =
  'w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all';

export const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ─── Shared constants ─────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Electronics', 'Home & Garden', 'Apparel', 'Toys & Games',
  'Tools & Hardware', 'Sports', 'Beauty', 'Furniture', 'Pet Supplies', 'Baby', 'Other',
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor / Parts Only'];

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Variant {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
}

export interface ManifestRow {
  id: string;
  manufacturer: string;
  productName: string;
  product: string;
  condition: string;
  upc: string;
  qty: string;
  msrp: string;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}

export function Section({ title, description, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 rounded-xl text-neutral-600">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>}
    </div>
  );
}
