'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function StorefrontCMSPage() {
  const [activeTab, setActiveTab] = useState('hero');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Storefront CMS</h2>
          <p className="text-neutral-500 mt-1">Manage homepage banners, featured categories, and UI configurations.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-xl font-bold text-sm tracking-wide shadow-sm">
           <i className="fi fi-rr-device-floppy" /> Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
         {/* Navigation Tabs */}
         <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white border border-neutral-200 rounded-2xl p-2 sticky top-8 flex flex-col gap-1">
               <button 
                 onClick={() => setActiveTab('hero')}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'hero' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
               >
                  <i className="fi fi-rr-picture text-lg" /> Hero Banners
               </button>
               <button 
                 onClick={() => setActiveTab('featured')}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'featured' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
               >
                  <i className="fi fi-rr-star text-lg" /> Featured Brands
               </button>
               <button 
                 onClick={() => setActiveTab('layout')}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'layout' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
               >
                  <i className="fi fi-rr-layout-fluid text-lg" /> Grid Layouts
               </button>
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1">
            {activeTab === 'hero' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <i className="fi fi-rr-layer-plus text-neutral-400" /> Primary Hero Carousel
                     </h3>
                     
                     <div className="space-y-4">
                        <div className="border border-neutral-200 rounded-xl p-4 flex gap-4 items-center bg-neutral-50 group hover:border-neutral-300 transition-colors">
                           <div className="w-8 flex flex-col items-center justify-center text-neutral-300 cursor-grab">
                              <i className="fi fi-rr-apps-sort" />
                           </div>
                           <div className="w-32 h-20 bg-neutral-200 rounded-lg overflow-hidden shrink-0">
                              <Image width={200} height={120} src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=200&h=120" alt="Clearance" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 space-y-2">
                              <input type="text" defaultValue="Summer Electronics Clearance" className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900" />
                              <input type="text" defaultValue="Up to 70% off retail prices on refurbished tech." className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900" />
                           </div>
                           <button className="w-10 h-10 rounded-lg border border-neutral-200 bg-white flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors shrink-0">
                              <i className="fi fi-rr-trash" />
                           </button>
                        </div>

                        <div className="border border-neutral-200 rounded-xl p-4 flex gap-4 items-center bg-neutral-50 group hover:border-neutral-300 transition-colors">
                           <div className="w-8 flex flex-col items-center justify-center text-neutral-300 cursor-grab">
                              <i className="fi fi-rr-apps-sort" />
                           </div>
                           <div className="w-32 h-20 bg-neutral-200 rounded-lg overflow-hidden shrink-0">
                              <Image width={200} height={120} src="https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&q=80&w=200&h=120" alt="Apparel" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 space-y-2">
                              <input type="text" defaultValue="Apparel Truckloads Arriving" className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-neutral-900" />
                              <input type="text" defaultValue="Secure premium brand apparel pallets today." className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900" />
                           </div>
                           <button className="w-10 h-10 rounded-lg border border-neutral-200 bg-white flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors shrink-0">
                              <i className="fi fi-rr-trash" />
                           </button>
                        </div>
                     </div>

                     <button className="mt-6 w-full py-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2">
                        <i className="fi fi-rr-add" /> Add New Banner Slide
                     </button>
                  </div>
               </div>
            )}
            
            {activeTab === 'featured' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
                     <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-400">
                        <i className="fi fi-rr-star text-2xl" />
                     </div>
                     <h3 className="text-lg font-bold text-neutral-900">Featured Brands Configuration</h3>
                     <p className="text-neutral-500 text-sm max-w-sm mt-2">Upload brand logos and assign them to the scrolling marquee on the homepage.</p>
                     <button className="mt-6 px-6 py-2.5 bg-neutral-100 text-neutral-900 font-bold rounded-xl text-sm hover:bg-neutral-200 transition-colors">
                        Manage Brand Logos
                     </button>
                  </div>
               </div>
            )}

            {activeTab === 'layout' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
                     <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-400">
                        <i className="fi fi-rr-layout-fluid text-2xl" />
                     </div>
                     <h3 className="text-lg font-bold text-neutral-900">Grid Layout Configuration</h3>
                     <p className="text-neutral-500 text-sm max-w-sm mt-2">Adjust the arrangement of the &quot;Featured Listings&quot; and &quot;Category&quot; grids.</p>
                     <button className="mt-6 px-6 py-2.5 bg-neutral-100 text-neutral-900 font-bold rounded-xl text-sm hover:bg-neutral-200 transition-colors">
                        Configure Grids
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
