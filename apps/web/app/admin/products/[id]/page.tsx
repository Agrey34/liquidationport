'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ─── Helper Types ─────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  name?: string | null;
  sku?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  stock: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  variants?: ProductVariant[];
}

// ─── Helper Components ────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; icon: string }> = {
  'Active':       { color: 'bg-emerald-100 text-emerald-700', icon: 'fi fi-rr-check-circle' },
  'Draft':        { color: 'bg-amber-100 text-amber-700',     icon: 'fi fi-rr-triangle-warning' },
  'Out of Stock': { color: 'bg-rose-100 text-rose-700',       icon: 'fi fi-rr-cross-circle' },
  'Archived':     { color: 'bg-neutral-100 text-neutral-500', icon: 'fi fi-rr-box' },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { color: 'bg-neutral-100 text-neutral-500', icon: 'fi fi-rr-box' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <i className={`${config.icon} w-3 h-3 flex items-center justify-center`} />
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<ProductDetail>(`/products/${id}`);
        setProduct(res.data);
      } catch (err: unknown) {
        console.error('Failed to load product details:', err);
        setError(err instanceof Error ? err.message : 'Product not found.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      alert('Product deleted successfully!');
      router.push('/admin/products');
    } catch (err: unknown) {
      alert(`Failed to delete product: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-neutral-500 font-semibold text-sm">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 bg-white border border-neutral-200 rounded-2xl shadow-sm max-w-lg mx-auto">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fi fi-rr-triangle-warning text-2xl flex items-center justify-center" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 mb-1">Failed to load product</h3>
        <p className="text-sm text-rose-500 max-w-sm mx-auto mb-6">{error || 'Product details are unavailable.'}</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-colors shadow-sm"
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  const productStatus = product.stock === 0 ? 'Out of Stock' : 'Active';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 transition-all"
          >
            <i className="fi fi-rr-arrow-small-left text-lg flex items-center justify-center shrink-0" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{product.name}</h2>
              <StatusBadge status={productStatus} />
            </div>
            <p className="text-neutral-500 mt-0.5 text-sm">Product detail overview and statistics.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-1.5"
          >
            <i className="fi fi-rr-trash text-lg flex items-center justify-center shrink-0" /> Delete
          </button>
          <Link
            href={`/admin/products/${id}/edit`}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-all shadow-sm flex items-center gap-1.5"
          >
            <i className="fi fi-rr-pencil text-lg flex items-center justify-center shrink-0" /> Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <i className="fi fi-rr-document text-lg text-neutral-400" /> Basic Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Category</p>
                <p className="text-sm font-semibold text-neutral-800 mt-0.5">{product.category?.name || 'Other'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Slug</p>
                <p className="text-sm font-mono text-neutral-800 mt-0.5">{product.slug}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Description</p>
              <p className="text-sm text-neutral-600 mt-1 leading-relaxed whitespace-pre-wrap">
                {product.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <i className="fi fi-rr-boxes text-lg text-neutral-400" /> Product Variants
            </h3>
            {!product.variants || product.variants.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">No variants are defined for this product.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {product.variants.map((v: ProductVariant, index: number) => (
                  <div key={v.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{v.name || `Variant ${index + 1}`}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">SKU: <span className="font-mono">{v.sku || '-'}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-900">${Number(v.price || 0).toFixed(2)}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Stock: {v.stock ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inventory & Pricing Summary */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <i className="fi fi-rr-chart-pie text-lg text-neutral-400" /> Sourcing & pricing
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Retail Sale Price</span>
                <span className="text-base font-bold text-neutral-900">${Number(product.price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Available Stock</span>
                <span className="text-sm font-semibold text-neutral-800">{product.stock} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Created At</span>
                <span className="text-sm font-semibold text-neutral-800">
                  {new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
