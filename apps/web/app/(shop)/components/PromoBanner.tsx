"use client";

import Link from "next/link";
import { useStorefrontConfig } from "../../../lib/hooks/useStorefrontConfig";

export default function PromoBanner() {
  const { config } = useStorefrontConfig();
  const promo = config.promoBanner;

  if (!promo || !promo.enabled) return null;

  return (
    <section className="bg-neutral-900 text-white py-20 relative overflow-hidden">
      {/* Background Gradient Accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900 to-indigo-950/40 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          {promo.badge && (
            <span className="px-4 py-1.5 bg-white/10 text-white border border-white/20 rounded-full text-xs font-black uppercase tracking-widest inline-block shadow-inner">
              {promo.badge}
            </span>
          )}

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {promo.title}
          </h2>

          <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto font-medium leading-relaxed">
            {promo.subtitle}
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              href={promo.ctaLink || "/register"}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl text-sm transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {promo.ctaText || "Get started"} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
