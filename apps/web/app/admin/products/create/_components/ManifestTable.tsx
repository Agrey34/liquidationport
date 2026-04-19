'use client';

import React from 'react';

import { ManifestRow } from './FormSection';

interface Props {
  rows: ManifestRow[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof ManifestRow, value: string) => void;
  onRemove: (id: string) => void;
  onDownload: () => void;
}

export function ManifestTable({ rows, onAdd, onUpdate, onRemove, onDownload }: Props) {
  const totalQty = rows.reduce((acc, r) => acc + (parseInt(r.qty) || 0), 0);
  const totalExtMsrp = rows.reduce((acc, r) => {
    return acc + (parseFloat(r.qty) || 0) * (parseFloat(r.msrp) || 0);
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">Pallet Manifest</label>
          <p className="text-xs text-neutral-400 mt-0.5">Detailed breakdown of included items.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
          </svg>
          Total Items: {totalQty}
        </span>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-neutral-700 w-36">
                  Manufacturer <span className="text-neutral-400">↑</span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Product Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 w-32">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Condition</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 w-36">UPC</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 w-16">QTY</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 w-24">MSRP</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 w-24">EXT MSRP</th>
                <th className="w-10 px-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {rows.map(row => {
                const ext = (parseFloat(row.qty) || 0) * (parseFloat(row.msrp) || 0);
                return (
                  <tr key={row.id} className="group hover:bg-neutral-50/40 transition-colors">
                    {/* Manufacturer */}
                    <td className="px-4 py-2.5">
                      <input type="text" value={row.manufacturer}
                        onChange={e => onUpdate(row.id, 'manufacturer', e.target.value)}
                        placeholder="e.g. Sony"
                        className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-0" />
                    </td>
                    {/* Product Name */}
                    <td className="px-4 py-2.5">
                      <input type="text" value={row.productName}
                        onChange={e => onUpdate(row.id, 'productName', e.target.value)}
                        placeholder="Full product name"
                        className="w-full bg-transparent border-none outline-none text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-0" />
                    </td>
                    {/* Product / SKU */}
                    <td className="px-4 py-2.5">
                      <input type="text" value={row.product}
                        onChange={e => onUpdate(row.id, 'product', e.target.value)}
                        placeholder="SKU / Model"
                        className="w-full bg-transparent border-none outline-none text-sm text-neutral-700 placeholder:text-neutral-300 focus:ring-0" />
                    </td>
                    {/* Condition */}
                    <td className="px-4 py-2.5">
                      <input type="text" value={row.condition}
                        onChange={e => onUpdate(row.id, 'condition', e.target.value)}
                        placeholder="e.g. Damaged/Missing Parts"
                        className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 placeholder:text-neutral-300 focus:ring-0" />
                    </td>
                    {/* UPC */}
                    <td className="px-4 py-2.5">
                      <input type="text" value={row.upc}
                        onChange={e => onUpdate(row.id, 'upc', e.target.value)}
                        placeholder="000000000000"
                        className="w-full bg-transparent border-none outline-none text-sm font-mono text-neutral-600 placeholder:text-neutral-300 focus:ring-0" />
                    </td>
                    {/* QTY */}
                    <td className="px-4 py-2.5">
                      <input type="number" value={row.qty} min="0"
                        onChange={e => onUpdate(row.id, 'qty', e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-center text-neutral-900 placeholder:text-neutral-300 focus:ring-0" />
                    </td>
                    {/* MSRP */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <span className="text-neutral-400 text-xs">$</span>
                        <input type="number" value={row.msrp} min="0" step="0.01"
                          onChange={e => onUpdate(row.id, 'msrp', e.target.value)}
                          placeholder="0.00"
                          className="w-16 bg-transparent border-none outline-none text-sm text-right text-neutral-700 placeholder:text-neutral-300 focus:ring-0" />
                      </div>
                    </td>
                    {/* EXT MSRP — auto-calculated */}
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm font-bold text-neutral-900">
                        {ext > 0 ? `$${ext.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                      </span>
                    </td>
                    {/* Delete */}
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(row.id)}
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

            {/* Totals */}
            <tfoot>
              <tr className="border-t border-neutral-200 bg-neutral-50">
                <td colSpan={4} className="px-4 py-3" />
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
                    {totalExtMsrp > 0
                      ? `$${totalExtMsrp.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '$0.00'}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add row */}
        <div className="border-t border-red-800 px-4 py-3 bg-amber-400">
          <button type="button" onClick={onAdd}
               className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
               <i className="fi fi-rr-plus w-3.5 h-3.5 flex items-center justify-center shrink-0" />
               Add Item
          </button>
        </div>
      </div>

      {/* Download */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all"
        >
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download full manifest
        </button>
      </div>
    </div>
  );
}
