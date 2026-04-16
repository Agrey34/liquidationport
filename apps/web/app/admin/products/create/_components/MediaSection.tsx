'use client';

import React, { useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Section } from './FormSection';

interface Props {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export function MediaSection({ images, setImages }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls  = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...urls].slice(0, 8));
    e.target.value = '';
  };

  return (
    <Section
      title="Media"
      description="Upload up to 8 photos. First image is the cover."
      icon={ImageIcon}
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all group"
        >
          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
            <Upload className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-700">Click to upload images</p>
          <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP — max 8 images</p>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
        </div>

        {/* Preview grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
