import React, { useState } from 'react';

import { AppOrder, OrderStatus } from '../types';

export function RowMenu({
  order,
  onView,
  onUpdateStatus,
  onShowInvoice,
}: {
  order: AppOrder;
  onView: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onShowInvoice: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = (fn: () => void) => { fn(); setOpen(false); };

  return (
    <div className="relative" id={`order-menu-${order.id}`}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <i className="fi fi-rr-menu-dots text-lg flex items-center justify-center shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
            <button onClick={() => wrap(onView)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              <i className="fi fi-rr-eye text-lg text-neutral-400 flex items-center justify-center shrink-0" /> View Order
            </button>
            <button onClick={() => wrap(onShowInvoice)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              <i className="fi fi-rr-document text-lg text-neutral-400 flex items-center justify-center shrink-0" /> Print / View Invoice
            </button>
            
            <div className="my-1 border-t border-neutral-100" />
            
            {order.status === 'pending' && (
              <button onClick={() => wrap(() => onUpdateStatus(order.id, 'processing'))} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                <i className="fi fi-rr-box text-lg flex items-center justify-center shrink-0" /> Mark Processing
              </button>
            )}
            {(order.status === 'pending' || order.status === 'processing') && (
               <button onClick={() => wrap(() => onUpdateStatus(order.id, 'shipped'))} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors">
                 <i className="fi fi-rr-truck-side text-lg flex items-center justify-center shrink-0" /> Mark Shipped
               </button>
            )}
            
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <button onClick={() => wrap(() => onUpdateStatus(order.id, 'cancelled'))} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                  <i className="fi fi-rr-cross-circle text-lg flex items-center justify-center shrink-0" /> Cancel Order
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
