'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShieldCheck, ArrowRight, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../../../lib/context/StoreContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, cartCount, cartSubtotal, removeFromCart, updateCartQty } = useCart();

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
             <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-900">
               <ShoppingCart className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-neutral-900 leading-none">Your Cart</h2>
                <p className="text-xs text-neutral-500 font-semibold mt-1">
                  {cartCount} {cartCount === 1 ? 'pallet' : 'pallets'} selected
                </p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50 custom-scrollbar">
           {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-2">
                    <ShoppingCart className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-neutral-900">Your cart is empty</h3>
                 <p className="text-sm text-neutral-500 max-w-[250px]">Browse our inventory and add liquidation pallets to your cart.</p>
                 <Link
                   href="/products"
                   onClick={onClose}
                   className="mt-4 px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors shadow-sm"
                 >
                   Explore Pallets
                 </Link>
              </div>
           ) : (
             <div className="space-y-4">
               {cart.map((item) => {
                 const imgSrc = item.img || '/catergories/electronics.png';
                 return (
                   <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex gap-4 group shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100 shrink-0 flex items-center justify-center">
                         {imgSrc.startsWith('http') ? (
                           <img src={imgSrc} alt={item.title} className="w-full h-full object-cover" />
                         ) : (
                           <Image src={imgSrc} fill alt={item.title} className="object-cover mix-blend-multiply" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                         )}
                      </div>
                      
                      <div className="flex-1 flex flex-col min-w-0">
                         <div className="flex justify-between items-start gap-2 mb-1">
                            <Link
                              href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                              onClick={onClose}
                              className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2 hover:underline"
                            >
                              {item.title}
                            </Link>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-neutral-300 hover:text-rose-500 transition-colors shrink-0 p-1 cursor-pointer"
                              title="Remove item"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                         
                         <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-2 mt-auto">
                           <span>Lot #{item.id.slice(0, 8)}</span>
                           {item.retailer && (
                             <>
                               <span>•</span>
                               <span className="text-neutral-600">{item.retailer}</span>
                             </>
                           )}
                         </div>
                         
                         <div className="flex justify-between items-end mt-auto pt-1">
                            {/* Qty Controls */}
                            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                               <button 
                                 onClick={() => updateCartQty(item.id, item.qty - 1)}
                                 className="text-neutral-500 hover:text-neutral-900 text-xs font-bold w-4 h-4 flex items-center justify-center cursor-pointer"
                               >
                                 <Minus className="w-3 h-3" />
                               </button>
                               <span className="text-xs font-bold text-neutral-900 w-4 text-center">{item.qty}</span>
                               <button 
                                 onClick={() => updateCartQty(item.id, item.qty + 1)}
                                 className="text-neutral-500 hover:text-neutral-900 text-xs font-bold w-4 h-4 flex items-center justify-center cursor-pointer"
                               >
                                 <Plus className="w-3 h-3" />
                               </button>
                            </div>
                            
                            <p className="text-base font-black text-neutral-900">
                              ${(item.price * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-100 bg-white p-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-4">
            
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                <span className="text-neutral-900 font-bold">
                  ${cartSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Freight Shipping</span>
                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Calculated at Checkout
                </span>
              </div>
              <div className="h-px bg-neutral-100 w-full my-1"></div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-neutral-900">Total</span>
                <span className="text-2xl font-black text-neutral-900">
                  ${cartSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>

            <Link href="/checkout" onClick={onClose} className="block w-full">
              <button className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 group cursor-pointer">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 py-2 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-4 h-4" /> Secure SSL Checkout
            </div>
          </div>
        )}
      </div>
    </>
  );
}
