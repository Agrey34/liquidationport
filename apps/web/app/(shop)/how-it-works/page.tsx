import React from "react";
import Image from "next/image";
import Link from "next/link";
import HowToBuyCarousel from "./HowToBuyCarousel";

export const metadata = {
  title: "How It Works | Liquidation Port",
  description: "Learn how to buy customer returns, overstock, and liquidation merchandise from Liquidation Port.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 
        ========================================================
        HERO SECTION
        ========================================================
      */}
      <section className="bg-[#f8f9fa] pt-16 pb-12 md:pt-24 md:pb-20 border-b border-gray-200 overflow-hidden relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            <div className="flex-1 max-w-2xl text-center md:text-left z-10">
              <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-[#111827] leading-tight mb-6 tracking-tight">
                Buy Customer Returns, Overstock and Liquidation Merchandise
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Browse thousands of liquidation listings from the nation’s top retailers and vendors updated multiple times daily.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/register"
                  className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-primary rounded hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/products"
                  className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Browse Listings
                </Link>
              </div>
            </div>

            <div className="flex-1 relative w-full h-[300px] md:h-[450px] z-10 mb-[-60px] md:mb-[-100px] mr-[-20px] md:mr-[-50px]">
               {/****** Show mobile headline image on small screens, desktop on large screens *******/}
               <div className="block md:hidden absolute inset-0">
                  <Image 
                    src="/how-it-works/headline-mobile.png" 
                    alt="Hero Pallets" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain object-bottom-right"
                    priority
                  />
               </div>
               <div className="hidden md:block absolute inset-0">
                  <Image 
                    src="/how-it-works/headline-desktop.png" 
                    alt="Hero Pallets" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain object-bottom-right"
                    priority
                  />
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================================
        HOW TO BUY SECTION (Tabs / Carousel)
        ========================================================
      */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
        <div className="mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How to buy</h2>
          <p className="text-[17px] text-gray-600 max-w-3xl">
            Gain instant access to liquidation inventory from top brands and retailers for customer returns, overstock, and end-of-life products.
          </p>
        </div>
        
        {/* Render the Client Component for the slider */}
        <HowToBuyCarousel />
      </section>

      {/* 
        ========================================================
        BENEFITS SECTION
        ========================================================
      */}
      <section className="bg-[#f8f9fa] py-20 px-4 sm:px-6 lg:px-8 border-t border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16 text-center">Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 relative">
                 <Image src="/icons/handshake.svg" alt="Source direct" fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Source liquidation inventory direct</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Connect straight to top U.S. retailers and buy their extra stock in bulk—no middleman needed. You’ll see what’s in stock right now and snap up wholesale lots at prices you won’t find anywhere else. It’s an easy way to cut out extra fees and keep more profit in your pocket.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 relative">
                 <Image src="/icons/money-under-loupe.svg" alt="Price transparency" fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Price transparency</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Our pricing tool shows you the full sales history for every pallet, so you know exactly what similar lots sold for. No more guessing or jumping between sites. With transparent data at your fingertips, you can make smarter bids or buy instantly with confidence.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 relative">
                 <Image src="/icons/money-in-hand.svg" alt="Buy on your terms" fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Buy on your terms</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Decide whether to make an offer or buy now for instant purchase and fast delivery. Either way, you’ll get flexible payment and shipping options that fit your timeline. Plus, our support team is here to help you at every step—from placing your order to tracking your shipment.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================================
        FOOTER / CTA SECTION
        ========================================================
      */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-[40px] font-bold text-gray-900 leading-tight mb-6">
            Ready to start sourcing high quality liquidation inventory?
          </h2>
          <p className="text-[17px] text-gray-600 mb-10 leading-relaxed">
            Liquidation Port is your #1 source for high quality liquidation inventory. Trust your sourcing needs to a company with a track record of over a decade of helping businesses like yours succeed.
          </p>
          <Link
            href="/register"
            className="inline-flex justify-center items-center px-10 py-4 text-base font-bold text-white bg-primary rounded hover:bg-primary/90 transition-colors shadow-sm"
          >
            Register your account
          </Link>
        </div>
      </section>
    </div>
  );
}
