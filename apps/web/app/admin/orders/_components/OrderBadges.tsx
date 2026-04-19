import React from 'react';

import { OrderStatus, PaymentStatus, SortKey, SortDir } from '../types';

export const orderStatusConfig: Record<OrderStatus, { label: string; color: string; dot: string; icon: string }> = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',   icon: 'fi fi-rr-clock-three' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',    icon: 'fi fi-rr-box' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500',  icon: 'fi fi-rr-truck-side' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', icon: 'fi fi-rr-check-circle' },
  cancelled:  { label: 'Cancelled',  color: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',    icon: 'fi fi-rr-cross-circle' }
};

export const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; icon: string }> = {
  paid:     { label: 'Paid',     color: 'bg-emerald-100 text-emerald-700', icon: 'fi fi-rr-check-circle' },
  unpaid:   { label: 'Unpaid',   color: 'bg-neutral-100 text-neutral-600', icon: 'fi fi-rr-clock-three' },
  refunded: { label: 'Refunded', color: 'bg-amber-100 text-amber-700',     icon: 'fi fi-rr-refresh' },
  failed:   { label: 'Failed',   color: 'bg-rose-100 text-rose-700',       icon: 'fi fi-rr-triangle-warning' }
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  const { label, color, dot } = orderStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const { label, color, icon: IconClass } = paymentStatusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <i className={`${IconClass} w-3 h-3`} />
      {label}
    </span>
  );
}

export function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <i className="fi fi-rr-arrows-up-down w-3.5 h-3.5 text-neutral-300 ml-1 flex items-center justify-center shrink-0" />;
  return sort.dir === 'asc'
    ? <i className="fi fi-rr-arrow-up w-3.5 h-3.5 text-neutral-900 ml-1 flex items-center justify-center shrink-0" />
    : <i className="fi fi-rr-arrow-down w-3.5 h-3.5 text-neutral-900 ml-1 flex items-center justify-center shrink-0" />;
}
