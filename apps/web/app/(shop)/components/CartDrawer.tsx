'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShieldCheck, ArrowRight, ShoppingCart } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock Cart Items
const MOCK_CART = [
  { 
    id: '942503', 
    title: '1 Pallet, Kitchen and Dining, Luggage, Camping', 
    price: 250.00, 
    qty: 1, 
    img: 'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=200&auto=format&fit=crop'
  },
  { 
    id: '112004', 
    title: 'Amazon Overstock Home Appliance Lot', 
    price: 1200.00, 
    qty: 1, 
    img: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=200&auto=format&fit=crop'
  }
];

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  
  const subtotal = MOCK_CART.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
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
                <p className="text-xs text-neutral-500 font-semibold mt-1">{MOCK_CART.length} pallets selected</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50">
           {MOCK_CART.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-2">
                    <ShoppingCart className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-neutral-900">Your cart is empty</h3>
                 <p className="text-sm text-neutral-500 max-w-[250px]">Browse our catalog and discover premium liquidation pallets.</p>
                 <button 
                   onClick={onClose}
                   className="mt-4 px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
                 >
                   Continue Shopping
                 </button>
              </div>
           ) : (
             <div className="space-y-4">
               {MOCK_CART.map((item) => (
                 <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex gap-4 group">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100 shrink-0">
                       <Image src={item.img} fill alt={item.title} className="object-cover mix-blend-multiply" />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                       <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2">{item.title}</h4>
                          <button className="text-neutral-300 hover:text-rose-500 transition-colors shrink-0">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       
                       <p className="text-xs font-semibold text-neutral-400 mb-2 mt-auto">Lot #{item.id}</p>
                       
                       <div className="flex justify-between items-end mt-auto">
                          {/* Qty Controls */}
                          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                             <button className="text-neutral-400 hover:text-neutral-900 text-sm font-black w-5">-</button>
                             <span className="text-xs font-bold text-neutral-900 w-4 text-center">{item.qty}</span>
                             <button className="text-neutral-400 hover:text-neutral-900 text-sm font-black w-5">+</button>
                          </div>
                          
                          <p className="text-base font-black text-neutral-900">${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Footer / Checkout */}
        {MOCK_CART.length > 0 && (
          <div className="border-t border-neutral-100 bg-white p-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Subtotal</span>
                <span className="text-neutral-900 font-bold">${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-neutral-500">
                <span>Freight Shipping</span>
                <span className="text-neutral-900 font-bold">Calculated at checkout</span>
              </div>
              <div className="h-px bg-neutral-100 w-full my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-neutral-900">Total</span>
                <span className="text-2xl font-black text-neutral-900">${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <Link href="/checkout" onClick={onClose} className="block w-full">
              <button className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 group">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 py-2 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-4 h-4" /> Secure SSL Checkout
            </div>
          </div>
        )}
      </div>
    </>
  );
}
