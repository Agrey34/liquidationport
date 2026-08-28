'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { apiFetch } from '../../../lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  createdAt: string;
  _count?: {
    products?: number;
  };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const [catRes, tagRes] = await Promise.all([
        apiFetch<Category[]>('/categories', { signal }),
        apiFetch<Tag[]>('/tags', { signal }),
      ]);

      const catPayload = catRes.data as unknown as Category[];
      const tagPayload = tagRes.data as unknown as Tag[];

      setCategories(Array.isArray(catPayload) ? catPayload : []);
      setTags(Array.isArray(tagPayload) ? tagPayload : []);
    } catch (err: unknown) {
      if (
        signal?.aborted ||
        (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort')))
      ) {
        return;
      }
      console.error('Failed to load categories/tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to database.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // Clean up object URL when modal closes or file changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormImageUrl(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormImageUrl(category.imageUrl || null);
    setSelectedFile(null);
    setPreviewUrl(category.imageUrl || null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle auto-generating slug from name
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!formSlug || formSlug === formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, WebP, GIF, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError('Image size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    setFormError(null);

    // Create local object preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Category (Create or Edit)
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      setFormError('Category name and slug are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      let finalImageUrl = formImageUrl;

      // 1. If user selected a new file, upload it directly to Cloudflare R2 categories/ folder
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await apiFetch<{ url: string; key: string }>('/categories/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = uploadRes.data as unknown as { url?: string; key?: string };
        if (uploadData?.url) {
          finalImageUrl = uploadData.url;
        }
      }

      // 2. Save Category to Database (POST or PATCH)
      if (editingCategory) {
        await apiFetch(`/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formName.trim(),
            slug: formSlug.trim(),
            imageUrl: finalImageUrl,
          }),
        });
      } else {
        await apiFetch('/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: formName.trim(),
            slug: formSlug.trim(),
            imageUrl: finalImageUrl,
          }),
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to save category:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/categories/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      console.error('Failed to delete category:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Categories & Taxonomies</h2>
          <p className="text-neutral-500 mt-1">
            Organize catalog departments with Cloudflare R2 high-res image icons.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm w-full sm:w-auto justify-center"
          >
            <i className="fi fi-rr-plus" /> New Category
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <i className="fi fi-rr-triangle-warning text-lg shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchData()} className="text-xs font-bold underline hover:no-underline ml-4">
            Try Again
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Total Categories</p>
            <p className="text-3xl font-black text-neutral-900">
              {loading ? (
                <span className="inline-block w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
              ) : (
                categories.length
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <i className="fi fi-rr-folder-tree text-2xl" />
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Active Tags</p>
            <p className="text-3xl font-black text-neutral-900">
              {loading ? (
                <span className="inline-block w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
              ) : (
                tags.length
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <i className="fi fi-rr-tags text-2xl" />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative">
            <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all w-64"
            />
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <i className={`fi fi-rr-refresh ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">URL Slug</th>
                <th className="px-6 py-4 font-bold">Live Products</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 rounded-xl shrink-0" />
                        <div className="h-4 bg-neutral-200 rounded w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3 bg-neutral-100 rounded w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-neutral-100 rounded-full w-16" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 bg-neutral-100 rounded w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-400">
                    <i className="fi fi-rr-inbox text-4xl block mb-2" />
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200/80 overflow-hidden flex items-center justify-center shrink-0 relative">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="fi fi-rr-folder text-xl text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm leading-tight">{category.name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {category.imageUrl ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                <i className="fi fi-rr-cloud-check text-[10px]" /> R2 Asset
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-400">No Image</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-xs">/{category.slug}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-semibold text-xs border border-neutral-200">
                        {category._count?.products ?? 0} products
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(category)}
                          className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                          title="Edit category"
                        >
                          <i className="fi fi-rr-pencil text-sm" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          className="p-2 text-neutral-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                          title="Delete category"
                        >
                          <i className="fi fi-rr-trash text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300 border border-neutral-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Images are stored on Cloudflare R2 in the <span className="font-mono text-neutral-700">categories/</span> folder.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-xl hover:bg-neutral-100"
              >
                <i className="fi fi-rr-cross-small text-xl flex" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCategory}>
              <div className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 flex items-center gap-2">
                    <i className="fi fi-rr-triangle-warning text-sm shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Category Image Upload Dropzone */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-900 flex items-center justify-between">
                    <span>Category Image / Icon</span>
                    <span className="text-xs font-normal text-neutral-400">Optional (PNG, JPG, WebP)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="category-image-input"
                  />

                  {previewUrl ? (
                    <div className="relative group border border-neutral-200 rounded-2xl p-3 bg-neutral-50 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-white border border-neutral-200 overflow-hidden shrink-0 relative shadow-sm">
                        <img
                          src={previewUrl}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-800 truncate">
                          {selectedFile ? selectedFile.name : 'Current Image'}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload to R2`
                            : 'Stored in Cloudflare R2 (categories/)'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors shadow-2xs"
                          >
                            Change Image
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-200 hover:border-neutral-900 rounded-2xl p-6 text-center cursor-pointer transition-all bg-neutral-50/50 hover:bg-neutral-50 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                        <i className="fi fi-rr-cloud-upload text-xl text-neutral-600 group-hover:text-neutral-900" />
                      </div>
                      <p className="text-sm font-bold text-neutral-800">
                        Click to upload category icon / thumbnail
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        SVG, PNG, JPG, or WebP (Max 15MB) — Saved to Cloudflare R2
                      </p>
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-900">Category Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Industrial Equipment"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm transition-all"
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-neutral-900">URL Slug</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">/</span>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) =>
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder="industrial-equipment"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono transition-all"
                    />
                  </div>
                  <p className="text-xs text-neutral-400">Lowercase letters, numbers, and hyphens only.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <i className="fi fi-rr-spinner animate-spin" /> : null}
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 border border-neutral-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <i className="fi fi-rr-trash text-xl" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-neutral-900">Delete Category</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Are you sure you want to delete <strong className="text-neutral-800">{deleteTarget.name}</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
