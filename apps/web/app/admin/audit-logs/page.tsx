'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../lib/api';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  items: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('search', search);
      if (entityFilter) queryParams.append('entity', entityFilter);
      if (actionFilter) queryParams.append('action', actionFilter);

      const response = await api.get<AuditLogResponse>(`/audit?${queryParams.toString()}`);
      setLogs(response.items || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, entityFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const ENTITIES = ['auth', 'products', 'categories', 'orders', 'reviews', 'users', 'system'];
  const ACTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'login', 'logout', 'status_change'];

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
        <i className="fi fi-rr-exclamation text-xl"></i>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Track administrator actions and system mutations.
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"></i>
            <input 
              type="text" 
              placeholder="Search user or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 w-full md:w-64"
            />
          </div>
          
          <select 
            value={entityFilter} 
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 capitalize"
          >
            <option value="">All Entities</option>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          
          <select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 uppercase"
          >
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Context</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 relative">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <i className="fi fi-rr-search-alt text-3xl mb-3 block opacity-50"></i>
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : !loading && (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                           <i className="fi fi-rr-user text-neutral-500"></i>
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900">{log.userName || 'System'}</div>
                          <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                            {log.userRole || 'Automated'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                        ${(log.action === 'POST' || log.action === 'login' || log.action === 'create') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          (log.action === 'DELETE' || log.action === 'logout') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          (log.action === 'PATCH' || log.action === 'PUT' || log.action === 'update') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-neutral-100 text-neutral-700 border border-neutral-200'}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900 capitalize">
                      {log.entity}
                      {log.entityId && (
                        <div className="text-xs text-neutral-400 font-mono mt-0.5" title={log.entityId}>
                          {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-xs text-neutral-600 font-mono">{log.ipAddress || 'Unknown IP'}</div>
                       <div className="text-xs text-neutral-400 truncate max-w-[150px]" title={log.userAgent || ''}>
                          {log.userAgent || 'Unknown Device'}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <details className="inline-block text-left relative cursor-pointer z-10 group">
                          <summary className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs list-none flex items-center justify-end gap-1">
                            Payload <i className="fi fi-rr-angle-down text-[10px]"></i>
                          </summary>
                          <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-80 bg-neutral-900 rounded-xl shadow-xl p-4 z-50 text-xs">
                            <pre className="text-green-400 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto no-scrollbar font-mono text-[11px]">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-neutral-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-neutral-500">
            Page {page}
          </span>
          <button 
             onClick={() => setPage(p => p + 1)}
             disabled={logs.length < limit || loading}
             className="px-3 py-1.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
