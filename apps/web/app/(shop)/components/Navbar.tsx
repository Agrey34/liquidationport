"use client";
import Image from "next/image";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ChevronDown, X, ShoppingCart } from "lucide-react";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Drawer menu items
  const menuItems = [
    { name: "Home", href: "/" },
    { name: "Full Catalog", href: "/products" },
    { name: "About us", href: "/about" },
    { name: "How it works", href: "/how-it-works" },
    { name: "Merchandise Conditions", href: "/products" },
    { name: "Terms and conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy-policy" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
        {/* Main Navbar Row */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left: Menu & Logo */}
            <div className="flex items-center space-x-4 shrink-0">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center justify-center bg-gray-200 text-gray-700 h-10 w-10 rounded-full hover:bg-gray-300 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <Link href="/" className="flex items-center">
                <span className="text-primary text-3xl font-bold tracking-tight">
                  Liquidation port
                </span>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:flex flex-1 items-center justify-center px-12">
                <button className="flex items-center mr-2 bg-transparent border-2 border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 shrink-0">
                  Category <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
                </button>
              <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl flex bg-[#f0f2f5] rounded-md overflow-hidden border border-transparent focus-within:border-gray-300 transition-all">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-500"
                  placeholder="Search"
                />
                <button type="submit" className="px-4 py-2.5 text-gray-500 hover:text-gray-800 transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Right: Region & Auth */}
            <div className="flex items-center space-x-6 shrink-0">
              <button className="hidden sm:flex items-center text-sm font-medium text-gray-800 hover:text-primary transition-colors">
                <Image src="/country-flags/usa.png" alt="USA" width={20} height={20} />
                USA <ChevronDown className="h-4 w-4 ml-1 opacity-60" />
              </button>
              <div className="hidden sm:flex items-center space-x-5">
                  <Link
                    href="/login"
                    className="text-sm font-bold text-gray-800 hover:text-primary transition-colors">
                    Log in
                  </Link>
                  <Link
                      href="/register"
                      className="text-sm font-bold text-primary border border-primary px-5 py-2.5 rounded hover:bg-primary/5 transition-all">
                      Sign up
                  </Link>
              </div>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors hover:bg-gray-100 rounded-full"
              >
                 <ShoppingCart className="w-5 h-5" />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              
              {/* Mobile Auth Links Fallback */}
              <div className="sm:hidden flex items-center space-x-4">
                 <Link href="/login" className="text-sm font-bold text-gray-800 hover:text-primary">Log in</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Ribbon (Horizontal Scrolling) */}
        <div className="border-t border-gray-100 hidden sm:block">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-8 h-12 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {menuItems.map((item, idx) => (
                <Link 
                  key={idx} 
                  href={item.href} 
                  className={`text-sm tracking-wide transition-colors ${idx === 0 ? "font-bold text-primary" : "font-medium text-[#4a4a4a] hover:text-primary"}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Navigation */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] sm:w-[350px] bg-white z-60 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b border-gray-100 shrink-0">
          <span className="text-primary text-xl font-bold tracking-tight">Menu</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col space-y-2 mt-2">
            {menuItems.map((item, idx) => (
              <li key={idx}>
                <Link 
                  href={item.href}
                  className="block px-4 py-3 text-[17px] text-[#252525] hover:bg-gray-50 hover:text-primary rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
