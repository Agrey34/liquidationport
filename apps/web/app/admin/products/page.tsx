
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { getMediaUrl } from '@/lib/image-url';
import { ProductDrawer } from './_components/ProductDrawer';

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductStatus = 'Active' | 'Draft' | 'Out of Stock' | 'Archived';
type SortKey = 'name' | 'sku' | 'category' | 'price' | 'stock' | 'status';
type SortDir = 'asc' | 'desc';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  imageUrl?: string;
  createdAt: string;
}

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  stock: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  variants?: {
    sku: string;
  }[];
  media?: {
    id: string;
    url: string;
    altText?: string | null;
    position?: number | null;
  }[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORIES = ['All', 'Electronics', 'Home & Garden', 'Apparel', 'Toys & Games', 'Tools & Hardware', 'Sports', 'Beauty', 'Furniture', 'Pet Supplies', 'Baby'];
const STATUSES: Array<ProductStatus | 'All'> = ['All', 'Active', 'Draft', 'Out of Stock', 'Archived'];
const PAGE_SIZE = 8;

// ─── Helper Functions ────────────────────────────────────────────────────────

const getAvatarKey = (categoryName?: string | null): string => {
  if (!categoryName) return 'OT';
  const name = categoryName.toLowerCase();
  if (name.includes('electronics')) return 'EL';
  if (name.includes('home')) return 'HG';
  if (name.includes('apparel') || name.includes('clothing')) return 'AP';
  if (name.includes('appliances')) return 'SA';
  if (name.includes('toy') || name.includes('game')) return 'TG';
  if (name.includes('tool') || name.includes('hardware')) return 'TH';
  if (name.includes('sport') || name.includes('outdoor')) return 'SO';
  if (name.includes('beauty') || name.includes('personal')) return 'BP';
  if (name.includes('furniture')) return 'OF';
  if (name.includes('pet')) return 'PS';
  if (name.includes('audio') || name.includes('headphone')) return 'AH';
  if (name.includes('baby') || name.includes('toddler')) return 'BT';
  return categoryName.substring(0, 2).toUpperCase();
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
};


// ─── Helper Components ────────────────────────────────────────────────────────

const statusConfig: Record<ProductStatus, { color: string; icon: string }> = {
  'Active':       { color: 'bg-emerald-100 text-emerald-700', icon: 'fi fi-rr-check-circle' },
  'Draft':        { color: 'bg-amber-100 text-amber-700',     icon: 'fi fi-rr-triangle-warning' },
  'Out of Stock': { color: 'bg-rose-100 text-rose-700',       icon: 'fi fi-rr-cross-circle' },
  'Archived':     { color: 'bg-neutral-100 text-neutral-500', icon: 'fi fi-rr-box' },
};

const avatarColors: Record<string, string> = {
  EL: 'bg-blue-600', HG: 'bg-emerald-600', AP: 'bg-purple-600',
  SA: 'bg-sky-600',  TG: 'bg-orange-500',  TH: 'bg-stone-600',
  SO: 'bg-green-600',BP: 'bg-pink-500',    OF: 'bg-indigo-600',
  PS: 'bg-teal-600', AH: 'bg-violet-600',  BT: 'bg-rose-500',
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const { color, icon: IconClass } = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <i className={`${IconClass} w-3 h-3 flex items-center justify-center`} />
      {status}
    </span>
  );
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <i className="fi fi-rr-arrows-up-down w-3.5 h-3.5 text-neutral-300 ml-1 flex items-center justify-center shrink-0" />;
  return sort.dir === 'asc'
    ? <i className="fi fi-rr-arrow-up w-3.5 h-3.5 text-neutral-900 ml-1 flex items-center justify-center shrink-0" />
    : <i className="fi fi-rr-arrow-down w-3.5 h-3.5 text-neutral-900 ml-1 flex items-center justify-center shrink-0" />;
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowMenu({ productId, onDelete, onViewDetails }: {
  productId: string;
  onDelete: (id: string) => void;
  onViewDetails: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" id={`row-menu-${productId}`}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <i className="fi fi-rr-menu-dots text-lg flex items-center justify-center shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
            <button
              onClick={() => { onViewDetails(); setOpen(false); }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <i className="fi fi-rr-eye text-lg text-neutral-400 flex items-center justify-center shrink-0" /> View Details
            </button>
            <Link
              href={`/admin/products/${productId}/edit`}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <i className="fi fi-rr-pencil text-lg text-neutral-400 flex items-center justify-center shrink-0" /> Edit Product
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            <button
              onClick={() => { onDelete(productId); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <i className="fi fi-rr-trash text-lg flex items-center justify-center shrink-0" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCat]      = useState('All');
  const [statusFilter, setStatus]     = useState<ProductStatus | 'All'>('All');
  const [sort, setSort]               = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<ApiProduct[]>('/products?limit=100');
      // Normalize raw data whether it's directly an array in res.data or nested in a data property
      const rawList: ApiProduct[] = Array.isArray(res.data)
        ? res.data
        : (res.data && Array.isArray((res.data as unknown as { data: ApiProduct[] }).data)
          ? (res.data as unknown as { data: ApiProduct[] }).data
          : (Array.isArray(res) ? (res as ApiProduct[]) : []));

      const mapped: Product[] = rawList.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || p.variants?.[0]?.sku || p.slug?.toUpperCase() || 'SKU-PENDING',
        category: p.category?.name || 'Other',
        price: typeof p.price === 'string' ? parseFloat(p.price) : p.price || 0,
        stock: p.stock || 0,
        status: (p.status as ProductStatus) || (p.stock === 0 ? 'Out of Stock' : 'Active'),
        image: getAvatarKey(p.category?.name),
        imageUrl: p.media?.[0]?.url ? getMediaUrl(p.media[0].url) : undefined,
        createdAt: formatDate(p.createdAt),
      }));
      setProducts(mapped);
    } catch (err: unknown) {
      console.error('Failed to fetch products:', err);
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred while loading products.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  // Stats
  const totalProducts  = products.length;
  const activeProducts = products.filter(p => p.status === 'Active').length;
  const outOfStock     = products.filter(p => p.status === 'Out of Stock').length;
  const totalValue     = products.reduce((acc, p) => acc + p.price * Math.max(p.stock, 1), 0);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...products];
    if (search)             list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== 'All') list = list.filter(p => p.category === categoryFilter);
    if (statusFilter   !== 'All') list = list.filter(p => p.status   === statusFilter);
    list.sort((a, b) => {
      const va = a[sort.key]; const vb = b[sort.key];
      const cmp = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, search, categoryFilter, statusFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Sorting
  const toggleSort = (key: SortKey) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  // Selection
  const allPageSelected = paged.length > 0 && paged.every(p => selected.has(p.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) paged.forEach(p => next.delete(p.id));
      else paged.forEach(p => next.add(p.id));
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

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete product: ${errMsg}`);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete the ${selected.size} selected products?`)) return;
    try {
      await Promise.all(
        Array.from(selected).map(id => apiFetch(`/products/${id}`, { method: 'DELETE' }))
      );
      setProducts(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete some products: ${errMsg}`);
      fetchProducts();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Pallets &amp; Products</h2>
          <p className="text-neutral-500 mt-1 text-sm">Manage inventory, manifest details, and pricing.</p>
        </div>
        <Link
          href="/admin/products/create"
          id="add-product-btn"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-colors shadow-sm shrink-0"
        >
          <i className="fi fi-rr-plus text-lg flex items-center justify-center shrink-0" />
          Add New Pallet
        </Link>
      </div>

      {/* ── KPI Stats & Inventory Table ───────────────── */}
      {!loading && !error && products.length === 0 ? (
        <div className="text-center py-20 bg-white border border-neutral-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500">
            <i className="fi fi-rr-box text-2xl text-neutral-400 flex items-center justify-center shrink-0" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">No products in inventory</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
            Your product inventory is currently empty. List your first pallet to start selling.
          </p>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-colors shadow-sm"
          >
            <i className="fi fi-rr-plus text-lg flex items-center justify-center shrink-0" />
            Add Your First Pallet
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Products',  value: loading ? '...' : totalProducts,                       icon: 'fi fi-rr-boxes',      color: 'text-blue-600 bg-blue-50' },
              { label: 'Active Listings', value: loading ? '...' : activeProducts,                      icon: 'fi fi-rr-check-circle',color:'text-emerald-600 bg-emerald-50' },
              { label: 'Out of Stock',    value: loading ? '...' : outOfStock,                          icon: 'fi fi-rr-triangle-warning', color: 'text-rose-600 bg-rose-50' },
              { label: 'Est. Total Value',value: loading ? '...' : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: 'fi fi-rr-dollar', color: 'text-violet-600 bg-violet-50' },
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

          {/* Toolbar & Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md w-full">
                <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 flex items-center justify-center shrink-0" />
                <input
                  id="product-search"
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name or SKU..."
                  disabled={loading || !!error}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                {/* Status filter */}
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={e => { setStatus(e.target.value as ProductStatus | 'All'); setPage(1); }}
                  disabled={loading || !!error}
                  className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all cursor-pointer disabled:opacity-50"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                </select>

                {/* Toggle More Filters */}
                <button
                  id="toggle-filters-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={loading || !!error}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${showFilters ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'}`}
                >
                  <i className="fi fi-rr-settings-sliders text-lg flex items-center justify-center shrink-0" />
                  Filters
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex flex-wrap gap-2 items-center animate-in slide-in-from-top duration-300">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-1">Category:</span>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setCat(cat); setPage(1); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${categoryFilter === cat ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Bulk Action Bar */}
            {selected.size > 0 && (
              <div className="px-4 py-3 bg-neutral-900 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white">{selected.size} item{selected.size > 1 ? 's' : ''} selected</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <i className="fi fi-rr-trash w-3.5 h-3.5 flex items-center justify-center shrink-0" />
                    Delete Selected
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAll}
                        disabled={loading || !!error || paged.length === 0}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 cursor-pointer accent-neutral-900 disabled:opacity-50"
                      />
                    </th>
                    {([
                      { key: 'name',     label: 'Product' },
                      { key: 'sku',      label: 'SKU' },
                      { key: 'category', label: 'Category' },
                      { key: 'price',    label: 'Price' },
                      { key: 'stock',    label: 'Stock' },
                      { key: 'status',   label: 'Status' },
                    ] as { key: SortKey; label: string }[]).map(col => (
                      <th
                        key={col.key}
                        className={`px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors ${col.key === 'price' || col.key === 'stock' ? 'text-right' : ''}`}
                        onClick={() => !loading && !error && toggleSort(col.key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <SortIcon col={col.key} sort={sort} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto" />
                          <p className="text-neutral-500 text-sm">Loading products...</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-rose-600 bg-rose-50/50">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                            <i className="fi fi-rr-triangle-warning text-xl flex items-center justify-center shrink-0" />
                          </div>
                          <p className="font-semibold">Failed to load products</p>
                          <p className="text-sm text-rose-500 max-w-md mx-auto mb-2">{error}</p>
                          <button
                            type="button"
                            onClick={fetchProducts}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-700 transition-colors shadow-sm"
                          >
                            Retry Connection
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                            <i className="fi fi-rr-box text-lg text-neutral-400 flex items-center justify-center shrink-0" />
                          </div>
                          <p className="text-neutral-700 font-semibold">No products found</p>
                          <p className="text-neutral-400 text-sm">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : paged.map(product => (
                    <tr
                      key={product.id}
                      className={`hover:bg-neutral-50/60 transition-colors group ${selected.has(product.id) ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggleOne(product.id)}
                          className="w-4 h-4 rounded border-neutral-300 cursor-pointer accent-neutral-900"
                        />
                      </td>

                      {/* Product Name + Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <Image
                              unoptimized
                              src={product.imageUrl}
                              alt={product.name}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-neutral-200"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0 ${avatarColors[product.image] ?? 'bg-neutral-400'}`}>
                              {product.image}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 truncate max-w-55" title={product.name}>
                              {product.name}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">{product.createdAt}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded-md">{product.sku}</span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                          <i className="fi fi-rr-tags w-3.5 h-3.5 text-neutral-400 flex items-center justify-center shrink-0" />
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-neutral-900">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-semibold tabular-nums ${product.stock === 0 ? 'text-rose-500' : product.stock <= 3 ? 'text-amber-500' : 'text-neutral-900'}`}>
                          {product.stock === 0 ? 'Sold Out' : product.stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={product.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDrawerProductId(product.id)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                            title="View Details"
                          >
                            <i className="fi fi-rr-eye text-lg flex items-center justify-center shrink-0" />
                          </button>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit"
                          >
                            <i className="fi fi-rr-pencil text-lg flex items-center justify-center shrink-0" />
                          </Link>
                          <RowMenu
                            productId={product.id}
                            onDelete={handleDelete}
                            onViewDetails={() => setDrawerProductId(product.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="px-4 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">
                  Showing <span className="font-semibold text-neutral-900">{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-neutral-900">{filtered.length}</span> products
                </p>
                <div className="flex items-center gap-1">
                  <button
                    id="prev-page-btn"
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
                    id="next-page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <i className="fi fi-rr-angle-right text-lg flex items-center justify-center shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {drawerProductId && (
        <ProductDrawer
          productId={drawerProductId}
          initialData={products.find((p) => p.id === drawerProductId)}
          onClose={() => setDrawerProductId(null)}
          onDeleteSuccess={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
        />
      )}
    </div>
  );
}
