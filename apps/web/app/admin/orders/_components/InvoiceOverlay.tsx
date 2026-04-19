import React from 'react';

import { AppOrder } from '../types';

export function InvoiceOverlay({ order, onClose }: { order: AppOrder; onClose: () => void }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-neutral-100 flex justify-center overflow-y-auto print:bg-white print:overflow-visible">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
        }
      `}</style>
      
      {/* Top action bar hidden during print */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shadow-sm print:hidden z-10">
         <button onClick={onClose} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-medium transition-colors">
           <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" /> Close
         </button>
         <button onClick={() => window.print()} className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm">
           <i className="fi fi-rr-download text-lg flex items-center justify-center shrink-0" /> Print / Save PDF
         </button>
      </div>

      {/* Invoice Document */}
      <div id="printable-invoice" className="bg-white max-w-4xl w-full mt-24 mb-12 p-8 md:p-12 shadow-lg text-neutral-900 mx-4 print:shadow-none print:m-0 print:p-8">
        <div className="flex justify-between items-start border-b border-neutral-200 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-10 h-10 bg-neutral-900 text-white flex items-center justify-center rounded-lg font-black text-lg">LP</div>
               <span className="text-xl font-bold tracking-tight">LiquidationPort</span>
            </div>
            <p className="text-sm text-neutral-500">123 Liquidation Ave, Suite 100</p>
            <p className="text-sm text-neutral-500">Austin, TX 78701</p>
            <p className="text-sm text-neutral-500">support@liquidationport.com</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-neutral-200 uppercase tracking-widest mb-2">Invoice</h1>
            <p className="text-sm font-bold">Invoice #: {order.id}</p>
            <p className="text-sm text-neutral-500 mt-1">Date: {order.createdAt}</p>
            <p className="text-sm text-neutral-500">Status: <span className="uppercase text-xs font-bold text-neutral-900 ml-1">{order.paymentStatus}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="font-bold text-sm">{order.customerName}</p>
            <p className="text-sm text-neutral-600 mt-1">{order.customerEmail}</p>
            <p className="text-sm text-neutral-600 mt-1 pr-6">{order.shippingAddress}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Payment Instruction</h3>
            <p className="text-sm font-medium">{order.paymentMethod}</p>
            <p className="text-sm text-neutral-500 mt-1">Terms: Due on receipt</p>
          </div>
        </div>

        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-900 text-xs uppercase tracking-wider font-bold text-neutral-400">
              <th className="py-3 px-2">Description</th>
              <th className="py-3 px-2 text-center w-24">Qty</th>
              <th className="py-3 px-2 text-right w-32 hidden sm:table-cell">Unit Price</th>
              <th className="py-3 px-2 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {order.items.map(item => (
              <tr key={item.id}>
                <td className="py-4 px-2">
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.sku}</p>
                </td>
                <td className="py-4 px-2 text-center text-sm font-medium">{item.quantity}</td>
                <td className="py-4 px-2 text-right text-sm hidden sm:table-cell">${item.unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td className="py-4 px-2 text-right text-sm font-bold">${(item.quantity * item.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-16">
          <div className="w-72 space-y-3">
             <div className="flex justify-between text-sm text-neutral-600">
               <span>Subtotal</span>
               <span>${order.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between text-sm text-neutral-600">
               <span>Shipping</span>
               <span>${order.shipping.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between text-sm text-neutral-600">
               <span>Tax</span>
               <span>${order.tax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between items-center border-t-2 border-neutral-900 pt-3 mt-3">
               <span className="font-bold uppercase tracking-wider">Total</span>
               <span className="text-xl font-black">${order.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
             </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-neutral-100 text-xs text-neutral-400">
          <p>Thank you for doing business with LiquidationPort.</p>
          <p className="mt-1">If you have any questions about this invoice, please contact support@liquidationport.com.</p>
        </div>
      </div>
    </div>
  );
}
