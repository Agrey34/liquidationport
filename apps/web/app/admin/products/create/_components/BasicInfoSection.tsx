'use client';

import React from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { Section, Field, inputCls, selectCls, CATEGORIES, CONDITIONS } from './FormSection';

interface Props {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
}

export function BasicInfoSection({
  name, setName,
  description, setDescription,
  category, setCategory,
  condition, setCondition,
}: Props) {
  return (
    <Section
      title="Basic Information"
      description="Name, description, and categorisation."
      icon={FileText}
    >
      <div className="space-y-4">
        <Field label="Product / Pallet Name" required hint="Be descriptive — include retailer, category, and unit count.">
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Amazon Customer Returns – Mixed Electronics Pallet"
            required
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" required>
            <div className="relative">
              <select
                id="category-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className={selectCls}
              >
                <option value="" disabled>Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="Condition" required>
            <div className="relative">
              <select
                id="condition-select"
                value={condition}
                onChange={e => setCondition(e.target.value)}
                required
                className={selectCls}
              >
                <option value="" disabled>Select condition…</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </Field>
        </div>

        <Field label="Description" hint="Describe what's included, expected returns, and sourcing retailer.">
          <textarea
            id="product-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide a detailed description of this pallet's contents, condition grades, and any known issues…"
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>
    </Section>
  );
}
