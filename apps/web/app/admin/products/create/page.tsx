
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';


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

const CATEGORIES = [
  'Electronics', 'Home & Garden', 'Apparel', 'Toys & Games',
  'Tools & Hardware', 'Sports', 'Beauty', 'Furniture', 'Pet Supplies', 'Baby', 'Other',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor / Parts Only'];

// ─── Form Section Wrapper ─────────────────────────────────────────────────────

function Section({ title, description, icon, children }: {
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

function Field({ label, required, children, hint }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [condition, setCondition]     = useState('');
  const [status, setStatus]           = useState('Draft');
  const [basePrice, setBasePrice]     = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stock, setStock]             = useState('');
  const [sku, setSku]                 = useState('');
  const [weight, setWeight]           = useState('');
  const [tags, setTags]               = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState('');
  const [variants, setVariants]       = useState<Variant[]>([]);
  const [images, setImages]           = useState<string[]>([]);
  const [manifestRows, setManifestRows] = useState<ManifestRow[]>([{ id: crypto.randomUUID(), manufacturer: '', productName: '', product: '', condition: '', upc: '', qty: '', msrp: '' }]);
  const [submitting, setSubmitting]   = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Auto-Save to LocalStorage ─────────────────────────────────────────────
  useEffect(() => {
    const draft = localStorage.getItem('product-create-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.name) setName(parsed.name);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.condition) setCondition(parsed.condition);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.basePrice) setBasePrice(parsed.basePrice);
        if (parsed.comparePrice) setComparePrice(parsed.comparePrice);
        if (parsed.stock) setStock(parsed.stock);
        if (parsed.sku) setSku(parsed.sku);
        if (parsed.weight) setWeight(parsed.weight);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.variants) setVariants(parsed.variants);
        if (parsed.images) setImages(parsed.images);
        if (parsed.manifestRows && parsed.manifestRows.length > 0) setManifestRows(parsed.manifestRows);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    setIsDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    
    const hasChanges = name || description || category || condition || basePrice || comparePrice || stock || sku || weight || tags.length > 0 || variants.length > 0 || manifestRows.length > 1 || manifestRows[0].productName;
    if (!hasChanges) {
      localStorage.removeItem('product-create-draft');
      return;
    }
    
    const draft = {
      name, description, category, condition, status, basePrice, comparePrice,
      stock, sku, weight, tags, variants, images, manifestRows
    };
    localStorage.setItem('product-create-draft', JSON.stringify(draft));
  }, [name, description, category, condition, status, basePrice, comparePrice, stock, sku, weight, tags, variants, images, manifestRows, isDraftLoaded]);

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
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  // ── Manifest Rows ─────────────────────────────────────────────────────────

  const addManifestRow = () => {
    setManifestRows(prev => [...prev, { id: crypto.randomUUID(), manufacturer: '', productName: '', product: '', condition: '', upc: '', qty: '', msrp: '' }]);
  };
  const updateManifestRow = (id: string, field: keyof ManifestRow, value: string) => {
    setManifestRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const removeManifestRow = (id: string) => {
    setManifestRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  };

  const totalQty     = manifestRows.reduce((acc, r) => acc + (parseInt(r.qty) || 0), 0);
  const totalExtMsrp = manifestRows.reduce((acc, r) => {
    const qty  = parseFloat(r.qty)  || 0;
    const unit = parseFloat(r.msrp) || 0;
    return acc + qty * unit;
  }, 0);

  const handleDownloadManifest = () => {
    const headers = ['Manufacturer', 'Product Name', 'Product', 'Condition', 'UPC', 'QTY', 'MSRP', 'EXT MSRP'];
    const rows = manifestRows.map(r => {
      const ext = (parseFloat(r.qty) || 0) * (parseFloat(r.msrp) || 0);
      return [r.manufacturer, r.productName, r.product, r.condition, r.upc, r.qty, r.msrp ? `$${parseFloat(r.msrp).toFixed(2)}` : '', ext > 0 ? `$${ext.toFixed(2)}` : ''];
    });
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'pallet-manifest.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Variants ─────────────────────────────────────────────────────────────

  const addVariant = () => {
    setVariants(prev => [...prev, {
      id:    crypto.randomUUID(),
      name:  '',
      sku:   '',
      price: '',
      stock: '',
    }]);
  };
  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };
  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  // ── Image mock upload ────────────────────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls  = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...urls].slice(0, 8));
    e.target.value = '';
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent, saveStatus: string) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description,
        price: parseFloat(basePrice) || 0,
        stock: parseInt(stock) || 0,
      };

      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      localStorage.removeItem('product-create-draft');
      alert(`Product saved as "${saveStatus}" successfully!`);
    } catch (err: unknown) {
      alert(`Error saving product: ${err instanceof Error ? err.message : String(err)}`);
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
            <p className="text-neutral-500 mt-0.5 text-sm">Fill in the details to list a new product or pallet.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={e => handleSubmit(e as unknown as React.FormEvent, 'Draft')}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={e => handleSubmit(e as unknown as React.FormEvent, 'Active')}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-all disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <form onSubmit={e => handleSubmit(e, status)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left Column (Main) ───────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <Section title="Basic Information" description="Name, description, and categorisation." icon={'fi fi-rr-document'}>
            <div className="space-y-4">
              <Field label="Product / Pallet Name" required hint="Be descriptive — include retailer, category, and unit count.">
                <input id="product-name" type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Amazon Customer Returns – Mixed Electronics Pallet"
                  required className={inputCls} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required>
                  <div className="relative">
                    <select id="category-select" value={category} onChange={e => setCategory(e.target.value)} required className={selectCls}>
                      <option value="" disabled>Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <i className="fi fi-rr-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none flex items-center justify-center shrink-0" />
                  </div>
                </Field>
                <Field label="Condition" required>
                  <div className="relative">
                    <select id="condition-select" value={condition} onChange={e => setCondition(e.target.value)} required className={selectCls}>
                      <option value="" disabled>Select condition…</option>
                      {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <i className="fi fi-rr-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none flex items-center justify-center shrink-0" />
                  </div>
                </Field>
              </div>

              <Field label="Description" hint="Describe what's included, expected returns, and sourcing retailer.">
                <textarea id="product-description" value={description} onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide a detailed description of this pallet's contents, condition grades, and any known issues…"
                  className={`${inputCls} resize-none`} />
              </Field>

              {/* ── Pallet Manifest Table ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800">Pallet Manifest</label>
                    <p className="text-xs text-neutral-400 mt-0.5">Detailed breakdown of included items.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" /></svg>
                    Total Items: {totalQty}
                  </span>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700 w-36">
                            Manufacturer
                            <span className="ml-1 text-neutral-400">↑</span>
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Product Name</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 w-32">Product</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Condition</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 w-36">UPC</th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 w-16">QTY</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 w-24">MSRP</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 w-24">EXT MSRP</th>
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
                                  onChange={e => updateManifestRow(row.id, 'manufacturer', e.target.value)}
                                  placeholder="e.g. Sony"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* Product Name */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.productName}
                                  onChange={e => updateManifestRow(row.id, 'productName', e.target.value)}
                                  placeholder="Full product name"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* Product (SKU / model) */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.product}
                                  onChange={e => updateManifestRow(row.id, 'product', e.target.value)}
                                  placeholder="SKU / Model"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-700 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* Condition */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.condition}
                                  onChange={e => updateManifestRow(row.id, 'condition', e.target.value)}
                                  placeholder="e.g. Damaged/Missing Parts"
                                  className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* UPC */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={row.upc}
                                  onChange={e => updateManifestRow(row.id, 'upc', e.target.value)}
                                  placeholder="000000000000"
                                  className="w-full bg-transparent border-none outline-none text-sm font-mono text-neutral-600 placeholder:text-neutral-300 focus:ring-0"
                                />
                              </td>
                              {/* QTY */}
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  value={row.qty}
                                  onChange={e => updateManifestRow(row.id, 'qty', e.target.value)}
                                  placeholder="0"
                                  min="0"
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
                                    onChange={e => updateManifestRow(row.id, 'msrp', e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-16 bg-transparent border-none outline-none text-sm text-right text-neutral-700 placeholder:text-neutral-300 focus:ring-0"
                                  />
                                </div>
                              </td>
                              {/* EXT MSRP — calculated */}
                              <td className="px-4 py-2.5 text-right">
                                <span className="text-sm font-bold text-neutral-900">
                                  {ext > 0 ? `$${ext.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                                </span>
                              </td>
                              {/* Delete */}
                              <td className="px-2 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeManifestRow(row.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-neutral-300 hover:text-rose-500 transition-all"
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
                        <tr className="border-t border-neutral-200 bg-neutral-50">
                          <td colSpan={4} className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Totals</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-neutral-900">{totalQty}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-neutral-400">--</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-neutral-900">
                              {totalExtMsrp > 0 ? `$${totalExtMsrp.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
                            </span>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Add Row */}
                  <div className="border-t border-neutral-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={addManifestRow}
                      className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      <i className="fi fi-rr-plus w-3.5 h-3.5 flex items-center justify-center shrink-0" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={handleDownloadManifest}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all"
                  >
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download full manifest
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* Images */}
          <Section title="Media" description="Upload up to 8 photos. First image is the cover." icon={'fi fi-rr-picture'}>
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all group"
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
                  <i className="fi fi-rr-upload text-lg text-neutral-400 flex items-center justify-center shrink-0" />
                </div>
                <p className="text-sm font-semibold text-neutral-700">Click to upload images</p>
                <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WEBP — max 8 images</p>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
              </div>

              {/* Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image fill={true} src={src} alt={`Product image ${i + 1}`} className="object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">Cover</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
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
          <Section title="Product Variants" description="Optional: add size, grade, or lot-size variants." icon={'fi fi-rr-boxes'}>
            <div className="space-y-3">
              {variants.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl">
                  <p className="text-sm text-neutral-500">No variants added yet.</p>
                  <p className="text-xs text-neutral-400 mt-1">Use variants for different pallet sizes or grades.</p>
                </div>
              ) : variants.map((v, i) => (
                <div key={v.id} className="grid grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="col-span-4 flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Variant {i + 1}</span>
                    <button type="button" onClick={() => removeVariant(v.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                      <i className="fi fi-rr-trash text-lg flex items-center justify-center shrink-0" />
                    </button>
                  </div>
                  <input
                    type="text" placeholder="Variant name (e.g. Grade A)"
                    value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)}
                    className={`${inputCls} col-span-2`}
                  />
                  <input
                    type="text" placeholder="SKU"
                    value={v.sku} onChange={e => updateVariant(v.id, 'sku', e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="number" placeholder="Price"
                    value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)}
                    className={inputCls} min="0" step="0.01"
                  />
                  <input
                    type="number" placeholder="Stock qty"
                    value={v.stock} onChange={e => updateVariant(v.id, 'stock', e.target.value)}
                    className={inputCls} min="0"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 border border-dashed border-neutral-200 hover:border-neutral-400 px-4 py-3 rounded-xl w-full justify-center transition-all hover:bg-neutral-50"
              >
                <i className="fi fi-rr-plus text-lg flex items-center justify-center shrink-0" />
                Add Variant
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
              {(['Active', 'Draft', 'Archived'] as const).map(s => (
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
                      {s === 'Active'   ? 'Visible and purchasable on the shop.' :
                       s === 'Draft'    ? 'Hidden — only admins can preview.' :
                                          'Unlisted and removed from shop.'}
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
              <Field label="Sale Price" required hint="The B2B buying price shown on the listing.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                  <input id="sale-price" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                    placeholder="0.00" min="0" step="0.01" required
                    className={`${inputCls} pl-7`} />
                </div>
              </Field>
              <Field label="Compare-at Price" hint="Strike-through retail value — shows savings.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">$</span>
                  <input id="compare-price" type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)}
                    placeholder="0.00" min="0" step="0.01"
                    className={`${inputCls} pl-7`} />
                </div>
              </Field>
              {comparePrice && basePrice && parseFloat(comparePrice) > parseFloat(basePrice) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-emerald-700 text-xs font-bold">
                    {Math.round((1 - parseFloat(basePrice) / parseFloat(comparePrice)) * 100)}% discount shown to buyers
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <i className="fi fi-rr-box text-lg text-neutral-500 flex items-center justify-center shrink-0" />
              <h3 className="font-bold text-neutral-900">Inventory</h3>
            </div>
            <div className="p-5 space-y-4">
              <Field label="SKU" hint="Internal stock-keeping unit — must be unique.">
                <input id="product-sku" type="text" value={sku} onChange={e => setSku(e.target.value)}
                  placeholder="ELC-PAL-001" className={inputCls} />
              </Field>
              <Field label="Quantity Available" required>
                <input id="product-stock" type="number" value={stock} onChange={e => setStock(e.target.value)}
                  placeholder="0" min="0" required className={inputCls} />
              </Field>
              <Field label="Weight (lbs)" hint="Used for shipping rate calculation.">
                <input id="product-weight" type="number" value={weight} onChange={e => setWeight(e.target.value)}
                  placeholder="0" min="0" step="0.1" className={inputCls} />
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
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag…"
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={addTag}
                  className="px-3 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-700 transition-colors">
                  <i className="fi fi-rr-plus text-lg flex items-center justify-center shrink-0" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-rose-500 transition-colors">
                        <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-neutral-400">Press Enter or click + to add. Tags improve search visibility.</p>
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <i className="fi fi-rr-info text-lg text-amber-600 shrink-0 mt-0.5 flex items-center justify-center shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Prices are locked on the backend at order creation. The frontend always fetches the server-side price — buyers cannot manipulate it.
            </p>
          </div>

          {/* Mobile Submit Buttons */}
          <div className="flex flex-col gap-2 sm:hidden">
            <button
              type="button"
              onClick={e => handleSubmit(e as unknown as React.FormEvent, 'Active')}
              disabled={submitting}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={e => handleSubmit(e as unknown as React.FormEvent, 'Draft')}
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
