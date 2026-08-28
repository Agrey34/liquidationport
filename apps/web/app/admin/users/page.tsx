'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { createClient } from '../../../lib/supabase/client';


// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole   = 'customer' | 'admin' | 'super_admin';
type UserStatus = 'active' | 'suspended' | 'pending' | 'banned';

interface ActivityEvent {
  action: string;
  timestamp: string;
  ip: string;
  device: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastSeen: string;
  orderCount: number;
  totalSpent: number;
  avatarColor: string;
  initials: string;
  flagged: boolean;
  verifiedEmail: boolean;
  activity: ActivityEvent[];
}

type SortKey = 'name' | 'joinedAt' | 'orderCount' | 'totalSpent' | 'lastSeen';
type SortDir  = 'asc' | 'desc';
type TabFilter = 'all' | 'customer' | 'admin' | 'suspended';

const PAGE_SIZE = 8;

// ─── Configs ──────────────────────────────────────────────────────────────────

const roleConfig: Record<UserRole, { label: string; color: string; icon: string }> = {
  customer:   { label: 'Customer',   color: 'bg-blue-100 text-blue-700',     icon: 'fi fi-rr-user-check' },
  admin:      { label: 'Admin',      color: 'bg-violet-100 text-violet-700', icon: 'fi fi-rr-shield-check' },
  super_admin:{ label: 'Super Admin',color: 'bg-amber-100 text-amber-700',   icon: 'fi fi-rr-crown' },
};

