'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();
  
  // Format the pathname for the breadcrumb
  const title = pathname === '/admin' 
    ? 'Dashboard Overview' 
    : pathname.replace('/admin/', '').charAt(0).toUpperCase() + pathname.replace('/admin/', '').slice(1);

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-8 shrink-0 relative z-10 w-full shadow-sm">
      
      {/* Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400">
           <span>/</span>
           <span className="text-neutral-500 font-medium">Administration</span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
             type="text" 
             placeholder="Quick search..." 
             className="pl-9 pr-4 py-2 bg-neutral-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all w-64"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-neutral-500 hover:text-neutral-900 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
          
          <div className="h-6 gap-0 border-l border-neutral-200 mx-1"></div>
          
          {/* Admin Avatar mockup */}
          <button className="flex items-center gap-2 hover:bg-neutral-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-neutral-200">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
               <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left">
               <p className="text-sm font-bold text-neutral-900 leading-none">Super Admin</p>
               <p className="text-xs text-neutral-500 mt-0.5 leading-none">admin@liqport.com</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
