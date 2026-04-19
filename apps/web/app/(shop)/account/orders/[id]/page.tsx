'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, Download, DownloadIcon } from 'lucide-react';
import Image from 'next/image';

const MOCK_ORDER = {
  id: 'LP-84729',
  date: 'Oct 24, 2026',
  total: 1400.00,
  subtotal: 1200.00,
  shipping: 150.00,
  tax: 50.00,
  status: 'Processing',
  items: [
     { id: '112004', title: 'Amazon Overstock Home Appliance Lot', price: 1200.00, qty: 1, img: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=200&auto=format&fit=crop' }
  ],
  shippingAddress: 'Dennis Smith\n123 Liquidation Ave\nAustin, TX 90210\nUnited States',
  paymentMethod: 'Visa ending in 4242'
};

export default function CustomerOrderDetailsPage({ params }: { params: { id: string } }) {
  // Using unwrapped params for mock demo (In Next.js 15 this is normally asynchronous, but we mock it)
  const orderId = params.id;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
         <div>
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors mb-3">
               <ArrowLeft className="w-3 h-3" /> Back to orders
            </Link>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
               Order #{orderId}
               <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-bold tracking-wider uppercase">Processing</span>
            </h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">Placed on {MOCK_ORDER.date}</p>
         </div>
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="px-4 py-2 border border-neutral-300 bg-white text-neutral-700 rounded-lg text-sm font-bold hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
               <DownloadIcon className="w-4 h-4" /> Download Invoice
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         <div className="lg:col-span-2 space-y-6">
            
            {/* Tracking Status */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
               <h2 className="text-lg font-bold text-neutral-900 mb-6">Tracking Status</h2>
               
               <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-[1.125rem] w-[calc(100%-2.25rem)] h-1 bg-neutral-100 rounded-full">
                     <div className="w-1/2 h-full bg-emerald-500 rounded-full"></div>
                  </div>

                  <div className="relative flex justify-between">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 shadow-md shadow-emerald-500/20 rounded-full flex items-center justify-center z-10">
                           <Package className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-neutral-900 text-center max-w-[80px]">Order Confirmed</span>
                     </div>
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 shadow-md shadow-emerald-500/20 rounded-full flex items-center justify-center z-10">
                           <Package className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-neutral-900 text-center max-w-[80px]">Processing</span>
                     </div>
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center z-10">
                           <Truck className="w-5 h-5 text-neutral-300" />
                        </div>
                        <span className="text-xs font-bold text-neutral-400 text-center max-w-[80px]">Shipped</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Items */}
            <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
               <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                  <h2 className="text-lg font-bold text-neutral-900">Items Ordered</h2>
               </div>
               <div className="divide-y divide-neutral-100">
                  {MOCK_ORDER.items.map(item => (
                     <div key={item.id} className="p-6 flex gap-4">
                        <div className="relative w-20 h-20 bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden shrink-0">
                           <Image src={item.img} alt={item.title} fill className="object-cover mix-blend-multiply" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                           <h4 className="text-sm font-bold text-neutral-900 line-clamp-2">{item.title}</h4>
                           <p className="text-xs font-semibold text-neutral-500 mt-1 uppercase tracking-widest">Lot #{item.id}</p>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                           <p className="text-base font-black text-neutral-900">${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                           <p className="text-xs font-medium text-neutral-500 mt-1">Qty: {item.qty}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

         </div>

         <div className="space-y-6">
            
            {/* Summary */}
            <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
               <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                  <h2 className="text-lg font-bold text-neutral-900">Order Summary</h2>
               </div>
               <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-600">
                     <span>Subtotal</span>
                     <span className="font-bold text-neutral-900">${MOCK_ORDER.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-600">
                     <span>Freight Shipping</span>
                     <span className="font-bold text-neutral-900">${MOCK_ORDER.shipping.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-600">
                     <span>Tax</span>
                     <span className="font-bold text-neutral-900">${MOCK_ORDER.tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="h-px bg-neutral-100 w-full my-2"></div>
                  <div className="flex justify-between items-center">
                     <span className="text-base font-bold text-neutral-900">Total</span>
                     <span className="text-2xl font-black text-neutral-900">${MOCK_ORDER.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
               </div>
            </div>

            {/* Info */}
            <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
               <div className="p-6 space-y-6">
                  <div>
                     <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Shipping Address</h3>
                     <p className="text-sm text-neutral-900 font-medium whitespace-pre-line leading-relaxed">{MOCK_ORDER.shippingAddress}</p>
                  </div>
                  <div className="h-px bg-neutral-100 w-full"></div>
                  <div>
                     <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Payment Method</h3>
                     <p className="text-sm text-neutral-900 font-medium flex items-center gap-2">
                        <span className="px-1.5 py-0.5 border border-neutral-200 rounded flex items-center justify-center font-bold text-[8px] bg-white">VISA</span>
                        {MOCK_ORDER.paymentMethod}
                     </p>
                  </div>
               </div>
            </div>

         </div>

      </div>

    </div>
  );
}
