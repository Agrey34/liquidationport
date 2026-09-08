'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Filter, ArrowUpDown, Tag, SlidersHorizontal, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getMediaUrl } from '@/lib/image-url';
import { formatConditionLabel } from '@/lib/condition';
import PalletCard from '@/app/(shop)/components/PalletCard';

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  stock: number;
  condition?: string | null;
  createdAt: string;
  comparePrice?: number | string | null;
  costPrice?: number | string | null;
  liquidatorName?: string | null;
  manifest?: Array<{
    qty?: number;
    msrp?: number | string;
  }> | null;
  category?: {
    id: string;
    name: string;
  } | null;
  variants?: {
    id?: string;
    sku?: string;
    price?: number | string | null;
    stock?: number | string | null;
    msrp?: number | string | null;
  }[];
  media?: {
    id?: string;
    url: string;
    altText?: string | null;
  }[];
}

interface ShopPallet {
  id: string;
  slug: string;
  title: string;
  retailer: string;
  condition: string;
  conditionGrade: string;
  lot: string;
  qty: number;
  msrp: number;
  comparePrice?: number | string | null;
  price: number;
  originalPrice: number | null;
  image: string;
  category: string;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=600&auto=format&fit=crop',
];

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [pallets, setPallets] = useState<ShopPallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<ApiProduct[]>('/products?limit=100');
        const rawList: ApiProduct[] = Array.isArray(res.data)
          ? res.data
          : (res.data && Array.isArray((res.data as unknown as { data: ApiProduct[] }).data)
            ? (res.data as unknown as { data: ApiProduct[] }).data
            : (Array.isArray(res) ? (res as ApiProduct[]) : []));

        const mapped: ShopPallet[] = rawList.map((p, index) => {
          const numPrice = typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price || 0);
          const fallbackImg = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          const imgUrl = getMediaUrl(p.media?.[0]?.url, fallbackImg);
          const catName = p.category?.name || 'General Merchandise';
          const retailerName = p.liquidatorName || catName;
          const conditionLabel = formatConditionLabel(p.condition);

          // DYNAMIC MSRP: Priority 1: comparePrice, Priority 2: manifest total, Priority 3: variant msrp
          let dynamicMsrp = p.comparePrice != null ? Number(p.comparePrice) : 0;
          if ((!dynamicMsrp || dynamicMsrp <= 0) && p.manifest && Array.isArray(p.manifest)) {
            const manifestTotal = p.manifest.reduce(
              (sum, item) => sum + Number(item.qty || 1) * Number(item.msrp || 0),
              0
            );
            if (manifestTotal > 0) dynamicMsrp = manifestTotal;
          }
          if ((!dynamicMsrp || dynamicMsrp <= 0) && p.variants && Array.isArray(p.variants)) {
            const variantTotal = p.variants.reduce(
              (sum, v) => sum + Number(v.stock || 1) * Number(v.msrp || 0),
              0
            );
            if (variantTotal > 0) dynamicMsrp = variantTotal;
          }

          return {
            id: p.id,
            slug: p.slug || p.id,
            title: p.name,
            retailer: retailerName,
            condition: conditionLabel,
            conditionGrade: conditionLabel,
            lot: '1 Pallet',
            qty: p.stock || 1,
            msrp: dynamicMsrp > 0 ? Number(dynamicMsrp.toFixed(2)) : 0,
            comparePrice: p.comparePrice,
            price: numPrice,
            originalPrice: dynamicMsrp > 0 ? Number(dynamicMsrp.toFixed(2)) : null,
            image: imgUrl,
            category: catName,
          };
        });

        setPallets(mapped);
      } catch (err: unknown) {
        console.error('Failed to load products for catalog:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(pallets.map(p => p.category)))];
  }, [pallets]);

  const conditions = useMemo(() => {
    return ['All', ...Array.from(new Set(pallets.map(p => p.conditionGrade).filter(Boolean)))];
  }, [pallets]);

  const filteredPallets = useMemo(() => {
    return pallets.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchCondition = selectedCondition === 'All' || p.conditionGrade === selectedCondition;
      return matchSearch && matchCategory && matchCondition;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0;
    });
  }, [pallets, searchQuery, selectedCategory, selectedCondition, sortBy]);

  return (
    <div className="bg-neutral-50 min-h-screen">

      {/* Page Header */}
      <div className="bg-neutral-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Live Inventory</h1>
          <p className="text-neutral-400 font-medium max-w-2xl mx-auto text-sm md:text-base">
            Browse premium overstock and liquidation pallets. Sourced directly and updated in real-time.
          </p>
          <div className="mt-8 max-w-xl mx-auto relative">
            <i className="fi fi-rr-search absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title, category, or LOT ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/15 placeholder:text-neutral-500 backdrop-blur-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Mobile Filter Toggle */}
          <div className="w-full flex items-center justify-between lg:hidden mb-4">
            <p className="text-sm font-bold text-neutral-600">{filteredPallets.length} Results</p>
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-xl text-sm font-bold bg-white text-neutral-900 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          {/* Sidebar Filters */}
          <div className={`w-full lg:w-64 shrink-0 lg:sticky lg:top-24 space-y-6 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-neutral-400" /> Category
              </h3>
              <div className="space-y-2">
                {categories.map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={selectedCategory === c}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900 cursor-pointer"
                    />
                    <span className={`text-sm tracking-wide ${selectedCategory === c ? 'font-bold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" /> Condition Grade
              </h3>
              <div className="space-y-2">
                {conditions.map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="condition"
                      value={c}
                      checked={selectedCondition === c}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900 cursor-pointer"
                    />
                    <span className={`text-sm tracking-wide ${selectedCondition === c ? 'font-bold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setSelectedCategory('All'); setSelectedCondition('All'); setSearchQuery(''); }}
              className="w-full py-2.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Clear All Filters
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full">
            <div className="hidden lg:flex items-center justify-between bg-white border border-neutral-200 rounded-2xl p-3 px-5 mb-6 shadow-sm">
              <p className="text-sm font-bold text-neutral-600">{filteredPallets.length} Results Found</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-neutral-500 flex items-center gap-1.5"><ArrowUpDown className="w-4 h-4" /> Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-none text-sm font-bold text-neutral-900 focus:ring-0 bg-transparent pr-8 cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-3">
                <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                <p className="text-neutral-500 font-semibold text-sm">Loading live pallets...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl p-8">
                <p className="text-rose-500 font-semibold text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : filteredPallets.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed border-neutral-300 rounded-3xl">
                <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-900">No pallets matched your search</h3>
                <p className="text-neutral-500 mt-1 text-sm">Try broadening your filters or checking back later.</p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSelectedCondition('All'); setSearchQuery(''); }}
                  className="mt-6 px-6 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPallets.map(pallet => (
                  <PalletCard key={pallet.id} pallet={pallet} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense boundary required for useSearchParams() in Next.js App Router
export default function ProductsCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    }>
      <ProductsCatalogContent />
    </Suspense>
  );
}
