'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  Eye,
  Trash2,
  Download,
  X,
  Crown,
  ActivitySquare,
  Clock,
  TrendingUp,
  Ban,
  RefreshCw,
} from 'lucide-react';

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: AppUser[] = [
  {
    id: 'USR-001', name: 'Liam Johnson', email: 'liam.johnson@email.com', phone: '+1 (555) 234-7890',
    location: 'Houston, TX', role: 'customer', status: 'active', joinedAt: 'Jan 5, 2025',
    lastSeen: '2 hours ago', orderCount: 14, totalSpent: 18240.00, avatarColor: 'bg-blue-600',
    initials: 'LJ', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Placed order #ORD-7645', timestamp: '2 hours ago', ip: '192.168.1.10', device: 'Chrome / macOS' },
      { action: 'Updated billing address', timestamp: '3 days ago', ip: '192.168.1.10', device: 'Chrome / macOS' },
      { action: 'Logged in', timestamp: '3 days ago', ip: '192.168.1.10', device: 'Chrome / macOS' },
    ],
  },
  {
    id: 'USR-002', name: 'Olivia Smith', email: 'olivia.smith@biz.com', phone: '+1 (555) 876-4321',
    location: 'New York, NY', role: 'customer', status: 'active', joinedAt: 'Feb 12, 2025',
    lastSeen: 'Yesterday', orderCount: 8, totalSpent: 9750.50, avatarColor: 'bg-purple-600',
    initials: 'OS', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Placed order #ORD-7640', timestamp: 'Yesterday', ip: '10.0.0.5', device: 'Safari / iOS' },
      { action: 'Logged in', timestamp: 'Yesterday', ip: '10.0.0.5', device: 'Safari / iOS' },
    ],
  },
  {
    id: 'USR-003', name: 'Noah Williams', email: 'noah.w@example.net', phone: '+1 (555) 333-1122',
    location: 'Chicago, IL', role: 'admin', status: 'active', joinedAt: 'Mar 1, 2024',
    lastSeen: '1 hour ago', orderCount: 0, totalSpent: 0, avatarColor: 'bg-emerald-600',
    initials: 'NW', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Approved payout for vendor #V-03', timestamp: '1 hour ago', ip: '172.16.0.1', device: 'Firefox / Windows' },
      { action: 'Updated product #PRD-008 status', timestamp: '3 hours ago', ip: '172.16.0.1', device: 'Firefox / Windows' },
    ],
  },
  {
    id: 'USR-004', name: 'Emma Brown', email: 'emma.b@liquidco.com', phone: '+1 (555) 901-2233',
    location: 'Los Angeles, CA', role: 'customer', status: 'suspended', joinedAt: 'Nov 20, 2024',
    lastSeen: '5 days ago', orderCount: 3, totalSpent: 1850.00, avatarColor: 'bg-rose-500',
    initials: 'EB', flagged: true, verifiedEmail: true,
    activity: [
      { action: 'Chargeback filed on #ORD-7210', timestamp: '5 days ago', ip: '203.0.113.45', device: 'Chrome / Android' },
      { action: 'Multiple failed login attempts', timestamp: '6 days ago', ip: '203.0.113.45', device: 'Unknown' },
    ],
  },
  {
    id: 'USR-005', name: 'Ava Jones', email: 'ava.jones@resale.io', phone: '+1 (555) 447-8800',
    location: 'Miami, FL', role: 'customer', status: 'active', joinedAt: 'Apr 1, 2025',
    lastSeen: '30 min ago', orderCount: 21, totalSpent: 31600.00, avatarColor: 'bg-orange-500',
    initials: 'AJ', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Placed order #ORD-7652', timestamp: '30 min ago', ip: '198.51.100.22', device: 'Chrome / Windows' },
      { action: 'Placed order #ORD-7649', timestamp: '2 days ago', ip: '198.51.100.22', device: 'Chrome / Windows' },
    ],
  },
  {
    id: 'USR-006', name: 'James Martinez', email: 'j.martinez@buyclub.com', phone: '+1 (555) 665-3300',
    location: 'Dallas, TX', role: 'customer', status: 'pending', joinedAt: 'Apr 15, 2025',
    lastSeen: 'Just now', orderCount: 0, totalSpent: 0, avatarColor: 'bg-sky-600',
    initials: 'JM', flagged: false, verifiedEmail: false,
    activity: [
      { action: 'Account created', timestamp: 'Just now', ip: '192.0.2.88', device: 'Safari / macOS' },
    ],
  },
  {
    id: 'USR-007', name: 'Sophia Taylor', email: 'sophia.t@palletking.com', phone: '+1 (555) 772-4455',
    location: 'Phoenix, AZ', role: 'customer', status: 'banned', joinedAt: 'Aug 12, 2024',
    lastSeen: '2 months ago', orderCount: 2, totalSpent: 590.00, avatarColor: 'bg-stone-500',
    initials: 'ST', flagged: true, verifiedEmail: true,
    activity: [
      { action: 'Account banned for fraud', timestamp: '2 months ago', ip: '10.10.10.10', device: 'Unknown' },
    ],
  },
  {
    id: 'USR-008', name: 'Isabella Anderson', email: 'isabella.a@resellers.net', phone: '+1 (555) 884-6677',
    location: 'Seattle, WA', role: 'customer', status: 'active', joinedAt: 'Dec 3, 2024',
    lastSeen: 'Yesterday', orderCount: 6, totalSpent: 7200.00, avatarColor: 'bg-teal-600',
    initials: 'IA', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Placed order #ORD-7638', timestamp: 'Yesterday', ip: '172.31.0.5', device: 'Edge / Windows' },
    ],
  },
  {
    id: 'USR-009', name: 'Mason Lee', email: 'mason.l@buyrights.co', phone: '+1 (555) 229-5544',
    location: 'Denver, CO', role: 'admin', status: 'active', joinedAt: 'Jan 15, 2024',
    lastSeen: '4 hours ago', orderCount: 0, totalSpent: 0, avatarColor: 'bg-indigo-600',
    initials: 'ML', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Reviewed flagged user USR-004', timestamp: '4 hours ago', ip: '192.168.100.1', device: 'Chrome / Windows' },
    ],
  },
  {
    id: 'USR-010', name: 'Ethan Garcia', email: 'ethan.g@stockport.us', phone: '+1 (555) 112-8899',
    location: 'Austin, TX', role: 'customer', status: 'active', joinedAt: 'Mar 22, 2025',
    lastSeen: '6 hours ago', orderCount: 4, totalSpent: 4100.00, avatarColor: 'bg-violet-600',
    initials: 'EG', flagged: false, verifiedEmail: true,
    activity: [
      { action: 'Placed order #ORD-7644', timestamp: '6 hours ago', ip: '10.20.30.40', device: 'Chrome / macOS' },
    ],
  },
];

