'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import { useWishlist, useCart } from '../../../../lib/context/StoreContext';
import { formatCardConditionBadge, getConditionBadgeClass } from '../../../../lib/condition';

export default function CustomerWishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
         <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Saved Pallets</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">Keep track of interesting liquidation lots and wholesale pallets.</p>
         </div>
         {wishlist.length > 0 && (
           <p className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-lg">
             {wishlist.length} {wishlist.length === 1 ? 'pallet' : 'pallets'} saved
           </p>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
         {wishlist.length === 0 ? (
            <div className="col-span-full py-20 bg-white border border-dashed border-neutral-300 rounded-3xl text-center p-8">
               <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-neutral-900">Your saved pallets list is empty</h3>
               <p className="text-neutral-500 mt-1 text-sm max-w-sm mx-auto">
                 When you see a pallet you are interested in, click the heart icon on any listing or detail page to save it here.
               </p>
               <Link href="/products" className="inline-block mt-6 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm">
                 Browse Live Inventory
               </Link>
            </div>
         ) : (
            wishlist.map(pallet => {
              const imgSrc = pallet.img || '/catergories/electronics.png';
              return (
                <div key={pallet.id} className="group bg-white rounded-3xl overflow-hidden border border-neutral-200 hover:border-neutral-900/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col relative">
                  
                  {/* Remove button */}
                  <button 
                    onClick={() => removeFromWishlist(pallet.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all z-20 shadow-sm border border-neutral-200 cursor-pointer"
                    title="Remove from saved pallets"
                  >
                     <Heart className="w-4 h-4 fill-current" />
                  </button>

                  {pallet.status === 'Sold Out' && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                       <span className="px-4 py-2 bg-neutral-900 text-white font-black uppercase tracking-widest text-sm rounded-lg rotate-12 shadow-xl border border-neutral-700">Sold Out</span>
                    </div>
                  )}

                  <Link href={`/products/${pallet.slug || pallet.id}`} className="flex flex-col flex-1">
                     <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                       {imgSrc.startsWith('http') ? (
                         <img 
                           src={imgSrc} 
                           alt={pallet.title} 
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                         />
                       ) : (
                         <Image 
                           src={imgSrc} 
                           alt={pallet.title} 
                           fill 
                           className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                         />
                       )}
                       <div className="absolute top-3 left-3 flex gap-2 items-center">
                         <span className={`px-2.5 py-1 backdrop-blur-md text-[10px] font-black rounded-lg uppercase tracking-wider shadow-xs ${getConditionBadgeClass(pallet.conditionGrade)}`}>
                           {formatCardConditionBadge(pallet.conditionGrade)}
                         </span>
                       </div>
                     </div>
                     
                     <div className="p-5 flex flex-col flex-1">
                       <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                         <span>Lot #{pallet.id.slice(0, 8)}</span>
                         {pallet.qty && (
                           <>
                             <span>•</span>
                             <span>{pallet.qty} Units</span>
                           </>
                         )}
                       </div>
                       <h3 className="font-extrabold text-neutral-900 leading-snug line-clamp-2 mb-3 mt-auto group-hover:text-blue-600 transition-colors">
                         {pallet.title}
                       </h3>
                       
                       <div className="h-px bg-neutral-100 w-full my-3"></div>

                       <div className="flex justify-between items-end mb-4">
                         <div>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Buy It Now</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-neutral-900">
                                ${pallet.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </span>
                            </div>
                         </div>
                         {pallet.msrp && pallet.msrp > 0 && (
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Est. MSRP</p>
                              <p className="text-sm font-semibold text-emerald-600">${pallet.msrp.toLocaleString()}</p>
                           </div>
                         )}
                       </div>

                       <button 
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
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
                         }}
                         className="w-full py-3 bg-neutral-100 text-neutral-900 hover:bg-neutral-900 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                       >
                          <ShoppingCart className="w-4 h-4" /> Move to Cart
                       </button>
                     </div>
                  </Link>
                </div>
              );
            })
         )}
      </div>

    </div>
  );
}
