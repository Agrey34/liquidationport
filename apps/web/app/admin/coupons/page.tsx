'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../lib/api';

interface AppCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  usageLimit: number | null;
  used: number;
  expires: string | null;
  status: 'Active' | 'Expired';
  createdAt: string;
}

interface CouponsResponse {
  data: AppCoupon[];
  kpis: {
    activePromotions: number;
    totalUsages: number;
    totalCoupons: number;
  };
}

export default function CouponsPage() {
  const [coupons, setCoupons]       = useState<AppCoupon[]>([]);
  const [loading, setLoading]       = useState<boolean>(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState<string>('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppCoupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [code, setCode]                   = useState('');
  const [discountType, setDiscountType]   = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('15');
  const [usageLimit, setUsageLimit]       = useState<string>('100');
  const [expiresAt, setExpiresAt]         = useState<string>('');
  const [formError, setFormError]         = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    activePromotions: 0,
    totalUsages: 0,
    totalCoupons: 0,
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const queryStr = params.toString();
      const res = await apiFetch<AppCoupon[]>(`/coupons${queryStr ? `?${queryStr}` : ''}`);
      const rawRes = res as unknown as CouponsResponse;
      const couponsList: AppCoupon[] = Array.isArray(res.data)
        ? (res.data as unknown as AppCoupon[])
        : (Array.isArray(rawRes?.data) ? rawRes.data : []);
      setCoupons(couponsList);
      if (rawRes?.kpis) {
        setKpis(rawRes.kpis);
      }
    } catch (err: unknown) {
      console.error('Failed to load coupons:', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to live coupons API.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCoupons();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchCoupons]);

  const generateAutoCode = () => {
    const prefix = discountType === 'percentage' ? 'SALE' : 'OFF';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCode(`${prefix}${discountValue || '10'}-${rand}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Please provide a coupon code.');
      return;
    }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }
    if (discountType === 'percentage' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await apiFetch('/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount: val,
          type: discountType,
          usageLimit: usageLimit.trim() ? parseInt(usageLimit, 10) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      setDrawerOpen(false);
      setCode('');
      setDiscountValue('15');
      setUsageLimit('100');
      setExpiresAt('');
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create coupon.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/coupons/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err: unknown) {
      console.error('Failed to delete coupon:', err);
      alert('Failed to delete coupon on server.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Discounts & Coupons</h2>
          <p className="text-neutral-500 mt-1">Manage promotional codes, pricing rules, and limits in real time.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Refresh"
          >
            <i className={`fi fi-rr-refresh text-base ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => { setFormError(null); setDrawerOpen(true); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm w-full sm:w-auto justify-center"
          >
            <i className="fi fi-rr-ticket text-base" /> Generate Coupon
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="fi fi-rr-triangle-warning text-lg shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCoupons}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Active Promotions</p>
            <p className="text-3xl font-black text-neutral-900">{kpis.activePromotions}</p>
            <p className="text-xs text-neutral-400 mt-1">{kpis.totalCoupons} total coupons configured</p>
          </div>
          <div className="text-emerald-500 shrink-0 opacity-80 flex items-center justify-center">
            <i className="fi fi-rr-badge-percent text-4xl" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Total Usage Count</p>
            <p className="text-3xl font-black text-neutral-900">{kpis.totalUsages.toLocaleString('en-US')}</p>
            <p className="text-xs text-neutral-400 mt-1">Times redeemed by customers</p>
          </div>
          <div className="text-blue-500 shrink-0 opacity-80 flex items-center justify-center">
            <i className="fi fi-rr-shopping-cart-check text-4xl" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Redemption Status</p>
            <p className="text-3xl font-black text-neutral-900">
              {kpis.totalCoupons > 0 ? `${Math.round((kpis.activePromotions / kpis.totalCoupons) * 100)}%` : '100%'}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Active code availability</p>
          </div>
          <div className="text-violet-500 shrink-0 opacity-80 flex items-center justify-center">
            <i className="fi fi-rr-tags text-4xl" />
          </div>
        </div>
      </div>

      {/* Coupons Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative flex-1 max-w-sm">
            <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search coupon codes..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-75">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Code</th>
                <th className="px-6 py-4 font-bold">Discount</th>
                <th className="px-6 py-4 font-bold">Usage</th>
                <th className="px-6 py-4 font-bold">Expires</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-28 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-16 h-6 bg-neutral-200 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><div className="w-8 h-8 bg-neutral-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                        <i className="fi fi-rr-ticket text-xl" />
                      </div>
                      <p className="text-neutral-700 font-semibold">No coupon codes found</p>
                      <p className="text-neutral-400 text-sm">Click &quot;Generate Coupon&quot; to create your first promotion.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-neutral-900 font-mono text-base tracking-wide">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {coupon.type === 'percentage' ? `${coupon.discount}% OFF` : `$${coupon.discount.toFixed(2)} OFF`}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      <span className="font-semibold text-neutral-900">{coupon.used}</span> / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs font-mono">
                      {coupon.expires ? coupon.expires : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Expired
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(coupon)}
                        title="Delete Coupon"
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors inline-flex items-center justify-center border border-rose-200"
                      >
                        <i className="fi fi-rr-trash text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl relative animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-lg font-bold text-neutral-900">Generate Coupon</h3>
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
              >
                <i className="fi fi-rr-cross-small text-xl flex" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCoupon} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <i className="fi fi-rr-triangle-warning text-sm shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-900">Discount Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SUMMER20" 
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono uppercase" 
                      required
                    />
                    <button 
                      type="button"
                      onClick={generateAutoCode}
                      className="px-4 bg-white border border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shrink-0"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-900">Discount Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                        discountType === 'percentage' 
                          ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <i className={`fi fi-rr-percentage text-xl ${discountType === 'percentage' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <span className={`text-sm font-bold ${discountType === 'percentage' ? 'text-neutral-900' : 'text-neutral-500'}`}>Percentage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${
                        discountType === 'fixed' 
                          ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <i className={`fi fi-rr-dollar text-xl ${discountType === 'fixed' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <span className={`text-sm font-bold ${discountType === 'fixed' ? 'text-neutral-900' : 'text-neutral-500'}`}>Fixed Amount</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-900">Discount Value</label>
                  <div className="relative">
                    {discountType === 'fixed' && <i className="fi fi-rr-dollar text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />}
                    {discountType === 'percentage' && <i className="fi fi-rr-percentage text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 mt-0.5" />}
                    <input 
                      type="number" 
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      placeholder="15" 
                      min="0.01"
                      step="any"
                      className={`w-full py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono ${
                        discountType === 'fixed' ? 'pl-8 pr-3' : 'pl-3 pr-8'
                      }`} 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-neutral-900">Usage Limit</label>
                    <input 
                      type="number" 
                      value={usageLimit}
                      onChange={e => setUsageLimit(e.target.value)}
                      placeholder="100 (optional)" 
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-neutral-900">Expires At</label>
                    <input 
                      type="date" 
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100 shrink-0">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold shadow-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Coupon Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="fi fi-rr-trash text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Delete Coupon</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Are you sure you want to delete coupon <span className="font-mono font-bold text-neutral-900">{deleteTarget.code}</span>? Customers will no longer be able to apply this discount.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl font-semibold text-sm hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoupon}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
