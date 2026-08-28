'use client';

import React, { useRef } from 'react';
import Image from 'next/image';

import { Section } from './FormSection';

export interface MediaItem {
  id: string;
  url: string;
  file?: File;
}

interface Props {
  media: MediaItem[];
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

export function MediaSection({ media, setMedia }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newItems: MediaItem[] = files.map(f => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      file: f,
    }));
    setMedia(prev => [...prev, ...newItems].slice(0, 8));
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    setMedia(prev => {
      const target = prev[index];
      if (target && target.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {
          // ignore
        }
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  return (
    <Section
      title="Media"
      description="Upload up to 8 photos. First image is the cover."
      icon={'fi fi-rr-picture'}
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all group"
        >
          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
            <i className="fi fi-rr-upload text-lg text-neutral-400 flex items-center justify-center shrink-0" />
          </div>
          <p className="text-sm font-semibold text-neutral-700">Click to upload images</p>
          <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP — max 8 images</p>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
        </div>

        {/* Preview grid */}
        {media.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {media.map((item, i) => (
              <div key={item.id || i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group">
                <Image unoptimized fill={true} src={item.url} alt={`Product image ${i + 1}`} className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                >
                  <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