const PAGE_SIZE = 8;

// ─── Configs ──────────────────────────────────────────────────────────────────

const roleConfig: Record<UserRole, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  customer:   { label: 'Customer',   color: 'bg-blue-100 text-blue-700',     icon: UserCheck },
  admin:      { label: 'Admin',      color: 'bg-violet-100 text-violet-700', icon: ShieldCheck },
  super_admin:{ label: 'Super Admin',color: 'bg-amber-100 text-amber-700',   icon: Crown },
};

const statusConfig: Record<UserStatus, { label: string; color: string; dot: string; icon: React.FC<{ className?: string }> }> = {
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  suspended: { label: 'Suspended', color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   icon: AlertTriangle },
  pending:   { label: 'Pending',   color: 'bg-sky-100 text-sky-700',        dot: 'bg-sky-500',     icon: Clock },
  banned:    { label: 'Banned',    color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500',    icon: XCircle },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const { label, color, icon: Icon } = roleConfig[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
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
  if (sort.key !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-300 ml-1" />;
  return sort.dir === 'asc'
    ? <ArrowUp   className="w-3.5 h-3.5 text-neutral-900 ml-1" />
    : <ArrowDown className="w-3.5 h-3.5 text-neutral-900 ml-1" />;
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowMenu({
  user,
  onView,
  onSuspend,
  onBan,
  onDelete,
  onReactivate,
}: {
  user: AppUser;
  onView: () => void;
  onSuspend: () => void;
  onBan: () => void;
  onDelete: () => void;
  onReactivate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = (fn: () => void) => { fn(); setOpen(false); };

  return (
    <div className="relative" id={`user-menu-${user.id}`}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
            <button onClick={() => wrap(onView)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              <Eye className="w-4 h-4 text-neutral-400" /> View Profile
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              <Mail className="w-4 h-4 text-neutral-400" /> Send Email
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              <UserCog className="w-4 h-4 text-neutral-400" /> Change Role
            </button>
            <div className="my-1 border-t border-neutral-100" />
            {user.status === 'active' ? (
              <button onClick={() => wrap(onSuspend)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                <UserX className="w-4 h-4" /> Suspend User
              </button>
            ) : (
              <button onClick={() => wrap(onReactivate)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                <RefreshCw className="w-4 h-4" /> Reactivate
              </button>
            )}
            <button onClick={() => wrap(onBan)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <Ban className="w-4 h-4" /> Ban User
            </button>
            <div className="my-1 border-t border-neutral-100" />
            <button onClick={() => wrap(onDelete)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete Account
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
            <X className="w-5 h-5" />
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
                  <AlertTriangle className="w-3 h-3" /> Flagged
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
              {!user.verifiedEmail && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  <Mail className="w-3 h-3" /> Unverified Email
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
                    { icon: Mail,     label: 'Email',    value: user.email },
                    { icon: Phone,    label: 'Phone',    value: user.phone },
                    { icon: MapPin,   label: 'Location', value: user.location },
                    { icon: Calendar, label: 'Joined',   value: user.joinedAt },
                    { icon: Clock,    label: 'Last Seen',value: user.lastSeen },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                      <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
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
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
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
                  <ActivitySquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
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
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
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
              <UserX className="w-4 h-4" /> Suspend
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(user.id, 'active')}
              className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reactivate
            </button>
          )}
          <button
            onClick={() => onStatusChange(user.id, 'banned')}
            className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
          >
            <Ban className="w-4 h-4" /> Ban Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]             = useState<AppUser[]>(MOCK_USERS);
  const [search, setSearch]           = useState('');
  const [tabFilter, setTabFilter]     = useState<TabFilter>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [sort, setSort]               = useState<{ key: SortKey; dir: SortDir }>({ key: 'joinedAt', dir: 'desc' });
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [drawerUser, setDrawerUser]   = useState<AppUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalUsers     = users.length;
  const activeUsers    = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended' || u.status === 'banned').length;
  const newThisMonth   = users.filter(u => u.joinedAt.includes('Apr')).length;
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
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  // ── Status Changes ────────────────────────────────────────────────────────
  const changeStatus = (id: string, status: UserStatus) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    if (drawerUser?.id === id) setDrawerUser(prev => prev ? { ...prev, status } : null);
  };

  const handleBulkSuspend = () => {
    setUsers(prev => prev.map(u => selected.has(u.id) ? { ...u, status: 'suspended' } : u));
    setSelected(new Set());
  };

  const handleBulkDelete = () => {
    setUsers(prev => prev.filter(u => !selected.has(u.id)));
    setSelected(new Set());
  };

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'All Users',  count: users.length },
    { key: 'customer',  label: 'Customers',  count: users.filter(u => u.role === 'customer').length },
    { key: 'admin',     label: 'Admins',     count: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length },
    { key: 'suspended', label: 'Restricted', count: users.filter(u => u.status === 'suspended' || u.status === 'banned').length },
  ];

  const STATUSES: Array<UserStatus | 'All'> = ['All', 'active', 'suspended', 'pending', 'banned'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">User Management</h2>
          <p className="text-neutral-500 mt-1 text-sm">Monitor, manage, and secure all platform accounts.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {flaggedCount > 0 && (
            <button
              onClick={() => setTabFilter('suspended')}
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              {flaggedCount} Flagged
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',      value: totalUsers,     icon: Users,       color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Accounts',  value: activeUsers,    icon: UserCheck,   color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Restricted',       value: suspendedUsers, icon: ShieldOff,   color: 'text-rose-600 bg-rose-50' },
          { label: 'New This Month',   value: newThisMonth,   icon: TrendingUp,  color: 'text-violet-600 bg-violet-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
              <Icon className="w-5 h-5" />
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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
              <Filter className="w-4 h-4" /> Filters
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
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-4">Flag:</span>
            <button
              onClick={() => {
                setSearch('');
                setUsers(prev => [...prev].filter(u => u.flagged).length > 0
                  ? prev.filter(u => u.flagged)
                  : MOCK_USERS
                );
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all bg-white border border-neutral-200 text-neutral-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            >
              Flagged Only
            </button>
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
                <UserX className="w-3.5 h-3.5" /> Suspend All
              </button>
              <button
                onClick={handleBulkDelete}
                id="bulk-delete-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All
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
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Users className="w-7 h-7 text-neutral-400" />
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
                          <p className="font-semibold text-neutral-900 truncate max-w-[160px]">{user.name}</p>
                          {!user.verifiedEmail && (
                            <span title="Unverified email" className="text-orange-400">
                              <Mail className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate max-w-[160px]">{user.email}</p>
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
                      <ShoppingBag className="w-3.5 h-3.5 text-neutral-300" />
                      {user.orderCount}
                    </span>
                  </td>

                  {/* Spent */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-1.5 font-bold text-neutral-900">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-300" />
                      {user.totalSpent > 0 ? user.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 }) : '—'}
                    </span>
                  </td>

                  {/* Last Seen */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-neutral-500">{user.lastSeen}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDrawerUser(user)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                        title="View profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <RowMenu
                        user={user}
                        onView={() => setDrawerUser(user)}
                        onSuspend={() => changeStatus(user.id, 'suspended')}
                        onBan={() => changeStatus(user.id, 'banned')}
                        onDelete={() => setUsers(prev => prev.filter(u => u.id !== user.id))}
                        onReactivate={() => changeStatus(user.id, 'active')}
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
              <ChevronLeft className="w-4 h-4" />
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
              <ChevronRight className="w-4 h-4" />
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
