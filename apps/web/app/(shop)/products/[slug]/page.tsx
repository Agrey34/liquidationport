'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MapPin, Truck, ShieldCheck, Info,ShoppingCart,Heart,Barcode } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Mock Data for the Pallet
const MOCK_PALLET = {
  id: '942503',
  title: '1 Pallet, 16 Pcs, Kitchen and Dining, All in One, Luggage, Camping and Hiking',
  retailer: 'Walmart',
  condition: 'Untested Customer Returns',
  location: 'Bentonville, AR',
  quantity: 16,
  msrp: 1091.98,
  price: 250.00,
  shipping: 'Freight Shipping Arranged at Checkout',
  lotSize: '1 Pallet',
  dimensions: '73"x44"x47"/410lb',
  images: [
    'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590845947376-2638caa89309?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=800&auto=format&fit=crop',
  ],
  manifest: [
    { upc: '00850020141231', qty: 2, desc: 'Mainstays 10-Piece Cookware Set', msrp: 49.99 },
    { upc: '00810012589012', qty: 1, desc: 'Ozark Trail 8-Person Family Tent', msrp: 149.00 },
    { upc: '00741258963214', qty: 4, desc: 'Protege 2-Piece Hard Side Luggage Set', msrp: 89.00 },
    { upc: '00412587963254', qty: 3, desc: 'Keurig K-Express Coffee Maker', msrp: 79.00 },
    { upc: '00852147963012', qty: 2, desc: 'Igloo 60 Quart Rolling Cooler', msrp: 55.00 },
    { upc: '00963258741025', qty: 4, desc: 'Farberware 15-Piece Knife Block Set', msrp: 35.00 },
  ],
  description: "This pallet consists of a variety of kitchen and dining items, luggage, and outdoor gear sourced directly from Walmart customer returns. Items are sold AS-IS and have not been tested or inspected for functionality. Some boxes may show wear or be repackaged. Great selection of established brands."
};

const TABS = ['Manifest', 'Overview', 'Shipping'];

