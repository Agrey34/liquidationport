'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Catalog', href: '/products', icon: Search },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, action: 'open-cart' },
    { label: 'Account', href: '/account', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 sm:hidden pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Determine if active: 
          // Home is active if exactly '/'
          // Others are active if they start with the href (e.g. /products, /account)
          const isActive = item.href === '/' 
             ? pathname === '/' 
             : pathname.startsWith(item.href);

          if (item.action === 'open-cart') {
             // For the cart, we can link to a dedicated cart page or trigger the drawer.
             // If we just use href, creating a `/cart` page or returning false would be fine. 
             // Currently, there's no dedicated /cart page, just the drawer.
             // But for simplicity of layout, we can let it link to a real route like '/checkout' or we can leave it as a link.
             // Actually, if we link to `/products`, the user can open it from Navbar. 
             // Let's just make it a link to a future `/cart` route or the checkout gateway. 
             // For now, href='/products' with `#cart` could work, or just linking to '/checkout'.
             // I'll link to '/checkout' for the Cart icon to emulate going to the cart.
          }

          return (
            <Link
              key={item.label}
              href={item.action === 'open-cart' ? '/checkout' : item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              } transition-colors`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''}`} />
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
