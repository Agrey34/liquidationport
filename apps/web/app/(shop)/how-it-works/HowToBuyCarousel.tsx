"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";

const steps = [
  {
    id: 1,
    title: "1. Register your account",
    description: "Create an account, add a valid credit card and upload your resale certificate.",
    image: "/how-it-works/lot-images/hs.png",
  },
  {
    id: 2,
    title: "2. Browse listings",
    description: "Search thousands of listings updated multiple times daily.",
    image: "/how-it-works/lot-images/ferguson.png",
  },
  {
    id: 3,
    title: "3. Offer or buy",
    description: "Place an offer to negotiate the listed price or buy now to secure a pallet instantly.",
    image: "/how-it-works/lot-images/walmart.png",
  },
  {
    id: 4,
    title: "4. Check out and ship",
    description: "Enter your payment details, tell us where to send your order, and choose from our carriers. We’ll handle the rest.",
    image: "/how-it-works/lot-images/jcpenny.png",
  },
];

export default function HowToBuyCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  return (
    <div className="relative w-full">
      {/**************** Scroll Indicators for Mobile (optional UX enhancement) *****************/}
      <div className="absolute inset-y-0 left-0 w-8 bg-linear-to-r from-white to-transparent pointer-events-none z-10 md:hidden" style={{ opacity: canScrollLeft ? 1 : 0, transition: "opacity 0.3s" }} />
      <div className="absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white to-transparent pointer-events-none z-10 md:hidden" style={{ opacity: canScrollRight ? 1 : 0, transition: "opacity 0.3s" }} />

      {/**************** Grid on Desktop, Horizontal Scroll on Mobile *****************/}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex md:grid md:grid-cols-4 gap-4 md:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-hide pb-8 -mx-4 px-4 md:px-0 md:mx-0"
        style={{ scrollBehavior: "smooth" }}
      >
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex-none w-[85%] sm:w-[60%] md:w-auto snap-center flex flex-col"
          >
            {/******************* Image Container ********************/}
           <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden mb-6 bg-gray-100 shadow-sm border border-gray-200 group">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 85vw, 25vw"
              />
            </div>
            
            {/******************* Text Content ********************/}
            
            <div className="flex-1 pr-4 md:pr-0">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
