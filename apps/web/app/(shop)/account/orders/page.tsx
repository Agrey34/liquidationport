'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Search, Truck, ArrowRight, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface UserOrder {
  id: string;
  total: number;
  status: string;
  currency: string;
  createdAt: string;
  items?: OrderItem[];
  shipment?: {
    carrier?: string;
    tracking?: string;
    shippedAt?: string;
    deliveredAt?: string;
  } | null;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      try {
        const res = await apiFetch<UserOrder[]>('/orders');
        if (isMounted && res?.data) {
          setOrders(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err: any) {
        console.error('Failed to load user orders:', err);
        if (isMounted) setError('Unable to load orders at this moment.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const shortId = `#LP-${order.id.slice(0, 5).toUpperCase()}`;
      const matchesSearch =
        !searchQuery.trim() ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shortId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items?.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || order.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            In Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Delivered
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-cyan-50 text-cyan-700 border border-cyan-100">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Payment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Order History</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            View, track, and manage all your liquidation pallet purchases.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by order or lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-28" />
                  <div className="h-3 bg-neutral-200 rounded w-20" />
                </div>
                <div className="h-6 bg-neutral-200 rounded w-20" />
                <div className="h-4 bg-neutral-200 rounded w-16" />
                <div className="h-4 bg-neutral-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-neutral-100">
                  <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((order) => {
                  const displayId = `#LP-${order.id.slice(0, 5).toUpperCase()}`;
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const itemCount = order.items?.length || 1;

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="font-bold text-neutral-900 hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <Package className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                          <span>{displayId}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">{orderDate}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">
                        {itemCount} {itemCount === 1 ? 'pallet' : 'pallets'}
                      </td>
                      <td className="px-6 py-4 font-bold text-neutral-900 text-right">
                        ${Number(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="inline-flex items-center justify-center p-2 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                          title="View Order Details & Freight Tracking"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">No Orders Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? 'No orders match your filter criteria. Try clearing your search.'
                : 'You have not placed any wholesale liquidation orders yet.'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Browse Inventory Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
