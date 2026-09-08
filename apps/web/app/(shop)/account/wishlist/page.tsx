'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/lib/context/StoreContext';
import PalletCard from '@/app/(shop)/components/PalletCard';

export default function CustomerWishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Saved Pallets</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Keep track of interesting liquidation lots and wholesale pallets.
          </p>
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
            <Link
              href="/products"
              className="inline-block mt-6 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Browse Live Inventory
            </Link>
          </div>
        ) : (
          wishlist.map((pallet) => (
            <PalletCard
              key={pallet.id}
              pallet={{
                id: pallet.id,
                title: pallet.title,
                price: pallet.price,
                msrp: pallet.msrp,
                image: pallet.img || '/catergories/electronics.png',
                slug: pallet.slug,
                retailer: pallet.retailer,
                conditionGrade: pallet.conditionGrade,
                qty: pallet.qty,
                category: pallet.category,
                status: pallet.status,
              }}
              isWishlistPage
            />
          ))
        )}
      </div>
    </div>
  );
}
