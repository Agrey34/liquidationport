'use client';

import React, { useState } from 'react';

const MOCK_CATEGORIES = [
  { id: '1', name: 'Electronics', slug: 'electronics', items: 124, status: 'Active' },
  { id: '2', name: 'Home Appliances', slug: 'home-appliances', items: 89, status: 'Active' },
  { id: '3', name: 'Apparel', slug: 'apparel', items: 250, status: 'Active' },
  { id: '4', name: 'Tools & Hardware', slug: 'tools-hardware', items: 45, status: 'Draft' },
];

export default function CategoriesPage() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Categories & Tags</h2>
          <p className="text-neutral-500 mt-1">Organize your product catalog into scalable taxonomies.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm w-full sm:w-auto justify-center">
              <i className="fi fi-rr-plus" /> New Category
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Total Categories</p>
               <p className="text-3xl font-black text-neutral-900">24</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
               <i className="fi fi-rr-folder-tree text-2xl" />
            </div>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-neutral-500 mb-1">Active Tags</p>
               <p className="text-3xl font-black text-neutral-900">142</p>
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
                   placeholder="Search categories..." 
                   className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all w-64"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
                     <tr>
                        <th className="px-6 py-4 font-bold">Category Name</th>
                        <th className="px-6 py-4 font-bold">Slug</th>
                        <th className="px-6 py-4 font-bold">Product Count</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                     {MOCK_CATEGORIES.map(category => (
                        <tr key={category.id} className="hover:bg-neutral-50/50 transition-colors group">
                           <td className="px-6 py-4 font-bold text-neutral-900">{category.name}</td>
                           <td className="px-6 py-4 text-neutral-500 font-mono text-xs">{category.slug}</td>
                           <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-semibold text-xs border border-neutral-200">
                                 {category.items} items
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              {category.status === 'Active' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-200">
                                   <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" /> Draft
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-2 text-neutral-400 hover:text-blue-600 transition-colors dropdown-button opacity-0 group-hover:opacity-100">
                                 <i className="fi fi-rr-edit" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Create Category Overlay */}
      {isDrawerOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300">
               <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-neutral-900">Create New Category</h3>
                  <button onClick={() => setDrawerOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100">
                     <i className="fi fi-rr-cross-small text-xl flex" />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">Category Name</label>
                     <input type="text" placeholder="e.g. Home Goods" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">URL Slug</label>
                     <input type="text" placeholder="e.g. home-goods" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm font-mono" />
                     <p className="text-xs text-neutral-500 mt-1">Leave blank to auto-generate from the name.</p>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-neutral-900">Status</label>
                     <select className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white text-sm">
                        <option value="active">Active (Visible)</option>
                        <option value="draft">Draft (Hidden)</option>
                     </select>
                  </div>
               </div>
               <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
                  <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
                     Cancel
                  </button>
                  <button onClick={() => setDrawerOpen(false)} className="px-6 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-neutral-800 transition-colors">
                     Save Category
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
