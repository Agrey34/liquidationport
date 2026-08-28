"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Quote } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function AboutPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const buyers = [
    { num: "01", name: "eCommerce Stores" },
    { num: "02", name: "Wholesalers" },
    { num: "03", name: "Third Party Marketplace Sellers" },
    { num: "04", name: "Flea Market & Swap Meet Vendors" },
    { num: "05", name: "Brokers" },
    { num: "06", name: "Retail Stores" },
  ];

  const advantages = [
    {
      title: "Buy with confidence",
      desc: "Our inventory is sourced directly from top national retailers and manufacturers. All listings include where the inventory was sourced from along with a detailed manifest, product conditions and a comprehensive set of photos so you know exactly what you're buying.",
      icon: "/Icons/money-in-hand.svg",
    },
    {
      title: "No hidden fees",
      desc: "When you buy with Direct Liquidation the price you see is the price you pay. There are no hidden costs or buyer's fees on our platform.",
      icon: "/Icons/money-under-loupe.svg"
    },
    {
      title: "Scale with ease",
      desc: "Whether you're new to the liquidation industry or a seasoned pro we've got everything from single pallets to full truckloads of merchandise available. Start with a single pallet purchase and scale all the way up to multiple truckloads per week when you're ready.",
      icon: "/Icons/scale_with_ease.svg" 
    }
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
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-[#f4f5f7] min-h-screen pb-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <div className="text-[13px] text-[#4a4a4a] mb-8 font-medium">
          <Link href="/" className="hover:underline">Home</Link> <span className="mx-1">/</span> <span className="text-[#111]">About Us</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-bold text-[#111] leading-[1.15] tracking-tight mb-8">
              Your #1 source for high-quality liquidation merchandise
            </h1>
            <Link href="/register" className="inline-block bg-primary text-white font-bold py-3.5 px-8 rounded hover:bg-accent transition-colors">
              Get started
            </Link>
          </div>
          <div className="flex items-center">
            <p className="text-[15px] leading-relaxed text-[#333]">
              For over <strong>10 years</strong>, Direct Liquidation has been a leading provider of customer returns, overstock, and end-of-life products sourced from major retailers and manufacturers. We offer a diverse range of liquidation inventory, including electronics, home goods, clothing, toys, general merchandise and much more.
            </p>
          </div>
        </div>
      </section>

      {/* Numbers Banner */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-[#EBE9F5] rounded-xl p-8 sm:p-12">
          <h2 className="text-[20px] font-bold text-[#111] mb-10">
            Direct Liquidation by numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            <div>
              <div className="text-[24px] font-bold text-[#111] mb-1">13+ years</div>
              <div className="text-[14px] text-[#4a4a4a]">in business</div>
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#111] mb-1">2,500+</div>
              <div className="text-[14px] text-[#4a4a4a]">positive reviews</div>
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#111] mb-1">$275M</div>
              <div className="text-[14px] text-[#4a4a4a]">in total sales</div>
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#111] mb-1">$1.7B</div>
              <div className="text-[14px] text-[#4a4a4a]">in retail value liquidated</div>
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#111] mb-1">35M</div>
              <div className="text-[14px] text-[#4a4a4a]">items sold</div>
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#111] mb-1">1M</div>
              <div className="text-[14px] text-[#4a4a4a]">satisfied customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mb-16 space-y-6">
        
        {/* Mission Statement */}
        <div className="bg-white rounded-xl p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-[20px] font-bold text-[#111]">Mission statement</h2>
          </div>
          <div className="lg:col-span-8 flex items-start gap-6">
            <Quote className="w-16 h-16 text-[#333] shrink-0 rotate-180" strokeWidth={3} />
            <p className="text-[15px] leading-relaxed text-[#333] pt-4">
              Our mission is to provide you with access to high-quality products at unbeatable prices. We source our products directly from retailers and manufacturers, which allows us to pass on significant savings to our customers.
            </p>
          </div>
        </div>

        {/* Commitment to sustainability */}
        <div className="bg-white rounded-xl p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-[20px] font-bold text-[#111]">Commitment to sustainability</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="text-[15px] leading-relaxed text-[#333]">
              We are committed to sustainability and minimizing waste. We work with our partners to ensure that products that are not suitable for sale are properly disposed of, recycled, or donated to charity whenever possible. By doing so, we help to reduce the amount of waste in landfills and support our local communities.
            </p>
          </div>
        </div>

        {/* Transparent buying experience */}
        <div className="bg-white rounded-xl p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-[20px] font-bold text-[#111]">Transparent buying experience</h2>
          </div>
          <div className="lg:col-span-8 space-y-4">
            <p className="text-[15px] leading-relaxed text-[#333]">
              At Direct Liquidation, we pride ourselves on providing a transparent and seamless buying experience. We offer detailed listing descriptions and photos, as well as accurate manifest information, so that our customers can make informed purchasing decisions. We also provide flexible shipping options, including local pickup, to ensure that our customers receive their products in a timely and cost-effective manner.
            </p>
            <p className="text-[15px] leading-relaxed text-[#333]">
              Our team is dedicated to providing excellent customer service and support. We understand that buying liquidation products can be intimidating, and we are here to help guide our customers through the process. Our knowledgeable and friendly staff are available to answer any questions or concerns that our customers may have.
            </p>
          </div>
        </div>
      </section>

      {/* Who buys from us */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mb-20 relative">
        <h2 className="text-[20px] font-bold text-[#111] mb-8">Who buys from us</h2>
        
        <div className="relative group/scroll">
          
          <button 
            onClick={() => scroll("left")}
            className={`absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center bg-[#D8D8D8] w-[46px] h-[46px] rounded-full cursor-pointer hover:bg-gray-400 transition-opacity ${showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-label="Scroll left"
          >
             <ChevronLeft className="w-5 h-5 text-white mr-1" />
          </button>

          <button 
            onClick={() => scroll("right")}
            className={`absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center bg-[#D8D8D8] w-[46px] h-[46px] rounded-full cursor-pointer hover:bg-gray-400 transition-opacity ${showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-label="Scroll right"
          >
             <ChevronRight className="w-5 h-5 text-white ml-0.5" />
          </button>

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 pt-2"
          >
            {buyers.map((buyer) => (
              <div key={buyer.num} className="bg-white rounded-xl p-6 min-w-[200px] h-[160px] flex flex-col justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
                <span className="text-[18px] font-bold text-primary">{buyer.num}</span>
                <h3 className="text-[16px] font-bold text-[#111] pr-4">{buyer.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our advantages */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-[20px] font-bold text-[#111] mb-8">Our advantages</h2>
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8 sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 gap-12 lg:gap-16 lg:grid-cols-3">
            {advantages.map((adv) => (
              <div key={adv.title} className="flex flex-col items-start text-left">
                <div className="relative h-30 w-34 mb-6">
                  <Image 
                    src={adv.icon} 
                    alt={adv.title} 
                    fill 
                    className="object-contain object-left" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </div>
                <h3 className="text-[18px] font-bold leading-7 text-[#111] mb-4">
                  {adv.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-[#333]">
                  {adv.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thank you Banner */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-[#EBE9F5] rounded-xl p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-4">
            <h2 className="text-[20px] font-bold text-[#111]">Thank you</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="text-[15px] leading-relaxed text-[#333]">
              Thank you for choosing Direct Liquidation as your source for quality liquidation products. We look forward to serving you and helping you find the best deals on high-quality merchandise for years to come.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
