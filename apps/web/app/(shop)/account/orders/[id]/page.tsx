'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, Printer, AlertCircle, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCleanErrorMessage } from '@/lib/error-utils';

interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

interface OrderAddress {
  id: string;
  addressLine: string;
  city: string;
  postalCode?: string;
  country: string;
}

interface OrderDetail {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  payment?: {
    id: string;
    provider: string;
    status: string;
    amount: number;
  } | null;
  shipment?: {
    id: string;
    carrier?: string;
    tracking?: string;
    shippedAt?: string;
    deliveredAt?: string;
  } | null;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    companyName?: string | null;
    addresses?: OrderAddress[];
  } | null;
}

export default function CustomerOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // Unwrap params safely in React 19 / Next.js 15+
  const resolvedParams = 'then' in params ? use(params) : params;
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiFetch<OrderDetail>(`/orders/${orderId}`);
        if (isMounted && res?.data) {
          setOrder(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load order:', err);
        if (isMounted) {
          setError(getCleanErrorMessage(err, 'Order not found or you do not have permission to view it.'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (orderId) {
      loadOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
        <div className="h-10 w-64 bg-neutral-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 h-40 animate-pulse" />
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 h-64 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 h-48 animate-pulse" />
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 h-40 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-neutral-900">Order Not Found</h2>
        <p className="text-sm text-neutral-500 mt-2 mb-6">
          {error || 'We could not locate this order in your account.'}
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order History
        </Link>
      </div>
    );
  }

  // Calculations & formatting
  const displayId = `#LP-${order.id.slice(0, 5).toUpperCase()}`;
  const placedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const items = order.items || [];
  const subtotal = items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  const total = Number(order.total);
  const estimatedShipping = Math.max(Math.round((total - subtotal) * 0.65), 0);
  const estimatedTax = Math.max(Number((total - subtotal - estimatedShipping).toFixed(2)), 0);

  // Determine Stepper State
  // Steps: 1: Confirmed, 2: Processing, 3: In Transit / Shipped, 4: Delivered
  const statusLower = order.status.toLowerCase();
  let activeStep = 1;
  if (['paid'].includes(statusLower)) activeStep = 2;
  if (['processing'].includes(statusLower)) activeStep = 2;
  if (['shipped'].includes(statusLower)) activeStep = 3;
  if (['delivered'].includes(statusLower)) activeStep = 4;

  const isCancelled = statusLower === 'cancelled';

  // Format Shipping Address
  const primaryAddress = order.user?.addresses?.[0];
  const customerName = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') ||
    (order.user?.companyName ? order.user.companyName : 'Wholesale Buyer');

  const addressLines = primaryAddress
    ? [
        primaryAddress.addressLine,
        `${primaryAddress.city}${primaryAddress.postalCode ? `, ${primaryAddress.postalCode}` : ''}`,
        primaryAddress.country,
      ].filter(Boolean)
    : ['Standard Commercial Delivery / Freight Terminal'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to orders
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Order {displayId}
            </h1>
            {isCancelled ? (
              <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black uppercase tracking-wider">
                Cancelled
              </span>
            ) : statusLower === 'delivered' ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-black uppercase tracking-wider">
                Delivered
              </span>
            ) : statusLower === 'shipped' ? (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black uppercase tracking-wider">
                In Transit
              </span>
            ) : statusLower === 'processing' || statusLower === 'paid' ? (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-black uppercase tracking-wider">
                Processing
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-black uppercase tracking-wider">
                Pending Payment
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-medium text-neutral-500 mt-1">
            Placed on {placedDate} • ID: <span className="font-mono text-neutral-400">{order.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-neutral-300 bg-white text-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tracking & Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tracking Stepper */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900">Fulfillment & Freight Status</h2>
              {order.shipment?.tracking && (
                <div className="flex items-center gap-1.5 text-xs font-bold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-md">
                  <Truck className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Tracking: {order.shipment.tracking}</span>
                </div>
              )}
            </div>

            {isCancelled ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-medium flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>This wholesale order has been cancelled and will not be fulfilled.</span>
              </div>
            ) : (
              <div className="relative pt-4 pb-2">
                {/* Progress bar background line */}
                <div className="absolute top-9 left-[12%] right-[12%] h-1 bg-neutral-100 rounded-full">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width:
                        activeStep === 1
                          ? '0%'
                          : activeStep === 2
                          ? '33%'
                          : activeStep === 3
                          ? '66%'
                          : '100%',
                    }}
                  />
                </div>

                <div className="relative flex justify-between">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        activeStep >= 1
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-900 text-center max-w-[70px]">
                      Order Placed
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        activeStep >= 2
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white border-2 border-neutral-200 text-neutral-300'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold text-center max-w-[70px] ${
                        activeStep >= 2 ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      Processing
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        activeStep >= 3
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white border-2 border-neutral-200 text-neutral-300'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold text-center max-w-[70px] ${
                        activeStep >= 3 ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      In Transit
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        activeStep >= 4
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white border-2 border-neutral-200 text-neutral-300'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold text-center max-w-[70px] ${
                        activeStep >= 4 ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      Delivered
                    </span>
                  </div>
                </div>
              </div>
            )}

            {order.shipment?.carrier && (
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                <span className="font-medium">Designated Freight Carrier:</span>
                <span className="font-bold text-neutral-900">{order.shipment.carrier}</span>
              </div>
            )}
          </div>

          {/* Items Ordered List */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900">Items Ordered</h2>
              <span className="text-xs font-bold text-neutral-500">
                {items.length} {items.length === 1 ? 'pallet lot' : 'pallet lots'}
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No individual lot records attached to this order.
                </div>
              ) : (
                items.map((item) => {
                  const unitPrice = Number(item.price);
                  const itemTotal = unitPrice * item.quantity;
                  return (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-2xl flex items-center justify-center shrink-0 text-neutral-400">
                        <Package className="w-8 h-8 text-neutral-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-2">
                          {item.productName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                          <span className="font-mono uppercase tracking-wider font-semibold">SKU: {item.sku || 'N/A'}</span>
                          <span>•</span>
                          <span>Qty: <strong className="text-neutral-800">{item.quantity}</strong></span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-base font-black text-neutral-900">
                          ${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} each
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Shipping Address */}
        <div className="space-y-6">
          
          {/* Order Summary */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-base font-bold text-neutral-900">Order Summary</h2>
            </div>
            <div className="p-6 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-neutral-600">
                <span>Lots Subtotal</span>
                <span className="font-bold text-neutral-900">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Estimated Freight Shipping</span>
                <span className="font-bold text-neutral-900">
                  ${estimatedShipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Estimated Tax</span>
                <span className="font-bold text-neutral-900">
                  ${estimatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-neutral-100 w-full my-3" />

              <div className="flex justify-between items-center">
                <span className="text-base font-black text-neutral-900">Total</span>
                <span className="text-2xl font-black text-neutral-900">
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping & Billing Info */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-6 space-y-6">
              
              {/* Shipping Address */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Freight Delivery Address</span>
                </div>
                <p className="text-sm font-bold text-neutral-900 mb-1">{customerName}</p>
                {addressLines.map((line, idx) => (
                  <p key={idx} className="text-xs text-neutral-600 leading-relaxed">
                    {line}
                  </p>
                ))}
                {order.user?.phone && (
                  <p className="text-xs text-neutral-500 mt-2 font-medium">
                    Phone: {order.user.phone}
                  </p>
                )}
              </div>

              <div className="h-px bg-neutral-100 w-full" />

              {/* Payment Info */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Payment Method</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-neutral-900">
                    {order.payment?.provider ? order.payment.provider.toUpperCase() : 'Credit Card (Stripe)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    order.payment?.status === 'paid' || order.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.payment?.status || (order.status === 'paid' ? 'Paid' : 'Pending')}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
