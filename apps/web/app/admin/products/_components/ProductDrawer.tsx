'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { getMediaUrl } from '@/lib/image-url';
import { formatConditionLabel } from '@/lib/condition';

// ─── Badge Configs ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; icon: string }> = {
  Active: { color: 'bg-emerald-100 text-emerald-800', icon: 'fi fi-rr-check-circle' },
  Draft: { color: 'bg-amber-100 text-amber-800', icon: 'fi fi-rr-triangle-warning' },
  'Out of Stock': { color: 'bg-rose-100 text-rose-800', icon: 'fi fi-rr-cross-circle' },
  Archived: { color: 'bg-neutral-100 text-neutral-600', icon: 'fi fi-rr-box' },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { color: 'bg-neutral-100 text-neutral-600', icon: 'fi fi-rr-box' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
      <i className={`${config.icon} w-3.5 h-3.5 flex items-center justify-center`} />
      {status}
    </span>
  );
}

export interface InitialProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  image: string;
  createdAt: string;
}

export interface DrawerProductVariant {
  id: string;
  name: string | null;
  sku: string | null;
  price: string | number;
  stock: number;
  condition?: string | null;
  upc?: string | null;
  msrp?: string | number | null;
}

export interface DrawerManifestItem {
  id?: string;
  manufacturer?: string;
  productName?: string;
  product?: string;
  condition?: string;
  upc?: string;
  qty?: number;
  msrp?: number;
}

export interface DrawerProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  stock: number;
  condition?: string | null;
  status?: string | null;
  comparePrice?: string | number | null;
  costPrice?: string | number | null;
  sku?: string | null;
  weight?: string | number | null;
  manifest?: DrawerManifestItem[] | null;
  createdAt: string;
  category?: {
    name: string;
  } | null;
  media?: {
    id: string;
    url: string;
    altText?: string | null;
    position?: number | null;
  }[];
  variants?: DrawerProductVariant[];
}

