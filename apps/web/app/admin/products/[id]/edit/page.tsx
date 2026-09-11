'use client';

import React, { useState, useRef, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getMediaUrl } from '@/lib/image-url';
import { STANDARD_CONDITIONS, DEFAULT_CONDITION, formatConditionLabel } from '@/lib/condition';
import { toast } from '@/lib/toast';
import { getCleanErrorMessage } from '@/lib/error-utils';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Lock,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  RotateCcw,
  Download,
  Barcode,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  url: string;
  file?: File;
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

interface ApiProductDetail {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
  condition?: string | null;
  status?: string | null;
  comparePrice?: number | string | null;
  costPrice?: number | string | null;
  sku?: string | null;
  weight?: number | string | null;
  manufacturer?: string | null;
  dimensionL?: number | string | null;
  dimensionW?: number | string | null;
  dimensionH?: number | string | null;
  liquidatorName?: string | null;
  liquidatorLogo?: string | null;
  manifest?: ManifestRow[] | null;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  media?: Array<{ id?: string; url: string }>;
  tags?: Array<{ tag: { id: string; name: string } } | string>;
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

const PRESET_LIQUIDATORS = [
  { name: 'Walmart', color: '#0071dc' },
  { name: 'Amazon', color: '#ff9900' },
  { name: 'Target', color: '#cc0000' },
  { name: 'Home Depot', color: '#f96302' },
  { name: 'Costco', color: '#005dab' },
  { name: "Lowe's", color: '#004990' },
  { name: 'Best Buy', color: '#0046be' },
  { name: "Sam's Club", color: '#0071ce' },
  { name: 'Wayfair', color: '#7f187f' },
  { name: 'Macy\'s', color: '#e01a2b' },
  { name: 'Kohl\'s', color: '#000000' },
];

const CONDITIONS = STANDARD_CONDITIONS;

// ─── CSV Parser & Exporter Helpers ────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function mapCsvToManifestRows(rawRows: string[][], fallbackCondition: string): ManifestRow[] {
  if (rawRows.length === 0) return [];

  const headerRow = rawRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const isHeader = headerRow.some((h) =>
    ['manufacturer', 'brand', 'productname', 'title', 'sku', 'upc', 'qty', 'msrp', 'price'].some((k) => h.includes(k))
  );

  let dataRows = rawRows;
  let colIndex = {
    mfr: -1,
    name: -1,
    sku: -1,
    condition: -1,
    upc: -1,
    qty: -1,
    msrp: -1,
  };

  if (isHeader) {
    dataRows = rawRows.slice(1);
    headerRow.forEach((h, idx) => {
      if (h.includes('mfr') || h.includes('manufacturer') || h.includes('brand') || h.includes('make')) colIndex.mfr = idx;
      else if (h.includes('productname') || h.includes('title') || h.includes('desc') || h.includes('itemname')) colIndex.name = idx;
      else if (h.includes('sku') || h.includes('model') || h.includes('part') || h.includes('itemno')) colIndex.sku = idx;
      else if (h.includes('condition') || h.includes('grade')) colIndex.condition = idx;
      else if (h.includes('upc') || h.includes('barcode') || h.includes('ean') || h.includes('gtin')) colIndex.upc = idx;
      else if (h.includes('qty') || h.includes('quantity') || h.includes('count') || h.includes('units')) colIndex.qty = idx;
      else if (h.includes('msrp') || h.includes('retail') || h.includes('price')) {
        if (colIndex.msrp === -1) colIndex.msrp = idx;
      }
    });
  } else {
    colIndex = { mfr: 0, name: 1, sku: 2, condition: 3, upc: 4, qty: 5, msrp: 6 };
  }

  if (colIndex.name === -1 && colIndex.sku !== -1) {
    colIndex.name = colIndex.sku;
  }

