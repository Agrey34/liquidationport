'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Filter, ChevronDown, Tag, ArrowUpDown, SlidersHorizontal, Package, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const MOCK_PALLETS = [
  { id: '942502', title: 'Target Returns Electronics Pallet', retailer: 'Target', condition: 'Untested Returns', lot: '1 Pallet', qty: 45, msrp: 3200, price: 550, originalPrice: null, image: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=600&auto=format&fit=crop', category: 'Electronics', conditionGrade: 'Fair' },
  { id: '112004', title: 'Amazon Overstock Home Appliance Lot', retailer: 'Amazon', condition: 'Brand New (Box Damage)', lot: '2 Pallets', qty: 15, msrp: 4500, price: 1200, originalPrice: 1500, image: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=600&auto=format&fit=crop', category: 'Home & Garden', conditionGrade: 'New' },
  { id: '850123', title: 'Mixed Summer Apparel - Brands Assorted', retailer: 'Macy\'s', condition: 'Shelf Pulls', lot: '1 Gaylord', qty: 250, msrp: 6500, price: 850, originalPrice: null, image: 'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=600&auto=format&fit=crop', category: 'Apparel', conditionGrade: 'Like New' },
  { id: '445012', title: 'Premium Tech Accessories - Mixed Cases', retailer: 'Best Buy', condition: 'Salvage/Parts', lot: '1 Pallet', qty: 300, msrp: 8900, price: 400, originalPrice: null, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop', category: 'Electronics', conditionGrade: 'Salvage' },
  { id: '904512', title: 'Power Tools & Hardware Returns', retailer: 'Home Depot', condition: 'Untested Returns', lot: '1 Pallet', qty: 12, msrp: 2400, price: 480, originalPrice: null, image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=600&auto=format&fit=crop', category: 'Tools & Hardware', conditionGrade: 'Fair' },
  { id: '343011', title: 'Children Toys & Games Holiday Clearout', retailer: 'Walmart', condition: 'Overstock', lot: '3 Pallets', qty: 150, msrp: 3500, price: 600, originalPrice: 850, image: 'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=600&auto=format&fit=crop', category: 'Toys & Games', conditionGrade: 'New' },
];

export default function ProductsCatalogPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Derive unique categories and conditions
  const categories = ['All', ...Array.from(new Set(MOCK_PALLETS.map(p => p.category)))];
  const conditions = ['All', ...Array.from(new Set(MOCK_PALLETS.map(p => p.conditionGrade)))];

  const filteredPallets = useMemo(() => {
    return MOCK_PALLETS.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchCondition = selectedCondition === 'All' || p.conditionGrade === selectedCondition;
      return matchSearch && matchCategory && matchCondition;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0; // newest as default placeholder
    });
  }, [searchQuery, selectedCategory, selectedCondition, sortBy]);

  return (
    <div className="bg-neutral-50 min-h-screen">
      
      {/* ── Page Header ── */}
      <div className="bg-neutral-900 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Live Inventory</h1>
          <p className="text-neutral-400 font-medium max-w-2xl mx-auto text-sm md:text-base">Browse premium overstock and liquidation pallets. New inventory is sourced directly from top retailers and updated daily.</p>
          
          <div className="mt-8 max-w-xl mx-auto relative">
             <i className="fi fi-rr-search absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
             <input 
               type="text" 
               placeholder="Search by manifest, brand, or LOT#" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/15 placeholder:text-neutral-500 backdrop-blur-sm transition-all"
             />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ── Mobile Filter Toggle ── */}
          <div className="w-full flex items-center justify-between lg:hidden mb-4">
             <p className="text-sm font-bold text-neutral-600">{filteredPallets.length} Results</p>
             <button 
               onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
               className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-xl text-sm font-bold bg-white text-neutral-900 shadow-sm"
             >
                <SlidersHorizontal className="w-4 h-4" /> Filters
             </button>
          </div>

          {/* ── Sidebar Filters ── */}
          <div className={`w-full lg:w-64 shrink-0 lg:sticky lg:top-24 space-y-6 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
             
             {/* Category Filter */}
             <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-neutral-400" /> Category
                </h3>
                <div className="space-y-2">
                  {categories.map(c => (
                    <label key={c} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category" 
                        value={c}
                        checked={selectedCategory === c}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900 cursor-pointer"
                      />
                      <span className={`text-sm tracking-wide ${selectedCategory === c ? 'font-bold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>{c}</span>
                    </label>
                  ))}
                </div>
             </div>

             {/* Condition Filter */}
             <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-400" /> Condition Grade
                </h3>
                <div className="space-y-2">
                  {conditions.map(c => (
                     <label key={c} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="condition" 
                        value={c}
                        checked={selectedCondition === c}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900 cursor-pointer"
                      />
                      <span className={`text-sm tracking-wide ${selectedCondition === c ? 'font-bold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>{c}</span>
                    </label>
                  ))}
                </div>
             </div>

             <button 
               onClick={() => { setSelectedCategory('All'); setSelectedCondition('All'); setSearchQuery(''); }}
               className="w-full py-2.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
             >
               Clear All Filters
             </button>
          </div>

          {/* ── Product Grid Area ── */}
          <div className="flex-1 w-full">
            
            {/* Top Toolbar */}
            <div className="hidden lg:flex items-center justify-between bg-white border border-neutral-200 rounded-2xl p-3 px-5 mb-6 shadow-sm">
               <p className="text-sm font-bold text-neutral-600">{filteredPallets.length} Results Found</p>
               <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-neutral-500 flex items-center gap-1.5"><ArrowUpDown className="w-4 h-4"/> Sort by:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-none text-sm font-bold text-neutral-900 focus:ring-0 bg-transparent pr-8 cursor-pointer"
                  >
                     <option value="newest">Newest Arrivals</option>
                     <option value="price_low">Price: Low to High</option>
                     <option value="price_high">Price: High to Low</option>
                  </select>
               </div>
            </div>

            {/* Grid */}
            {filteredPallets.length === 0 ? (
               <div className="text-center py-20 bg-white border border-dashed border-neutral-300 rounded-3xl">
                  <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-neutral-900">No pallets matched your search</h3>
                  <p className="text-neutral-500 mt-1 text-sm">Try broadening your filters or checking back later. Inventory is updated daily.</p>
                  <button 
                    onClick={() => { setSelectedCategory('All'); setSelectedCondition('All'); setSearchQuery(''); }}
                    className="mt-6 px-6 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
                  >
                    Reset Search
                  </button>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPallets.map(pallet => (
                  <Link key={pallet.id} href={`/products/${pallet.id}`} className="group bg-white rounded-3xl overflow-hidden border border-neutral-200 hover:border-neutral-900/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col">
                    <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                      <Image 
                        src={pallet.image} 
                        alt={pallet.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-neutral-900 text-[10px] font-black rounded-lg uppercase tracking-wider">{pallet.conditionGrade}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                         <span className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm">{pallet.retailer}</span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                        <span>Lot #{pallet.id}</span>
                        <span>•</span>
                        <span>{pallet.qty} Units</span>
                      </div>
                      <h3 className="font-extrabold text-neutral-900 leading-snug line-clamp-2 mb-3 mt-auto group-hover:text-blue-600 transition-colors">{pallet.title}</h3>
                      
                      <div className="h-px bg-neutral-100 w-full my-3"></div>

                      <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Buy It Now</p>
                           <div className="flex items-baseline gap-2">
                             <span className="text-xl font-black text-neutral-900">${pallet.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             {pallet.originalPrice && <span className="text-xs font-semibold text-neutral-400 line-through">${pallet.originalPrice.toLocaleString()}</span>}
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Est. MSRP</p>
                           <p className="text-sm font-semibold text-emerald-600">${pallet.msrp.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
