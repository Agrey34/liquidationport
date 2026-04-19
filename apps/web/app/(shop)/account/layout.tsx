'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, Settings, LogOut } from 'lucide-react';

const ACCOUNT_LINKS = [
  { name: 'Dashboard', href: '/account', icon: User, exact: true },
  { name: 'Order History', href: '/account/orders', icon: Package, exact: false },
  { name: 'Saved Pallets', href: '/account/wishlist', icon: Heart, exact: true },
  { name: 'Account Settings', href: '/account/settings', icon: Settings, exact: true },
];

export default function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 mb-4 shadow-sm">
               <div className="flex items-center gap-4 mb-1">
                  <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-full flex items-center justify-center text-lg">
                    DS
                  </div>
                  <div>
                    <h2 className="font-bold text-neutral-900 leading-tight">Dennis Smith</h2>
                    <p className="text-xs font-semibold text-neutral-500">Retail Buyer</p>
                  </div>
               </div>
            </div>

            <nav className="bg-white border border-neutral-200 rounded-3xl p-3 shadow-sm flex flex-col gap-1">
              {ACCOUNT_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = link.exact 
                  ? pathname === link.href 
                  : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10' 
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
              
              <div className="h-px bg-neutral-100 my-2 mx-4"></div>
              
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left">
                 <LogOut className="w-4 h-4" /> Log Out
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0">
             {children}
          </div>

        </div>
      </div>
    </div>
  );
}
