'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Package, Heart, ShoppingCart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getMediaUrl } from "@/lib/image-url";
import { useCart, useWishlist } from "@/lib/context/StoreContext";
import { formatConditionLabel, formatCardConditionBadge, getConditionBadgeClass } from "@/lib/condition";

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  stock: number;
  condition?: string | null;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  variants?: {
    id?: string;
    sku?: string;
    price?: number | string | null;
    stock?: number | string | null;
  }[];
  media?: {
    id?: string;
    url: string;
    altText?: string | null;
  }[];
}

interface FeaturedPallet {
  id: string;
  slug: string;
  title: string;
  retailer: string;
  conditionGrade: string;
  qty: number;
  msrp: number;
  price: number;
  image: string;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=600&auto=format&fit=crop',
];

export default function FeaturedListings() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [pallets, setPallets] = useState<FeaturedPallet[]>([]);
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

        const mapped: FeaturedPallet[] = rawList.slice(0, 4).map((p, index) => {
          const numPrice = typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price || 0);
          const fallbackImg = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          const imgUrl = getMediaUrl(p.media?.[0]?.url, fallbackImg);
          const catName = p.category?.name || 'Overstock Pallets';
          const conditionLabel = formatConditionLabel(p.condition);

          return {
            id: p.id,
            slug: p.slug || p.id,
            title: p.name,
            retailer: catName,
            conditionGrade: conditionLabel,
            qty: p.stock || 1,
            msrp: Number((numPrice * 1.4).toFixed(2)),
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
            {pallets.map((pallet) => {
              const isSaved = isInWishlist(pallet.id);
              return (
                <div key={pallet.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-transparent hover:border-neutral-200 relative">
                  
                  {/* Floating Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist({
                        id: pallet.id,
                        title: pallet.title,
                        price: pallet.price,
                        msrp: pallet.msrp,
                        img: pallet.image,
                        slug: pallet.slug,
                        retailer: pallet.retailer,
                        conditionGrade: pallet.conditionGrade,
                        qty: pallet.qty,
                      });
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 shadow-sm border cursor-pointer ${
                      isSaved
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white/90 backdrop-blur-md border-neutral-200 text-neutral-400 hover:text-rose-500 hover:bg-white'
                    }`}
                    title={isSaved ? "Remove from Saved Pallets" : "Save to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <Link href={`/products/${pallet.slug || pallet.id}`} className="flex flex-col flex-1">
                    <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                      <Image 
                        src={pallet.image} 
                        alt={pallet.title} 
                        fill 
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 flex gap-2 items-center">
                        <span className={`px-2.5 py-1 backdrop-blur-md text-[10px] font-black rounded-lg uppercase tracking-wider shadow-xs ${getConditionBadgeClass(pallet.conditionGrade)}`}>
                          {formatCardConditionBadge(pallet.conditionGrade)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                        <span>Lot #{pallet.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{pallet.qty} Units</span>
                      </div>
                      <h3 className="font-extrabold text-[#111] leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">{pallet.title}</h3>
                      
                      <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-end mb-3">
                        <div>
                           <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Buy It Now</p>
                           <div className="flex items-baseline gap-2">
                             <span className="text-lg font-black text-[#111]">${pallet.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Est. MSRP</p>
                           <p className="text-sm font-semibold text-emerald-600">${pallet.msrp.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Quick Add to Cart Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart({
                            id: pallet.id,
                            title: pallet.title,
                            price: pallet.price,
                            img: pallet.image,
                            slug: pallet.slug,
                            retailer: pallet.retailer,
                            conditionGrade: pallet.conditionGrade,
                            unitsCount: pallet.qty,
                          });
                        }}
                        className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </Link>
                </div>
              );
            })}
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
