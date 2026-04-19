'use client';

import React from 'react';

import { Field, inputCls } from './FormSection';

interface Props {
  basePrice: string;
  setBasePrice: (v: string) => void;
  comparePrice: string;
  setComparePrice: (v: string) => void;
}

export function PricingPanel({ basePrice, setBasePrice, comparePrice, setComparePrice }: Props) {
  const showDiscount =
    comparePrice && basePrice &&
    parseFloat(comparePrice) > parseFloat(basePrice);

  const discountPct = showDiscount
    ? Math.round((1 - parseFloat(basePrice) / parseFloat(comparePrice)) * 100)
    : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        <i className="fi fi-rr-dollar text-lg text-neutral-500 flex items-center justify-center shrink-0" />
        <h3 className="font-bold text-neutral-900">Pricing</h3>
      </div>
      <div className="p-5 space-y-4">
        <Field label="Sale Price" required hint="The B2B buying price shown on the listing.">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
            <input
              id="sale-price"
              type="number"
              value={basePrice}
              onChange={e => setBasePrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
              className={`${inputCls} pl-7`}
            />
          </div>
        </Field>

        <Field label="Compare-at Price" hint="Strike-through retail value — shows savings.">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
            <input
              id="compare-price"
              type="number"
              value={comparePrice}
              onChange={e => setComparePrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`${inputCls} pl-7`}
            />
          </div>
        </Field>

        {showDiscount && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-emerald-700 text-xs font-bold">
              {discountPct}% discount shown to buyers
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
