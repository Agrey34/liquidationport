'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Heart, Trash2, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { useWishlist, useCart } from '../../../lib/context/StoreContext';
import { formatConditionLabel } from '../../../lib/condition';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { wishlist, wishlistCount, removeFromWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();

  const handleMoveToCart = (pallet: typeof wishlist[0]) => {
    addToCart({
      id: pallet.id,
      title: pallet.title,
      price: pallet.price,
      img: pallet.img,
      slug: pallet.slug,
      retailer: pallet.retailer,
      conditionGrade: pallet.conditionGrade,
      unitsCount: pallet.qty,
    });
  };

  const handleMoveAllToCart = () => {
    wishlist.forEach((pallet) => {
      addToCart({
        id: pallet.id,
        title: pallet.title,
        price: pallet.price,
        img: pallet.img,
        slug: pallet.slug,
        retailer: pallet.retailer,
        conditionGrade: pallet.conditionGrade,
        unitsCount: pallet.qty,
      });
    });
    onClose();
    openCart();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
               <Heart className="w-5 h-5 fill-rose-500" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-neutral-900 leading-none">Saved Pallets</h2>
                <p className="text-xs text-neutral-500 font-semibold mt-1">
                  {wishlistCount} {wishlistCount === 1 ? 'pallet' : 'pallets'} saved
                </p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wishlist Items Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50 custom-scrollbar">
           {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-2">
                    <Heart className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-neutral-900">Your wishlist is empty</h3>
                 <p className="text-sm text-neutral-500 max-w-[260px]">
                   Click the heart icon on any pallet listing to save lots you want to track or buy later.
                 </p>
                 <Link
                   href="/products"
                   onClick={onClose}
                   className="mt-4 px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors shadow-sm"
                 >
                   Browse Inventory
                 </Link>
              </div>
           ) : (
             <div className="space-y-4">
               {wishlist.map((pallet) => {
                 const imgSrc = pallet.img || '/catergories/electronics.png';
                 return (
                   <div key={pallet.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex gap-4 group shadow-2xs hover:shadow-xs transition-shadow relative">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100 shrink-0 flex items-center justify-center">
                         {imgSrc.startsWith('http') ? (
                           <img src={imgSrc} alt={pallet.title} className="w-full h-full object-cover" />
                         ) : (
                           <Image src={imgSrc} fill alt={pallet.title} className="object-cover mix-blend-multiply" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                         )}
                      </div>
                      
                      <div className="flex-1 flex flex-col min-w-0">
                         <div className="flex justify-between items-start gap-2 mb-1">
                            <Link
                              href={pallet.slug ? `/products/${pallet.slug}` : `/products/${pallet.id}`}
                              onClick={onClose}
                              className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2 hover:underline"
                            >
                              {pallet.title}
                            </Link>
                            <button
                              onClick={() => removeFromWishlist(pallet.id)}
                              className="text-neutral-300 hover:text-rose-500 transition-colors shrink-0 p-1 cursor-pointer"
                              title="Remove from saved"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                         
                         <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mb-2 mt-auto flex-wrap">
                           <span>Lot #{pallet.id.slice(0, 8)}</span>
                           {pallet.conditionGrade && (
                             <>
                               <span>•</span>
                               <span className="text-neutral-700 font-bold">{formatConditionLabel(pallet.conditionGrade)}</span>
                             </>
                           )}
                           {pallet.retailer && (
                             <>
                               <span>•</span>
                               <span className="text-neutral-500">{pallet.retailer}</span>
                             </>
                           )}
                         </div>
                         
                         <div className="flex justify-between items-end mt-auto pt-2 border-t border-neutral-100">
                            <div>
                              <p className="text-base font-black text-neutral-900 leading-none">
                                ${pallet.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </p>
                              {pallet.msrp && pallet.msrp > 0 && (
                                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                  MSRP: ${pallet.msrp.toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleMoveToCart(pallet)}
                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <ShoppingCart className="w-3 h-3" /> Move to Cart
                            </button>
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="border-t border-neutral-100 bg-white p-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-3">
            <button
              onClick={handleMoveAllToCart}
              className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" /> Move All to Cart
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <Link
              href="/account/wishlist"
              onClick={onClose}
              className="block w-full text-center py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:underline transition-colors"
            >
              View Full Saved Pallets Dashboard Page
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
