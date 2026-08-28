"use client";

import Link from "next/link";
import Image from "next/image";
import { useStorefrontConfig } from "../../../lib/hooks/useStorefrontConfig";

export default function Hero() {
  const { config } = useStorefrontConfig();
  const hero = config.hero;

  const imageSrc = hero.heroImage || "/herosectoin/truck2.png";

  return (
    <div className="relative bg-secondary flex items-center pt-16 pb-20 overflow-hidden min-h-[600px]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between">
        
        {/* Left: Text Content */}
        <div className="w-full md:w-5/12 z-10 md:pr-10 lg:pl-12 space-y-4">
          {hero.badgeText && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 backdrop-blur-xs border border-neutral-200 text-neutral-800 rounded-full text-xs font-bold shadow-2xs">
              {hero.badgeText}
            </span>
          )}

          <h1 className="text-5xl font-['Roboto',sans-serif] font-bold tracking-tight sm:text-6xl text-gray-900 leading-[1.1] whitespace-pre-line">
            {hero.headline}
          </h1>

          <p className="mt-4 text-xl text-[#252525] max-w-lg font-medium leading-relaxed">
            {hero.subheadline}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href={hero.primaryCtaLink || "/register"}
              className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-accent transition-colors shadow-sm"
            >
              {hero.primaryCtaText || "Get started"}
            </Link>

            {hero.secondaryCtaText && (
              <Link
                href={hero.secondaryCtaLink || "/products"}
                className="inline-flex items-center justify-center px-6 py-3.5 border border-neutral-300 text-sm font-bold rounded-xl text-neutral-800 bg-white hover:bg-neutral-50 transition-colors shadow-2xs"
              >
                {hero.secondaryCtaText}
              </Link>
            )}
          </div>
        </div>

        {/* Right: Graphic Image */}
        <div className="w-full md:w-7/12 mt-16 md:mt-0 relative flex justify-end min-h-[400px] md:min-h-[500px]">
          {imageSrc.startsWith("http") ? (
            <img
              src={imageSrc}
              alt="Liquidation logistics"
              className="object-contain object-right drop-shadow-2xl max-h-[500px] w-auto max-w-full"
            />
          ) : (
            <Image
              src={imageSrc}
              alt="Liquidation logistics"
              fill
              className="object-contain object-right drop-shadow-2xl"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          )}
        </div>
      </div>
    </div>
  );
}
