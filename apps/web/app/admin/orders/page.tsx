
'use client';

import React, { useState, useMemo } from 'react';


import { AppOrder, OrderStatus, PaymentStatus, SortKey, SortDir, TabFilter } from './types';
import { OrderBadge, PaymentBadge, SortIcon } from './_components/OrderBadges';
import { RowMenu } from './_components/RowMenu';
import { OrderDrawer } from './_components/OrderDrawer';
import { InvoiceOverlay } from './_components/InvoiceOverlay';
import { MOCK_ORDERS } from './mockData';

const PAGE_SIZE = 10;

// --- Main Page ----------------------------------------------------------------
export default function OrdersPage() {
  const [orders, setOrders]           = useState<AppOrder[]>(MOCK_ORDERS);
  const [search, setSearch]           = useState('');
  const [tabFilter, setTabFilter]     = useState<TabFilter>('all');
  const [paymentFilter, setPayFilter] = useState<PaymentStatus | 'All'>('All');
  const [sort, setSort]               = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [drawerOrder, setDrawerOrder] = useState<AppOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<AppOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalOrders     = orders.length;
  const pendingOrders   = orders.filter(o => o.status === 'pending').length;
  const totalRevenue    = orders.filter(o => o.status !== 'cancelled' && o.paymentStatus !== 'failed').reduce((acc, o) => acc + o.total, 0);
  const actAttention    = orders.filter(o => o.paymentStatus === 'failed' || (o.status === 'pending' && o.paymentStatus === 'paid')).length;

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...orders];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }

    if (tabFilter !== 'all') {
      if (tabFilter === 'attention') {
        list = list.filter(o => o.paymentStatus === 'failed' || (o.status === 'pending' && o.paymentStatus === 'paid'));
      } else {
        list = list.filter(o => o.status === tabFilter);
      }
    }

    if (paymentFilter !== 'All') {
      list = list.filter(o => o.paymentStatus === paymentFilter);
    }

    list.sort((a, b) => {
      let va = a[sort.key] as string | number;
      let vb = b[sort.key] as string | number;
      
      // Basic date string comparison for mock
      if (sort.key === 'createdAt') {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      }

      const cmp = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [orders, search, tabFilter, paymentFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const allPageSelected = paged.length > 0 && paged.every(o => selected.has(o.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) paged.forEach(o => next.delete(o.id));
      else paged.forEach(o => next.add(o.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const changeStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, status, updatedAt: 'Just now' };
      updated.activity = [{
        action: `Status Updated to ${status}`,
        status: status,
        timestamp: 'Just now',
        actor: 'Admin'
      }, ...o.activity];
      return updated;
    }));
    if (drawerOrder?.id === id) {
      setDrawerOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleBulkAction = (action: 'processing' | 'shipped') => {
    setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status: action } : o));
    setSelected(new Set());
  };

  const deleteSelected = () => {
    setOrders(prev => prev.filter(o => !selected.has(o.id)));
    setSelected(new Set());
  };

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all',        label: 'All Orders', count: orders.length },
    { key: 'attention',  label: 'Attention Needed', count: actAttention },
    { key: 'pending',    label: 'Pending',    count: orders.filter(o => o.status === 'pending').length },
    { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { key: 'shipped',    label: 'Shipped',    count: orders.filter(o => o.status === 'shipped').length },
  ];

  const PAY_STATUSES: Array<PaymentStatus | 'All'> = ['All', 'paid', 'unpaid', 'failed', 'refunded'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Orders Management</h2>
          <p className="text-neutral-500 mt-1 text-sm">View, fulfill, and track customer orders across the platform.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <i className="fi fi-rr-download text-lg flex items-center justify-center shrink-0" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume',     value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: 'fi fi-rr-dollar', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Orders',     value: totalOrders,    icon: 'fi fi-rr-shopping-bag', color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Processing',value: pendingOrders, icon: 'fi fi-rr-clock-three',       color: 'text-amber-600 bg-amber-50' },
          { label: 'Action Required',  value: actAttention,   icon: 'fi fi-rr-triangle-warning',color: actAttention > 0 ? 'text-rose-600 bg-rose-50' : 'text-neutral-600 bg-neutral-50' },
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
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <i className="fi fi-rr-trash w-3.5 h-3.5 flex items-center justify-center shrink-0" /> Delete
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
        <div className="overflow-x-auto min-h-[400px]">
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
              {paged.length === 0 ? (
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
              ) : paged.map((order) => {
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
                        <span className="font-bold text-neutral-900 font-mono text-sm">{order.id}</span>
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
                         <p className="font-semibold text-neutral-900 truncate max-w-[160px]">{order.customerName}</p>
                         <p className="text-xs text-neutral-500 truncate max-w-[160px] mt-0.5">{order.customerEmail}</p>
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
                        ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
              {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-neutral-900">{filtered.length}</span> orders
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
