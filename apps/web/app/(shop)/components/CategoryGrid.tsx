"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";

interface CategoryItem {
  id?: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  image?: string;
}

export function getCategoryFallbackImage(name: string, slug: string = ''): string {
  const text = `${name} ${slug}`.toLowerCase();

  if (text.includes('cloth') || text.includes('apparel') || text.includes('fashion') || text.includes('wear') || text.includes('shoe')) {
    return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400&h=400';
  }
  if (text.includes('appliance') || text.includes('kitchen') || text.includes('fridge') || text.includes('cookware')) {
    return 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?auto=format&fit=crop&q=80&w=400&h=400';
  }
  if (text.includes('beauty') || text.includes('health') || text.includes('personal') || text.includes('cosmetic')) {
    return '/catergories/health-beauty.png';
  }
  if (text.includes('tool') || text.includes('hardware') || text.includes('improvement') || text.includes('construct')) {
    return '/catergories/home-improvement.png';
  }
  if (text.includes('toy') || text.includes('game') || text.includes('hobby')) {
    return '/catergories/toys.png';
  }
  if (text.includes('sport') || text.includes('fitness') || text.includes('outdoor') || text.includes('exercise')) {
    return '/catergories/sports.png';
  }
  if (text.includes('furniture') || text.includes('couch') || text.includes('chair') || text.includes('table')) {
    return '/catergories/furniture.png';
  }
  if (text.includes('patio') || text.includes('garden') || text.includes('yard') || text.includes('lawn')) {
    return '/catergories/patio-garden.png';
  }
  if (text.includes('baby') || text.includes('kid') || text.includes('infant')) {
    return '/catergories/baby.png';
  }
  if (text.includes('pet') || text.includes('dog') || text.includes('cat')) {
    return '/catergories/pet-toys-pet-supplies.png';
  }
  if (text.includes('auto') || text.includes('car') || text.includes('motor') || text.includes('vehicle')) {
    return '/catergories/automotive.png';
  }
  if (text.includes('office') || text.includes('desk') || text.includes('paper')) {
    return '/catergories/furniture-office.png';
  }
  if (text.includes('home') || text.includes('decor') || text.includes('living')) {
    return '/catergories/home.png';
  }
  if (text.includes('general') || text.includes('merchandise') || text.includes('misc')) {
    return 'https://images.unsplash.com/photo-1586528116311-ad8ed745330e?auto=format&fit=crop&q=80&w=400&h=400';
  }
  if (text.includes('electr') || text.includes('tech') || text.includes('comput') || text.includes('phone')) {
    return '/catergories/electronics.png';
  }

  return '/catergories/home.png';
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: "Apparel & Clothing", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Appliances", image: "https://images.unsplash.com/photo-1583847268964-b28e5f884f67?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Beauty & Personal Care", image: "/catergories/health-beauty.png" },
  { name: "Electronics", image: "/catergories/electronics.png" },
  { name: "Furniture", image: "/catergories/furniture.png" },
  { name: "General Merchandise", image: "https://images.unsplash.com/photo-1586528116311-ad8ed745330e?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Home & Garden", image: "/catergories/patio-garden.png" },
  { name: "Sports & Outdoors", image: "/catergories/sports.png" },
  { name: "Tools & Hardware", image: "/catergories/home-improvement.png" },
  { name: "Toys & Games", image: "/catergories/toys.png" },
];

export default function CategoryGrid() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [displayCategories, setDisplayCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    async function loadLiveCategories() {
      try {
        const res = await apiFetch<CategoryItem[]>('/categories');
        const liveList = res.data as unknown as CategoryItem[];
        if (Array.isArray(liveList) && liveList.length > 0) {
          const mapped = liveList.map((cat) => ({
            ...cat,
            image: cat.imageUrl || getCategoryFallbackImage(cat.name, cat.slug),
          }));
          setDisplayCategories(mapped);
        }
      } catch (err) {
        console.warn("Could not fetch live categories, using defaults:", err);
      }
    }

    loadLiveCategories();
  }, []);

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
            {displayCategories.map((category) => {
              const imgSource = category.imageUrl || category.image || getCategoryFallbackImage(category.name, category.slug);
              return (
                <Link 
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  key={category.id || category.name} 
                  className="flex flex-col items-center justify-start min-w-[80px] sm:min-w-[110px] cursor-pointer group shrink-0"
                >
                  <div className="h-20 w-24 sm:h-24 sm:w-28 relative mb-5 transition-transform group-hover:scale-105">
                    {imgSource.startsWith("http") ? (
                      <img
                        src={imgSource}
                        alt={category.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <Image 
                        src={imgSource} 
                        alt={category.name} 
                        fill
                        sizes="(max-width: 640px) 100px, 120px" 
                        className="object-contain"
                      />
                    )}
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
