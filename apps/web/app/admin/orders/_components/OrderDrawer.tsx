
import React, { useState } from 'react';

import { AppOrder, OrderStatus } from '../types';
import { OrderBadge, PaymentBadge } from './OrderBadges';

export function OrderDrawer({ order, onClose, onStatusChange }: {
  order: AppOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 shrink-0 bg-neutral-50/50">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
               <h2 className="text-xl font-bold text-neutral-900">{order.id}</h2>
               <OrderBadge status={order.status} />
               <PaymentBadge status={order.paymentStatus} />
             </div>
             <p className="text-sm text-neutral-500 font-medium">Placed on {order.createdAt}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors bg-white border border-neutral-200"
          >
            <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 shrink-0 px-6 bg-white">
          {(['details', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Order {tab}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/30">
          
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                   <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <i className="fi fi-rr-user text-lg flex items-center justify-center shrink-0" /> Customer Details
                   </h3>
                   <p className="font-semibold text-neutral-900">{order.customerName}</p>
                   <p className="text-sm text-neutral-600 mt-1">{order.customerEmail}</p>
                   {order.customerPhone && <p className="text-sm text-neutral-600 mt-1">{order.customerPhone}</p>}
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                   <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <i className="fi fi-rr-marker text-lg flex items-center justify-center shrink-0" /> Shipping Address
                   </h3>
                   <p className="font-semibold text-neutral-900 line-clamp-3 leading-relaxed text-sm">
                     {order.shippingAddress}
                   </p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Line Items</h3>
                  <span className="text-xs font-bold text-neutral-700 bg-neutral-200/50 px-2.5 py-1 rounded-full">{order.items.length} items</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {order.items.map(item => (
                    <div key={item.id} className="p-4 flex gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-white shadow-inner ${item.imageColor}`}>
                        <i className="fi fi-rr-box text-lg outline-white flex items-center justify-center shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm line-clamp-2">{item.name}</p>
                        <p className="text-xs text-neutral-500 mt-1 font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-neutral-900">${item.unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                        <p className="text-xs text-neutral-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Payment Info */}
                <div className="space-y-4">
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm h-full">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <i className="fi fi-rr-credit-card text-lg flex items-center justify-center shrink-0" /> Payment Details
                    </h3>
                    <div className="space-y-3 mt-4">
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-neutral-500">Status</span>
                         <PaymentBadge status={order.paymentStatus} />
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-neutral-500">Method</span>
                         <span className="text-sm font-medium text-neutral-900">{order.paymentMethod}</span>
                       </div>
                       {order.paymentStatus === 'failed' && (
                         <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-100 text-xs text-rose-700">
                           Payment capture failed. Order placed on hold until funds are secured.
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Subtotals */}
                <div className="bg-neutral-900 text-white rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="font-medium">${order.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Shipping</span>
                    <span className="font-medium">${order.shipping.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Tax Estimation</span>
                    <span className="font-medium">${order.tax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-black">${order.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
                
              </div>
              
              {/* Shipping/Tracking Info */}
              {order.trackingNumber && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                       <i className="fi fi-rr-truck-side text-lg flex items-center justify-center shrink-0" /> Tracking Information Provided
                    </h4>
                    <p className="text-xs text-indigo-700 mt-1 font-mono">{order.trackingNumber}</p>
                  </div>
                  <button className="text-sm font-semibold text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                    Track Package
                  </button>
                </div>
              )}

            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-6">
              <div className="relative pl-6 space-y-6">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-neutral-200"></div>
                
                {order.activity.map((evt, i) => (
                  <div key={i} className="relative">
                    {/* Circle */}
                    <div className={`absolute -left-6 w-5 h-5 rounded-full border-4 border-neutral-50 flex items-center justify-center
                      ${evt.status === 'payment' ? 'bg-emerald-500' : 
                        evt.status === 'cancelled' ? 'bg-rose-500' : 
                        'bg-blue-500'}
                    `} />
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{evt.action}</p>
                          {evt.note && <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed">{evt.note}</p>}
                        </div>
                        <span className="text-xs text-neutral-400 whitespace-nowrap text-right">{evt.timestamp}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2">
                        <i className="fi fi-rr-user w-3.5 h-3.5 text-neutral-400 flex items-center justify-center shrink-0" />
                        <span className="text-xs font-medium text-neutral-500">{evt.actor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 flex gap-3 shrink-0 bg-white">
          {order.status === 'pending' && (
             <button
              onClick={() => onStatusChange(order.id, 'processing')}
              className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold border border-neutral-900 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <i className="fi fi-rr-box text-lg flex items-center justify-center shrink-0" /> Start Processing
            </button>
          )}
          {(order.status === 'pending' || order.status === 'processing') && (
            <button
               onClick={() => onStatusChange(order.id, 'shipped')}
               className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
             >
               <i className="fi fi-rr-truck-side text-lg flex items-center justify-center shrink-0" /> Mark as Shipped
             </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
             <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="px-4 py-2.5 bg-white text-rose-600 rounded-xl text-sm font-bold border border-rose-200 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
