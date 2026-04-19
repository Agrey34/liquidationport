'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Search, Filter } from 'lucide-react';

const MOCK_ORDERS = [
  { id: 'LP-84729', date: 'Oct 24, 2026', total: 1400.00, status: 'Processing', items: 2 },
  { id: 'LP-77310', date: 'Sep 12, 2026', total: 850.00, status: 'Delivered', items: 1 },
  { id: 'LP-59201', date: 'Jul 04, 2026', total: 1200.00, status: 'Delivered', items: 1 },
];

export default function CustomerOrdersPage() {
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
         <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Order History</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">View and track all your liquidation purchases.</p>
         </div>
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
               <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
               <input type="text" placeholder="Search orders..." className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            </div>
            <button className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors">
               <Filter className="w-4 h-4" />
            </button>
         </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
               <thead>
                 <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider text-right">Total</th>
                    <th className="px-6 py-4 font-bold text-neutral-900 text-xs uppercase tracking-wider text-center">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-100">
                  {MOCK_ORDERS.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors group">
                       <td className="px-6 py-4">
                          <Link href={`/account/orders/${order.id}`} className="font-bold text-neutral-900 hover:text-primary transition-colors flex items-center gap-2">
                             <Package className="w-4 h-4 text-neutral-400" />
                             {order.id}
                          </Link>
                       </td>
                       <td className="px-6 py-4 text-neutral-600 font-medium">{order.date}</td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none ${
                             order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                             order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                             'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Processing' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                            {order.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-neutral-600 font-medium">{order.items} pallets</td>
                       <td className="px-6 py-4 font-bold text-neutral-900 text-right">${order.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                       <td className="px-6 py-4 text-center">
                          <Link href={`/account/orders/${order.id}`} className="inline-flex items-center justify-center p-2 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                             <ChevronRight className="w-5 h-5" />
                          </Link>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}
