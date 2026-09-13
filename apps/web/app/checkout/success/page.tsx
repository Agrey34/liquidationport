'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Package,
  Truck,
  Download,
  BellRing,
  MapPin,
  Clock,
  Printer,
  FileText,
} from 'lucide-react';

interface StoredOrder {
  orderId: string;
  email: string;
  recipientName?: string;
  shippingAddress: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  items: Array<{
    id: string;
    title: string;
    price: number;
    qty: number;
    img?: string;
  }>;
  paymentMethod?: string;
  deliveryNotes?: string;
  createdAt: string;
}

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [orderId, setOrderId] = useState('LP-84729');
  const [customerEmail, setCustomerEmail] = useState('customer@example.com');

  useEffect(() => {
    try {
      // 1. Check URL parameters
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const paramId = params.get('orderId');
        const paramEmail = params.get('email');
        if (paramId) setOrderId(paramId);
        if (paramEmail) setCustomerEmail(decodeURIComponent(paramEmail));

        // 2. Check SessionStorage for rich order object
        const stored = sessionStorage.getItem('last_order');
        if (stored) {
          const parsed = JSON.parse(stored) as StoredOrder;
          setOrder(parsed);
          if (parsed.orderId) setOrderId(parsed.orderId);
          if (parsed.email) setCustomerEmail(parsed.email);
        }
      }
    } catch (err) {
      console.warn('Failed to parse last order from session storage:', err);
    }
  }, []);

  const handlePrintInvoice = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Success Badge */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center -rotate-6 shadow-xs border border-emerald-100">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
      </div>

      <div className="text-center mb-10">
        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">
          Wholesale Order Confirmed
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 mb-3 tracking-tight">
          Thank You for Your Order!
        </h1>
        <p className="text-base text-neutral-600 max-w-lg mx-auto leading-relaxed">
          Your order <span className="font-bold text-neutral-900">#{orderId}</span> has been staged for freight dispatch. A confirmation manifest has been sent to{' '}
          <span className="font-semibold text-neutral-900 break-all">{customerEmail}</span>.
        </p>
      </div>

      {/* Order Status Stepper */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs mb-8">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/80 flex justify-between items-center">
          <h2 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Live Freight Fulfillment Status
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
            Paid & Confirmed
          </span>
        </div>
        <div className="p-6">
          <p className="text-xs text-neutral-500 mb-6">
            Carrier appointment booking will be coordinated via the delivery phone number provided. You will receive real-time carrier BOL updates.
          </p>

          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-neutral-100">
            {/* Step 1 */}
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="pt-1.5">
                <h4 className="text-sm font-bold text-neutral-900">Wholesale Order Placed & Payment Authorized</h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Inventory securely locked in Dallas Central Hub.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 border-2 border-primary text-primary rounded-full flex items-center justify-center shrink-0 z-10">
                <Package className="w-4 h-4" />
              </div>
              <div className="pt-1.5">
                <h4 className="text-sm font-bold text-neutral-900">Pallet Staging & Shrink-Wrapping</h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Warehouse team is staging pallets for carrier pickup dock inspection.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start gap-4 opacity-50">
              <div className="w-10 h-10 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center shrink-0 z-10">
                <Truck className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="pt-1.5">
                <h4 className="text-sm font-bold text-neutral-900">Carrier BOL Dispatched</h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Freight carrier Bill of Lading (BOL) and tracking number will be emailed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Breakdown if available from session */}
      {order && (
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs mb-8 p-6 space-y-5">
          <h3 className="font-bold text-neutral-900 text-sm pb-3 border-b border-neutral-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Delivery & Items Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-neutral-500 font-medium">Shipping Destination:</p>
              <p className="font-semibold text-neutral-900 mt-0.5">{order.shippingAddress}</p>
              {order.recipientName && (
                <p className="text-neutral-500 mt-0.5">Recipient: {order.recipientName}</p>
              )}
            </div>
            <div>
              <p className="text-neutral-500 font-medium">Freight Shipping Method:</p>
              <p className="font-semibold text-neutral-900 mt-0.5">{order.shippingMethod}</p>
              <p className="text-neutral-500 mt-0.5">Payment: {order.paymentMethod || 'Credit Card'}</p>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Ordered Lots ({order.items.length}):</p>
              <div className="divide-y divide-neutral-100">
                {order.items.map((it) => (
                  <div key={it.id} className="py-2 flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-900 line-clamp-1 pr-4">
                      {it.qty}x {it.title}
                    </span>
                    <span className="font-bold text-neutral-900 shrink-0">
                      ${(it.price * it.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-sm font-black text-neutral-900">
            <span>Total Paid (USD):</span>
            <span className="text-xl text-primary">
              ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
        <button
          type="button"
          onClick={handlePrintInvoice}
          className="px-6 py-4 bg-white border border-neutral-300 text-neutral-800 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
        >
          <Printer className="w-4 h-4" /> Print / Save Invoice
        </button>
        <Link
          href="/products"
          className="px-6 py-4 bg-neutral-900 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20 hover:-translate-y-0.5"
        >
          Continue Sourcing Lots <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-800 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
          <BellRing className="w-4 h-4 text-blue-600" /> Need freight assistance? Contact dispatch or view order history in your{' '}
          <Link href="/account/orders" className="underline hover:text-blue-950 font-bold">
            Account Dashboard
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
