'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Menu, 
  Search, 
  ChevronDown, 
  ShoppingCart, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Package, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Check,
  UploadCloud,
  Trash2,
  Plus,
  RefreshCw,
  Save,
  ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import {
  StorefrontConfig,
  DEFAULT_STOREFRONT_CONFIG,
  BrandLogoItem,
  BenefitItem,
} from '../../../lib/types/storefront';

type ActiveSection = 'announcement' | 'hero' | 'categories' | 'listings' | 'benefits' | 'brands' | 'promoBanner';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';

interface DemoProduct {
  id: string;
  name: string;
  retailer: string;
  conditionGrade: string;
  qty: number;
  msrp: number;
  price: number;
  image: string;
}

const DEMO_LISTINGS: DemoProduct[] = [
  {
    id: '1',
    name: 'Mixed Consumer Electronics Pallet - Unmanifested Customer Returns',
    retailer: 'Walmart',
    conditionGrade: 'Customer Returns',
    qty: 142,
    msrp: 14500,
    price: 3200,
    image: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Major Brand Small Home Appliances & Kitchenware Lot',
    retailer: 'Target',
    conditionGrade: 'Overstock / Open Box',
    qty: 88,
    msrp: 9800,
    price: 2450,
    image: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Commercial Tools, Hardware & Jobsite Equipment Truckload',
    retailer: 'Home Depot',
    conditionGrade: 'Tested Working',
    qty: 65,
    msrp: 22000,
    price: 6100,
    image: 'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Designer Apparel & Footwear Assortment Casepack',
    retailer: 'Costco',
    conditionGrade: 'Brand New In Box',
    qty: 320,
    msrp: 18400,
    price: 4600,
    image: 'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=600&auto=format&fit=crop',
  },
];

const PREVIEW_CATEGORIES = [
  { name: "Electronics", image: "/catergories/electronics.png" },
  { name: "Home", image: "/catergories/home.png" },
  { name: "Home Improvement", image: "/catergories/home-improvement.png" },
  { name: "Toys", image: "/catergories/toys.png" },
  { name: "Sports & Outdoors", image: "/catergories/sports.png" },
  { name: "Patio & Garden", image: "/catergories/patio-garden.png" },
  { name: "Furniture", image: "/catergories/furniture.png" },
  { name: "Health & Beauty", image: "/catergories/health-beauty.png" },
  { name: "Baby", image: "/catergories/baby.png" },
  { name: "Pet Supplies", image: "/catergories/pet-toys-pet-supplies.png" },
  { name: "Automotive", image: "/catergories/automotive.png" },
  { name: "Office", image: "/catergories/furniture-office.png" },
];

