'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Boxes,
  BarChart3,
} from 'lucide-react';

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
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: 'PRD-001', name: 'Amazon Customer Returns Pallet – Mixed Electronics', sku: 'ELC-PAL-001', category: 'Electronics', price: 1250.00, stock: 14, status: 'Active', image: 'EL', createdAt: 'Apr 10, 2025' },
  { id: 'PRD-002', name: 'Home & Garden Liquidation Lot (150 Items)', sku: 'HMG-LOT-002', category: 'Home & Garden', price: 480.00, stock: 8, status: 'Active', image: 'HG', createdAt: 'Apr 9, 2025' },
  { id: 'PRD-003', name: 'Clothing & Apparel Overstock Bundle', sku: 'APP-BND-003', category: 'Apparel', price: 320.00, stock: 0, status: 'Out of Stock', image: 'AP', createdAt: 'Apr 8, 2025' },
  { id: 'PRD-004', name: 'Walmart Returns – Small Appliances Pallet', sku: 'APL-PAL-004', category: 'Electronics', price: 890.00, stock: 5, status: 'Active', image: 'SA', createdAt: 'Apr 7, 2025' },
  { id: 'PRD-005', name: 'Toy & Games Seasonal Clearance Lot', sku: 'TOY-LOT-005', category: 'Toys & Games', price: 210.00, stock: 22, status: 'Draft', image: 'TG', createdAt: 'Apr 6, 2025' },
  { id: 'PRD-006', name: 'Tool & Hardware Contractor Returns', sku: 'HRD-RTN-006', category: 'Tools & Hardware', price: 760.00, stock: 3, status: 'Active', image: 'TH', createdAt: 'Apr 5, 2025' },
  { id: 'PRD-007', name: 'Sports & Outdoors Bulk Lot – 200 Units', sku: 'SPT-BLK-007', category: 'Sports', price: 540.00, stock: 11, status: 'Active', image: 'SO', createdAt: 'Apr 4, 2025' },
  { id: 'PRD-008', name: 'Beauty & Personal Care Overstock', sku: 'BPC-OVR-008', category: 'Beauty', price: 185.00, stock: 0, status: 'Archived', image: 'BP', createdAt: 'Apr 3, 2025' },
  { id: 'PRD-009', name: 'Office Furniture Customer Returns – 20pc', sku: 'OFC-RTN-009', category: 'Furniture', price: 1800.00, stock: 2, status: 'Active', image: 'OF', createdAt: 'Apr 2, 2025' },
  { id: 'PRD-010', name: 'Pet Supplies Mixed Lot – 300 Items', sku: 'PET-MIX-010', category: 'Pet Supplies', price: 290.00, stock: 18, status: 'Draft', image: 'PS', createdAt: 'Apr 1, 2025' },
  { id: 'PRD-011', name: 'Audio & Headphones Returns Pallet', sku: 'AUD-PAL-011', category: 'Electronics', price: 670.00, stock: 7, status: 'Active', image: 'AH', createdAt: 'Mar 31, 2025' },
  { id: 'PRD-012', name: 'Baby & Toddler Products Mixed Returns', sku: 'BBY-MIX-012', category: 'Baby', price: 350.00, stock: 0, status: 'Out of Stock', image: 'BT', createdAt: 'Mar 30, 2025' },
];

const CATEGORIES = ['All', 'Electronics', 'Home & Garden', 'Apparel', 'Toys & Games', 'Tools & Hardware', 'Sports', 'Beauty', 'Furniture', 'Pet Supplies', 'Baby'];
const STATUSES: Array<ProductStatus | 'All'> = ['All', 'Active', 'Draft', 'Out of Stock', 'Archived'];
const PAGE_SIZE = 8;

// ─── Helper Components ────────────────────────────────────────────────────────

const statusConfig: Record<ProductStatus, { color: string; icon: React.FC<{ className?: string }> }> = {
  'Active':       { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  'Draft':        { color: 'bg-amber-100 text-amber-700',     icon: AlertTriangle },
  'Out of Stock': { color: 'bg-rose-100 text-rose-700',       icon: XCircle },
  'Archived':     { color: 'bg-neutral-100 text-neutral-500', icon: Package },
};

const avatarColors: Record<string, string> = {
  EL: 'bg-blue-600', HG: 'bg-emerald-600', AP: 'bg-purple-600',
  SA: 'bg-sky-600',  TG: 'bg-orange-500',  TH: 'bg-stone-600',
  SO: 'bg-green-600',BP: 'bg-pink-500',    OF: 'bg-indigo-600',
  PS: 'bg-teal-600', AH: 'bg-violet-600',  BT: 'bg-rose-500',
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const { color, icon: Icon } = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-300 ml-1" />;
  return sort.dir === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 text-neutral-900 ml-1" />
    : <ArrowDown className="w-3.5 h-3.5 text-neutral-900 ml-1" />;
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowMenu({ productId, onDelete }: { productId: string; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" id={`row-menu-${productId}`}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
            <Link
              href={`/admin/products/${productId}`}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye className="w-4 h-4 text-neutral-400" /> View Details
            </Link>
            <Link
              href={`/admin/products/${productId}/edit`}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Edit className="w-4 h-4 text-neutral-400" /> Edit Product
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            <button
              onClick={() => { onDelete(productId); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts]       = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCat]      = useState('All');
  const [statusFilter, setStatus]     = useState<ProductStatus | 'All'>('All');
  const [sort, setSort]               = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

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
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  // Delete
  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  };
  const handleBulkDelete = () => {
    setProducts(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set());
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
          <Plus className="w-4 h-4" />
          Add New Pallet
        </Link>
      </div>

      {/* ── KPI Stats ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',  value: totalProducts,                       icon: Boxes,      color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Listings', value: activeProducts,                      icon: CheckCircle2,color:'text-emerald-600 bg-emerald-50' },
          { label: 'Out of Stock',    value: outOfStock,                          icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
          { label: 'Est. Total Value',value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-violet-600 bg-violet-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-neutral-900 truncate">{value}</p>
              <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              id="product-search"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {/* Status filter */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => { setStatus(e.target.value as ProductStatus | 'All'); setPage(1); }}
              className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all cursor-pointer"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>

            {/* Toggle More Filters */}
            <button
              id="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex flex-wrap gap-2 items-center">
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
                <Trash2 className="w-3.5 h-3.5" />
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

        {/* ── Table ──────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-neutral-300 text-neutral-900 cursor-pointer accent-neutral-900"
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
                    onClick={() => toggleSort(col.key)}
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
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Package className="w-7 h-7 text-neutral-400" />
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
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0 ${avatarColors[product.image] ?? 'bg-neutral-400'}`}>
                        {product.image}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate max-w-[220px]" title={product.name}>
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
                      <Tag className="w-3.5 h-3.5 text-neutral-400" />
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
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <RowMenu productId={product.id} onDelete={handleDelete} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────── */}
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
              <ChevronLeft className="w-4 h-4" />
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
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
