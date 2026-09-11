'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, MapPin, CreditCard, ChevronRight, Truck, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface DashboardMetrics {
  activeOrdersCount: number;
  lifetimeSpend: number;
  formattedLifetimeSpend: string;
  savedAddressesCount: number;
}

interface RecentTrackingItem {
  orderId: string;
  orderNumber: string;
  status: string;
  statusDisplay: string;
  estimatedDelivery: string;
  carrier?: string;
  trackingNumber?: string | null;
  trackUrl: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  recentTracking: RecentTrackingItem | null;
}

export default function CustomerDashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const res = await apiFetch<DashboardData>('/users/dashboard');
        if (isMounted && res?.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard overview:', err);
        if (isMounted) setError('Unable to load dashboard metrics right now.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Overview</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Real-time status of your wholesale liquidation account.
          </p>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 md:gap-6 scrollbar-hide">
        {/* Active Orders */}
        <div className="w-[85%] sm:w-[300px] md:w-auto shrink-0 snap-center bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs transition-all hover:border-neutral-300">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
            Active Orders
          </p>
          {isLoading ? (
            <div className="h-9 bg-neutral-200 rounded w-16 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-neutral-900">
              {data?.metrics?.activeOrdersCount ?? 0}
            </p>
          )}
        </div>

        {/* Lifetime Spend */}
        <div className="w-[85%] sm:w-[300px] md:w-auto shrink-0 snap-center bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs transition-all hover:border-neutral-300">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
            Lifetime Spend
          </p>
          {isLoading ? (
            <div className="h-9 bg-neutral-200 rounded w-24 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-neutral-900">
              {data?.metrics?.formattedLifetimeSpend ?? '$0'}
            </p>
          )}
        </div>

        {/* Saved Addresses */}
        <div className="w-[85%] sm:w-[300px] md:w-auto shrink-0 snap-center bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs transition-all hover:border-neutral-300">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
            Saved Addresses
          </p>
          {isLoading ? (
            <div className="h-9 bg-neutral-200 rounded w-12 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-neutral-900">
              {data?.metrics?.savedAddressesCount ?? 0}
            </p>
          )}
        </div>
      </div>

      {/* Recent Tracking Card */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs mt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Recent Tracking</h2>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Live freight & pallet order progress
            </p>
          </div>
          <Link
            href="/account/orders"
            className="text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
          >
            View all orders
          </Link>
        </div>

        {isLoading ? (
          <div className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-200 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-32" />
                <div className="h-3 bg-neutral-200 rounded w-24" />
              </div>
            </div>
            <div className="h-8 bg-neutral-200 rounded w-20" />
          </div>
        ) : data?.recentTracking ? (
          /* Active Order Line Item */
          <div className="border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 transition-colors bg-neutral-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-6 h-6 text-neutral-500" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">
                  Order {data.recentTracking.orderNumber}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      data.recentTracking.status === 'delivered'
                        ? 'bg-blue-600'
                        : data.recentTracking.status === 'cancelled'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <p className="text-xs font-semibold text-neutral-600">
                    {data.recentTracking.statusDisplay}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-200">
              <div className="text-left md:text-right">
                <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
                  Estimated Delivery
                </p>
                <p className="text-sm font-bold text-neutral-900">
                  {data.recentTracking.estimatedDelivery}
                </p>
              </div>
              <Link
                href={data.recentTracking.trackUrl}
                className="px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-bold text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition-colors flex items-center justify-center gap-1 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Track <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-10 px-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">No recent orders to track</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              You do not have any active shipments at the moment. Browse available liquidation lots and manifests.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Explore Wholesale Pallets <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