export default function StorefrontCMSPage() {
  const [config, setConfig] = useState<StorefrontConfig>(DEFAULT_STOREFRONT_CONFIG);
  const [selectedSection, setSelectedSection] = useState<ActiveSection>('hero');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Uploading state
  const [isUploadingHero, setIsUploadingHero] = useState<boolean>(false);
  const [isUploadingBrand, setIsUploadingBrand] = useState<string | null>(null);

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const brandFileInputRef = useRef<HTMLInputElement>(null);
  const [targetBrandIdForUpload, setTargetBrandIdForUpload] = useState<string | null>(null);
  const inspectorPanelRef = useRef<HTMLDivElement>(null);

  // Fetch initial config from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await apiFetch<{ key: string; value: string | null }>('/settings/storefront_config');
        const payload = res.data as unknown as { key?: string; value?: string | null };

        if (payload?.value) {
          try {
            const parsed = JSON.parse(payload.value);
            setConfig({
              ...DEFAULT_STOREFRONT_CONFIG,
              ...parsed,
              announcement: { ...DEFAULT_STOREFRONT_CONFIG.announcement, ...(parsed.announcement || {}) },
              hero: { ...DEFAULT_STOREFRONT_CONFIG.hero, ...(parsed.hero || {}) },
              brands: { ...DEFAULT_STOREFRONT_CONFIG.brands, ...(parsed.brands || {}) },
              benefits: { ...DEFAULT_STOREFRONT_CONFIG.benefits, ...(parsed.benefits || {}) },
              promoBanner: { ...DEFAULT_STOREFRONT_CONFIG.promoBanner, ...(parsed.promoBanner || {}) },
            });
          } catch (e) {
            console.warn('Failed to parse storefront JSON:', e);
          }
        }
      } catch (err) {
        console.warn('Could not load storefront config, using defaults:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  // Scroll inspector to view when a section is clicked in preview
  const handleSelectSection = (section: ActiveSection) => {
    setSelectedSection(section);
    if (inspectorPanelRef.current) {
      inspectorPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await apiFetch('/settings/storefront_config', {
        method: 'PATCH',
        body: JSON.stringify({
          value: JSON.stringify(config),
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Failed to save storefront config:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save storefront configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Hero Image to Cloudflare R2 'marketing/' folder
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingHero(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'marketing');

      const res = await apiFetch<{ imageUrl: string; r2Key: string }>('/shop/admin/upload-public', {
        method: 'POST',
        body: formData,
      });

      const data = res.data as unknown as { imageUrl?: string };
      if (data?.imageUrl) {
        setConfig((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            heroImage: data.imageUrl!,
          },
        }));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to upload hero image to Cloudflare R2.');
    } finally {
      setIsUploadingHero(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  // Upload Brand Logo to Cloudflare R2 'marketing/' folder
  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetBrandIdForUpload) return;

    try {
      setIsUploadingBrand(targetBrandIdForUpload);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'marketing');

      const res = await apiFetch<{ imageUrl: string; r2Key: string }>('/shop/admin/upload-public', {
        method: 'POST',
        body: formData,
      });

      const data = res.data as unknown as { imageUrl?: string };
      if (data?.imageUrl) {
        setConfig((prev) => ({
          ...prev,
          brands: {
            ...prev.brands,
            brands: prev.brands.brands.map((b) =>
              b.id === targetBrandIdForUpload ? { ...b, logoUrl: data.imageUrl! } : b
            ),
          },
        }));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to upload brand logo to Cloudflare R2.');
    } finally {
      setIsUploadingBrand(null);
      setTargetBrandIdForUpload(null);
      if (brandFileInputRef.current) brandFileInputRef.current.value = '';
    }
  };

  // Add Brand Item
  const handleAddBrand = () => {
    const newBrand: BrandLogoItem = {
      id: Date.now().toString(),
      name: 'New Partner',
      logoUrl: '/companies-logos/walmart.svg',
      discountText: 'Direct Lots',
    };
    setConfig((prev) => ({
      ...prev,
      brands: {
        ...prev.brands,
        brands: [...prev.brands.brands, newBrand],
      },
    }));
  };

  // Remove Brand Item
  const handleRemoveBrand = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      brands: {
        ...prev.brands,
        brands: prev.brands.brands.filter((b) => b.id !== id),
      },
    }));
  };

  // Reset to default configuration
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all storefront settings to defaults?')) {
      setConfig(DEFAULT_STOREFRONT_CONFIG);
    }
  };

  // Viewport container width styling
  const viewportWidthClass =
    viewportMode === 'desktop'
      ? 'w-full'
      : viewportMode === 'tablet'
      ? 'max-w-[768px] mx-auto shadow-2xl rounded-2xl border-x border-neutral-300'
      : 'max-w-[420px] mx-auto shadow-2xl rounded-[36px] border-4 border-neutral-800 overflow-hidden';

  const heroImageSrc = config.hero.heroImage || '/herosectoin/truck2.png';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Hidden File Inputs for Cloudflare R2 Uploads */}
      <input
        ref={heroFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleHeroImageUpload}
        className="hidden"
      />
      <input
        ref={brandFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBrandLogoUpload}
        className="hidden"
      />

      {/* Top Header Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">Storefront Studio</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Click-and-Edit Live Preview
            </span>
          </div>
          <p className="text-neutral-500 text-xs mt-1 font-medium">
            Hover over and click any section on the exact live shop preview below to inspect, customize, and publish changes in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          {/* Viewport Switcher */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewportMode === 'desktop' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewportMode === 'tablet' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewportMode === 'mobile' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> View Live Shop
          </a>

          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer hover:shadow-md"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publish Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Storefront published successfully! Your live customer storefront is updated.</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-rose-700 hover:text-rose-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Grid: Left Pixel-Identical Canvas + Right Inspector Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT / CENTER: PIXEL-PERFECT USER SHOP PREVIEW (Click & Edit) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-8 bg-neutral-100/70 p-3 sm:p-5 rounded-3xl border border-neutral-200/80 overflow-hidden shadow-inner">
          
          {/* Top Canvas Bar */}
          <div className="flex items-center justify-between mb-3 px-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="text-xs font-mono text-neutral-400 ml-2 font-medium">http://localhost:3001 (Live User Storefront)</span>
            </div>
            <span className="text-xs font-bold text-neutral-600 bg-white px-3 py-1 rounded-xl border border-neutral-200 shadow-2xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" /> Click any section to edit
            </span>
          </div>

          {/* EXACT USER SHOP CANVAS */}
          <div className={`${viewportWidthClass} bg-white rounded-2xl overflow-hidden shadow-xl border border-neutral-200 transition-all duration-300 font-sans`}>
            
            {/* 1. EXACT ANNOUNCEMENT BAR */}
            {config.announcement.enabled && (
              <div
                onClick={() => handleSelectSection('announcement')}
                className={`cursor-pointer transition-all relative group border-2 ${
                  selectedSection === 'announcement'
                    ? 'border-indigo-600 ring-2 ring-indigo-300 z-30'
                    : 'border-transparent hover:border-indigo-400'
                }`}
                style={{
                  backgroundColor: config.announcement.bgColor || '#111827',
                  color: config.announcement.textColor || '#ffffff',
                }}
              >
                <div className="absolute top-1.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md z-30">
                  ✎ Click to edit Announcement
                </div>

                <div className="py-2.5 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 flex-wrap">
                  {config.announcement.badge && (
                    <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {config.announcement.badge}
                    </span>
                  )}
                  <span>{config.announcement.text}</span>
                  {config.announcement.linkText && (
                    <span className="underline font-bold ml-1 text-white/90">
                      {config.announcement.linkText} →
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. EXACT SHOP NAVBAR */}
            <header className="w-full bg-white border-b border-gray-100 shadow-xs">
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                  {/* Left: Menu & Logo */}
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="flex items-center justify-center bg-gray-200 text-gray-700 h-10 w-10 rounded-full">
                      <Menu className="h-5 w-5" />
                    </div>
                    <span className="text-[#150050] text-3xl font-bold tracking-tight">
                      Liquidation port
                    </span>
                  </div>

                  {/* Center: Search Bar */}
                  <div className="hidden md:flex flex-1 items-center justify-center px-8 lg:px-12">
                    <button className="flex items-center mr-2 bg-transparent border-2 border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 shrink-0">
                      Category <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
                    </button>
                    <div className="w-full max-w-2xl flex bg-[#f0f2f5] rounded-md overflow-hidden border border-transparent">
                      <input
                        type="text"
                        readOnly
                        placeholder="Search liquidation pallets, truckloads..."
                        className="w-full bg-transparent px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-500"
                      />
                      <div className="px-4 py-2.5 text-gray-500 flex items-center">
                        <Search className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Right: Region & Auth */}
                  <div className="flex items-center space-x-5 shrink-0">
                    <div className="hidden sm:flex items-center text-sm font-medium text-gray-800 gap-1">
                      <img src="/country-flags/usa.png" alt="USA" className="w-5 h-5 object-contain inline-block" />
                      <span>USA</span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </div>
                    <div className="hidden sm:flex items-center space-x-4">
                      <span className="text-sm font-bold text-gray-800">Log in</span>
                      <span className="text-sm font-bold text-[#150050] border border-[#150050] px-4 py-2 rounded">
                        Sign up
                      </span>
                    </div>
                    <div className="relative p-2 text-gray-600 rounded-full">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* 3. EXACT HERO SECTION */}
            <div
              onClick={() => handleSelectSection('hero')}
              className={`relative bg-[#f5f5f5] flex items-center pt-16 pb-20 overflow-hidden min-h-[500px] cursor-pointer transition-all group border-2 ${
                selectedSection === 'hero'
                  ? 'border-indigo-600 ring-2 ring-indigo-300 z-30'
                  : 'border-transparent hover:border-indigo-400'
              }`}
            >
              <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-30 flex items-center gap-1">
                ✎ Click to edit Hero Section
              </div>

              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between">
                {/* Left: Text Content */}
                <div className="w-full md:w-5/12 z-10 md:pr-10 lg:pl-12 space-y-4">
                  {config.hero.badgeText && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-neutral-200 text-neutral-800 rounded-full text-xs font-bold shadow-2xs">
                      {config.hero.badgeText}
                    </span>
                  )}

                  <h1 className="text-4xl sm:text-5xl font-['Roboto',sans-serif] font-bold tracking-tight text-gray-900 leading-[1.1] whitespace-pre-line">
                    {config.hero.headline}
                  </h1>

                  <p className="mt-4 text-lg sm:text-xl text-[#252525] max-w-lg font-medium leading-relaxed">
                    {config.hero.subheadline}
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-2">
                    <span className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded text-white bg-[#150050] hover:bg-[#2d108d] shadow-sm">
                      {config.hero.primaryCtaText || 'Get started'}
                    </span>
                    {config.hero.secondaryCtaText && (
                      <span className="inline-flex items-center justify-center px-6 py-3.5 border border-neutral-300 text-sm font-bold rounded text-neutral-800 bg-white shadow-2xs">
                        {config.hero.secondaryCtaText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Graphic / Truck Image */}
                <div className="w-full md:w-7/12 mt-12 md:mt-0 relative flex justify-end min-h-[340px] md:min-h-[440px]">
                  <img
                    src={heroImageSrc}
                    alt="Liquidation logistics"
                    className="object-contain object-right drop-shadow-2xl max-h-[440px] w-auto max-w-full"
                  />
                </div>
              </div>
            </div>

            {/* 4. EXACT CATEGORY GRID */}
            <div
              onClick={() => handleSelectSection('categories')}
              className={`bg-white py-12 border-b border-gray-100 cursor-pointer transition-all relative group border-2 ${
                selectedSection === 'categories'
                  ? 'border-indigo-600 ring-2 ring-indigo-300 z-30'
                  : 'border-transparent hover:border-indigo-400'
              }`}
            >
              <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-30">
                ✎ Category Grid Section
              </div>

              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    Explore Liquidation by Category
                  </h2>
                  <span className="text-xs font-bold text-[#150050] flex items-center gap-1">
                    View All Categories <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                  {PREVIEW_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="flex flex-col items-center shrink-0 w-28 text-center group/cat">
                      <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center p-3 border border-neutral-200/80 mb-2 group-hover/cat:scale-105 transition-transform">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-bold text-neutral-800 line-clamp-2">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. EXACT FEATURED LISTINGS */}
            <div
              onClick={() => handleSelectSection('listings')}
              className={`bg-white py-16 cursor-pointer transition-all relative group border-2 ${
                selectedSection === 'listings'
                  ? 'border-indigo-600 ring-2 ring-indigo-300 z-30'
                  : 'border-transparent hover:border-indigo-400'
              }`}
            >
              <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-30">
                ✎ Featured Product Listings
              </div>

              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Liquidation Lots</h2>
                    <p className="text-sm text-neutral-500 mt-1">High-demand manifested customer returns & overstock pallets ready to ship.</p>
                  </div>
                  <span className="text-sm font-bold text-[#150050] hover:underline">View All Pallets →</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {DEMO_LISTINGS.map((pallet) => (
                    <div
                      key={pallet.id}
                      className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden flex flex-col group/card hover:shadow-md transition-all"
                    >
                      <div className="relative h-48 bg-neutral-100 overflow-hidden">
                        <img src={pallet.image} alt={pallet.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" />
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          {pallet.conditionGrade}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <p className="text-xs text-neutral-400 font-semibold uppercase">{pallet.qty} Units in Lot</p>
                          <h3 className="font-bold text-sm text-neutral-900 line-clamp-2 mt-1">{pallet.name}</h3>
                        </div>
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-neutral-400 block line-through">Est. MSRP ${pallet.msrp.toLocaleString()}</span>
                            <span className="text-base font-black text-neutral-900">${pallet.price.toLocaleString()}</span>
                          </div>
                          <span className="px-3 py-1.5 bg-[#150050] text-white rounded-lg text-xs font-bold">
                            View Pallet
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. EXACT BENEFITS SECTION */}
            <div
              onClick={() => handleSelectSection('benefits')}
              className={`bg-[#f4f5f7] py-16 sm:py-24 cursor-pointer transition-all relative group border-2 ${
                selectedSection === 'benefits'
                  ? 'border-indigo-600 ring-2 ring-indigo-300 z-30'
                  : 'border-transparent hover:border-indigo-400'
              }`}
            >
              <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-30">
                ✎ Click to edit Benefits Section
              </div>

              <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-8">
                  {config.benefits.title || 'Benefits'}
                </h2>

                <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 lg:p-14">
                  <div className="grid grid-cols-1 gap-12 lg:gap-16 sm:grid-cols-1 lg:grid-cols-3">
                    {config.benefits.items.map((benefit) => {
                      const iconSrc = benefit.icon || '/Icons/handshake.svg';
                      return (
                        <div key={benefit.id || benefit.title} className="flex flex-col items-start text-left">
                          <div className="relative h-24 w-28 mb-6 flex items-center justify-start">
                            <img src={iconSrc} alt={benefit.title} className="max-h-20 w-auto object-contain" />
                          </div>
                          <h3 className="text-xl font-bold leading-7 text-[#111] mb-3">{benefit.title}</h3>
                          <p className="text-[15px] leading-relaxed text-[#555]">{benefit.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 7. EXACT FEATURED LIQUIDATORS / BRANDS */}
            <div
              onClick={() => handleSelectSection('brands')}
              className={`bg-[#f5f5f5] pb-16 pt-12 cursor-pointer transition-all relative group border-2 ${
                selectedSection === 'brands'
                  ? 'border-indigo-600 ring-2 ring-indigo-300 z-30'
                  : 'border-transparent hover:border-indigo-400'
              }`}
            >
              <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-30">
                ✎ Click to edit Featured Liquidators
              </div>

              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-8 lg:pl-12">
                  {config.brands.title || 'Featured liquidators'}
                </h2>

                <div className="flex space-x-4 overflow-x-auto pb-4 px-2 lg:pl-12 scrollbar-hide">
                  {config.brands.brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex flex-col justify-center shrink-0 w-64 h-48 bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md items-center p-6 text-center"
                    >
                      <div className="h-16 w-32 relative mb-2 flex items-center justify-center">
                        <img src={brand.logoUrl} alt={brand.name} className="object-contain max-h-14 w-auto grayscale" />
                      </div>
                      <p className="font-bold text-sm text-neutral-900 mt-1">{brand.name}</p>
                      {brand.discountText && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                          {brand.discountText}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. EXACT PROMO CTA BANNER */}
            {config.promoBanner.enabled && (
              <div
                onClick={() => handleSelectSection('promoBanner')}
                className={`bg-neutral-900 text-white py-20 relative overflow-hidden cursor-pointer transition-all group border-2 ${
                  selectedSection === 'promoBanner'
                    ? 'border-indigo-400 ring-2 ring-indigo-300 z-30'
                    : 'border-transparent hover:border-indigo-400'
                }`}
              >
                <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-30">
                  ✎ Click to edit Promo Banner
                </div>

                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                  <div className="max-w-3xl mx-auto space-y-6">
                    {config.promoBanner.badge && (
                      <span className="px-4 py-1.5 bg-white/10 text-white border border-white/20 rounded-full text-xs font-black uppercase tracking-widest inline-block">
                        {config.promoBanner.badge}
                      </span>
                    )}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                      {config.promoBanner.title}
                    </h2>
                    <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto font-medium leading-relaxed">
                      {config.promoBanner.subtitle}
                    </p>
                    <div className="pt-4 flex justify-center">
                      <span className="inline-flex items-center justify-center px-8 py-4 bg-white text-neutral-900 font-bold rounded-xl text-sm shadow-xl">
                        {config.promoBanner.ctaText} →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. EXACT USER SHOP FOOTER */}
            <footer className="bg-white pt-16 pb-12 border-t border-gray-100">
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-16">
                  {/* Column 1 */}
                  <div className="flex flex-col">
                    <h2 className="text-[20px] font-bold text-[#111] mb-5">Sign up to receive deals</h2>
                    <div className="flex items-center w-full max-w-sm mb-4 space-x-3">
                      <input
                        type="email"
                        readOnly
                        placeholder="Email"
                        className="w-full grow rounded border border-gray-300 bg-white px-3 py-1.5 text-[14px] text-[#111] placeholder-gray-500"
                      />
                      <button className="whitespace-nowrap rounded border border-[#150050] bg-white px-5 py-1.5 text-[13px] font-bold text-[#150050]">
                        Sign up
                      </button>
                    </div>
                    <p className="text-[13px] text-[#333] mb-6">
                      Sign up now to receive exclusive member&apos;s only discounts.
                    </p>
                    <div className="flex items-center space-x-4 mb-8 text-[#150050]">
                      <Facebook size={22} className="fill-current" />
                      <Linkedin size={22} className="fill-current" />
                      <Youtube size={24} className="fill-current" />
                    </div>
                    <p className="text-[11px] text-[#4a4a4a]">
                      &copy; {new Date().getFullYear()} Liquidation Port, Inc. All rights reserved.
                    </p>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <h2 className="text-[20px] font-bold text-[#111] mb-5">Help & Support</h2>
                    <ul className="space-y-3 text-[14px] text-[#333] font-medium">
                      <li>How it works</li>
                      <li>Shipping & Freight</li>
                      <li>Payment Terms</li>
                      <li>FAQ & Guides</li>
                    </ul>
                  </div>

                  {/* Column 3 */}
                  <div>
                    <h2 className="text-[20px] font-bold text-[#111] mb-5">About us</h2>
                    <ul className="space-y-3 text-[14px] text-[#333] font-medium">
                      <li>Our Story</li>
                      <li>Sustainability</li>
                      <li>Partner Network</li>
                      <li>Careers</li>
                    </ul>
                  </div>

                  {/* Column 4 */}
                  <div>
                    <h2 className="text-[20px] font-bold text-[#111] mb-5">Legal & Policies</h2>
                    <ul className="space-y-3 text-[14px] text-[#333] font-medium">
                      <li>Terms and Conditions</li>
                      <li>Privacy Policy</li>
                      <li>Merchandise Conditions</li>
                      <li>Buyer Agreement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </footer>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: INSPECTOR & CONTROLS PANEL */}
        {/* ========================================================================= */}
        <div ref={inspectorPanelRef} className="xl:col-span-4 space-y-6 sticky top-6">
          
          {/* Section Navigation Tabs */}
          <div className="bg-white p-2.5 rounded-3xl border border-neutral-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedSection('announcement')}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSection === 'announcement'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              📢 Announcement
            </button>
            <button
              onClick={() => setSelectedSection('hero')}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSection === 'hero'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              🚀 Hero Banner
            </button>
            <button
              onClick={() => setSelectedSection('brands')}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSection === 'brands'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              ⭐ Brands
            </button>
            <button
              onClick={() => setSelectedSection('benefits')}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSection === 'benefits'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              🛡️ Benefits
            </button>
            <button
              onClick={() => setSelectedSection('promoBanner')}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSection === 'promoBanner'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              🎯 Promo
            </button>
          </div>

          {/* SECTION 1: Announcement Bar Inspector */}
          {selectedSection === 'announcement' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-base">Top Announcement Bar</h3>
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.announcement.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, enabled: e.target.checked },
                      }))
                    }
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4"
                  />
                  Visible
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700">Badge Text</label>
                  <input
                    type="text"
                    value={config.announcement.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, badge: e.target.value },
                      }))
                    }
                    placeholder="e.g. 🔥 HOT DROP"
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700">Message Text</label>
                  <textarea
                    rows={2}
                    value={config.announcement.text}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, text: e.target.value },
                      }))
                    }
                    placeholder="Announcement message..."
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-neutral-900 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Link Text</label>
                    <input
                      type="text"
                      value={config.announcement.linkText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          announcement: { ...prev.announcement, linkText: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Link URL</label>
                    <input
                      type="text"
                      value={config.announcement.linkUrl}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          announcement: { ...prev.announcement, linkUrl: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Background Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={config.announcement.bgColor || '#111827'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            announcement: { ...prev.announcement, bgColor: e.target.value },
                          }))
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono text-neutral-600">{config.announcement.bgColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700">Text Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={config.announcement.textColor || '#ffffff'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            announcement: { ...prev.announcement, textColor: e.target.value },
                          }))
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono text-neutral-600">{config.announcement.textColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Hero Section Inspector */}
          {selectedSection === 'hero' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-base">Hero Banner Configuration</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Customize headline, subtext, and upload R2 hero graphics.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700">Badge Text</label>
                  <input
                    type="text"
                    value={config.hero.badgeText}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, badgeText: e.target.value },
                      }))
                    }
                    placeholder="e.g. ⚡ Verified Liquidation Lots Direct"
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700">Headline</label>
                  <textarea
                    rows={2}
                    value={config.hero.headline}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headline: e.target.value },
                      }))
                    }
                    placeholder="Main headline..."
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700">Subheadline Description</label>
                  <textarea
                    rows={3}
                    value={config.hero.subheadline}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, subheadline: e.target.value },
                      }))
                    }
                    placeholder="Detailed hero description..."
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-neutral-900 resize-none"
                  />
                </div>

                {/* Hero Graphic Cloudflare R2 Upload */}
                <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/80 space-y-2">
                  <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
                    <span>Hero Graphic (Cloudflare R2 marketing/)</span>
                    {isUploadingHero && <span className="text-[11px] text-indigo-600 font-bold">Uploading to R2...</span>}
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 bg-white border border-neutral-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={heroImageSrc}
                        alt="Hero preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={isUploadingHero}
                      className="px-3.5 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 hover:bg-neutral-100 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-neutral-600" /> Replace Image (R2)
                    </button>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Primary Button</label>
                    <input
                      type="text"
                      value={config.hero.primaryCtaText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, primaryCtaText: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Primary Link</label>
                    <input
                      type="text"
                      value={config.hero.primaryCtaLink}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, primaryCtaLink: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Secondary Button</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCtaText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, secondaryCtaText: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Secondary Link</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCtaLink}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, secondaryCtaLink: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Featured Brands Inspector */}
          {selectedSection === 'brands' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Featured Liquidators</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Manage partner logos and discount tags.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBrand}
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Partner
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Section Title</label>
                    <input
                      type="text"
                      value={config.brands.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          brands: { ...prev.brands, title: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Subtitle</label>
                    <input
                      type="text"
                      value={config.brands.subtitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          brands: { ...prev.brands, subtitle: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Brands List */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {config.brands.brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="p-3 border border-neutral-200 rounded-2xl bg-neutral-50 flex items-center gap-3"
                    >
                      <div className="w-12 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                        <img src={brand.logoUrl} alt={brand.name} className="max-h-7 max-w-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={brand.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => ({
                              ...prev,
                              brands: {
                                ...prev.brands,
                                brands: prev.brands.brands.map((b) => (b.id === brand.id ? { ...b, name: val } : b)),
                              },
                            }));
                          }}
                          placeholder="Brand Name"
                          className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={brand.discountText || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => ({
                              ...prev,
                              brands: {
                                ...prev.brands,
                                brands: prev.brands.brands.map((b) => (b.id === brand.id ? { ...b, discountText: val } : b)),
                              },
                            }));
                          }}
                          placeholder="Discount Tag"
                          className="px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs text-emerald-700 font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetBrandIdForUpload(brand.id);
                            brandFileInputRef.current?.click();
                          }}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg text-xs cursor-pointer"
                          title="Upload logo to Cloudflare R2"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBrand(brand.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                          title="Delete logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Benefits Inspector */}
          {selectedSection === 'benefits' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-base">Benefits & Value Propositions</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Trust cards displayed on the storefront.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700">Section Title</label>
                  <input
                    type="text"
                    value={config.benefits.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        benefits: { ...prev.benefits, title: e.target.value },
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {config.benefits.items.map((item, idx) => (
                    <div key={item.id} className="p-3.5 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-2">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase">Benefit #{idx + 1}</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig((prev) => ({
                            ...prev,
                            benefits: {
                              ...prev.benefits,
                              items: prev.benefits.items.map((b) => (b.id === item.id ? { ...b, title: val } : b)),
                            },
                          }));
                        }}
                        placeholder="Benefit Title"
                        className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold"
                      />
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig((prev) => ({
                            ...prev,
                            benefits: {
                              ...prev.benefits,
                              items: prev.benefits.items.map((b) => (b.id === item.id ? { ...b, description: val } : b)),
                            },
                          }));
                        }}
                        placeholder="Description..."
                        className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Promo Banner Inspector */}
          {selectedSection === 'promoBanner' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-base">Promotional CTA Banner</h3>
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.promoBanner.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        promoBanner: { ...prev.promoBanner, enabled: e.target.checked },
                      }))
                    }
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4"
                  />
                  Visible
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700">Badge Text</label>
                  <input
                    type="text"
                    value={config.promoBanner.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        promoBanner: { ...prev.promoBanner, badge: e.target.value },
                      }))
                    }
                    placeholder="e.g. VIP BUYER ACCESS"
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700">Banner Title</label>
                  <input
                    type="text"
                    value={config.promoBanner.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        promoBanner: { ...prev.promoBanner, title: e.target.value },
                      }))
                    }
                    placeholder="Banner Headline"
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700">Banner Subtitle</label>
                  <textarea
                    rows={2}
                    value={config.promoBanner.subtitle}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        promoBanner: { ...prev.promoBanner, subtitle: e.target.value },
                      }))
                    }
                    placeholder="Subtext..."
                    className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Button Text</label>
                    <input
                      type="text"
                      value={config.promoBanner.ctaText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          promoBanner: { ...prev.promoBanner, ctaText: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-700">Button Link</label>
                    <input
                      type="text"
                      value={config.promoBanner.ctaLink}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          promoBanner: { ...prev.promoBanner, ctaLink: e.target.value },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Categories Quick Link */}
          {selectedSection === 'categories' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-base">Categories Configuration</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Manage live storefront department icons & categories.</p>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Categories are synced from your database with Cloudflare R2 department thumbnails.
              </p>
              <Link
                href="/admin/categories"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-2xs"
              >
                Go to Category Manager →
              </Link>
            </div>
          )}

          {/* SECTION 7: Listings Quick Link */}
          {selectedSection === 'listings' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-base">Featured Pallet Listings</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Live inventory catalog products.</p>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Featured listings display active inventory pallets with live manifest data, MSRP, and condition grades.
              </p>
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-2xs"
              >
                Manage Pallet Inventory →
              </Link>
            </div>
          )}

          {/* Footer Actions: Save & Reset */}
          <div className="p-4 bg-white rounded-3xl border border-neutral-200 shadow-sm flex items-center justify-between">
            <button
              onClick={handleResetDefaults}
              className="text-xs font-bold text-neutral-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset to Defaults
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save & Publish
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
