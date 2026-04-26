'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logout } from '../../auth/actions';

const NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'New Order: ORD-2904', time: '5m ago', read: false },
  { id: 2, type: 'alert', title: 'Low Stock: Wireless Mouse', time: '1h ago', read: false },
  { id: 3, type: 'system', title: 'Stripe Webhook Failed', time: '3h ago', read: true },
  { id: 4, type: 'user', title: 'New Admin Registered', time: '1d ago', read: true },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Format the pathname for the breadcrumb
  const title = pathname === '/admin' 
    ? 'Dashboard Overview' 
    : pathname.replace('/admin/', '').charAt(0).toUpperCase() + pathname.replace('/admin/', '').slice(1);

  // Close dropdown on click outside
  useEffect(() => {
     function handleClickOutside(event: MouseEvent) {
       if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
         setShowNotifications(false);
       }
       if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
         setShowProfileMenu(false);
       }
     }
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-8 shrink-0 relative z-40 w-full shadow-sm">
      
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
          <i className="fi fi-rr-search text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
          <input 
             type="text" 
             placeholder="Quick search..." 
             className="pl-9 pr-4 py-2 bg-neutral-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all w-64"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3 relative" ref={notificationRef}>
          <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className={`relative p-2 transition-colors rounded-xl ${showNotifications ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
          >
            <i className="fi fi-rr-bell text-xl mt-1 block" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
             <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-neutral-200 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                   <h3 className="text-sm font-bold text-neutral-900">Notifications</h3>
                   <span className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer">Mark all as read</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                   {NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`p-4 border-b border-neutral-50 flex gap-3 hover:bg-neutral-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'bg-white'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              n.type === 'order' ? 'bg-indigo-50 text-indigo-600' : 
                              n.type === 'alert' ? 'bg-rose-50 text-rose-600' : 
                              'bg-neutral-100 text-neutral-600'
                          }`}>
                              {n.type === 'order' && <i className="fi fi-rr-shopping-bag" />}
                              {n.type === 'alert' && <i className="fi fi-rr-triangle-warning" />}
                              {(n.type === 'system' || n.type === 'user') && <i className="fi fi-rr-info" />}
                          </div>
                          <div>
                             <p className={`text-sm ${n.read ? 'font-medium text-neutral-600' : 'font-bold text-neutral-900'}`}>{n.title}</p>
                             <p className="text-xs text-neutral-400 mt-0.5">{n.time}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto mt-1" />}
                      </div>
                   ))}
                </div>
                <div className="p-2 bg-neutral-50 text-center border-t border-neutral-100">
                   <button className="text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors py-1">View All Activity</button>
                </div>
             </div>
          )}

          <div className="h-6 gap-0 border-l border-neutral-200 mx-1"></div>
          
          {/* Admin Avatar mockup */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-neutral-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-neutral-200"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                 <i className="fi fi-rr-user mt-1" />
              </div>
              <div className="hidden md:block text-left">
                 <p className="text-sm font-bold text-neutral-900 leading-none">Super Admin</p>
                 <p className="text-xs text-neutral-500 mt-0.5 leading-none">admin@liqport.com</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-neutral-200 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 flex flex-col">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors text-left">
                    <i className="fi fi-rr-settings text-neutral-400"></i>
                    Settings
                  </button>
                  <div className="h-px bg-neutral-100 my-1"></div>
                  <button 
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <i className="fi fi-rr-sign-out-alt"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
