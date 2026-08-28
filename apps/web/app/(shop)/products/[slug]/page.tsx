'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MapPin,
  Truck,
  ShieldCheck,
  Info,
  Barcode,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getMediaUrl, DEFAULT_PRODUCT_FALLBACK } from '@/lib/image-url';
import { useCart, useWishlist } from '@/lib/context/StoreContext';
import { formatConditionLabel } from '@/lib/condition';

interface ApiVariant {
  id?: string;
  sku?: string;
  name?: string;
  price?: number | string | null;
  stock?: number | string | null;
}

interface ApiMedia {
  id?: string;
  url: string;
  altText?: string | null;
}

interface ApiProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  stock: number;
  condition?: string | null;
  status?: string | null;
  comparePrice?: number | string | null;
  costPrice?: number | string | null;
  sku?: string | null;
  weight?: number | string | null;
  manifest?: Array<{
    manufacturer?: string;
    productName?: string;
    product?: string;
    condition?: string;
    upc?: string;
    qty?: number;
    msrp?: number;
  }> | null;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
  variants?: ApiVariant[];
  media?: ApiMedia[];
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=800&auto=format&fit=crop',
];

const TABS = ['Manifest', 'Overview', 'Shipping'];

export default function ProductDetailsPage() {
  const routeParams = useParams();
  const rawSlug = routeParams?.slug || '';
  const slug = typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : '';

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('Manifest');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllDimensions, setShowAllDimensions] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<ApiProductDetail>(`/products/${slug}`);
        const data =
          res.data && 'data' in (res.data as unknown as Record<string, unknown>)
            ? (res.data as unknown as { data: ApiProductDetail }).data
            : res.data;

        if (!data || !data.id) {
          throw new Error('Product not found.');
        }
        setProduct(data);
      } catch (err: unknown) {
        console.error('Failed to load product detail:', err);
        setError(err instanceof Error ? err.message : 'Unable to find this product.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-4 py-24">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-neutral-500 font-semibold text-sm">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-neutral-200 shadow-sm max-w-md w-full">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Product Not Found</h2>
          <p className="text-neutral-500 text-sm mb-6">
            {error || 'The requested listing does not exist or has been removed.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-800 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Retry
            </button>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Live Inventory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawPrice = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price || 0);
  const msrpPrice = product.comparePrice ? Number(product.comparePrice) : Number((rawPrice * 1.4).toFixed(2));
  const savings = Math.max(0, msrpPrice - rawPrice);
  const images =
    product.media && product.media.length > 0
      ? product.media.map((m) => getMediaUrl(m.url))
      : DEFAULT_IMAGES;
  const currentImage = images[activeImage] || images[0] || DEFAULT_PRODUCT_FALLBACK;
  const retailer = product.category?.name || 'General Merchandise';
  const unitsCount = product.stock || (product.variants?.reduce((sum, v) => sum + Number(v.stock || 1), 0) ?? 1);

  const handleAddToCart = () => {
    const primaryImg = images[0] || DEFAULT_PRODUCT_FALLBACK;
    addToCart({
      id: product.id,
      title: product.name,
      price: rawPrice,
      img: primaryImg,
      slug: product.slug,
      retailer,
      conditionGrade: product.condition || 'Customer Returns',
      unitsCount,
    });
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  const handleToggleWishlist = () => {
    const primaryImg = images[0] || DEFAULT_PRODUCT_FALLBACK;
    toggleWishlist({
      id: product.id,
      title: product.name,
      price: rawPrice,
      msrp: msrpPrice,
      img: primaryImg,
      slug: product.slug,
      retailer,
      conditionGrade: product.condition || 'Customer Returns',
      qty: unitsCount,
      category: retailer,
      status: product.status || 'Available',
    });
  };

  const handleDownloadManifest = () => {
    const headers = ['Manufacturer', 'Product Name', 'SKU', 'Condition', 'UPC', 'QTY', 'MSRP', 'EXT Price'];
    const csvRows = [
      headers.join(','),
      ...manifestItems.map((item) =>
        [
          `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
          `"${(item.productName || '').replace(/"/g, '""')}"`,
          `"${(item.product || '').replace(/"/g, '""')}"`,
          `"${(item.condition || '').replace(/"/g, '""')}"`,
          `"${(item.upc || '').replace(/"/g, '""')}"`,
          item.qty,
          item.msrp.toFixed(2),
          (item.msrp * item.qty).toFixed(2),
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${product.slug || 'pallet'}-manifest.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Derive manifest rows
  const manifestItems =
    product.manifest && Array.isArray(product.manifest) && product.manifest.length > 0
      ? product.manifest.map((m, i) => ({
          manufacturer: m.manufacturer || product.category?.name || 'Assorted Brands',
          productName: m.productName || m.product || `${product.name} (Item ${i + 1})`,
          product: m.product || `LOT-ITEM-${i + 1}`,
          condition: m.condition || product.condition || 'Untested Customer Returns',
          upc: m.upc || `00850020${1000 + i}`,
          qty: Number(m.qty || 1),
          msrp: m.msrp
            ? Number(m.msrp)
            : Number((rawPrice / Math.max(product.manifest?.length || 1, 1)).toFixed(2)),
        }))
      : product.variants && product.variants.length > 0
      ? product.variants.map((v, i) => ({
          manufacturer: product.category?.name || 'Assorted Brands',
          productName: v.name || `${product.name} (Variant ${i + 1})`,
          product: v.sku || `SKU-${i + 1}`,
          condition: product.condition || 'Untested Customer Returns',
          upc: `00850020${1000 + i}`,
          qty: Number(v.stock || 1),
          msrp: Number(v.price || rawPrice),
        }))
      : [
          {
            manufacturer: product.category?.name || 'Assorted Brands',
            productName: product.name,
            product: product.sku || product.slug?.toUpperCase().slice(0, 10) || 'GEN-SKU',
            condition: product.condition || 'Untested Customer Returns',
            upc: '008500201412',
            qty: product.stock || 1,
            msrp: msrpPrice,
          },
        ];

  const totalManifestItems = manifestItems.length;
  const totalPages = Math.ceil(totalManifestItems / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(currentPage * rowsPerPage, totalManifestItems);
  const paginatedManifestItems = manifestItems.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      
      {/* ─── Top Breadcrumbs, Title & Lot ID ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        {/* Breadcrumbs */}
        <div className="text-xs text-neutral-600 font-medium flex items-center gap-1.5 mb-1.5">
          <Link href="/products" className="hover:underline text-neutral-600">
            {retailer}
          </Link>
          <span>/</span>
          <span className="text-neutral-600">Pallets</span>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">{formatConditionLabel(product.condition)}</span>
        </div>

        {/* Product Title */}
        <h1 className="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">
          {product.name}
        </h1>

        {/* Lot ID */}
        <p className="text-xs text-neutral-500 font-medium mt-1">
          Lot ID: {product.sku || product.id.slice(0, 8)}
        </p>
      </div>

      {/* ─── Main Product Container Box ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
          
          {/* Header Bar inside white card */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Bentonville, AR</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm tracking-tight text-[#0071dc]">Walmart</span>
              <span className="text-amber-500 text-base leading-none font-black">*</span>
            </div>
          </div>

          {/* Card Body (2-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8">
            
            {/* Left: Gallery (Thumbnails + Main Image) */}
            <div className="lg:col-span-7 flex gap-4 items-start">
              
              {/* Thumbnail Strip */}
              <div className="flex flex-col gap-2.5 w-14 sm:w-16 shrink-0 max-h-[460px] overflow-y-auto no-scrollbar">
                {images.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-white overflow-hidden transition-all border flex items-center justify-center p-1 cursor-pointer ${
                      activeImage === i
                        ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-2xs'
                        : 'border-neutral-200 opacity-80 hover:opacity-100 hover:border-neutral-400'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Thumbnail ${i}`}
                      fill
                      unoptimized
                      className="object-contain mix-blend-multiply"
                      sizes="64px"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Main Image View */}
              <div className="flex-1 aspect-[4/3] bg-white rounded-lg flex items-center justify-center relative p-6 border border-neutral-100 overflow-hidden">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  priority
                  loading="eager"
                  unoptimized
                  className="object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                  }}
                />
              </div>
            </div>

            {/* Right: Buy Box, Specs & Description */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              
              {/* ASK PRICE */}
              <div className="mb-5">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                  ASK PRICE
                </span>
                <span className="text-3xl font-extrabold text-neutral-900">
                  ${rawPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Action Buttons (Bookmark + Add to Cart) - No Offer Button */}
              <div className="flex items-center gap-3 mb-6">
                
                {/* Heart / Wishlist button */}
                <button
                  onClick={handleToggleWishlist}
                  className={`h-11 w-11 shrink-0 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                    isInWishlist(product.id)
                      ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50/50'
                  }`}
                  title={isInWishlist(product.id) ? 'Remove from Saved Pallets' : 'Save Pallet to Wishlist'}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : 'text-neutral-700'
                    }`}
                  />
                </button>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAddedToCart}
                  className={`flex-1 h-11 px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    isAddedToCart
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'border-[#18113c] text-[#18113c] bg-white hover:bg-[#18113c]/5 hover:shadow-2xs'
                  }`}
                >
                  {isAddedToCart ? (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Added to Cart
                    </>
                  ) : (
                    <>Add to cart</>
                  )}
                </button>
              </div>

              {/* Specs Grid */}
              <div className="space-y-3.5 text-xs">
                
                {/* Row 1: EST. SAVINGS & MSRP */}
                <div className="grid grid-cols-2 gap-4 pb-3.5 border-b border-neutral-100">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      EST. SAVINGS
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">
                      {savings > 0
                        ? `$${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      MSRP
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      ${msrpPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Row 2: LOT SIZE & UNITS */}
                <div className="grid grid-cols-2 gap-4 pb-3.5 border-b border-neutral-100">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      LOT SIZE
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      {manifestItems.length > 1 ? `${Math.ceil(manifestItems.length / 10)} Pallets` : '1 Pallet'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      UNITS
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">{unitsCount}</span>
                  </div>
                </div>

                {/* Row 3: CONDITION & DIMENSIONS/WEIGHTS */}
                <div className="grid grid-cols-2 gap-4 pb-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      CONDITION
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      {formatConditionLabel(product.condition)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                      DIMENSIONS/WEIGHTS
                    </span>
                    <span className="text-xs font-semibold text-neutral-800 block">
                      {product.weight ? `74"x72"x44" / ${product.weight}lb` : '74"x72"x44" / 750lb'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllDimensions(!showAllDimensions)}
                      className="text-[11px] font-bold text-[#18113c] hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <span>{showAllDimensions ? 'Hide' : `${manifestItems.length > 1 ? manifestItems.length : 14} more`}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showAllDimensions ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Dimensions details */}
                {showAllDimensions && (
                  <div className="p-3 bg-neutral-50 rounded-lg text-[11px] text-neutral-600 space-y-1 mt-2 border border-neutral-100">
                    <p className="font-semibold text-neutral-800">Pallet Breakdown:</p>
                    <p>• Estimated Skid Dimensions: 48&quot;L x 40&quot;W x 72&quot;H</p>
                    <p>• Total Freight Weight: {product.weight || 750} lbs (Class 125)</p>
                    <p>• Forklift / Loading Dock Accessible: Yes</p>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-neutral-900">Description</h3>
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-xs font-bold text-[#18113c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isDescriptionExpanded ? 'Show less' : 'Show more'}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                <h4 className="text-xs font-bold text-neutral-800 mb-1">Customer Condition</h4>
                <p className={`text-xs text-neutral-600 leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                  {product.description ||
                    'Inventory consists of merchandise that has been tested and determined to be non-working, or products that show obvious signs of physical damage and/or are missing essential parts or accessories.'}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ─── Information & Manifest Tabs ─── */}
        <div className="mt-10 bg-white rounded-xl shadow-2xs border border-neutral-200/90 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-neutral-200 no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'text-[#18113c]'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#18113c]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 min-h-[350px]">
            <AnimatePresence mode="wait">
              {/* Manifest Tab */}
              {activeTab === 'Manifest' && (
                <motion.div
                  key="manifest"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">Pallet Manifest</h3>
                      <p className="text-xs text-neutral-500">Detailed breakdown of included items in this lot.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleDownloadManifest}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#18113c] text-[#18113c] hover:bg-[#18113c]/5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download full manifest</span>
                      </button>
                      <div className="bg-neutral-50 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold text-neutral-700 border border-neutral-200 flex items-center gap-2">
                        <Barcode className="w-4 h-4" />
                        <span>Total Items: {unitsCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#0071dc] text-white">
                        <tr className="border-b border-blue-700">
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide">Manufacturer</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide">Product Name</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide">SKU</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide">Condition</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide">UPC</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide text-center">QTY</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide text-right">MSRP</th>
                          <th className="px-4 py-3 text-xs font-bold text-white tracking-wide text-right">EXT Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {paginatedManifestItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="px-4 py-3 font-medium text-neutral-800">{item.manufacturer}</td>
                            <td className="px-4 py-3 text-neutral-900 font-semibold">{item.productName}</td>
                            <td className="px-4 py-3 font-mono text-neutral-500">{item.product}</td>
                            <td className="px-4 py-3 text-neutral-600">{item.condition}</td>
                            <td className="px-4 py-3 font-mono text-neutral-500">{item.upc}</td>
                            <td className="px-4 py-3 text-center font-bold text-neutral-800">{item.qty}</td>
                            <td className="px-4 py-3 text-right text-neutral-600">${item.msrp.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-bold text-neutral-900">
                              ${(item.msrp * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Functional Pagination Footer */}
                    <div className="flex items-center justify-end gap-6 px-4 py-3 bg-white border-t border-neutral-200 text-xs text-neutral-600 select-none">
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <div className="relative inline-flex items-center">
                          <select
                            value={rowsPerPage}
                            onChange={(e) => {
                              setRowsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="appearance-none bg-transparent border-b border-neutral-400 pr-5 pl-1 py-0.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-neutral-600 absolute right-0.5 pointer-events-none" />
                        </div>
                      </div>

                      <span className="font-medium text-neutral-800">
                        {totalManifestItems === 0
                          ? '0-0 of 0'
                          : `${startIndex + 1}-${endIndex} of ${totalManifestItems}`}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                          className="p-1.5 rounded-md hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4 text-neutral-800" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                          className="p-1.5 rounded-md hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4 text-neutral-800" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <p>Manifests are provided for informational purposes. All wholesale liquidation lots are sold as-is.</p>
                  </div>
                </motion.div>
              )}

              {/* Overview Tab */}
              {activeTab === 'Overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl prose prose-neutral text-neutral-600 text-sm"
                >
                  <h3 className="text-base font-bold text-neutral-900 mb-3">Lot Information</h3>
                  <p className="leading-relaxed">
                    {product.description || 'Pallet consisting of overstock and liquidation items direct from retail facilities.'}
                  </p>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-neutral-100">
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-xs uppercase tracking-wider">
                        Facility Features
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li>Forklift available for loading</li>
                        <li>Dock doors present</li>
                        <li>By appointment only</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2 text-xs uppercase tracking-wider">
                        Packaging Details
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li>Standard 48 x 40 Wooden Pallet</li>
                        <li>Shrink-wrapped and strapped</li>
                        <li>Approx. Weight: {product.weight ? `${product.weight} lbs` : '250 - 750 lbs'}</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'Shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl"
                >
                  <h3 className="text-base font-bold text-neutral-900 mb-5">Shipping & Pickup Information</h3>

                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-neutral-100 text-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">Freight Shipping</h4>
                        <p className="text-neutral-600 mt-1 text-xs leading-relaxed">
                          We partner with top-tier LTL freight carriers to offer nationwide delivery. Shipping rates are calculated at checkout based on the delivery zip code and facility requirements (liftgate, residential, etc.).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">Buyer Arranged Pickup</h4>
                        <p className="text-neutral-600 mt-1 text-xs leading-relaxed">
                          You may arrange your own freight carrier or pick up the pallet directly from the facility once payment clears.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
