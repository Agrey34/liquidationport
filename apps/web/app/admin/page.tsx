import React from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ShoppingBag
} from 'lucide-react';

const STATS = [
  { 
    title: 'Total Revenue', 
    value: '$45,232.89', 
    trend: '+20.1%', 
    isPositive: true,
    icon: DollarSign 
  },
  { 
    title: 'Active Pallets', 
    value: '+573', 
    trend: '+12.5%', 
    isPositive: true,
    icon: Package 
  },
  { 
    title: 'New B2B Users', 
    value: '+2,350', 
    trend: '-4.2%', 
    isPositive: false,
    icon: Users 
  },
  { 
    title: 'Pending Orders', 
    value: '142', 
    trend: '+8.1%', 
    isPositive: true,
    icon: ShoppingBag 
  }
];

const RECENT_ORDERS = [
  { id: 'ORD-7652', customer: 'Liam Johnson', date: 'Today, 2:45 PM', amount: '$1,250.00', status: 'Processing' },
  { id: 'ORD-7651', customer: 'Olivia Smith', date: 'Today, 1:12 PM', amount: '$8,400.00', status: 'Pending' },
  { id: 'ORD-7650', customer: 'Noah Williams', date: 'Yesterday', amount: '$345.50', status: 'Completed' },
  { id: 'ORD-7649', customer: 'Emma Brown', date: 'Yesterday', amount: '$2,100.00', status: 'Completed' },
  { id: 'ORD-7648', customer: 'Ava Jones', date: 'Oct 12, 2023', amount: '$5,500.00', status: 'Failed' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header Area */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h2>
        <p className="text-neutral-500 mt-1">Here&apos;s an overview of your platform&apos;s performance today.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 lg:p-6 border border-neutral-200 shadow-sm flex flex-col justify-between min-w-0">
              <div className="flex justify-between items-start mb-3">
                <div className="p-1.5 lg:p-2 bg-neutral-100 text-neutral-600 rounded-lg shrink-0">
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span className="hidden sm:inline">{stat.trend}</span>
                </div>
              </div>
              
              <div className="min-w-0">
                <h3 className="text-xl lg:text-3xl font-black text-neutral-900 truncate">{stat.value}</h3>
                <p className="text-xs lg:text-sm font-medium text-neutral-500 mt-1 truncate">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Recent Orders Table Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
             <h3 className="text-lg font-bold text-neutral-900">Recent Orders</h3>
             <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 text-neutral-500 text-xs uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {RECENT_ORDERS.map((order, i) => (
                  <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-neutral-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{order.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-neutral-900">{order.amount}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider
                          ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : ''}
                          ${order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : ''}
                          ${order.status === 'Failed' ? 'bg-rose-100 text-rose-800' : ''}
                        `}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between overflow-hidden relative">
          {/* Decorative backdrop */}
          <TrendingUp className="absolute -bottom-6 -right-6 w-48 h-48 text-white/5" />
          
          <div>
            <div className="p-3 bg-white/10 w-fit rounded-xl backdrop-blur-md mb-6">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Pending Withdrawals</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              You have 3 pending vendor payouts requiring super-admin approval from Stripe Connect.
            </p>
          </div>
          
          <button className="w-full py-3 px-4 bg-white text-neutral-900 rounded-xl font-bold hover:bg-neutral-100 transition-colors shadow-lg mt-auto z-10">
            Review Payouts
          </button>
        </div>

      </div>
    </div>
  );
}