export default function ProductDetailsPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('Manifest');
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-neutral-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-sm font-medium text-neutral-500 space-x-2">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-primary transition-colors">Pallets</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-neutral-900 truncate max-w-[200px] sm:max-w-md">{MOCK_PALLET.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Main Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Left: Image Gallery  add to cart */ }
          <div className="md:col-span-7 flex flex-row gap-4 h-[500px] lg:h-[600px]">
            <div className="flex flex-col gap-3 w-20 sm:w-24 overflow-y-auto no-scrollbar shrink-0">
              {MOCK_PALLET.images.map((imgUrl, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-full aspect-square rounded-lg bg-white overflow-hidden transition-all duration-200 border flex items-center justify-center p-1 ${activeImage === i ? 'border-neutral-900 shadow-sm' : 'border-neutral-200 opacity-80 hover:opacity-100'}`}
                >
                  <Image src={imgUrl} alt={`Thumbnail ${i}`} fill unoptimized className="object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
            
            {/* Main Image View */}
            <motion.div 
              layoutId={`image-gallery-main`}
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex-1 bg-white border border-neutral-200 rounded-xl flex items-center justify-center relative overflow-hidden group p-8 cursor-crosshair`}
              onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - left) / width) * 100;
                  const y = ((e.clientY - top) / height) * 100;
                  img.style.transformOrigin = `${x}% ${y}%`;
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                const img = e.currentTarget.querySelector('img');
                if (img) {
                  img.style.transformOrigin = 'center center';
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={MOCK_PALLET.images[activeImage]} 
                alt="Main product" 
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[2]" 
              />
            </motion.div>
          </div>

          {/* Right: Info & Buy Box */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-md uppercase tracking-wider">Lot#{MOCK_PALLET.id}</span>
                 <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wider">{MOCK_PALLET.retailer}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                {MOCK_PALLET.title}
              </h1>
            </div>
            {/* Price & Action Card (Glassmorphic) */}
            <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-2">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-sm font-semibold text-neutral-500 mb-1">Buy It Now Price</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-neutral-900">${MOCK_PALLET.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <p className="text-emerald-600 text-sm font-semibold py-1">Save ${(MOCK_PALLET.msrp - MOCK_PALLET.price).toLocaleString()} off MSRP</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                      <button  onClick={handleAddToCart} disabled={isAddedToCart}
                        className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${isAddedToCart ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/95 hover:-translate-y-0.5'}`} >
                        {isAddedToCart ? (
                          <><ShieldCheck className="w-5 h-5" /> Added to Cart! </> ) : (
                          <> <ShoppingCart className="w-5 h-5" /> Add to Cart </>
                        )}
      
                      </button>
                      <div className="flex gap-3">
                        <button className="flex-1 py-3 px-6 rounded-xl font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                            Buy Now
                        </button>
      
                        <button className="p-3 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-neutral-200/50 flex flex-col gap-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span>Ships nationwide via Freight. Calculated at checkout.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Secure checkout provided by Stripe.</span>
                      </div>
                  </div>
            </div>

            {/* Detailed Specs (Matching Design) */}
            <div className="border-t border-b border-neutral-200 py-5 grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase mb-0.5">MSRP</p>
                <p className="text-[15px] font-medium text-neutral-900">${MOCK_PALLET.msrp.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
              </div>
              <div className="col-span-2 h-px bg-neutral-100"></div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase mb-0.5">Lot Size</p>
                <p className="text-[15px] font-medium text-neutral-900">{MOCK_PALLET.lotSize}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase mb-0.5">Units</p>
                <p className="text-[15px] font-medium text-neutral-900">{MOCK_PALLET.quantity}</p>
              </div>
              <div className="col-span-2 h-px bg-neutral-100"></div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase mb-0.5">Condition</p>
                <p className="text-[15px] font-medium text-neutral-900">{MOCK_PALLET.condition}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase mb-0.5">Dimensions/Weights</p>
                <p className="text-[15px] font-medium text-neutral-900">{MOCK_PALLET.dimensions}</p>
              </div>
            </div>

            <div className="mt-2 text-sm text-neutral-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-neutral-900">Description</h3>
                <button className="text-indigo-800 text-xs font-bold hover:underline">Show more ⌄</button>
              </div>
              <p className="font-semibold mb-2">Merchandise Condition:</p>
              <p className="text-neutral-500 mb-4">Product is untested and in various cosmetic condition.</p>
              <p className="font-semibold text-neutral-400">Disclaimer:</p>
            </div>


          </div>
        </div>

        {/* Information Tabs */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-neutral-200 no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-5 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    initial={{ false: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* Overview Tab */}
              {activeTab === 'Overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl prose prose-neutral text-neutral-600"
                >
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">Lot Information</h3>
                  <p className="text-lg leading-relaxed">{MOCK_PALLET.description}</p>
                  
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-neutral-100">
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2">Facility Features</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Forklift available for loading</li>
                        <li>Dock doors present</li>
                        <li>By appointment only</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 mb-2">Packaging Details</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Standard 48 x 40 Wooden Pallet</li>
                        <li>Shrink-wrapped</li>
                        <li>Approx. Weight: 240 lbs</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Manifest Tab */}
              {activeTab === 'Manifest' && (
                <motion.div
                  key="manifest"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">Pallet Manifest</h3>
                      <p className="text-sm text-neutral-500">Detailed breakdown of included items.</p>
                    </div>
                    <div className="bg-neutral-100 px-4 py-2 rounded-lg font-mono text-sm text-neutral-700 border border-neutral-200 flex items-center gap-2">
                       <Barcode className="w-4 h-4"/> 
                       <span>Total Items: {MOCK_PALLET.quantity}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-neutral-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-700 border-b border-neutral-200">
                          <th className="p-4 font-semibold text-sm">UPC / Barcode</th>
                          <th className="p-4 font-semibold text-sm">Description</th>
                          <th className="p-4 font-semibold text-sm text-right">Qty</th>
                          <th className="p-4 font-semibold text-sm text-right">Unit MSRP</th>
                          <th className="p-4 font-semibold text-sm text-right">Ext MSRP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 bg-white">
                        {MOCK_PALLET.manifest.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-4 font-mono text-xs text-neutral-500">{item.upc}</td>
                            <td className="p-4 text-sm font-medium text-neutral-900">{item.desc}</td>
                            <td className="p-4 text-sm text-right font-bold text-neutral-700">{item.qty}</td>
                            <td className="p-4 text-sm text-right text-neutral-600">${item.msrp.toFixed(2)}</td>
                            <td className="p-4 text-sm text-right font-bold text-neutral-900 flex justify-end items-center gap-2">
                               ${(item.msrp * item.qty).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-neutral-50 font-bold border-t-2 border-neutral-300 text-neutral-900">
                          <td colSpan={2} className="p-4 text-right">Totals</td>
                          <td className="p-4 text-right">{MOCK_PALLET.quantity}</td>
                          <td className="p-4 text-right">--</td>
                          <td className="p-4 text-right">${MOCK_PALLET.msrp.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex items-start gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Manifests are provided for informational purposes. The actual items, conditions, and quantities may vary slightly. Liquidation sales are final.</p>
                  </div>
                </motion.div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'Shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl"
                >
                  <h3 className="text-xl font-bold text-neutral-900 mb-6">Shipping & Pickup Information</h3>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-lg">Freight Shipping</h4>
                        <p className="text-neutral-600 mt-1">We partner with top-tier LTL freight carriers to offer nationwide delivery. Shipping rates are calculated at checkout based on the delivery zip code and facility requirements (e.g., liftgate needs, residential vs commercial).</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 text-lg">Buyer Arranged Pickup</h4>
                        <p className="text-neutral-600 mt-1">You may choose to arrange your own freight or pick up the pallet yourself. Once payment clears, our operations team will contact you to schedule an appointment. A valid BOL (Bill of Lading) must be provided 24 hours prior to pickup if using a third-party carrier.</p>
                      </div>
                    </div>
                  </div>
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
