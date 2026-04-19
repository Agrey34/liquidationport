'use client';

import React from 'react';

import { inputCls } from './FormSection';

interface Props {
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
}

export function TagsPanel({ tags, tagInput, setTagInput, onAdd, onRemove }: Props) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        <i className="fi fi-rr-tags text-lg text-neutral-500 flex items-center justify-center shrink-0" />
        <h3 className="font-bold text-neutral-900">Tags</h3>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
            placeholder="Add a tag…"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-700 transition-colors"
          >
            <i className="fi fi-rr-plus text-lg flex items-center justify-center shrink-0" />
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                {t}
                <button
                  type="button"
                  onClick={() => onRemove(t)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-neutral-400">Press Enter or click + to add. Tags improve search visibility.</p>
      </div>
    </div>
  );
}
