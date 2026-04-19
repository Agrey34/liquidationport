'use client';

import React, { useState } from 'react';

const MOCK_EVENTS = [
  { id: 1, type: 'info', service: 'Auth', message: 'Admin login successful (IP: 192.168.1.1)', time: '2 mins ago' },
  { id: 2, type: 'error', service: 'Stripe', message: 'Webhook delivery failed: timeout', time: '14 mins ago' },
  { id: 3, type: 'warning', service: 'Inventory', message: 'Stock depleted: PRD-004', time: '1 hour ago' },
  { id: 4, type: 'info', service: 'Order', message: 'Order #ORD-2029 created', time: '2 hours ago' },
  { id: 5, type: 'info', service: 'System', message: 'Cache cleared globally', time: '5 hours ago' },
  { id: 6, type: 'error', service: 'Database', message: 'Query latency spike > 500ms', time: '1 day ago' },
];

export function MonitoringPanel() {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const filteredEvents = MOCK_EVENTS.filter(e => filter === 'all' || e.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h3 className="text-lg font-bold text-neutral-900">System Monitoring</h3>
            <p className="text-sm text-neutral-500">Live platform metrics, webhooks, and audit logs.</p>
         </div>
         <button className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
            <i className="fi fi-rr-refresh" /> Refresh Core Data
         </button>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
               <i className="fi fi-rr-server" />
               <span className="text-xs font-bold uppercase tracking-wider">API Latency</span>
            </div>
            <p className="text-2xl font-black text-neutral-900">42ms</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Excellent performance</p>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
               <i className="fi fi-rr-database" />
               <span className="text-xs font-bold uppercase tracking-wider">DB Connection</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">Healthy</p>
            <p className="text-xs text-neutral-500 font-semibold mt-1">Supabase Edge Region: US-East</p>
         </div>
         <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
               <i className="fi fi-rr-triangle-warning" />
               <span className="text-xs font-bold uppercase tracking-wider">Error Rate (24h)</span>
            </div>
            <p className="text-2xl font-black text-neutral-900">0.02%</p>
            <p className="text-xs text-neutral-500 font-semibold mt-1">2 failed requests</p>
         </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
            <h4 className="text-sm font-bold text-neutral-900">Live Event Stream</h4>
            <div className="flex gap-2">
               <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>All</button>
               <button onClick={() => setFilter('error')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'error' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>Errors</button>
               <button onClick={() => setFilter('warning')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>Warnings</button>
               <button onClick={() => setFilter('info')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === 'info' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>Info</button>
            </div>
         </div>
         <div className="max-h-[300px] overflow-y-auto no-scrollbar">
            {filteredEvents.length === 0 ? (
               <div className="p-8 text-center text-neutral-500 text-sm flex flex-col items-center">
                  <i className="fi fi-rr-check-circle text-3xl text-neutral-300 mb-2" />
                  No events found for this filter.
               </div>
            ) : (
               <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-neutral-100">
                     {filteredEvents.map(event => (
                        <tr key={event.id} className="hover:bg-neutral-50/50 transition-colors">
                           <td className="p-4 w-12 text-center">
                              {event.type === 'error' && <i className="fi fi-rr-circle-xmark text-rose-500 text-lg" />}
                              {event.type === 'warning' && <i className="fi fi-rr-triangle-warning text-amber-500 text-lg" />}
                              {event.type === 'info' && <i className="fi fi-rr-info text-blue-500 text-lg" />}
                           </td>
                           <td className="p-4 w-32 font-medium text-neutral-900">{event.service}</td>
                           <td className="p-4 text-neutral-600">{event.message}</td>
                           <td className="p-4 text-right text-neutral-400 text-xs whitespace-nowrap">{event.time}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
}
