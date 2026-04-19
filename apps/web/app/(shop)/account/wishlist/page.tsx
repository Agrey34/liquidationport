'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Search, Package, ShoppingCart } from 'lucide-react';

const MOCK_WISHLIST = [
  { id: '112004', title: 'Amazon Overstock Home Appliance Lot', retailer: 'Amazon', condition: 'Brand New (Box Damage)', lot: '2 Pallets', qty: 15, msrp: 4500, price: 1200, image: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop', category: 'Home & Garden', conditionGrade: 'New', status: 'Available' },
  { id: '850123', title: 'Mixed Summer Apparel - Brands Assorted', retailer: 'Macy\'s', condition: 'Shelf Pulls', lot: '1 Gaylord', qty: 250, msrp: 6500, price: 850, image: 'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop', category: 'Apparel', conditionGrade: 'Like New', status: 'Sold Out' },
];

export default function CustomerWishlistPage() {
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
         <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Saved Pallets</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">Keep track of interesting pallets before they sell out.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
         {MOCK_WISHLIST.length === 0 ? (
            <div className="col-span-full py-20 bg-white border border-dashed border-neutral-300 rounded-3xl text-center">
               <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-neutral-900">Your wishlist is empty</h3>
               <p className="text-neutral-500 mt-1 text-sm">When you see a pallet you like, click the heart icon to save it here.</p>
               <Link href="/products" className="inline-block mt-6 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors">
                 Browse Inventory
               </Link>
            </div>
         ) : (
            MOCK_WISHLIST.map(pallet => (
              <div key={pallet.id} className="group bg-white rounded-3xl overflow-hidden border border-neutral-200 hover:border-neutral-900/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col relative">
                
                {/* Remove button */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all z-10 shadow-sm border border-neutral-200">
                   <Heart className="w-4 h-4 fill-current" />
                </button>

                {pallet.status === 'Sold Out' && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                     <span className="px-4 py-2 bg-neutral-900 text-white font-black uppercase tracking-widest text-sm rounded-lg rotate-12 shadow-xl border border-neutral-700">Sold Out</span>
                  </div>
                )}

                <Link href={`/products/${pallet.id}`} className="flex flex-col h-full opacity-100 transition-opacity">
                   <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                     <Image 
                       src={pallet.image} 
                       alt={pallet.title} 
                       fill 
                       className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                     />
                     <div className="absolute top-3 left-3 flex gap-2">
                       <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-neutral-900 text-[10px] font-black rounded-lg uppercase tracking-wider">{pallet.conditionGrade}</span>
                     </div>
                   </div>
                   
                   <div className="p-5 flex flex-col flex-1">
                     <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                       <span>Lot #{pallet.id}</span>
                       <span>•</span>
                       <span>{pallet.qty} Units</span>
                     </div>
                     <h3 className="font-extrabold text-neutral-900 leading-snug line-clamp-2 mb-3 mt-auto group-hover:text-blue-600 transition-colors">{pallet.title}</h3>
                     
                     <div className="h-px bg-neutral-100 w-full my-3"></div>

                     <div className="flex justify-between items-end mb-4">
                       <div>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Buy It Now</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-neutral-900">${pallet.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Est. MSRP</p>
                          <p className="text-sm font-semibold text-emerald-600">${pallet.msrp.toLocaleString()}</p>
                       </div>
                     </div>

                     <button className="w-full py-3 bg-neutral-100 text-neutral-900 hover:bg-neutral-900 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                     </button>
                   </div>
                </Link>
              </div>
            ))
         )}
      </div>

    </div>
  );
}
