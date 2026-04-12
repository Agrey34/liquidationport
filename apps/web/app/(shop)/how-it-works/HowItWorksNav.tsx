"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { name: "How It Works", path: "/how-it-works" },
  { name: "Merchandise Conditions", path: "/how-it-works/merchandise-conditions-explained" },
  { name: "Payment Information", path: "/how-it-works/payment-information" },
  { name: "Shipping Information", path: "/how-it-works/shipping-information" },
  { name: "Who Buys from Us", path: "/how-it-works/buys-direct-liquidation" },
  { name: "Truckload Buyers", path: "/how-it-works/truckload-buyers" },
];

export default function HowItWorksNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-[#f8f9fa] border-b border-gray-200 sticky top-20 z-30 pt-4">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;

            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`relative px-1 pb-4 text-sm font-semibold transition-colors ${
                  isActive ? "text-[#1a1154]" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.name}
                {isActive && (
                  <motion.div
                    layoutId="how-it-works-active-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1154]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
