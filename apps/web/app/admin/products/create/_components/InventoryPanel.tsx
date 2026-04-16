'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { Field, inputCls } from './FormSection';

interface Props {
  sku: string;
  setSku: (v: string) => void;
  stock: string;
  setStock: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
}

export function InventoryPanel({ sku, setSku, stock, setStock, weight, setWeight }: Props) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        <Package className="w-4 h-4 text-neutral-500" />
        <h3 className="font-bold text-neutral-900">Inventory</h3>
      </div>
      <div className="p-5 space-y-4">
        <Field label="SKU" hint="Internal stock-keeping unit — must be unique.">
          <input
            id="product-sku"
            type="text"
            value={sku}
            onChange={e => setSku(e.target.value)}
            placeholder="ELC-PAL-001"
            className={inputCls}
          />
        </Field>

        <Field label="Quantity Available" required>
          <input
            id="product-stock"
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="0"
            min="0"
            required
            className={inputCls}
          />
        </Field>

        <Field label="Weight (lbs)" hint="Used for shipping rate calculation.">
          <input
            id="product-weight"
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="0"
            min="0"
            step="0.1"
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}
