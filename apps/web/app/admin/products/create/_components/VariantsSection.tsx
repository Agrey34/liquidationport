'use client';

import React from 'react';
import { Plus, Trash2, Boxes } from 'lucide-react';
import { Section, inputCls } from './FormSection';
import { Variant } from './FormSection';

interface Props {
  variants: Variant[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Variant, value: string) => void;
  onRemove: (id: string) => void;
}

export function VariantsSection({ variants, onAdd, onUpdate, onRemove }: Props) {
  return (
    <Section
      title="Product Variants"
      description="Optional: add size, grade, or lot-size variants."
      icon={Boxes}
    >
      <div className="space-y-3">
        {variants.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl">
            <p className="text-sm text-neutral-500">No variants added yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Use variants for different pallet sizes or grades.</p>
          </div>
        ) : (
          variants.map((v, i) => (
            <div key={v.id} className="grid grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="col-span-4 flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Variant {i + 1}</span>
                <button type="button" onClick={() => onRemove(v.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input type="text" placeholder="Variant name (e.g. Grade A)"
                value={v.name} onChange={e => onUpdate(v.id, 'name', e.target.value)}
                className={`${inputCls} col-span-2`} />
              <input type="text" placeholder="SKU"
                value={v.sku} onChange={e => onUpdate(v.id, 'sku', e.target.value)}
                className={inputCls} />
              <input type="number" placeholder="Price" min="0" step="0.01"
                value={v.price} onChange={e => onUpdate(v.id, 'price', e.target.value)}
                className={inputCls} />
              <input type="number" placeholder="Stock qty" min="0"
                value={v.stock} onChange={e => onUpdate(v.id, 'stock', e.target.value)}
                className={inputCls} />
            </div>
          ))
        )}

        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 border border-dashed border-neutral-200 hover:border-neutral-400 px-4 py-3 rounded-xl w-full justify-center transition-all hover:bg-neutral-50"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>
    </Section>
  );
}
