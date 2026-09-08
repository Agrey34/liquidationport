'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Package } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getMediaUrl } from "@/lib/image-url";
import { formatConditionLabel } from "@/lib/condition";
import PalletCard, { PalletCardData } from "./PalletCard";

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  stock: number;
  condition?: string | null;
  createdAt: string;
  comparePrice?: number | string | null;
  liquidatorName?: string | null;
  manifest?: Array<{
    qty?: number;
    msrp?: number | string;
  }> | null;
  category?: {
    id: string;
    name: string;
  } | null;
  variants?: {
    id?: string;
    sku?: string;
    price?: number | string | null;
    stock?: number | string | null;
    msrp?: number | string | null;
  }[];
  media?: {
    id?: string;
    url: string;
    altText?: string | null;
  }[];
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=600&auto=format&fit=crop',
];

export default function FeaturedListings() {
  const [pallets, setPallets] = useState<PalletCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        setLoading(true);
        const res = await apiFetch<ApiProduct[]>('/products?limit=8&sortBy=created_at');
        const rawList: ApiProduct[] = Array.isArray(res.data)
          ? res.data
          : (res.data && Array.isArray((res.data as unknown as { data: ApiProduct[] }).data)
            ? (res.data as unknown as { data: ApiProduct[] }).data
            : (Array.isArray(res) ? (res as ApiProduct[]) : []));

        const mapped: PalletCardData[] = rawList.slice(0, 4).map((p, index) => {
          const numPrice = typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price || 0);
          const fallbackImg = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          const imgUrl = getMediaUrl(p.media?.[0]?.url, fallbackImg);
          const catName = p.liquidatorName || p.category?.name || 'Overstock Pallets';
          const conditionLabel = formatConditionLabel(p.condition);

          // DYNAMIC MSRP: Priority 1: comparePrice, Priority 2: manifest total, Priority 3: variant msrp
          let dynamicMsrp = p.comparePrice != null ? Number(p.comparePrice) : 0;
          if ((!dynamicMsrp || dynamicMsrp <= 0) && p.manifest && Array.isArray(p.manifest)) {
            const manifestTotal = p.manifest.reduce(
              (sum, item) => sum + Number(item.qty || 1) * Number(item.msrp || 0),
              0
            );
            if (manifestTotal > 0) dynamicMsrp = manifestTotal;
          }
          if ((!dynamicMsrp || dynamicMsrp <= 0) && p.variants && Array.isArray(p.variants)) {
            const variantTotal = p.variants.reduce(
              (sum, v) => sum + Number(v.stock || 1) * Number(v.msrp || 0),
              0
            );
            if (variantTotal > 0) dynamicMsrp = variantTotal;
          }

          return {
            id: p.id,
            slug: p.slug || p.id,
            title: p.name,
            retailer: catName,
            conditionGrade: conditionLabel,
            qty: p.stock || 1,
            msrp: dynamicMsrp > 0 ? Number(dynamicMsrp.toFixed(2)) : 0,
            comparePrice: p.comparePrice,
            price: numPrice,
            image: imgUrl,
          };
        });

        setPallets(mapped);
      } catch (err: unknown) {
        console.error('Failed to load featured listings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  return (
    <div className="bg-[#f0f2f5] py-16 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111]">
            Recently Added
          </h2>
          <Link href="/products" className="hidden sm:block text-primary font-bold hover:text-accent">
            View all inventory
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-neutral-200 animate-pulse h-80 flex flex-col justify-between">
                <div className="bg-neutral-200 aspect-[4/3] rounded-xl mb-4 w-full" />
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : pallets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-8">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-semibold">New inventory arriving soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pallets.map((pallet) => (
              <PalletCard key={pallet.id} pallet={pallet} />
            ))}
          </div>
        )}
        
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/products" className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold text-center hover:bg-gray-50">
            View all inventory
          </Link>
        </div>
      </div>
    </div>
  );
}
