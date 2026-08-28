'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface AppOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface AdminOrdersResponse {
  data: AppOrder[];
  total: number;
  totalPages: number;
  kpis: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    attentionRequired: number;
  };
}

export default function ReturnsPage() {
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'cancelled' | 'refunded'>('all');

  const fetchReturns = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '50',
        sortBy: 'createdAt',
        sortDir: 'desc',
      });

      if (statusFilter === 'cancelled') {
        params.set('status', 'cancelled');
      } else if (statusFilter === 'refunded') {
        params.set('paymentStatus', 'refunded');
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await apiFetch<AppOrder[]>(`/orders/admin?${params.toString()}`, { signal });
      const rawRes = res as unknown as AdminOrdersResponse;
      const allOrders: AppOrder[] = Array.isArray(res.data)
        ? (res.data as unknown as AppOrder[])
        : (Array.isArray(rawRes?.data) ? rawRes.data : []);

      // Filter to cancelled or refunded orders if 'all' is selected
      const returnsOrders = statusFilter === 'all'
        ? allOrders.filter(o => o.status === 'cancelled' || o.paymentStatus === 'refunded')
        : allOrders;

      setOrders(returnsOrders);
    } catch (err: unknown) {
      if (
        signal?.aborted ||
        (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort')))
      ) {
        return;
      }
      console.error('Failed to load returns/refunds:', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to live returns API.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      fetchReturns(controller.signal);
    }, 250);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [fetchReturns]);

  const totalRefundAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const refundedCount = orders.filter(o => o.paymentStatus === 'refunded').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Returns & Cancellations</h2>
          <p className="text-neutral-500 mt-1">Review live cancelled orders, process refunds, and monitor disputes.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm w-full sm:w-auto justify-center"
          >
            <i className="fi fi-rr-boxes" /> View All Orders
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="fi fi-rr-triangle-warning text-lg shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchReturns()} className="text-xs font-bold underline hover:no-underline ml-4">
            Try Again
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-neutral-500 mb-1">Cancelled Orders</p>
          <p className="text-2xl font-black text-neutral-900">
            {loading ? <span className="inline-block w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" /> : cancelledCount}
          </p>
          <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1">
            <i className="fi fi-rr-cross-circle" /> Live cancelled count
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-neutral-500 mb-1">Refunded Orders</p>
          <p className="text-2xl font-black text-neutral-900">
            {loading ? <span className="inline-block w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" /> : refundedCount}
          </p>
          <p className="text-xs font-semibold text-amber-500 mt-2 flex items-center gap-1">
            <i className="fi fi-rr-rotate-left" /> Payment refunded
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-neutral-500 mb-1">Total Cancelled Volume</p>
          <p className="text-2xl font-black text-neutral-900">
            {loading ? <span className="inline-block w-16 h-8 bg-neutral-100 rounded-lg animate-pulse" /> : `$${totalRefundAmount.toFixed(2)}`}
          </p>
          <p className="text-xs font-semibold text-neutral-400 mt-2">Aggregate value</p>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-50">
          <div className="relative">
            <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or order..."
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all w-64"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'cancelled' | 'refunded')}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">All Returns & Cancellations</option>
              <option value="cancelled">Cancelled Only</option>
              <option value="refunded">Refunded Only</option>
            </select>
            <button
              onClick={() => fetchReturns()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <i className={`fi fi-rr-refresh ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Items Count</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold">Order Status</th>
                <th className="px-6 py-4 font-bold">Payment Status</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-neutral-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-neutral-100 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-neutral-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-neutral-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-neutral-100 rounded-full w-20" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-neutral-100 rounded-full w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-neutral-100 rounded w-20" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-neutral-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                    <i className="fi fi-rr-shield-check text-4xl block mb-2 text-emerald-400" />
                    No returns or cancelled orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-neutral-900 font-mono text-xs">
                      <Link href="/admin/orders" className="hover:underline text-indigo-600">
                        {order.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-neutral-900">{order.customerName}</p>
                      <p className="text-xs text-neutral-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-900">${Number(order.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {order.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-200">
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {order.paymentStatus === 'refunded' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Refunded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-neutral-700 bg-neutral-50 border border-neutral-200">
                          {order.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs">{order.createdAt}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href="/admin/orders"
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-700 font-bold rounded-lg text-xs hover:bg-neutral-200 transition-colors inline-block"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
