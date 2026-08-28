"use client";

import Image from "next/image";
import { useStorefrontConfig } from "../../../lib/hooks/useStorefrontConfig";

export default function FeaturedBrands() {
  const { config } = useStorefrontConfig();
  const brandsConfig = config.brands;

  return (
    <div className="bg-secondary pb-16 pt-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 lg:pl-12">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {brandsConfig.title || "Featured liquidators"}
          </h2>
          {brandsConfig.subtitle && (
            <p className="text-sm text-neutral-500 mt-1">{brandsConfig.subtitle}</p>
          )}
        </div>
        
        {/* Render horizontal partner liquidator cards */}
        <div className="flex space-x-4 overflow-x-auto pb-4 px-2 lg:pl-12 scrollbar-hide">
          {brandsConfig.brands.map((brand) => (
            <div
              key={brand.id}
              className="flex flex-col justify-center shrink-0 w-64 h-48 bg-white rounded-2xl shadow-sm border border-neutral-200/80 transition-all hover:shadow-md hover:-translate-y-0.5 items-center p-6 text-center group"
            >
              <div className="h-16 w-32 relative mb-3 flex items-center justify-center">
                {brand.logoUrl.startsWith("http") ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="object-contain max-h-12 w-auto grayscale group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={120}
                    height={60}
                    className="object-contain max-h-12 w-auto grayscale group-hover:grayscale-0 transition-all"
                  />
                )}
              </div>
              <p className="font-bold text-sm text-neutral-900">{brand.name}</p>
              {brand.discountText && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 border border-emerald-200/60">
                  {brand.discountText}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
