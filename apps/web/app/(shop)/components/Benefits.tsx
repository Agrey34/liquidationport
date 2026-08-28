"use client";

import Image from "next/image";
import { useStorefrontConfig } from "../../../lib/hooks/useStorefrontConfig";

export default function Benefits() {
  const { config } = useStorefrontConfig();
  const benefits = config.benefits;

  return (
    <section className="bg-[#f4f5f7] py-16 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-8">
          {benefits.title || "Benefits"}
        </h2>

        {/* White Card Container */}
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 gap-12 lg:gap-16 sm:grid-cols-1 lg:grid-cols-3">
            {benefits.items.map((benefit) => {
              const iconSrc = benefit.icon || "/Icons/handshake.svg";
              return (
                <div key={benefit.id || benefit.title} className="flex flex-col items-start text-left">
                  {/* Icon */}
                  <div className="relative h-24 w-28 mb-6 flex items-center justify-start">
                    {iconSrc.startsWith("http") ? (
                      <img
                        src={iconSrc}
                        alt={benefit.title}
                        className="max-h-20 w-auto object-contain"
                      />
                    ) : (
                      <Image 
                        src={iconSrc} 
                        alt={benefit.title} 
                        fill 
                        className="object-contain object-left" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                      />
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold leading-7 text-[#111] mb-3">
                    {benefit.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[15px] leading-relaxed text-[#555]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
