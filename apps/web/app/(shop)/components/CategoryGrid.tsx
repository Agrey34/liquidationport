"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function CategoryGrid() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const categories = [
    { name: "Electronics", image: "/catergories/electronics.png" },
    { name: "Home", image: "/catergories/home.png" },
    { name: "Home Improvement", image: "/catergories/home-improvement.png" },
    { name: "Toys", image: "/catergories/toys.png" },
    { name: "Sports, Fitness & Outdoors", image: "/catergories/sports.png" },
    { name: "Patio & Garden", image: "/catergories/patio-garden.png" },
    { name: "Furniture", image: "/catergories/furniture.png" },
    { name: "Health & Beauty", image: "/catergories/health-beauty.png" },
    { name: "Baby", image: "/catergories/baby.png" },
    { name: "Pet Toys & Pet Supplies", image: "/catergories/pet-toys-pet-supplies.png" },
    { name: "Automotive", image: "/catergories/automotive.png" },
    { name: "Office", image: "/catergories/furniture-office.png" },
  ];

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-[#f4f5f7] py-16 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111] mb-12">
          Most popular categories
        </h2>

        <div className="relative group/nav">
          {/* Faded Left Arrow indicator */}
          <button 
            onClick={() => scroll("left")}
            className={`absolute left-[-10px] top-[30%] -translate-y-1/2 z-10 hidden lg:flex items-center justify-center bg-black/20 w-12 h-12 rounded-full cursor-pointer hover:bg-black/30 transition-opacity ${showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-label="Scroll left"
          >
             <ChevronLeft className="w-6 h-6 text-white mr-1" />
          </button>

          {/* Faded Right Arrow indicator */}
          <button 
            onClick={() => scroll("right")}
            className={`absolute right-[-10px] top-[30%] -translate-y-1/2 z-10 hidden lg:flex items-center justify-center bg-black/20 w-12 h-12 rounded-full cursor-pointer hover:bg-black/30 transition-opacity ${showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-label="Scroll right"
          >
             <ChevronRight className="w-6 h-6 text-white ml-0.5" />
          </button>

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex items-start gap-12 sm:gap-16 lg:gap-[4.5rem] overflow-x-auto scrollbar-hide pb-8 pt-2"
          >
            {categories.map((category) => {
              const categorySlug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <Link 
                  href={`/category/${categorySlug}`}
                  key={category.name} 
                  className="flex flex-col items-center justify-start min-w-[80px] sm:min-w-[110px] cursor-pointer group shrink-0"
                >
                  <div className="h-20 w-24 sm:h-24 sm:w-28 relative mb-5 transition-transform group-hover:scale-105">
                    <Image 
                      src={category.image} 
                      alt={category.name} 
                      fill
                      sizes="(max-width: 640px) 100px, 120px" 
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                  <h3 className="text-[13px] font-[#333] text-center max-w-[130px] leading-snug group-hover:underline">
                    {category.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ready to start block */}
        <div className="mt-24 flex flex-col items-center justify-center text-center">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[#111] mb-8">
            Ready to start?
          </h2>
          <Link href="/register" className="bg-primary text-white text-[15px] font-bold py-3.5 px-8 rounded hover:bg-accent transition-colors">
            Get started
          </Link>
        </div>

      </div>
    </section>
  );
}