  return dataRows
    .filter((row) => row.some((c) => c.trim().length > 0))
    .map((row) => {
      const getVal = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');
      const rawMfr = getVal(colIndex.mfr);
      const rawName = getVal(colIndex.name) || getVal(colIndex.sku) || 'Manifest Item';
      const rawSku = getVal(colIndex.sku);
      const rawCond = getVal(colIndex.condition) || fallbackCondition;
      const rawUpc = getVal(colIndex.upc);
      const rawQty = getVal(colIndex.qty).replace(/[^0-9]/g, '') || '1';
      const rawMsrp = getVal(colIndex.msrp).replace(/[^0-9.]/g, '');

      return {
        id: crypto.randomUUID(),
        manufacturer: rawMfr,
        productName: rawName,
        product: rawSku,
        condition: rawCond,
        upc: rawUpc,
        qty: parseInt(rawQty, 10) > 0 ? rawQty : '1',
        msrp: rawMsrp && !isNaN(parseFloat(rawMsrp)) ? parseFloat(rawMsrp).toFixed(2) : '',
      };
    });
}

// ─── UI Styles ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
      <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base leading-snug">{title}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  hint,
  id,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  id?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1.5">{hint}</p>}
    </div>
  );
}

// ─── Edit Pallet Page ─────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [condition, setCondition] = useState<string>(DEFAULT_CONDITION);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Draft');

  // Sourcing / Liquidator
  const [liquidatorName, setLiquidatorName] = useState('');
  const [liquidatorLogo, setLiquidatorLogo] = useState('');

  // Media
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  // Manifest Data Table
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

  // Financials & Pricing
  const [basePrice, setBasePrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');

  // Logistics & Fulfillment
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('1');
  const [weight, setWeight] = useState('');
  const [dimensionL, setDimensionL] = useState('48');
  const [dimensionW, setDimensionW] = useState('40');
  const [dimensionH, setDimensionH] = useState('');

  // Tags & Submitting
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Reactive Manifest Financials & Totals ──
  const { totalQty, totalExtMsrp } = useMemo(() => {
    let qtyAcc = 0;
    let extAcc = 0;

    for (const row of manifestRows) {
      const q = parseInt(row.qty, 10) || 0;
      const m = parseFloat(row.msrp) || 0;
      qtyAcc += q;
      extAcc += q * m;
    }

    return { totalQty: qtyAcc, totalExtMsrp: extAcc };
  }, [manifestRows]);

  // Effective MSRP for storefront: comparePrice takes precedence; fallback to totalExtMsrp
  const effectiveMsrp = useMemo(() => {
    const parsed = parseFloat(comparePrice);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    return totalExtMsrp > 0 ? totalExtMsrp : 0;
  }, [comparePrice, totalExtMsrp]);

  // Gross Margin Formula: ((Sale Price - Sourcing Cost) / Sale Price) * 100
  const marginCalculation = useMemo(() => {
    const sale = parseFloat(basePrice);
    const cost = parseFloat(costPrice);

    if (isNaN(sale) || sale <= 0 || isNaN(cost) || cost < 0) {
      return null;
    }

    const marginPct = ((sale - cost) / sale) * 100;
    const profitUsd = sale - cost;

    return {
      percent: marginPct,
      profitUsd,
      formattedPercent: `${marginPct >= 0 ? '+' : ''}${marginPct.toFixed(1)}%`,
    };
  }, [basePrice, costPrice]);

  // Discount off Estimated Total MSRP:
  const discountCalculation = useMemo(() => {
    const sale = parseFloat(basePrice);
    if (!isNaN(sale) && sale > 0 && effectiveMsrp > sale) {
      const discountPct = Math.round((1 - sale / effectiveMsrp) * 100);
      const savingsUsd = effectiveMsrp - sale;
      return { discountPct, savingsUsd };
    }
    return null;
  }, [basePrice, effectiveMsrp]);

  // ── Categories List Load ──
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch<{ id: string; name: string; slug: string }[] | { data: { id: string; name: string; slug: string }[] }>('/categories');
        const list = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(list) && list.length > 0) {
          const fetchedNames = list.map((c) => c.name).filter(Boolean);
          setCategoriesList(Array.from(new Set([...fetchedNames, ...DEFAULT_CATEGORIES])));
        }
      } catch (err) {
        console.warn('Could not fetch categories from server, using default list:', err);
      }
    }
    loadCategories();
  }, []);

  // ── Load Product for Edit ──
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<ApiProductDetail>(`/products/${id}`);
        const p = res.data;
        if (p) {
          setName(p.name || '');
          setDescription(p.description || '');
          setBasePrice(p.price ? String(p.price) : '');
          setComparePrice(p.comparePrice != null ? String(p.comparePrice) : '');
          setCostPrice(p.costPrice ? String(p.costPrice) : '');
          setStock(p.stock !== undefined && p.stock !== null ? String(p.stock) : '1');
          setSku(p.sku || '');
          setWeight(p.weight ? String(p.weight) : '');
          setDimensionL(p.dimensionL ? String(p.dimensionL) : '48');
          setDimensionW(p.dimensionW ? String(p.dimensionW) : '40');
          setDimensionH(p.dimensionH ? String(p.dimensionH) : '');
          setLiquidatorName(p.liquidatorName || '');
          setLiquidatorLogo(p.liquidatorLogo || '');
          setCondition(formatConditionLabel(p.condition));
          setStatus(p.status || 'Active');

          if (p.category) {
            setCategory(p.category.name || '');
          }

          if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) {
            const parsedTags = p.tags
              .map((t: string | { tag?: { name?: string } }) => (typeof t === 'string' ? t : t.tag?.name || ''))
              .filter(Boolean);
            setTags(parsedTags);
          }

          if (p.manifest && Array.isArray(p.manifest) && p.manifest.length > 0) {
            setManifestRows(
              p.manifest.map((m: ManifestRow) => ({
                id: m.id || crypto.randomUUID(),
                manufacturer: m.manufacturer || '',
                productName: m.productName || '',
                product: m.product || '',
                condition: formatConditionLabel(m.condition || ''),
                upc: m.upc || '',
                qty: m.qty ? String(m.qty) : '1',
                msrp: m.msrp ? String(m.msrp) : '',
              }))
            );
          }

          if (p.media && p.media.length > 0) {
            setMedia(p.media.map((m: { id?: string; url: string }) => ({ id: m.id || crypto.randomUUID(), url: m.url })));
          }
        }
      } catch (err: unknown) {
        console.error('Failed to load product for editing:', err);
        setError(getCleanErrorMessage(err, 'Product not found.'));
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  // ── Manifest Table Actions ──
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

  const updateManifestRow = (mid: string, field: keyof ManifestRow, value: string) => {
    setManifestRows((prev) => prev.map((r) => (r.id === mid ? { ...r, [field]: value } : r)));
  };

  const removeManifestRow = (mid: string) => {
    setManifestRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== mid) : prev));
  };

  const clearManifestTable = () => {
    if (manifestRows.length > 1 || manifestRows[0].productName || manifestRows[0].manufacturer) {
      if (!confirm('Are you sure you want to clear the entire manifest table?')) return;
    }
    setManifestRows([
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
    toast.info('Manifest table reset.');
  };

  // CSV Bulk Import
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File content is empty.');

        const rawRows = parseCSV(text);
        if (rawRows.length === 0) throw new Error('No rows found in CSV.');

        const parsedRows = mapCsvToManifestRows(rawRows, condition || DEFAULT_CONDITION);
        if (parsedRows.length === 0) throw new Error('Unable to parse valid manifest rows from CSV.');

        setManifestRows(parsedRows);
        toast.success(`Successfully imported ${parsedRows.length} items from CSV!`);
      } catch (err: unknown) {
        toast.error(`CSV Import failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        if (csvRef.current) csvRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // CSV Export / Download
  const handleDownloadManifest = () => {
    const headers = ['Manufacturer', 'Product Name', 'SKU/Model', 'Condition', 'UPC', 'QTY', 'MSRP', 'EXT Price'];
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
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name ? name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'pallet'}-manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Canonical Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const headers = ['Manufacturer', 'Product Name', 'SKU/Model', 'Condition', 'UPC', 'QTY', 'MSRP'];
    const sampleRows = [
      ['Apple', 'AirPods Pro with MagSafe Case', 'MWP22AM/A', 'Open Box', '0190199247000', '10', '249.00'],
      ['Samsung', 'Galaxy Tab S9 128GB', 'SM-X710NZAAXAR', 'Brand New', '0887276767574', '5', '799.99'],
      ['Sony', 'WH-1000XM5 Wireless Headphones', 'WH1000XM5/B', 'Untested Returns', '0027242923515', '8', '399.99'],
    ];
    const csv = [headers, ...sampleRows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pallet-manifest-sample-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Media Handling ──
  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      toast.warning('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    const availableSlots = 8 - media.length;
    if (availableSlots <= 0) {
      toast.warning('Maximum 8 photos reached.');
      return;
    }

    const toAdd = valid.slice(0, availableSlots);
    const newItems: MediaItem[] = toAdd.map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      file: f,
    }));

    setMedia((prev) => [...prev, ...newItems]);
    if (valid.length > availableSlots) {
      toast.info(`Uploaded ${availableSlots} images. (Limit: 8 total)`);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    e.target.value = '';
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setMedia((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success('Primary cover photo updated.');
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

  // ── Tag Management ──
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // ── Delete Pallet ──
  const handleDeleteProduct = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted successfully.');
      router.push('/admin/products');
    } catch (err: unknown) {
      toast.error(`Failed to delete product: ${err instanceof Error ? err.message : String(err)}`);
      setDeleting(false);
    }
  };

  // ── Form Submission ──
  const handleSubmit = async (e: React.FormEvent, saveStatus?: string) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a Pallet / Lot title.');
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast.warning('Please enter a valid Sale Price (Buy It Now).');
      return;
    }

    setSubmitting(true);

    try {
      const existingUrls = media.filter((m) => !m.file && !m.url.startsWith('blob:')).map((m) => m.url);
      const pendingFiles = media.filter((m) => m.file).map((m) => m.file as File);

      let uploadedUrls: string[] = [];
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        pendingFiles.forEach((file) => formData.append('files', file));
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

      const validManifest = manifestRows
        .filter((r) => r.productName.trim() || r.manufacturer.trim() || r.product.trim() || r.upc.trim())
        .map((r) => ({
          manufacturer: r.manufacturer.trim() || undefined,
          productName: r.productName.trim() || undefined,
          product: r.product.trim() || undefined,
          condition: r.condition.trim() || condition || undefined,
          upc: r.upc.trim() || undefined,
          qty: parseInt(r.qty, 10) || 1,
          msrp: r.msrp && !isNaN(parseFloat(r.msrp)) ? parseFloat(r.msrp) : undefined,
        }));

      const derivedManufacturer = validManifest.find((m) => m.manufacturer)?.manufacturer || undefined;

      const parsedCompare = comparePrice && !isNaN(parseFloat(comparePrice)) && parseFloat(comparePrice) > 0
        ? parseFloat(parseFloat(comparePrice).toFixed(2))
        : undefined;
      const finalComparePrice = parsedCompare !== undefined
        ? parsedCompare
        : (totalExtMsrp > 0 ? parseFloat(totalExtMsrp.toFixed(2)) : undefined);

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(basePrice) || 0,
        // Compare-At MSRP: Explicit user setting or fallback to manifest total
        comparePrice: finalComparePrice,
        costPrice: costPrice && !isNaN(parseFloat(costPrice)) ? parseFloat(costPrice) : undefined,
        stock: parseInt(stock, 10) > 0 ? parseInt(stock, 10) : 1,
        condition: condition || DEFAULT_CONDITION,
        status: saveStatus || status || 'Active',
        sku: sku.trim() || undefined,
        weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : undefined,
        manufacturer: derivedManufacturer,
        dimensionL: dimensionL && !isNaN(parseFloat(dimensionL)) ? parseFloat(dimensionL) : undefined,
        dimensionW: dimensionW && !isNaN(parseFloat(dimensionW)) ? parseFloat(dimensionW) : undefined,
        dimensionH: dimensionH && !isNaN(parseFloat(dimensionH)) ? parseFloat(dimensionH) : undefined,
        liquidatorName: liquidatorName.trim() || undefined,
        liquidatorLogo: liquidatorLogo.trim() || undefined,
        category: category.trim() || undefined,
        images: finalImages,
        tags: tags.length > 0 ? tags : undefined,
        manifest: validManifest,
      };

      const cleanPayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined) cleanPayload[key] = value;
      }

      await apiFetch(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(cleanPayload),
      });

      toast.success('Pallet updated successfully!');
      router.push('/admin/products');
    } catch (err: unknown) {
      toast.error(`Error updating pallet: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        <p className="text-neutral-500 font-semibold text-sm">Loading pallet details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">{error}</h2>
        <Link href="/admin/products" className="inline-block px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      
      {/* ── Page Header & Top Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200/90 rounded-2xl p-5 sm:px-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 transition-all shadow-2xs"
            title="Back to All Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">Edit Pallet</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 font-mono">
                {sku || id.slice(0, 8)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Update manifest line items, automated financial formulas, and warehouse freight specifications.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={deleting || submitting}
            onClick={handleDeleteProduct}
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting…' : 'Delete'}</span>
          </button>
          <button
            type="button"
            disabled={submitting || deleting}
            onClick={(e) => handleSubmit(e, 'Draft')}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting || deleting}
            onClick={(e) => handleSubmit(e, 'Active')}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{submitting ? 'Updating…' : 'Update Pallet'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN: Core Lot Identity, Media & Manifest (Span 8) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── SECTION 1: Core Pallet Information (Lot Identity) ── */}
          <SectionCard
            title="Section 1: Core Pallet Information"
            subtitle="High-level lot classification and retail origin mapping."
            icon={Package}
          >
            <div className="space-y-4">
              <Field label="Pallet / Lot Title" required id="product-name" hint="Descriptive title — specify liquidator, merchandise category, and key brands.">
                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Walmart Customer Returns – Premium Audio & Mixed Electronics Pallet"
                  required
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Primary Category" required id="category-select" hint="Determines catalog grouping and navigation filters.">
                  <div className="relative">
                    <select
                      id="category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className={selectCls}
                    >
                      <option value="" disabled>Select category…</option>
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <i className="fi fi-rr-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label="Lot Condition Grade" required id="condition-select" hint="Uniform rating explaining overall condition tier to buyers.">
                  <div className="relative">
                    <select
                      id="condition-select"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                      className={selectCls}
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <i className="fi fi-rr-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
                </Field>
              </div>

              {/* Retail Liquidator / Source Preset Quick-Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Retail Liquidator / Source
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_LIQUIDATORS.map((liq) => {
                    const isSelected = liquidatorName.toLowerCase() === liq.name.toLowerCase();
                    return (
                      <button
                        key={liq.name}
                        type="button"
                        onClick={() => setLiquidatorName(liq.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: liq.color }} />
                        <span>{liq.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    id="liquidator-name"
                    type="text"
                    value={liquidatorName}
                    onChange={(e) => setLiquidatorName(e.target.value)}
                    placeholder="Custom liquidator or facility name…"
                    className={inputCls}
                  />
                  <input
                    id="liquidator-logo"
                    type="url"
                    value={liquidatorLogo}
                    onChange={(e) => setLiquidatorLogo(e.target.value)}
                    placeholder="Optional liquidator logo URL (HTTPS)…"
                    className={inputCls}
                  />
                </div>
              </div>

              <Field label="Description & Manifest Notes" id="product-description" hint="Packaging specs, facility dock policies, and overall condition highlights.">
                <textarea
                  id="product-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Detail lot composition, inspection notes, shrink-wrap condition, or pickup dock instructions…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── SECTION 2: Media & Gallery ── */}
          <SectionCard
            title="Section 2: Media & Gallery"
            subtitle="Drag & drop inspection photos. Accepts up to 8 PNG/JPG/WEBP images."
            icon={ImageIcon}
            badge={
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                {media.length}/8 Uploaded
              </span>
            }
          >
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = Array.from(e.dataTransfer.files);
                handleFiles(files);
              }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-neutral-900 bg-neutral-100/70 scale-[1.005]'
                  : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50'
              }`}
            >
              <div className="w-12 h-12 bg-neutral-100 text-neutral-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-900">Drag & drop photos here, or click to browse</p>
              <p className="text-xs text-neutral-400 mt-1">Accepts PNG, JPG, WEBP — up to 10MB per image (Cloudflare R2 stored)</p>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
            </div>

            {/* Visual Photo Grid (Primary Cover vs Secondary) */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                {media.map((item, idx) => {
                  const isCover = idx === 0;
                  return (
                    <div
                      key={item.id || idx}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border transition-all group bg-neutral-100 ${
                        isCover
                          ? 'ring-2 ring-neutral-900 border-transparent shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Image
                        unoptimized
                        fill
                        src={getMediaUrl(item.url)}
                        alt={`Pallet photo ${idx + 1}`}
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />

                      {/* Primary Cover Badge */}
                      {isCover ? (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Primary Cover
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-neutral-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm cursor-pointer"
                        >
                          Set as Cover
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── SECTION 3: Pallet Manifest (The Core Data Table) ── */}
          <SectionCard
            title="Section 3: Pallet Manifest"
            subtitle="Itemized breakdown of included goods. Extracted data auto-powers financial metrics."
            icon={Layers}
            badge={
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-neutral-100 text-neutral-700 px-3 py-1 rounded-xl">
                <Barcode className="w-3.5 h-3.5" />
                <span>{manifestRows.length} Line Items</span>
              </span>
            }
          >
            {/* Action Bar Above Table */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
              <div className="flex items-center gap-2">
                <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={handleCsvSelect} />
                <button
                  type="button"
                  onClick={() => csvRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Bulk Import via CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Download standard template headers"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Sample CSV Template</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadManifest}
                  disabled={manifestRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={clearManifestTable}
                  className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Table</span>
                </button>
              </div>
            </div>

            {/* Manifest Data Grid */}
            <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-130 scrollbar-thin scrollbar-thumb-neutral-300">
                <table className="min-w-310 w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-100/90 text-neutral-700 border-b border-neutral-200 sticky top-0 z-10 backdrop-blur-xs font-bold">
                    <tr>
                      <th className="px-3.5 py-3 w-37.5 min-w-37.5">Manufacturer</th>
                      <th className="px-3.5 py-3 w-70 min-w-70">Product Name *</th>
                      <th className="px-3.5 py-3 w-35 min-w-35">SKU / Model</th>
                      <th className="px-3.5 py-3 w-42.5 min-w-42.5">Condition</th>
                      <th className="px-3.5 py-3 w-37.5 min-w-37.5">UPC / Barcode</th>
                      <th className="px-3.5 py-3 w-22.5 min-w-22.5 text-center">QTY *</th>
                      <th className="px-3.5 py-3 w-30 min-w-30 text-right">MSRP ($)</th>
                      <th className="px-3.5 py-3 w-32.5 min-w-32.5 text-right font-extrabold text-neutral-900 bg-neutral-200/60 whitespace-nowrap">EXT Price</th>
                      <th className="w-12.5 min-w-12.5 px-2 text-center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {manifestRows.map((row) => {
                      const q = parseInt(row.qty, 10) || 0;
                      const m = parseFloat(row.msrp) || 0;
                      const ext = q * m;

                      return (
                        <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                          {/* Manufacturer */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.manufacturer}
                              onChange={(e) => updateManifestRow(row.id, 'manufacturer', e.target.value)}
                              placeholder="e.g. Apple"
                              className="w-full px-3 py-2 bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-xs text-neutral-800 placeholder:text-neutral-300 focus:outline-none transition-all"
                            />
                          </td>

                          {/* Product Name */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.productName}
                              onChange={(e) => updateManifestRow(row.id, 'productName', e.target.value)}
                              placeholder="Full product title / description…"
                              required
                              className="w-full px-3 py-2 bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-xs font-semibold text-neutral-900 placeholder:text-neutral-300 focus:outline-none transition-all"
                            />
                          </td>

                          {/* SKU / Model */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.product}
                              onChange={(e) => updateManifestRow(row.id, 'product', e.target.value)}
                              placeholder="Model / Part #"
                              className="w-full px-3 py-2 bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-xs font-mono text-neutral-700 placeholder:text-neutral-300 focus:outline-none transition-all"
                            />
                          </td>

                          {/* Condition */}
                          <td className="p-2.5">
                            <select
                              value={row.condition}
                              onChange={(e) => updateManifestRow(row.id, 'condition', e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-xs font-medium text-neutral-800 focus:outline-none transition-all cursor-pointer"
                            >
                              {CONDITIONS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>

                          {/* UPC / Barcode */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.upc}
                              onChange={(e) => updateManifestRow(row.id, 'upc', e.target.value)}
                              placeholder="012345678901"
                              className="w-full px-3 py-2 bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-xs font-mono text-neutral-600 placeholder:text-neutral-300 focus:outline-none transition-all"
                            />
                          </td>

                          {/* QTY */}
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) => updateManifestRow(row.id, 'qty', e.target.value)}
                              required
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl text-xs font-bold text-center text-neutral-900 focus:bg-white focus:outline-none transition-all"
                            />
                          </td>

                          {/* MSRP ($) */}
                          <td className="p-2.5">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.msrp}
                                onChange={(e) => updateManifestRow(row.id, 'msrp', e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-6 pr-3 py-2 bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white rounded-xl text-xs text-right font-medium text-neutral-800 placeholder:text-neutral-300 focus:outline-none transition-all"
                              />
                            </div>
                          </td>

                          {/* EXT Price */}
                          <td className="px-3.5 py-2.5 text-right font-extrabold text-neutral-900 bg-neutral-50/60 whitespace-nowrap">
                            ${ext.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Delete */}
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeManifestRow(row.id)}
                              disabled={manifestRows.length <= 1}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-20 transition-all cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={addManifestRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>

                <p className="text-[11px] text-neutral-400">
                  Formulas auto-compute on every change. Empty rows are skipped upon saving.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN: Smart Financials, Logistics & Publishing (Span 4) ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* ── SECTION 4: Automated Financials & Pricing (Smart Section) ── */}
          <SectionCard
            title="Section 4: Financials & Pricing"
            subtitle="Automated manifest metrics, public pricing, and internal profit analysis."
            icon={DollarSign}
          >
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Automated Manifest Totals (Read-Only)
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Total Manifest Items */}
                <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block">Total Items</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-neutral-900 tracking-tight">{totalQty}</span>
                    <span className="text-xs text-neutral-500 font-medium">units</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Σ Manifest QTY</span>
                </div>

                {/* Estimated Total MSRP */}
                <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block">Estimated Total MSRP</span>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
                      ${totalExtMsrp.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Σ Line EXT Prices</span>
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Buyer-Facing Storefront Pricing */}
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-700 block">
                Public Storefront Pricing
              </span>

              <Field label="Sale Price / Buy It Now ($)" required id="sale-price" hint="This is the exact purchase price paid by the wholesale buyer.">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">$</span>
                  <input
                    id="sale-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className={`${inputCls} pl-8 text-base font-extrabold text-neutral-900`}
                  />
                </div>
              </Field>

              <Field
                label="Compare-at Price / Est. Retail MSRP ($)"
                id="compare-price"
                hint="Storefront retail value used to calculate buyer savings (e.g. 'Save 74% MSRP'). Defaults to manifest line-item total if left blank."
              >
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">$</span>
                    <input
                      id="compare-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      placeholder={totalExtMsrp > 0 ? totalExtMsrp.toFixed(2) : "0.00"}
                      className={`${inputCls} pl-8 text-sm font-semibold text-neutral-900`}
                    />
                  </div>

                  {totalExtMsrp > 0 && (
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-neutral-500">
                        Manifest Sum: <strong className="text-neutral-700">${totalExtMsrp.toFixed(2)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setComparePrice(totalExtMsrp.toFixed(2))}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        Auto-fill from Manifest
                      </button>
                    </div>
                  )}
                </div>
              </Field>

              {/* Live Discount Callout */}
              {discountCalculation ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>Storefront Savings:</span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                    {discountCalculation.discountPct}% OFF MSRP (${discountCalculation.savingsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} savings)
                  </span>
                </div>
              ) : (
                parseFloat(basePrice) > 0 && effectiveMsrp > 0 && parseFloat(basePrice) >= effectiveMsrp && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800">
                    <p className="font-bold text-amber-900">MSRP is less than or equal to Sale Price</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">The &ldquo;Save XX% MSRP&rdquo; badge will not display on pallet cards until MSRP is higher than the sale price.</p>
                  </div>
                )
              )}
            </div>

            <hr className="border-neutral-100" />

            {/* Internal Financials & Profitability (Confidential) */}
            <div className="p-4 bg-neutral-50/70 border border-neutral-200/90 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  Internal Cost & Profitability
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                  Hidden from Buyers
                </span>
              </div>

              <Field label="Sourcing Cost per Pallet ($)" id="cost-price" hint="What your company paid to acquire this lot.">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">$</span>
                  <input
                    id="cost-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </Field>

              <div className="pt-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">
                  Estimated Gross Margin
                </span>
                {marginCalculation ? (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                      marginCalculation.percent >= 40
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : marginCalculation.percent >= 15
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    <span>Margin: {marginCalculation.formattedPercent}</span>
                    <span>Profit: ${marginCalculation.profitUsd.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white border border-neutral-200 rounded-xl text-center text-xs text-neutral-400 font-medium">
                    Enter Sale Price & Sourcing Cost to calculate margin
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── SECTION 5: Logistics & Fulfillment ── */}
          <SectionCard
            title="Section 5: Logistics & Fulfillment"
            subtitle="Freight specifications for LTL carrier quoting and dock loading."
            icon={Package}
          >
            <div className="space-y-4">
              <Field label="Pallet / Lot Inventory SKU" id="pallet-sku" hint="Unique internal identification code for racking.">
                <input
                  id="pallet-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. WMT-2026-ELEC-001"
                  className={`${inputCls} font-mono uppercase`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Available Lot Qty" required id="pallet-stock" hint="Number of identical pallets.">
                  <input
                    id="pallet-stock"
                    type="number"
                    min="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    className={inputCls}
                  />
                </Field>

                <Field label="Total Weight (lbs)" id="pallet-weight" hint="Used for freight quoting.">
                  <div className="relative">
                    <input
                      id="pallet-weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 450"
                      className={inputCls}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-semibold pointer-events-none">
                      lbs
                    </span>
                  </div>
                </Field>
              </div>

              {/* Dimensions L x W x H */}
              <Field label="Pallet Dimensions (L × W × H in inches)" hint="Standard GMA wooden pallet is 48 × 40 in.">
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      id="dim-l"
                      type="number"
                      min="0"
                      value={dimensionL}
                      onChange={(e) => setDimensionL(e.target.value)}
                      placeholder="L (48)"
                      className={inputCls}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-semibold pointer-events-none">in</span>
                  </div>
                  <div className="relative">
                    <input
                      id="dim-w"
                      type="number"
                      min="0"
                      value={dimensionW}
                      onChange={(e) => setDimensionW(e.target.value)}
                      placeholder="W (40)"
                      className={inputCls}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-semibold pointer-events-none">in</span>
                  </div>
                  <div className="relative">
                    <input
                      id="dim-h"
                      type="number"
                      min="0"
                      value={dimensionH}
                      onChange={(e) => setDimensionH(e.target.value)}
                      placeholder="H (Height)"
                      className={inputCls}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-semibold pointer-events-none">in</span>
                  </div>
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* ── Publishing Status & Tags Card ── */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
            <Field label="Listing Status">
              <div className="grid grid-cols-3 gap-2">
                {['Draft', 'Active', 'Archived'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === s
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Search Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add search tag…"
                  className={`${inputCls} text-xs py-2`}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    >
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-rose-600 cursor-pointer">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Bottom Submit Actions */}
            <div className="pt-2 sm:hidden space-y-2">
              <button
                type="button"
                disabled={submitting || deleting}
                onClick={(e) => handleSubmit(e, 'Active')}
                className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all shadow-sm"
              >
                {submitting ? 'Updating…' : 'Update Pallet'}
              </button>
              <button
                type="button"
                disabled={submitting || deleting}
                onClick={(e) => handleSubmit(e, 'Draft')}
                className="w-full py-2.5 border border-neutral-200 text-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-all"
              >
                Save as Draft
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
