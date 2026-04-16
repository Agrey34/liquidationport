'use client';

import React from 'react';

type StatusValue = 'Active' | 'Draft' | 'Archived';

const STATUS_DESCRIPTIONS: Record<StatusValue, string> = {
  Active:   'Visible and purchasable on the shop.',
  Draft:    'Hidden — only admins can preview.',
  Archived: 'Unlisted and removed from shop.',
};

interface Props {
  status: string;
  setStatus: (v: string) => void;
}

export function StatusPanel({ status, setStatus }: Props) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-5">
      <h3 className="font-bold text-neutral-900 mb-4">Status &amp; Visibility</h3>
      <div className="space-y-3">
        {(['Active', 'Draft', 'Archived'] as StatusValue[]).map(s => (
          <label key={s} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="status"
              value={s}
              checked={status === s}
              onChange={() => setStatus(s)}
              className="accent-neutral-900"
            />
            <div>
              <p className="text-sm font-semibold text-neutral-800">{s}</p>
              <p className="text-xs text-neutral-400">{STATUS_DESCRIPTIONS[s]}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
