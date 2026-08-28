'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RecentActivityWidget from './components/RecentActivityWidget';
import { apiFetch } from '../../lib/api';

interface KpiItem {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

interface DashboardData {
  kpis: KpiItem[];
  recentOrders: RecentOrder[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<DashboardData>('/admins/dashboard-stats');
      setData(res.data);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to live dashboard data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h2>
          <p className="text-neutral-500 mt-1">Here&apos;s an overview of your platform&apos;s live performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-50 active:bg-neutral-100 transition-colors shadow-sm disabled:opacity-50"
          >
            <i className={`fi fi-rr-refresh text-base ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="fi fi-rr-triangle-warning text-lg shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 lg:p-6 border border-neutral-200 shadow-sm animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-neutral-200 rounded-xl" />
                <div className="w-12 h-5 bg-neutral-200 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-7 bg-neutral-200 rounded-lg" />
                <div className="w-32 h-4 bg-neutral-200 rounded-lg" />
              </div>
            </div>
          ))
        ) : (
          (data?.kpis || []).map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 lg:p-6 border border-neutral-200 shadow-sm flex flex-col justify-between min-w-0">
              <div className="flex justify-between items-start mb-3">
                <div className="text-neutral-600 shrink-0">
                  <i className={`${stat.icon} text-2xl lg:text-3xl flex items-center justify-center`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600'}`}>
                  {stat.isPositive && <i className="fi fi-rr-arrow-up-right text-lg flex items-center justify-center shrink-0" />}
                  <span className="hidden sm:inline">{stat.trend}</span>
                </div>
              </div>
              
              <div className="min-w-0">
                <h3 className="text-xl lg:text-3xl font-black text-neutral-900 truncate">{stat.value}</h3>
                <p className="text-xs lg:text-sm font-medium text-neutral-500 mt-1 truncate">{stat.title}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-stretch">
        
        {/* Recent Orders Table Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col max-h-[480px]">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center shrink-0 bg-white">
             <h3 className="text-lg font-bold text-neutral-900">Recent Orders</h3>
             <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
               View All
             </Link>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-neutral-50 shadow-xs">
                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <th className="px-6 py-4 bg-neutral-50">Order ID</th>
                  <th className="px-6 py-4 bg-neutral-50">Customer</th>
                  <th className="px-6 py-4 bg-neutral-50">Date</th>
                  <th className="px-6 py-4 bg-neutral-50 text-right">Amount</th>
                  <th className="px-6 py-4 bg-neutral-50 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-28 h-4 bg-neutral-200 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-24 h-4 bg-neutral-200 rounded" /></td>
                      <td className="px-6 py-4"><div className="w-16 h-4 bg-neutral-200 rounded ml-auto" /></td>
                      <td className="px-6 py-4"><div className="w-20 h-6 bg-neutral-200 rounded-full mx-auto" /></td>
                    </tr>
                  ))
                ) : (data?.recentOrders || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-400 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fi fi-rr-shopping-bag text-3xl text-neutral-300" />
                        <p className="font-semibold text-neutral-600">No orders placed yet</p>
                        <p className="text-xs text-neutral-400">Live orders created on the storefront will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (data?.recentOrders || []).map((order) => {
                    const statusLower = order.status.toLowerCase();
                    const badgeClasses =
                      statusLower === 'completed' || statusLower === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : statusLower === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : statusLower === 'shipped'
                        ? 'bg-indigo-100 text-indigo-800'
                        : statusLower === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800';

                    return (
                      <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-neutral-900 font-semibold truncate max-w-35">
                          <Link href="/admin/orders" className="hover:underline">
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 capitalize">{order.customer}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">{order.date}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-neutral-900">{order.amount}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${badgeClasses}`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <RecentActivityWidget />

      </div>
    </div>
  );
}