export function ProductDrawer({
  productId,
  onClose,
  onDeleteSuccess,
  initialData,
}: {
  productId: string;
  onClose: () => void;
  onDeleteSuccess: (id: string) => void;
  initialData?: InitialProductData;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'manifest' | 'variants'>('overview');

  // Initialize state with optimistic initial data if provided
  const [product, setProduct] = useState<DrawerProduct | null>(() => {
    if (initialData) {
      return {
        id: initialData.id,
        name: initialData.name,
        slug: initialData.sku ? initialData.sku.toLowerCase() : '',
        price: initialData.price,
        stock: initialData.stock,
        status: initialData.status,
        sku: initialData.sku,
        category: { name: initialData.category },
        createdAt: initialData.createdAt,
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const activeRequestIdRef = useRef<string>(productId);

  // Sync optimistic initialData when switching product ID
  useEffect(() => {
    activeRequestIdRef.current = productId;
    if (initialData && initialData.id === productId) {
      setProduct({
        id: initialData.id,
        name: initialData.name,
        slug: initialData.sku ? initialData.sku.toLowerCase() : '',
        price: initialData.price,
        stock: initialData.stock,
        status: initialData.status,
        sku: initialData.sku,
        category: { name: initialData.category },
        createdAt: initialData.createdAt,
      });
      setLoading(false);
      setError(null);
    } else {
      setProduct(null);
      setLoading(true);
      setError(null);
    }
  }, [productId, initialData]);

  const loadProductDetails = useCallback(
    async (signal?: AbortSignal) => {
      const currentId = productId;
      try {
        if (!initialData) {
          setLoading(true);
        }
        setError(null);

        const res = await apiFetch<DrawerProduct>(`/products/${currentId}`, { signal });

        if (activeRequestIdRef.current === currentId) {
          setProduct(res.data);
        }
      } catch (err: unknown) {
        if (signal?.aborted || activeRequestIdRef.current !== currentId) {
          return;
        }
        console.error('[ProductDrawer] Failed to fetch details:', err);
        const errMsg = err instanceof Error ? err.message : 'Product details could not be loaded.';
        setError(errMsg);
      } finally {
        if (activeRequestIdRef.current === currentId) {
          setLoading(false);
        }
      }
    },
    [productId, initialData]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadProductDetails(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProductDetails]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pallet listing?')) return;
    try {
      setDeleting(true);
      await apiFetch(`/products/${productId}`, { method: 'DELETE' });
      alert('Product deleted successfully!');
      onDeleteSuccess(productId);
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete product.';
      alert(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const productStatus = product?.status || (product?.stock === 0 ? 'Out of Stock' : 'Active');

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 shrink-0 bg-neutral-50/70">
          <div className="flex flex-col gap-1 min-w-0">
            {loading && !product ? (
              <h2 className="text-xl font-bold text-neutral-900">Loading Pallet Details...</h2>
            ) : error && !product ? (
              <h2 className="text-xl font-bold text-rose-600">Product Error</h2>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-neutral-900 truncate max-w-sm md:max-w-md" title={product?.name}>
                  {product?.name}
                </h2>
                <StatusBadge status={productStatus} />
              </div>
            )}
            {product && (
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                <span>SKU: {product.sku || 'N/A'}</span>
                <span>•</span>
                <span>ID: {product.id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors bg-white border border-neutral-200 shrink-0"
          >
            <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
          </button>
        </div>

        {/* Tabs */}
        {product && (
          <div className="flex border-b border-neutral-200 shrink-0 px-6 bg-white">
            {(['overview', 'manifest', 'variants'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/30">
          {loading && !product ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
              <p className="text-neutral-400 text-xs font-semibold">Loading details...</p>
            </div>
          ) : error && !product ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <i className="fi fi-rr-triangle-warning text-xl flex items-center justify-center" />
              </div>
              <p className="text-rose-600 text-sm font-semibold">{error}</p>
              <button
                onClick={() => loadProductDetails()}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && product && (
                <div className="space-y-6">
                  {/* KPI Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Sale Price</p>
                      <p className="text-xl font-black text-neutral-900 mt-1">
                        ${parseFloat(String(product.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {product.comparePrice && (
                      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Est. MSRP</p>
                        <p className="text-xl font-black text-emerald-700 mt-1">
                          ${parseFloat(String(product.comparePrice)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Stock Qty</p>
                      <p className="text-xl font-black text-neutral-900 mt-1">{product.stock} units</p>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Category</h4>
                        <p className="text-sm font-semibold text-neutral-800 mt-1">{product.category?.name || 'General Merchandise'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Condition</h4>
                        <p className="text-sm font-semibold text-neutral-800 mt-1">
                          {formatConditionLabel(product.condition)}
                        </p>
                      </div>
                    </div>
                    {product.weight && (
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Weight</h4>
                        <p className="text-sm font-semibold text-neutral-800 mt-1">{product.weight} lbs</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description</h4>
                      <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed whitespace-pre-wrap">
                        {product.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  {product.media && product.media.length > 0 && (
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Pallet Photos ({product.media.length})
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {product.media.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 group"
                          >
                            <Image
                              unoptimized
                              fill={true}
                              src={getMediaUrl(item.url)}
                              alt={item.altText || `${product.name} ${idx + 1}`}
                              className="object-cover hover:scale-105 transition-transform"
                            />
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 text-[9px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded shadow">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manifest Tab */}
              {activeTab === 'manifest' && product && (
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/70">
                    <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Pallet Manifest Items</h3>
                  </div>
                  {product.manifest && Array.isArray(product.manifest) && product.manifest.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-700">
                          <tr>
                            <th className="px-4 py-2.5">Product</th>
                            <th className="px-4 py-2.5">Manufacturer</th>
                            <th className="px-4 py-2.5">Condition</th>
                            <th className="px-4 py-2.5 text-center">QTY</th>
                            <th className="px-4 py-2.5 text-right">MSRP</th>
                            <th className="px-4 py-2.5 text-right">EXT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {product.manifest.map((item, idx) => {
                            const ext = (Number(item.qty) || 1) * (Number(item.msrp) || 0);
                            return (
                              <tr key={idx} className="hover:bg-neutral-50/50">
                                <td className="px-4 py-2.5 font-semibold text-neutral-900">{item.productName || item.product || '—'}</td>
                                <td className="px-4 py-2.5 text-neutral-600">{item.manufacturer || '—'}</td>
                                <td className="px-4 py-2.5 text-neutral-500">{item.condition || '—'}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-neutral-900">{item.qty || 1}</td>
                                <td className="px-4 py-2.5 text-right text-neutral-700">
                                  {item.msrp ? `$${Number(item.msrp).toFixed(2)}` : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-neutral-900">
                                  {ext > 0 ? `$${ext.toFixed(2)}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-neutral-400">No manifest items defined on this pallet listing.</div>
                  )}
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && product && (
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/70">
                    <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Product Variants</h3>
                  </div>
                  {loading && !product.variants ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                      <p className="text-neutral-400 text-xs font-semibold">Loading variants...</p>
                    </div>
                  ) : !product.variants || product.variants.length === 0 ? (
                    <div className="p-6 text-center text-sm text-neutral-400">No variants are defined for this product.</div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {product.variants.map((v, idx) => (
                        <div key={v.id} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">{v.name || `Variant ${idx + 1}`}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              SKU: <span className="font-mono">{v.sku || '-'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-neutral-900">${parseFloat(String(v.price || 0)).toFixed(2)}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">Stock: {v.stock} units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {product && (
          <div className="px-6 py-4 border-t border-neutral-200 flex gap-3 shrink-0 bg-white">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 bg-white text-rose-600 rounded-xl text-sm font-bold border border-rose-200 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i className="fi fi-rr-trash text-base flex items-center justify-center shrink-0" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              onClick={onClose}
            >
              <i className="fi fi-rr-pencil text-base flex items-center justify-center shrink-0" />
              Edit Pallet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
