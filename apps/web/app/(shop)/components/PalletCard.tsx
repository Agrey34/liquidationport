'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart, useWishlist } from '@/lib/context/StoreContext';
import { formatConditionLabel } from '@/lib/condition';

export interface PalletCardData {
  id: string;
  slug?: string;
  title: string;
  retailer?: string;
  location?: string;
  condition?: string | null;
  conditionGrade?: string | null;
  lot?: string;
  lotVolume?: string;
  qty?: number;
  msrp?: number;
  comparePrice?: number | string | null;
  price: number;
  originalPrice?: number | null;
  image: string;
  category?: string;
  status?: string;
}

interface PalletCardProps {
  pallet: PalletCardData;
  isWishlistPage?: boolean;
}

/**
 * Clean condition badge coloring with soft pastel backgrounds
 */
function getSoftConditionBadgeClass(condition: string | null | undefined): string {
  const label = formatConditionLabel(condition).toLowerCase();

  if (label.includes('brand new') || label === 'new') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (label.includes('open box') || label.includes('like new')) {
    return 'bg-sky-50 text-sky-700';
  }
  if (label.includes('good')) {
    return 'bg-indigo-50 text-indigo-700';
  }
  if (label.includes('fair') || label.includes('scratch') || label.includes('dent')) {
    return 'bg-amber-50 text-amber-700';
  }
  if (label.includes('salvage') || label.includes('parts')) {
    return 'bg-rose-50 text-rose-700';
  }
  if (label.includes('overstock') || label.includes('shelf pull')) {
    return 'bg-purple-50 text-purple-700';
  }
  // Default to Untested Returns soft indigo/blue
  return 'bg-[#eef2ff] text-[#3730a3]';
}

export default function PalletCard({ pallet, isWishlistPage = false }: PalletCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);

  const isSaved = isWishlistPage || isInWishlist(pallet.id);
  const conditionDisplay = formatConditionLabel(pallet.conditionGrade || pallet.condition);

  // Price calculations
  const priceValue = typeof pallet.price === 'string' ? parseFloat(pallet.price) : Number(pallet.price || 0);
  const msrpValue = pallet.msrp != null && Number(pallet.msrp) > 0
    ? Number(pallet.msrp)
    : (pallet.comparePrice ? Number(pallet.comparePrice) : 0);

  const savingsPercent = msrpValue > priceValue && msrpValue > 0
    ? Math.round(((msrpValue - priceValue) / msrpValue) * 100)
    : 0;

  // Lot Volume Display
  const unitsCount = pallet.qty || 1;
  const lotVolumeDisplay = pallet.lotVolume || `${pallet.lot || '1 Pallet'} / ${unitsCount} ${unitsCount === 1 ? 'Pc' : 'Pcs'}`;

  // Source & Location Subtitle
  const retailerDisplay = pallet.retailer || pallet.category || 'Major National Appliance Retailer';
 //const locationDisplay = pallet.location || 'Columbus, OH';

  // Format price strings
  const formattedPrice = priceValue.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(priceValue) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const formattedMsrp = msrpValue.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(msrpValue) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlistPage) {
      removeFromWishlist(pallet.id);
    } else {
      toggleWishlist({
        id: pallet.id,
        title: pallet.title,
        price: priceValue,
        msrp: msrpValue,
        img: pallet.image,
        slug: pallet.slug || pallet.id,
        retailer: retailerDisplay,
        conditionGrade: conditionDisplay,
        qty: unitsCount,
        category: pallet.category,
      });
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || pallet.status === 'Sold Out') return;

    setIsAdding(true);
    try {
      await addToCart({
        id: pallet.id,
        title: pallet.title,
        price: priceValue,
        img: pallet.image,
        slug: pallet.slug || pallet.id,
        retailer: retailerDisplay,
        conditionGrade: conditionDisplay,
        unitsCount,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col h-full">
  
          {/* Top Floating Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`absolute top-3.5 left-3.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border cursor-pointer ${
              isSaved
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white/95 backdrop-blur-xs border-slate-200/80 text-slate-700 hover:text-rose-500 hover:bg-white'
            }`}
            title={isSaved ? 'Remove from Saved Pallets' : 'Save to Wishlist'}
            aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Top Right Condition Badge */}
          <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
            <span className={`px-2 py-1 text-xs font-bold tracking-tight shadow-xs backdrop-blur-xs ${getSoftConditionBadgeClass(conditionDisplay)}`}>
              {conditionDisplay}
            </span>
          </div>

          {/* Clickable Card Body */}
          <Link href={`/products/${pallet.slug || pallet.id}`} className="flex flex-col flex-1">
            {/* Product Image Area */}
            <div className="relative w-full aspect-4/3 bg-slate-100 rounded-t-2xl overflow-hidden">
              <Image
                src={pallet.image}
                alt={pallet.title}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {/* Sold Out Overlay */}
              {pallet.status === 'Sold Out' && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <span className="px-3.5 py-1.5 bg-neutral-900 text-white font-black uppercase tracking-wider text-xs rounded-lg shadow-lg">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
            <div className='p-3 sm:p-3'>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mt-1">
                  {pallet.title}
                </h3>

                {/* Sourced Direct Subtitle */}
                <p className="text-xs text-slate-500 font-normal mt-1 line-clamp-2 leading-relaxed">
                  <span className='text-stone-950'>Sourced Direct:</span> {retailerDisplay}
                </p>

                {/* Specifications Box: Lot Volume & Est. Retail MSRP */}
                <div className="bg-[#f8fafc] border border-slate-100  p-2 my-1  flex justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">
                      LOT VOLUME
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                      {lotVolumeDisplay}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">
                      EST. RETAIL MSRP
                    </span>
                    <span className="text-sm font-semibold text-slate-600 line-through mt-0.5 text-center block truncate">
                      {msrpValue > 0 ? `$${formattedMsrp}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Pricing Row */}
                <div className="mt-auto pt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                      CURRENT PRICE
                    </span>
                    {savingsPercent > 0 && (
                      <span className="bg-[#e6f9ed] text-[#137333] text-[11px] font-bold px-2 py-0.5 rounded">
                        Save {savingsPercent}% MSRP
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-[28px] font-black text-blue-600 tracking-tight leading-none mt-1">
                    ${formattedPrice}
                  </div>
                </div>
            
            </div>
          </Link>

          {/* Add to Cart Button */}
          <div className='flex justify-center'>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={pallet.status === 'Sold Out' || isAdding}
                className="w-[90%] mb-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer">
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-white" />
                    <span>{pallet.status === 'Sold Out' ? 'Sold Out' : 'Add to Cart'}</span>
                  </>
                )}
              </button>
          </div>

      
    </div>
  );
}
