'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import Link from 'next/link';

interface AuditLog {
  id: string;
  userName: string | null;
  action: string;
  entity: string;
  createdAt: string;
}

export default function RecentActivityWidget() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get<{items: AuditLog[]}>('/audit?limit=15');
        setLogs(response.items || []);
      } catch (err) {
        console.error('Failed to load recent activity', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between overflow-hidden relative max-h-[480px] h-full">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-xl font-bold flex items-center gap-2">
           <i className="fi fi-rr-time-past text-lg text-neutral-400"></i>
           Recent Activity
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-dark space-y-4 max-h-[340px]">
        {loading ? (
          <div className="flex justify-center py-8">
             <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-neutral-500 text-sm text-center py-8">No recent activity</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex gap-3 text-sm">
              <div className="mt-0.5">
                <div className={`w-2 h-2 rounded-full mt-1.5
                  ${(log.action === 'POST' || log.action === 'login' || log.action === 'create') ? 'bg-emerald-400' :
                    (log.action === 'DELETE' || log.action === 'logout') ? 'bg-rose-400' :
                    (log.action === 'PATCH' || log.action === 'PUT' || log.action === 'update') ? 'bg-blue-400' :
                    'bg-neutral-400'}`} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-300 leading-snug">
                   <span className="font-semibold text-white truncate max-w-[100px] inline-block align-bottom">{log.userName || 'System'}</span>
                   {' '}performed{' '}
                   <span className="font-mono text-xs text-neutral-400">{log.action}</span>
                   {' '}on{' '}
                   <span className="text-white capitalize">{log.entity}</span>
                </p>
                <div className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mt-1">
                  {timeAgo(log.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/admin/audit-logs" className="block text-center mt-4 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors text-sm shrink-0">
        View All Logs
      </Link>
    </div>
  );
}
