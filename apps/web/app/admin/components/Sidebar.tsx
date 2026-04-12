'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* ===== MOBILE: Bottom Navigation Bar ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 flex items-stretch h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 relative transition-colors"
            >
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full bg-neutral-900 transition-all duration-300 ${
                  isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                }`}
              />
              <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-neutral-900 scale-110' : 'text-neutral-400'}`} />
              <span className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>


      {/* ===== DESKTOP: Collapsible Sidebar ===== */}
      <div className={`hidden md:flex bg-white border-r border-neutral-200 h-full flex-col shadow-sm flex-shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-[84px]' : 'w-64'}`}>
        
    
        <button  onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 top-20 bg-white border border-neutral-200 rounded-full p-1.5 shadow-sm text-neutral-500 hover:text-neutral-900 z-50 transition-colors">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-6 border-b border-neutral-200 overflow-hidden">
            <Link href="/admin" className="font-extrabold text-xl tracking-tight text-neutral-900 flex items-center justify-center gap-2 w-full">
              <div className="w-8 h-8 bg-neutral-900 text-white flex shrink-0 items-center justify-center rounded-lg text-sm font-black">
                LP
              </div>
              {!isCollapsed && <span className="truncate">Admin</span>}
            </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}
                          className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 font-medium overflow-hidden ${
                            isCollapsed ? 'justify-center px-0' : 'px-3'
                          } ${
                            isActive 
                              ? 'bg-neutral-900 text-white shadow-md' 
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                          }`}
                          title={isCollapsed ? item.name : undefined}
                          >
                          <Icon className="w-5 h-5 shrink-0" />  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
        </nav>

        {/* Exit to Shop */}
        <div className="p-4 border-t border-neutral-200 flex justify-center">
          <Link 
            href="/" 
            className={`flex items-center gap-3 py-2.5 text-neutral-500 hover:text-red-600 hover:bg-rose-50 rounded-xl transition-all duration-200 font-medium text-sm overflow-hidden w-full ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
            title={isCollapsed ? "Exit to Shop" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">Exit to Shop</span>}
          </Link>
        </div>
      </div>
    </>
  );
}