const statusConfig: Record<UserStatus, { label: string; color: string; dot: string; icon: string }> = {
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: 'fi fi-rr-check-circle' },
  suspended: { label: 'Suspended', color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   icon: 'fi fi-rr-triangle-warning' },
  pending:   { label: 'Pending',   color: 'bg-sky-100 text-sky-700',        dot: 'bg-sky-500',     icon: 'fi fi-rr-clock-three' },
  banned:    { label: 'Banned',    color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500',    icon: 'fi fi-rr-cross-circle' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const { label, color, icon } = roleConfig[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <i className={`${icon} w-3 h-3 flex items-center justify-center`} />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const { label, color, dot } = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }) {
  if (sort.key !== col) return <i className="fi fi-rr-arrows-up-down w-3.5 h-3.5 text-neutral-300 ml-1 flex items-center justify-center shrink-0" />;
  return sort.dir === 'asc'
    ? <i className="fi fi-rr-arrow-up w-3.5 h-3.5 text-neutral-900 ml-1 flex items-center justify-center shrink-0" />
    : <i className="fi fi-rr-arrow-down w-3.5 h-3.5 text-neutral-900 ml-1 flex items-center justify-center shrink-0" />;
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowMenu({
  user,
  onView,
  onSuspend,
  onBan,
  onDelete,
  onReactivate,
  onChangeRole,
}: {
  user: AppUser;
  onView: () => void;
  onSuspend: () => void;
  onBan: () => void;
  onDelete: () => void;
  onReactivate: () => void;
  onChangeRole: (role: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const wrap = (fn: () => void) => { fn(); setOpen(false); setShowRoles(false); };

  return (
    <div className="relative" id={`user-menu-${user.id}`}>
      <button
        onClick={() => { setOpen(!open); setShowRoles(false); }}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <i className="fi fi-rr-menu-dots text-lg flex items-center justify-center shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
            <button onClick={() => wrap(onView)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              <i className="fi fi-rr-eye text-base text-neutral-400 flex items-center justify-center shrink-0" /> View Profile
            </button>
            <button 
              onClick={() => setShowRoles(!showRoles)} 
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <i className="fi fi-rr-user-gear text-base text-neutral-400 flex items-center justify-center shrink-0" /> Change Role
              </span>
              <i className={`fi fi-rr-angle-right text-xs text-neutral-400 transition-transform ${showRoles ? 'rotate-90' : ''}`} />
            </button>

            {showRoles && (
              <div className="px-2 py-1 bg-neutral-50 border-y border-neutral-100 space-y-0.5">
                {(['customer', 'admin', 'super_admin'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => wrap(() => onChangeRole(r))}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between ${
                      user.role === r ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-200/60'
                    }`}
                  >
                    <span className="capitalize">{r.replace('_', ' ')}</span>
                    {user.role === r && <i className="fi fi-rr-check text-xs" />}
                  </button>
                ))}
              </div>
            )}

            <div className="my-1 border-t border-neutral-100" />
            {user.status === 'active' ? (
              <button onClick={() => wrap(onSuspend)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                <i className="fi fi-rr-delete-user text-base flex items-center justify-center shrink-0" /> Suspend User
              </button>
            ) : (
              <button onClick={() => wrap(onReactivate)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                <i className="fi fi-rr-refresh text-base flex items-center justify-center shrink-0" /> Reactivate
              </button>
            )}
            <button onClick={() => wrap(onBan)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <i className="fi fi-rr-ban text-base flex items-center justify-center shrink-0" /> Ban User
            </button>
            <div className="my-1 border-t border-neutral-100" />
            <button onClick={() => wrap(onDelete)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <i className="fi fi-rr-trash text-base flex items-center justify-center shrink-0" /> Delete Account
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

function UserDrawer({ user, onClose, onStatusChange }: {
  user: AppUser;
  onClose: () => void;
  onStatusChange: (id: string, status: UserStatus) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'orders'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative ml-auto w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 shrink-0">
          <h2 className="text-lg font-bold text-neutral-900">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <i className="fi fi-rr-cross-small text-lg flex items-center justify-center shrink-0" />
          </button>
        </div>

        {/* User Hero */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-4 shrink-0">
          <div className={`w-14 h-14 rounded-2xl ${user.avatarColor} text-white flex items-center justify-center text-xl font-black shrink-0`}>
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-neutral-900 truncate">{user.name}</h3>
              {user.flagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                  <i className="fi fi-rr-triangle-warning text-lg flex items-center justify-center shrink-0" /> Flagged
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
              {!user.verifiedEmail && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  <i className="fi fi-rr-envelope text-lg flex items-center justify-center shrink-0" /> Unverified Email
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 shrink-0 px-6">
          {(['overview', 'activity', 'orders'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {activeTab === 'overview' && (
            <>
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Contact Information</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: 'fi fi-rr-envelope',     label: 'Email',    value: user.email },
                    { icon: 'fi fi-rr-phone-call',    label: 'Phone',    value: user.phone },
                    { icon: 'fi fi-rr-marker',   label: 'Location', value: user.location },
                    { icon: 'fi fi-rr-calendar', label: 'Joined',   value: user.joinedAt },
                    { icon: 'fi fi-rr-clock-three',    label: 'Last Seen',value: user.lastSeen },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                      <i className={`${icon} w-4 h-4 text-neutral-400 shrink-0 flex items-center justify-center`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm text-neutral-800 font-medium truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Purchase History</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <p className="text-2xl font-black text-neutral-900">{user.orderCount}</p>
                    <p className="text-xs text-neutral-500 font-medium mt-1">Total Orders</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <p className="text-2xl font-black text-neutral-900">${user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                    <p className="text-xs text-neutral-500 font-medium mt-1">Total Spent</p>
                  </div>
                </div>
              </div>

              {/* Security Flags */}
              {user.flagged && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="fi fi-rr-triangle-warning text-lg text-rose-600 flex items-center justify-center shrink-0" />
                    <h4 className="text-sm font-bold text-rose-700">Security Warning</h4>
                  </div>
                  <p className="text-xs text-rose-600 leading-relaxed">
                    This account has been flagged for suspicious activity. Review the activity log before taking action.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Recent Activity Log</h4>
              {user.activity.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <i className="fi fi-rr-chart-pie text-lg mx-auto mb-3 opacity-30 flex items-center justify-center shrink-0" />
                  <p className="text-sm">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {user.activity.map((evt, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-neutral-300 shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800">{evt.action}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-neutral-400">{evt.timestamp}</span>
                          <span className="text-xs text-neutral-400 font-mono">IP: {evt.ip}</span>
                          <span className="text-xs text-neutral-400">{evt.device}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="text-center py-12 text-neutral-400">
              <i className="fi fi-rr-shopping-bag text-lg mx-auto mb-3 opacity-30 flex items-center justify-center shrink-0" />
              <p className="text-sm font-medium">
                {user.orderCount === 0 ? 'No orders placed yet.' : `${user.orderCount} orders — connect to live API to view.`}
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 flex gap-3 shrink-0">
          {user.status === 'active' ? (
            <button
              onClick={() => onStatusChange(user.id, 'suspended')}
              className="flex-1 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold border border-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fi fi-rr-delete-user text-lg flex items-center justify-center shrink-0" /> Suspend
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(user.id, 'active')}
              className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fi fi-rr-refresh text-lg flex items-center justify-center shrink-0" /> Reactivate
            </button>
          )}
          <button
            onClick={() => onStatusChange(user.id, 'banned')}
            className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fi fi-rr-ban text-lg flex items-center justify-center shrink-0" /> Ban Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]             = useState<AppUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [tabFilter, setTabFilter]     = useState<TabFilter>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [sort, setSort]               = useState<{ key: SortKey; dir: SortDir }>({ key: 'joinedAt', dir: 'desc' });
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [drawerUser, setDrawerUser]   = useState<AppUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch logic
  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.get<AppUser[]>('/users');
      setUsers(data || []);
      setDrawerUser(prev => {
        if (!prev) return null;
        return data.find(u => u.id === prev.id) ?? prev;
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalUsers     = users.length;
  const activeUsers    = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;
  const newThisMonth   = users.filter(u => {
    const d = new Date(u.joinedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const flaggedCount   = users.filter(u => u.flagged).length;

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...users];

    if (search) list = list.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
    );

    if (tabFilter === 'customer')  list = list.filter(u => u.role === 'customer');
    if (tabFilter === 'admin')     list = list.filter(u => u.role === 'admin' || u.role === 'super_admin');
    if (tabFilter === 'suspended') list = list.filter(u => u.status === 'suspended' || u.status === 'banned');

    if (statusFilter !== 'All') list = list.filter(u => u.status === statusFilter);

    list.sort((a, b) => {
      let va: number | string, vb: number | string;
      if (sort.key === 'orderCount') { va = a.orderCount; vb = b.orderCount; }
      else if (sort.key === 'totalSpent') { va = a.totalSpent; vb = b.totalSpent; }
      else { va = String(a[sort.key]); vb = String(b[sort.key]); }
      const cmp = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [users, search, tabFilter, statusFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const allPageSelected = paged.length > 0 && paged.every(u => selected.has(u.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) paged.forEach(u => next.delete(u.id));
      else paged.forEach(u => next.add(u.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Status Changes ────────────────────────────────────────────────────────
  const changeStatus = async (id: string, status: UserStatus) => {
    try {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status, flagged: status === 'suspended' || status === 'banned' } : u));
      if (drawerUser?.id === id) setDrawerUser(prev => prev ? { ...prev, status, flagged: status === 'suspended' || status === 'banned' } : null);
      
      await api.patch(`/users/${id}/status`, { status });
    } catch (err) {
      console.error('Failed to change status:', err);
      fetchUsers();
    }
  };

  const changeRole = async (id: string, role: UserRole) => {
    try {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      if (drawerUser?.id === id) setDrawerUser(prev => prev ? { ...prev, role } : null);
      await api.patch(`/users/${id}/role`, { role });
    } catch (err) {
      console.error('Failed to change role:', err);
      fetchUsers();
    }
  };

  const handleBulkSuspend = async () => {
    const ids = Array.from(selected);
    try {
      setUsers(prev => prev.map(u => selected.has(u.id) ? { ...u, status: 'suspended', flagged: true } : u));
      setSelected(new Set());
      await Promise.all(ids.map(id => api.patch(`/users/${id}/status`, { status: 'suspended' })));
    } catch (err) {
      console.error('Failed bulk suspend:', err);
      fetchUsers();
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    try {
      setUsers(prev => prev.filter(u => !selected.has(u.id)));
      setSelected(new Set());
      await Promise.all(ids.map(id => api.delete(`/users/${id}`)));
    } catch (err) {
      console.error('Failed bulk delete:', err);
      fetchUsers();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setUsers(prev => prev.filter(u => u.id !== id));
      if (drawerUser?.id === id) setDrawerUser(null);
      await api.delete(`/users/${id}`);
    } catch (err) {
      console.error('Failed to delete user:', err);
      fetchUsers();
    }
  };

  const exportCSV = () => {
    if (users.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Orders', 'Total Spent', 'Joined At'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      u.role,
      u.status,
      u.orderCount,
      u.totalSpent,
      `"${u.joinedAt}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'All Users',  count: users.length },
    { key: 'customer',  label: 'Customers',  count: users.filter(u => u.role === 'customer').length },
    { key: 'admin',     label: 'Admins',     count: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length },
    { key: 'suspended', label: 'Restricted', count: users.filter(u => u.status === 'suspended' || u.status === 'banned').length },
  ];

  const STATUSES: Array<UserStatus | 'All'> = ['All', 'active', 'suspended', 'pending', 'banned'];

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fi fi-rr-triangle-warning text-xl"></i>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchUsers}
          className="text-xs font-bold underline hover:no-underline ml-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">User Management</h2>
          <p className="text-neutral-500 mt-1 text-sm">Monitor, manage, and secure all platform accounts live.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            disabled={users.length === 0}
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <i className="fi fi-rr-download text-lg flex items-center justify-center shrink-0" /> Export CSV
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <i className={`fi fi-rr-refresh text-base ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {flaggedCount > 0 && (
            <button
              onClick={() => setTabFilter('suspended')}
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm"
            >
              <i className="fi fi-rr-triangle-warning text-lg flex items-center justify-center shrink-0" />
              {flaggedCount} Flagged
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',      value: totalUsers,     icon: 'fi fi-rr-users',       color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Accounts',  value: activeUsers,    icon: 'fi fi-rr-user-check',   color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Restricted',       value: suspendedUsers, icon: 'fi fi-rr-shield-exclamation',   color: 'text-rose-600 bg-rose-50' },
          { label: 'New This Month',   value: newThisMonth,   icon: 'fi fi-rr-chart-line-up',  color: 'text-violet-600 bg-violet-50' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`${color.split(" ")[0]} shrink-0 flex items-center justify-center`}>
              <i className={`${icon} text-3xl`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-neutral-900 truncate">{value}</p>
              <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Table Card ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Role Tabs */}
        <div className="flex border-b border-neutral-200 px-4 pt-1 gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setTabFilter(tab.key); setPage(1); }}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors -mb-px flex items-center gap-2 ${
                tabFilter === tab.key
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                tabFilter === tab.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 flex items-center justify-center shrink-0" />
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email or ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <select
              id="user-status-filter"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as UserStatus | 'All'); setPage(1); }}
              className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all cursor-pointer capitalize"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <button
              id="user-toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'}`}
            >
              <i className="fi fi-rr-settings-sliders text-lg flex items-center justify-center shrink-0" /> Filters
            </button>
          </div>
        </div>

        {/* Expanded Filter Row */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Role:</span>
            {(['all', 'customer', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => { setTabFilter(r); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${tabFilter === r ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="px-4 py-3 bg-neutral-900 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-white">{selected.size} user{selected.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkSuspend}
                id="bulk-suspend-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <i className="fi fi-rr-delete-user w-3.5 h-3.5 flex items-center justify-center shrink-0" /> Suspend All
              </button>
              <button
                onClick={handleBulkDelete}
                id="bulk-delete-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <i className="fi fi-rr-trash w-3.5 h-3.5 flex items-center justify-center shrink-0" /> Delete All
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <span className="inline-flex items-center gap-1">User <SortIcon col="name" sort={sort} /></span>
                </th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th
                  className="px-4 py-3 text-right select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('orderCount')}
                >
                  <span className="inline-flex items-center justify-end gap-1">Orders <SortIcon col="orderCount" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 text-right select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('totalSpent')}
                >
                  <span className="inline-flex items-center justify-end gap-1">Spent <SortIcon col="totalSpent" sort={sort} /></span>
                </th>
                <th
                  className="px-4 py-3 select-none cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => toggleSort('lastSeen')}
                >
                  <span className="inline-flex items-center gap-1">Last Seen <SortIcon col="lastSeen" sort={sort} /></span>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><div className="w-4 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-neutral-200 rounded-xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="w-24 h-3.5 bg-neutral-200 rounded" />
                          <div className="w-32 h-3 bg-neutral-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="w-16 h-5 bg-neutral-200 rounded-full" /></td>
                    <td className="px-4 py-3.5"><div className="w-16 h-5 bg-neutral-200 rounded-full" /></td>
                    <td className="px-4 py-3.5"><div className="w-10 h-4 bg-neutral-200 rounded ml-auto" /></td>
                    <td className="px-4 py-3.5"><div className="w-14 h-4 bg-neutral-200 rounded ml-auto" /></td>
                    <td className="px-4 py-3.5"><div className="w-20 h-4 bg-neutral-200 rounded" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="w-8 h-8 bg-neutral-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
                        <i className="fi fi-rr-users text-lg text-neutral-400 flex items-center justify-center shrink-0" />
                      </div>
                      <p className="text-neutral-700 font-semibold">No users found</p>
                      <p className="text-neutral-400 text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : paged.map(user => (
                <tr
                  key={user.id}
                  className={`hover:bg-neutral-50/60 transition-colors group ${selected.has(user.id) ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.has(user.id)}
                      onChange={() => toggleOne(user.id)}
                      className="w-4 h-4 rounded border-neutral-300 cursor-pointer accent-neutral-900"
                    />
                  </td>

                  {/* User */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${user.avatarColor} text-white flex items-center justify-center text-xs font-black shrink-0 relative`}>
                        {user.initials}
                        {user.flagged && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-neutral-900 truncate max-w-40">{user.name}</p>
                          {!user.verifiedEmail && (
                            <span title="Unverified email" className="text-orange-400">
                              <i className="fi fi-rr-envelope text-lg flex items-center justify-center shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate max-w-40">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-1.5 text-neutral-700 font-semibold">
                      <i className="fi fi-rr-shopping-bag w-3.5 h-3.5 text-neutral-300 flex items-center justify-center shrink-0" />
                      {user.orderCount}
                    </span>
                  </td>

                  {/* Spent */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-1.5 font-bold text-neutral-900">
                      <i className="fi fi-rr-dollar w-3.5 h-3.5 text-neutral-300 flex items-center justify-center shrink-0" />
                      {user.totalSpent > 0 ? user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '—'}
                    </span>
                  </td>

                  {/* Last Seen */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-neutral-500">{new Date(user.lastSeen).toLocaleString()}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDrawerUser(user)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                        title="View profile"
                      >
                        <i className="fi fi-rr-eye text-lg flex items-center justify-center shrink-0" />
                      </button>
                      <RowMenu
                        user={user}
                        onView={() => setDrawerUser(user)}
                        onSuspend={() => changeStatus(user.id, 'suspended')}
                        onBan={() => changeStatus(user.id, 'banned')}
                        onDelete={() => handleDelete(user.id)}
                        onReactivate={() => changeStatus(user.id, 'active')}
                        onChangeRole={(role) => changeRole(user.id, role)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            Showing{' '}
            <span className="font-semibold text-neutral-900">
              {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-neutral-900">{filtered.length}</span> users
          </p>
          <div className="flex items-center gap-1">
            <button
              id="users-prev-page"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="fi fi-rr-angle-left text-lg flex items-center justify-center shrink-0" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${n === page ? 'bg-neutral-900 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
              >
                {n}
              </button>
            ))}
            <button
              id="users-next-page"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <i className="fi fi-rr-angle-right text-lg flex items-center justify-center shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      {drawerUser && (
        <UserDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onStatusChange={(id, status) => changeStatus(id, status)}
        />
      )}
    </div>
  );
}
