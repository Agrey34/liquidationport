'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: 'fi fi-rr-apps' },
  { name: 'Orders', href: '/admin/orders', icon: 'fi fi-rr-shopping-bag' },
  { name: 'Returns', href: '/admin/returns', icon: 'fi fi-rr-arrow-turn-down-left' },
  { name: 'Products', href: '/admin/products', icon: 'fi fi-rr-box' },
  { name: 'Categories', href: '/admin/categories', icon: 'fi fi-rr-folder-tree' },
  { name: 'Reviews', href: '/admin/reviews', icon: 'fi fi-rr-comment-alt-middle' },
  { name: 'Users', href: '/admin/users', icon: 'fi fi-rr-users' },
  { name: 'Coupons', href: '/admin/coupons', icon: 'fi fi-rr-ticket' },
  { name: 'Storefront', href: '/admin/storefront', icon: 'fi fi-rr-layout-fluid' },
  { name: 'Settings', href: '/admin/settings', icon: 'fi fi-rr-settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Take the most critical 4 items for the bottom nav
  const primaryNavItems = navItems.slice(0, 4);

  return (
    <>
      {/* ===== MOBILE: Bottom Navigation Bar ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 flex items-stretch h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex flex-1 flex-col items-center justify-center gap-1 relative px-1 transition-colors"
            >
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full bg-neutral-900 transition-all duration-300 ${
                  isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                }`}
              />
              <i className={`${item.icon} text-lg transition-all duration-200 ${isActive ? 'text-neutral-900 scale-110' : 'text-neutral-400'}`} />
              <span className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        {/* The "More" Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 relative px-1 transition-colors group"
        >
          <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full bg-neutral-900 transition-all duration-300 ${isMobileMenuOpen ? 'w-8 opacity-100' : 'w-0 opacity-0'}`} />
          <i className={`fi fi-rr-menu-dots text-lg transition-all duration-200 ${isMobileMenuOpen ? 'text-neutral-900 scale-110' : 'text-neutral-400 group-hover:text-neutral-900'}`} />
          <span className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${isMobileMenuOpen ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-900'}`}>
            More
          </span>
        </button>
      </nav>

      {/* ===== MOBILE: "More" Menu Overlay ===== */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-12 duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 shrink-0">
                 <h3 className="text-lg font-bold text-neutral-900">All Modules</h3>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                    <i className="fi fi-rr-cross-small text-xl flex" />
                 </button>
              </div>
              <div className="overflow-y-auto px-4 py-4 space-y-1 pb-20">
                 {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
                    return (
                       <Link
                         key={`more-${item.name}`}
                         href={item.href}
                         onClick={() => setIsMobileMenuOpen(false)}
                         className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}
                       >
                          <i className={`${item.icon} text-xl w-6 flex justify-center`} />
                          <span className="font-bold text-sm tracking-wide">{item.name}</span>
                          {isActive && <i className="fi fi-rr-angle-right ml-auto" />}
                       </Link>
                    );
                 })}
              </div>
           </div>
        </div>
      )}


      {/* ===== DESKTOP: Collapsible Sidebar ===== */}
      <div className={`hidden md:flex bg-white border-r border-neutral-200 h-full flex-col shadow-sm shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-[84px]' : 'w-64'}`}>
        
    
        <button  onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 top-20 bg-white border border-neutral-200 rounded-full p-1.5 shadow-sm text-neutral-500 hover:text-neutral-900 z-50 transition-colors flex items-center justify-center">
            {isCollapsed ? <i className="fi fi-rr-angle-right text-xs" /> : <i className="fi fi-rr-angle-left text-xs" />}
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
                          <i className={`${item.icon} text-lg shrink-0 mt-0.5`} />  {!isCollapsed && <span className="truncate">{item.name}</span>}
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
            <i className="fi fi-rr-sign-out-alt text-lg shrink-0 mt-0.5" />
            {!isCollapsed && <span className="truncate">Exit to Shop</span>}
          </Link>
        </div>
      </div>
    </>
  );
}
