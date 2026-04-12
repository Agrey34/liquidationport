import React from "react";
import Image from "next/image";

export const metadata = {
  title: "Merchandise Conditions | Liquidation Port",
};

export default function MerchandiseConditionsPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16">
        
        {/* Header Section */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-6 font-sans">
            Source a variety of product conditions
          </h1>
          <p className="text-center text-gray-800 max-w-3xl mx-auto text-base md:text-lg">
            Whether you’re looking for untested customer returns, refurbished items or brand new inventory, we’ve got a bit of everything to suit all types of businesses.
          </p>
        </div>

        {/* Hero Illustration */}
        <div className="flex justify-center mb-16 px-4">
          <Image 
            src="/how-it-works/merchandise-conditions/machandise_condition_headline.svg" 
            alt="Conditions Illustration" 
            width={800}
            height={300}
            className="w-full max-w-3xl h-auto drop-shadow-sm"
            unoptimized
          
          />
        </div>

        {/* Conditions List */}
        <div className="space-y-12">
          
          {/* Brand New */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">

            <div className="md:w-56 h-9 shrink-0 flex md:justify-end pt-1">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#e8faed] text-[#2c8d55]">
                BRAND NEW
              </span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Brand New</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Product comes in original retail packaging. Factory sealed.
              </p>
            </div>
          </div>


          <div className="flex flex-col md:flex-row gap-4 md:gap-8 mr-3">
            <div className="md:w-56 h-6 shrink-0 flex md:justify-end pt-1 ">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#52a688] text-white">
                NEW DAMAGED BOX
              </span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Brand New (Damaged Box)</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Never been used. Fully functional. Product comes in original retail packaging, but packaging is damaged.
              </p>
            </div>
          </div>

          {/* Like New */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="md:w-56 h-9 shrink-0 flex md:justify-end pt-1">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#f3efff] text-[#6b3deb]">
                LIKE NEW
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Like New</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Fully functional. Product has no cosmetic defects. Product may come in original retail packaging or comparable plain replacement. Manuals may be missing.
              </p>
            </div>
          </div>

          {/* Refurbished Section */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="md:w-56 shrink-0 flex md:justify-end pt-1">
              {/* No top-level badge here, grades have badges */}
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Refurbished</h3>
              
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6 md:p-8 space-y-8">
                
                {/* Grade A */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-32 shrink-0 pt-1">
                    <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#7a6fb9] text-white">
                      REFURB-A
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1 leading-snug">
                      <span className="font-bold">Grade A</span> Fully functional. Product has no cosmetic defects.
                    </h4>
                    <p className="text-gray-600 text-[14.5px] leading-relaxed">
                      Product has been inspected, tested and returned to manufacturer’s original standards. Product may come in original retail packaging or comparable plain replacement.
                    </p>
                  </div>
                </div>

                {/* Grade B */}
                <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-50 pt-6 sm:border-t-0 sm:pt-0">
                  <div className="sm:w-32 shrink-0 pt-1">
                    <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#7a6fb9] text-white">
                      REFURB-B
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1 leading-snug">
                      <span className="font-bold">Grade B</span> Fully functional. Product has slight cosmetic defects.
                    </h4>
                    <p className="text-gray-600 text-[14.5px] leading-relaxed">
                      Product has been inspected, tested and returned to manufacturer’s original standards. Product may come in original retail packaging or comparable plain replacement.
                    </p>
                  </div>
                </div>

                {/* Grade C */}
                <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-50 pt-6 sm:border-t-0 sm:pt-0">
                  <div className="sm:w-32 shrink-0 pt-1">
                    <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#7a6fb9] text-white">
                      REFURB-C
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1 leading-snug">
                      <span className="font-bold">Grade C</span> Fully functional. Product has significant cosmetic defects.
                    </h4>
                    <p className="text-gray-600 text-[14.5px] leading-relaxed">
                      Product has been inspected, tested and returned to manufacturer’s original standards. Product may come in original retail packaging or comparable plain replacement.
                    </p>
                  </div>
                </div>

                {/* Grade D */}
                <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-50 pt-6 sm:border-t-0 sm:pt-0">
                  <div className="sm:w-32 shrink-0 pt-1">
                    <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#7a6fb9] text-white">
                      REFURB-D
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1 leading-snug">
                      <span className="font-bold">Grade D</span> Fully functional. Product has very significant cosmetic defects.
                    </h4>
                    <p className="text-gray-600 text-[14.5px] leading-relaxed">
                      Product has been inspected, tested and returned to manufacturer’s original standards. Product may come in original retail packaging or comparable plain replacement.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Untested Customer Returns */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-4">
            <div className="md:w-56 h-8  shrink-0 flex md:justify-end pt-1">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#fff0e1] text-[#e07718] uppercase">
                Untested Returns
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Untested Customer Returns</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Operational condition is unknown. May be fully functional or non working. May or not include original packaging. Packaging may be damaged. Accessories may be missing or broken. No inspection or testing was performed on this inventory.
              </p>
            </div>
          </div>

          {/* Damaged / Missing Parts */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="md:w-56 h-8  shrink-0 flex md:justify-end pt-1">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#ffe5ee] text-[#d63462] uppercase">
                Damaged
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Damaged / Missing Parts</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Operational condition is unknown. Inventory was visually inspected and show obvious signs of damage or have key components missing. No testing or repairs have been performed.
              </p>
            </div>
          </div>

          {/* Tested Not Working */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="md:w-56 h-8  shrink-0 flex md:justify-end pt-1">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold tracking-wide rounded bg-[#f05a7e] text-white uppercase">
                Not Working
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Tested Not Working</h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Not functional. Inventory was tested but failed a technical functionality or physical condition test. No repair has been attempted. Packaging may be damaged or missing. Units may lack essential components, accessories or documentation.
              </p>
            </div>
          </div>

        </div>

        {/* Important Note Box */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-12 md:mt-20">
          <div className="md:w-56 h-8  shrink-0 flex md:justify-end pt-1"></div>
          <div className="flex-1">
          </div>
        </div>

            <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-6 text-[14px] text-gray-700">
              <span className="font-bold text-gray-900 block sm:inline mr-1">Important Note:</span>
              Please check the “Warranty Information” section found in each listing’s “Description” area.Unless otherwise noted all inventory is sold “As-Is” with no warranty.
            </div>
      </div>
    </div>
  );
}
