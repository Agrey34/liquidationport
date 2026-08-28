'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getMediaUrl } from '@/lib/image-url';
import { STANDARD_CONDITIONS, DEFAULT_CONDITION, formatConditionLabel } from '@/lib/condition';

interface MediaItem {
  id: string;
  url: string;
  file?: File;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
}

interface ManifestRow {
  id: string;
  manufacturer: string;
  productName: string;
  product: string;
  condition: string;
  upc: string;
  qty: string;
  msrp: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Home & Garden',
  'Apparel & Clothing',
  'Toys & Games',
  'Tools & Hardware',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Furniture',
  'Appliances',
  'General Merchandise',
  'Other',
];

const CONDITIONS = STANDARD_CONDITIONS;

// ─── Form Section Wrapper ─────────────────────────────────────────────────────

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 rounded-xl text-neutral-600">
            <i className={`${icon} w-4 h-4 flex items-center justify-center`} />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [condition, setCondition] = useState<string>(DEFAULT_CONDITION);
  const [status, setStatus] = useState('Draft');
  const [basePrice, setBasePrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [manifestRows, setManifestRows] = useState<ManifestRow[]>([
    {
      id: crypto.randomUUID(),
      manufacturer: '',
      productName: '',
      product: '',
      condition: DEFAULT_CONDITION,
      upc: '',
      qty: '1',
      msrp: '',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ── Fetch dynamic categories from backend ───────────────────────────────────
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch<CategoryOption[]>('/categories');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const fetchedNames = res.data.map((c) => c.name);
          setCategoriesList(Array.from(new Set([...fetchedNames, ...DEFAULT_CATEGORIES])));
        }
      } catch (err) {
        console.warn('Could not fetch categories from server, using default list:', err);
      }
    }
    loadCategories();
  }, []);

  // ── Auto-Save to LocalStorage ─────────────────────────────────────────────
  useEffect(() => {
    const draft = localStorage.getItem('product-create-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.name) setName(parsed.name);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.condition) setCondition(formatConditionLabel(parsed.condition));
        if (parsed.status) setStatus(parsed.status);
        if (parsed.basePrice) setBasePrice(parsed.basePrice);
        if (parsed.comparePrice) setComparePrice(parsed.comparePrice);
        if (parsed.costPrice) setCostPrice(parsed.costPrice);
        if (parsed.stock) setStock(parsed.stock);
        if (parsed.sku) setSku(parsed.sku);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.variants) setVariants(parsed.variants);
        if (parsed.images && Array.isArray(parsed.images)) {
          setMedia(parsed.images.map((url: string) => ({ id: crypto.randomUUID(), url })));
        }
        if (parsed.manifestRows && parsed.manifestRows.length > 0) {
          setManifestRows(
            parsed.manifestRows.map((r: any) => ({
              ...r,
              condition: formatConditionLabel(r.condition),
            }))
          );
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    setIsDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;

    const hasChanges =
      name ||
      description ||
      category ||
      condition !== DEFAULT_CONDITION ||
      basePrice ||
      comparePrice ||
      stock !== '1' ||
      sku ||
      weight ||
      tags.length > 0 ||
      variants.length > 0 ||
      manifestRows.length > 1 ||
      manifestRows[0].productName;

    if (!hasChanges) {
      localStorage.removeItem('product-create-draft');
      return;
    }

    const draft = {
      name,
      description,
      category,
      condition,
      status,
      basePrice,
      comparePrice,
      costPrice,
      stock,
      sku,
      weight,
      tags,
      variants,
      images: media.filter((m) => !m.file && !m.url.startsWith('blob:')).map((m) => m.url),
      manifestRows,
    };
    localStorage.setItem('product-create-draft', JSON.stringify(draft));
  }, [
    name,
    description,
    category,
    condition,
    status,
    basePrice,
    comparePrice,
    costPrice,
    stock,
    sku,
    weight,
    tags,
    variants,
    media,
    manifestRows,
    isDraftLoaded,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasChanges = name || description || category || basePrice;
      if (hasChanges && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [name, description, category, basePrice, submitting]);

  // ── Tags ──────────────────────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // ── Manifest Rows ─────────────────────────────────────────────────────────

  const addManifestRow = () => {
    setManifestRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        manufacturer: '',
        productName: '',
        product: '',
        condition: condition || DEFAULT_CONDITION,
        upc: '',
        qty: '1',
        msrp: '',
      },
    ]);
  };

  const updateManifestRow = (id: string, field: keyof ManifestRow, value: string) => {
    setManifestRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeManifestRow = (id: string) => {
    setManifestRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const totalQty = manifestRows.reduce((acc, r) => acc + (parseInt(r.qty) || 0), 0);
  const totalExtMsrp = manifestRows.reduce((acc, r) => {
    const qty = parseFloat(r.qty) || 0;
    const unit = parseFloat(r.msrp) || 0;
    return acc + qty * unit;
  }, 0);

  const handleDownloadManifest = () => {
    const headers = ['Manufacturer', 'Product Name', 'Product/SKU', 'Condition', 'UPC', 'QTY', 'MSRP', 'EXT MSRP'];
    const rows = manifestRows.map((r) => {
      const ext = (parseFloat(r.qty) || 0) * (parseFloat(r.msrp) || 0);
      return [
        r.manufacturer,
        r.productName,
        r.product,
        r.condition,
        r.upc,
        r.qty,
        r.msrp ? `$${parseFloat(r.msrp).toFixed(2)}` : '',
        ext > 0 ? `$${ext.toFixed(2)}` : '',
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name ? name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'pallet'}-manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Variants ─────────────────────────────────────────────────────────────

  const addVariant = () => {
    const variantIndex = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Variant ${variantIndex}`,
        sku: sku ? `${sku}-V${variantIndex}` : '',
        price: basePrice || '',
        stock: '1',
      },
    ]);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // ── Image upload handling ────────────────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newItems: MediaItem[] = files.map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      file: f,
    }));
    setMedia((prev) => [...prev, ...newItems].slice(0, 8));
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setMedia((prev) => {
      const target = prev[index];
      if (target && target.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(target.url);
        } catch {
          // ignore
        }
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent, saveStatus: string) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product / pallet name.');
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      alert('Please enter a valid sale price.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload any pending image files to Cloudflare R2 via backend
      const existingUrls = media.filter((m) => !m.file && !m.url.startsWith('blob:')).map((m) => m.url);
      const pendingFiles = media.filter((m) => m.file).map((m) => m.file as File);

      let uploadedUrls: string[] = [];
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((file) => {
          formData.append('files', file);
        });
        const uploadRes = await apiFetch<{ urls: string[] }>('/products/upload', {
          method: 'POST',
          body: formData,
        });
        const payloadData = uploadRes.data as unknown as { urls: string[] } | string[];
        if (Array.isArray(payloadData)) {
          uploadedUrls = payloadData;
        } else if (payloadData && Array.isArray(payloadData.urls)) {
          uploadedUrls = payloadData.urls;
        }
      }

      const finalImages = [...existingUrls, ...uploadedUrls];

      // 2. Build full typed payload
      const validManifest = manifestRows
        .filter((r) => r.productName.trim() || r.manufacturer.trim() || r.product.trim() || r.upc.trim())
        .map((r) => ({
          manufacturer: r.manufacturer.trim() || undefined,
          productName: r.productName.trim() || undefined,
          product: r.product.trim() || undefined,
          condition: r.condition.trim() || condition || undefined,
          upc: r.upc.trim() || undefined,
          qty: parseInt(r.qty) || 1,
          msrp: r.msrp && !isNaN(parseFloat(r.msrp)) ? parseFloat(r.msrp) : undefined,
        }));

      const validVariants = variants
        .filter((v) => v.name.trim() || v.sku.trim())
        .map((v, idx) => ({
          name: v.name.trim() || `Variant ${idx + 1}`,
          sku: v.sku.trim() || undefined,
          price: v.price && !isNaN(parseFloat(v.price)) ? parseFloat(v.price) : parseFloat(basePrice) || 0,
          stock: v.stock && !isNaN(parseInt(v.stock)) ? parseInt(v.stock) : 1,
          condition: condition || undefined,
        }));

      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: description.trim() || undefined,
        price: parseFloat(basePrice) || 0,
        stock: parseInt(stock) || 1,
        condition: condition || DEFAULT_CONDITION,
        status: saveStatus || status || 'Active',
        comparePrice: comparePrice && !isNaN(parseFloat(comparePrice)) ? parseFloat(comparePrice) : undefined,
        costPrice: costPrice && !isNaN(parseFloat(costPrice)) ? parseFloat(costPrice) : undefined,
        sku: sku.trim() || undefined,
        weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : undefined,
        category: category.trim() || undefined,
        images: finalImages,
        tags: tags.length > 0 ? tags : undefined,
        variants: validVariants.length > 0 ? validVariants : undefined,
        manifest: validManifest.length > 0 ? validManifest : undefined,
      };

      // Filter out undefined keys
      const cleanPayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined) {
          cleanPayload[key] = value;
        }
      }

      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(cleanPayload),
      });

      localStorage.removeItem('product-create-draft');
      alert(`Pallet saved as "${saveStatus}" successfully!`);
      router.push('/admin/products');
    } catch (err: unknown) {
      alert(`Error saving pallet: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 transition-all"
          >
            <i className="fi fi-rr-arrow-small-left text-lg flex items-center justify-center shrink-0" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Add New Pallet</h2>
            <p className="text-neutral-500 mt-0.5 text-sm">Fill in the details to list a new liquidation lot or pallet.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'Draft')}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'Active')}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-all disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, status)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left Column (Main) ───────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Section title="Basic Information" description="Name, description, condition, and categorisation." icon={'fi fi-rr-document'}>
            <div className="space-y-4">
              <Field label="Product / Pallet Name" required hint="Be descriptive — include retailer, category, and unit count.">
                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amazon Customer Returns – Mixed Electronics Pallet"
                  required
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required hint="Select an existing category or create a custom one.">
                  <div className="relative">
                    <select
                      id="category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className={selectCls}
                    >
                      <option value="" disabled>
                        Select category…
                      </option>
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <i className="fi fi-rr-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none flex items-center justify-center shrink-0" />
                  </div>
                </Field>

                <Field label="Pallet Condition" required hint="Describes overall condition of goods on pallet.">
                  <div className="relative">
                    <select
                      id="condition-select"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                      className={selectCls}
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <i className="fi fi-rr-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none flex items-center justify-center shrink-0" />
                  </div>
                </Field>
              </div>

              <Field label="Description" hint="Describe what's included, expected returns, origin facility, and packaging.">
                <textarea
                  id="product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide a detailed description of this pallet's contents, condition grades, manifests, and any known notes…"
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* ── Pallet Manifest Table ── */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800">Pallet Manifest</label>
                    <p className="text-xs text-neutral-400 mt-0.5">Detailed breakdown of included items, quantities, and MSRP.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
                    </svg>
                    Total Items: {totalQty}
                  </span>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50/70">
                          <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700 w-36">Manufacturer</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700">Product Name</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700 w-32">SKU / Model</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700 w-36">Condition</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700 w-36">UPC</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-neutral-700 w-16">QTY</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-neutral-700 w-24">MSRP</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-neutral-700 w-24">EXT MSRP</th>
                          <th className="w-10 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {manifestRows.map((row) => {
                          const ext = (parseFloat(row.qty) || 0) * (parseFloat(row.msrp) || 0);
                          return (
                            <tr key={row.id} className="group hover:bg-neutral-50/40 transition-colors">
                              {/* Manufacturer */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.manufacturer}
                                  onChange={(e) => updateManifestRow(row.id, 'manufacturer', e.target.value)}
                                  placeholder="e.g. Sony"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* Product Name */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.productName}
                                  onChange={(e) => updateManifestRow(row.id, 'productName', e.target.value)}
                                  placeholder="Full product name"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* Product (SKU / model) */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.product}
                                  onChange={(e) => updateManifestRow(row.id, 'product', e.target.value)}
                                  placeholder="SKU / Model"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-700 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* Condition */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.condition}
                                  onChange={(e) => updateManifestRow(row.id, 'condition', e.target.value)}
                                  placeholder="Condition"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* UPC */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.upc}
                                  onChange={(e) => updateManifestRow(row.id, 'upc', e.target.value)}
                                  placeholder="000000000000"
                                  className="w-full bg-transparent border-none outline-none text-sm font-mono text-neutral-600 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* QTY */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  value={row.qty}
                                  onChange={(e) => updateManifestRow(row.id, 'qty', e.target.value)}
                                  placeholder="1"
                                  min="1"
                                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-center text-neutral-900 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* MSRP */}
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-0.5">
                                  <span className="text-neutral-400 text-xs">$</span>
                                  <input
                                    type="number"
                                    value={row.msrp}
                                    onChange={(e) => updateManifestRow(row.id, 'msrp', e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-16 bg-transparent border-none outline-none text-sm text-right text-neutral-700 placeholder:text-neutral-300 focus:ring-0"
                                  />
                                </div>
                              </td>
                              {/* EXT MSRP */}
                              <td className="px-4 py-2.5 text-right">
                                <span className="text-sm font-bold text-neutral-900">
                                  {ext > 0 ? `$${ext.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                </span>
                              </td>
                              {/* Delete */}
                              <td className="px-2 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeManifestRow(row.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition-all"
                                  title="Remove row"
                                >
                                  <i className="fi fi-rr-trash w-3.5 h-3.5 flex items-center justify-center shrink-0" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Totals Row */}
                      <tfoot>
                        <tr className="border-t border-neutral-200 bg-neutral-50 font-bold">
                          <td colSpan={4} className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total MSRP:</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-neutral-900">{totalQty}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-neutral-400">--</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-emerald-700">
                              {totalExtMsrp > 0 ? `$${totalExtMsrp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                            </span>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Add Row */}
                  <div className="border-t border-neutral-100 px-4 py-3 bg-white">
                    <button
                      type="button"
                      onClick={addManifestRow}
                      className="flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      <i className="fi fi-rr-plus w-3.5 h-3.5 flex items-center justify-center shrink-0" />
                      Add Item Row
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex justify-center mt-3">
                  <button
                    type="button"
                    onClick={handleDownloadManifest}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Manifest CSV
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* Images */}
          <Section title="Media & Photos" description="Upload up to 8 photos. First photo is the primary cover image." icon={'fi fi-rr-picture'}>
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all group"
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
                  <i className="fi fi-rr-upload text-lg text-neutral-400 flex items-center justify-center shrink-0" />
                </div>
                <p className="text-sm font-semibold text-neutral-700">Click to upload photos</p>
                <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP — up to 8 images stored on Cloudflare R2</p>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
              </div>

              {media.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {media.map((item, i) => (
                    <div key={item.id || i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group bg-neutral-100">
                      <Image
                        unoptimized
                        fill={true}
                        src={getMediaUrl(item.url)}
                        alt={`Product image ${i + 1}`}
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded-md shadow">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Remove photo"
                      >
                        <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Variants */}
          <Section title="Product Variants" description="Optional: add sub-lots, sizes, grades, or distinct pallet variants." icon={'fi fi-rr-boxes'}>
            <div className="space-y-3">
              {variants.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                  <p className="text-sm text-neutral-500 font-medium">No custom variants added.</p>
                  <p className="text-xs text-neutral-400 mt-1">By default, a primary variant with your SKU and price is automatically managed.</p>
                </div>
              ) : (
                variants.map((v, i) => (
                  <div key={v.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="sm:col-span-4 flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Variant {i + 1}</span>
                      <button type="button" onClick={() => removeVariant(v.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                        <i className="fi fi-rr-trash text-sm flex items-center justify-center shrink-0" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Variant name (e.g. Pallet A)"
                      value={v.name}
                      onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                      className={`${inputCls} sm:col-span-2`}
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                      className={inputCls}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => updateVariant(v.id, 'price', e.target.value)}
                        className={inputCls}
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={v.stock}
                        onChange={(e) => updateVariant(v.id, 'stock', e.target.value)}
                        className={inputCls}
                        min="0"
                      />
                    </div>
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 border border-dashed border-neutral-200 hover:border-neutral-400 px-4 py-3 rounded-xl w-full justify-center transition-all hover:bg-neutral-50"
              >
                <i className="fi fi-rr-plus text-base flex items-center justify-center shrink-0" />
                Add Variant Row
              </button>
            </div>
          </Section>
        </div>

        {/* ── Right Column (Sidebar) ───────────────── */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-neutral-900 mb-4">Status &amp; Visibility</h3>
            <div className="space-y-3">
              {(['Active', 'Draft', 'Archived'] as const).map((s) => (
                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-neutral-900"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{s}</p>
                    <p className="text-xs text-neutral-400">
                      {s === 'Active'
                        ? 'Visible and purchasable on the live storefront.'
                        : s === 'Draft'
                        ? 'Hidden from catalog — only visible in admin panel.'
                        : 'Archived and hidden from the catalog.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <i className="fi fi-rr-dollar text-lg text-neutral-500 flex items-center justify-center shrink-0" />
              <h3 className="font-bold text-neutral-900">Pricing</h3>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Sale Price (Buy It Now)" required hint="The buyer checkout price.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                  <input
                    id="sale-price"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className={`${inputCls} pl-7 font-bold text-neutral-900`}
                  />
                </div>
              </Field>

              <Field label="Estimated Total MSRP (Compare-at)" hint="Retail value to display strike-through savings.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                  <input
                    id="compare-price"
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </Field>

              {comparePrice && basePrice && parseFloat(comparePrice) > parseFloat(basePrice) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-emerald-700 text-xs font-bold">
                    {Math.round((1 - parseFloat(basePrice) / parseFloat(comparePrice)) * 100)}% discount shown to buyers
                  </span>
                </div>
              )}

              <Field label="Cost per Pallet" hint="Internal cost of goods — not shown to buyers.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                  <input
                    id="cost-price"
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Inventory & Shipping */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <i className="fi fi-rr-box text-lg text-neutral-500 flex items-center justify-center shrink-0" />
              <h3 className="font-bold text-neutral-900">Inventory &amp; Shipping</h3>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Pallet / Lot SKU" hint="Unique identifier for inventory management.">
                <input
                  id="product-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. AMZ-ELEC-001"
                  className={inputCls}
                />
              </Field>
              <Field label="Available Pallet Quantity" required>
                <input
                  id="product-stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="1"
                  min="0"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Weight (lbs)" hint="Used for freight quote estimations.">
                <input
                  id="product-weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 450"
                  min="0"
                  step="0.1"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <i className="fi fi-rr-tags text-lg text-neutral-500 flex items-center justify-center shrink-0" />
              <h3 className="font-bold text-neutral-900">Tags</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag…"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  <i className="fi fi-rr-plus text-base flex items-center justify-center shrink-0" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-rose-500 transition-colors">
                        <i className="fi fi-rr-cross-small text-base flex items-center justify-center shrink-0" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-neutral-400">Press Enter or click + to add. Tags improve search visibility.</p>
            </div>
          </div>

          {/* Mobile Submit Buttons */}
          <div className="flex flex-col gap-2 sm:hidden">
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'Active')}
              disabled={submitting}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'Draft')}
              disabled={submitting}
              className="w-full py-3 border border-neutral-200 text-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
