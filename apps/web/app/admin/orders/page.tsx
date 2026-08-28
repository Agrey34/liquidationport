'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppOrder, OrderStatus, PaymentStatus, SortKey, SortDir, TabFilter } from './types';
import { OrderBadge, PaymentBadge, SortIcon } from './_components/OrderBadges';
import { RowMenu } from './_components/RowMenu';
import { OrderDrawer } from './_components/OrderDrawer';
import { InvoiceOverlay } from './_components/InvoiceOverlay';
import { apiFetch } from '../../../lib/api';

const PAGE_SIZE = 10;

interface AdminOrdersResponse {
  data: AppOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    attentionRequired: number;
  };
}

// --- Main Page ----------------------------------------------------------------
export default function OrdersPage() {
  const [orders, setOrders]           = useState<AppOrder[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [error, setError]             = useState<string | null>(null);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [totalPages, setTotalPages]   = useState<number>(1);
  const [kpis, setKpis]               = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    attentionRequired: 0,
  });

  const [search, setSearch]           = useState('');
  const [tabFilter, setTabFilter]     = useState<TabFilter>('all');
  const [paymentFilter, setPayFilter] = useState<PaymentStatus | 'All'>('All');
  const [sort, setSort]               = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [drawerOrder, setDrawerOrder] = useState<AppOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<AppOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch Orders from Live API ────────────────────────────────────────────
  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        sortBy: sort.key,
        sortDir: sort.dir,
      });

      if (search.trim()) params.set('search', search.trim());
      if (tabFilter !== 'all') params.set('status', tabFilter);
      if (paymentFilter !== 'All') params.set('paymentStatus', paymentFilter);

      const res = await apiFetch<AppOrder[]>(`/orders/admin?${params.toString()}`, { signal });
      const rawRes = res as unknown as AdminOrdersResponse;
      const ordersList: AppOrder[] = Array.isArray(res.data)
        ? (res.data as unknown as AppOrder[])
        : (Array.isArray(rawRes?.data) ? rawRes.data : []);
      setOrders(ordersList);
      setTotalPages(rawRes?.totalPages || 1);
      setTotalOrdersCount(rawRes?.total || ordersList.length);
      if (rawRes?.kpis) {
        setKpis(rawRes.kpis);
      }
    } catch (err: unknown) {
      if (
        signal?.aborted ||
        (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort')))
      ) {
        // Request was aborted due to parameter change or component unmount; ignore
        return;
      }
      console.error('Failed to load orders:', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to live orders API.';
      setError(msg);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [page, search, tabFilter, paymentFilter, sort.key, sort.dir]);

  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      fetchOrders(controller.signal);
    }, 250);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [fetchOrders]);

  const toggleSort = (key: SortKey) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const allPageSelected = orders.length > 0 && orders.every(o => selected.has(o.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) orders.forEach(o => next.delete(o.id));
      else orders.forEach(o => next.add(o.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const changeStatus = async (id: string, status: OrderStatus) => {
    // Optimistic local update
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    if (drawerOrder?.id === id) {
      setDrawerOrder(prev => prev ? { ...prev, status } : null);
    }

    try {
      await apiFetch(`/orders/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status.');
      fetchOrders();
    }
  };

  const handleBulkAction = async (action: 'processing' | 'shipped') => {
    const ids = Array.from(selected);
    setSelected(new Set());
    try {
      await Promise.all(
        ids.map(id =>
          apiFetch(`/orders/admin/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: action })
          })
        )
      );
      fetchOrders();
    } catch (err) {
      console.error('Bulk action error:', err);
      fetchOrders();
    }
  };

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all',        label: 'All Orders', count: kpis.totalOrders },
    { key: 'attention',  label: 'Attention Needed', count: kpis.attentionRequired },
    { key: 'pending',    label: 'Pending',    count: kpis.pendingOrders },
    { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { key: 'shipped',    label: 'Shipped',    count: orders.filter(o => o.status === 'shipped').length },
  ];

  const PAY_STATUSES: Array<PaymentStatus | 'All'> = ['All', 'paid', 'unpaid', 'failed', 'refunded'];

  const exportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Status', 'Payment Status', 'Total'];
    const rows = orders.map(o => [
      o.id,
      `"${o.createdAt}"`,
      `"${o.customerName}"`,
      `"${o.customerEmail}"`,
      o.status,
      o.paymentStatus,
      o.total
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Orders Management</h2>
          <p className="text-neutral-500 mt-1 text-sm">View, fulfill, and track customer orders live across the platform.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <i className="fi fi-rr-download text-lg flex items-center justify-center shrink-0" /> Export CSV
          </button>
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <i className={`fi fi-rr-refresh text-base ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="fi fi-rr-triangle-warning text-lg shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── KPI Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume',     value: `$${kpis.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`, icon: 'fi fi-rr-dollar', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Orders',     value: kpis.totalOrders,    icon: 'fi fi-rr-shopping-bag', color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Processing',value: kpis.pendingOrders, icon: 'fi fi-rr-clock-three',       color: 'text-amber-600 bg-amber-50' },
          { label: 'Action Required',  value: kpis.attentionRequired,   icon: 'fi fi-rr-triangle-warning',color: kpis.attentionRequired > 0 ? 'text-rose-600 bg-rose-50' : 'text-neutral-600 bg-neutral-50' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`${color.split(" ")[0]} shrink-0 flex items-center justify-center`}>
              <i className={`${icon} text-3xl`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-neutral-900 truncate">{value}</p>
              <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Table Card ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Status Tabs */}
        <div className="flex border-b border-neutral-200 px-4 pt-1 gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setTabFilter(tab.key); setPage(1); }}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors -mb-px flex items-center gap-2 ${
                tabFilter === tab.key
                  ? (tab.key === 'attention' ? 'border-rose-600 text-rose-700' : 'border-neutral-900 text-neutral-900')
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab.key === 'attention' && <i className="fi fi-rr-triangle-warning text-lg flex items-center justify-center shrink-0" />}
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                tabFilter === tab.key 
                  ? (tab.key === 'attention' ? 'bg-rose-100 text-rose-700' : 'bg-neutral-900 text-white') 
                  : (tab.count > 0 && tab.key === 'attention' ? 'bg-rose-100 text-rose-600' : 'bg-neutral-100 text-neutral-500')
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 flex items-center justify-center shrink-0" />
            <input
              id="order-search"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search Order ID, Customer, or Email..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <select
              id="payment-status-filter"
              value={paymentFilter}
              onChange={e => { setPayFilter(e.target.value as PaymentStatus | 'All'); setPage(1); }}
              className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all cursor-pointer capitalize"
            >
              <option value="All">All Payment Status</option>
              {PAY_STATUSES.filter(s => s !== 'All').map(s => (
                 <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              id="order-toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'}`}
            >
              <i className="fi fi-rr-settings-sliders text-lg flex items-center justify-center shrink-0" /> Filters
            </button>
          </div>
        </div>

        {/* Expanded Filter Row */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Date Range:</span>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 flex items-center gap-2">
              <i className="fi fi-rr-calendar w-3.5 h-3.5 flex items-center justify-center shrink-0" /> All Time
            </button>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="px-4 py-3 bg-neutral-900 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-white">{selected.size} order{selected.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('processing')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <i className="fi fi-rr-box w-3.5 h-3.5 flex items-center justify-center shrink-0" /> Mark Processing
              </button>
              <button
                onClick={() => handleBulkAction('shipped')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <i className="fi fi-rr-truck-side w-3.5 h-3.5 flex items-center justify-center shrink-0" /> Mark Shipped
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('id')}
                >
                  <span className="inline-flex items-center gap-1">Order <SortIcon col="id" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span className="inline-flex items-center gap-1">Date <SortIcon col="createdAt" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('customerName')}
                >
                  <span className="inline-flex items-center gap-1">Customer <SortIcon col="customerName" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('status')}
                >
                  <span className="inline-flex items-center gap-1">Status <SortIcon col="status" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('paymentStatus')}
                >
                  <span className="inline-flex items-center gap-1">Payment <SortIcon col="paymentStatus" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 text-right select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('total')}
                >
                  <span className="inline-flex items-center justify-end gap-1">Total <SortIcon col="total" sort={sort} /></span>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><div className="w-4 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="w-24 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="w-28 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="w-16 h-6 bg-neutral-200 rounded-full" /></td>
                    <td className="px-4 py-3.5"><div className="w-16 h-6 bg-neutral-200 rounded-full" /></td>
                    <td className="px-4 py-3.5"><div className="w-16 h-4 bg-neutral-200 rounded ml-auto" /></td>
                    <td className="px-4 py-3.5"><div className="w-8 h-8 bg-neutral-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
                        <i className="fi fi-rr-shopping-bag text-lg text-neutral-400 flex items-center justify-center shrink-0" />
                      </div>
                      <p className="text-neutral-700 font-semibold">No orders found</p>
                      <p className="text-neutral-400 text-sm">Adjust your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : orders.map((order) => {
                const isLate = order.status === 'pending' && order.paymentStatus === 'paid';
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-neutral-50/60 transition-colors group ${selected.has(order.id) ? 'bg-blue-50/40' : (isLate ? 'bg-amber-50/30' : '')}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="w-4 h-4 rounded border-neutral-300 cursor-pointer accent-neutral-900"
                      />
                    </td>

                    {/* Order ID */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 font-mono text-sm truncate max-w-30 sm:max-w-45">{order.id}</span>
                        {isLate && (
                          <span title="Action Required - Late fulfillment" className="text-rose-500">
                            <i className="fi fi-rr-triangle-warning text-lg flex items-center justify-center shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <i className="fi fi-rr-tags text-lg flex items-center justify-center shrink-0" /> {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-neutral-600 font-medium whitespace-nowrap">{order.createdAt}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                         <p className="font-semibold text-neutral-900 truncate max-w-40 capitalize">{order.customerName}</p>
                         <p className="text-xs text-neutral-500 truncate max-w-40 mt-0.5">{order.customerEmail}</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <OrderBadge status={order.status} />
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-neutral-900">
                        ${Number(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDrawerOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="View order"
                        >
                          <i className="fi fi-rr-eye text-lg flex items-center justify-center shrink-0" />
                        </button>
                        <RowMenu
                          order={order}
                          onView={() => setDrawerOrder(order)}
                          onUpdateStatus={(id, status) => changeStatus(id, status)}
                          onShowInvoice={() => setInvoiceOrder(order)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            Showing{' '}
            <span className="font-semibold text-neutral-900">
              {totalOrdersCount === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, totalOrdersCount)}–{Math.min(page * PAGE_SIZE, totalOrdersCount)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-neutral-900">{totalOrdersCount}</span> orders
          </p>
          <div className="flex items-center gap-1">
            <button
              id="orders-prev-page"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="fi fi-rr-angle-left text-lg flex items-center justify-center shrink-0" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${n === page ? 'bg-neutral-900 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
              >
                {n}
              </button>
            ))}
            <button
              id="orders-next-page"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="fi fi-rr-angle-right text-lg flex items-center justify-center shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {drawerOrder && (
        <OrderDrawer
          order={drawerOrder}
          onClose={() => setDrawerOrder(null)}
          onStatusChange={changeStatus}
        />
      )}

      {/* Invoice Detail View */}
      {invoiceOrder && (
        <InvoiceOverlay
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
