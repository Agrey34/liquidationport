import React from "react";
import { Store, ShoppingCart, Globe, Factory } from "lucide-react";

export const metadata = {
  title: "Who Buys From Us | Liquidation Port",
};

export default function WhoBuysFromUsPage() {
  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Who Buys From Us?</h1>
        <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
          We supply discount merchandise to tens of thousands of businesses worldwide. From local flea market vendors to massive e-commerce outlets, we have inventory for every business model.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-gray-600">
          
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Store className="w-10 h-10 text-primary mb-5" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Discount Bin Stores</h3>
            <p>
              Bin stores rely on high-volume, low-cost merchandise to fill their tables weekly. We provide unsorted returns and general merchandise pallets that fit perfectly into the $5-per-item bin store model.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <ShoppingCart className="w-10 h-10 text-primary mb-5" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Amazon & eBay Resellers</h3>
            <p>
              Online sellers look for high MSRP items such as electronics, branded apparel, and appliances. Our manifested pallets allow online sellers to cherry-pick items that have high resale value and fast turnover.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Globe className="w-10 h-10 text-primary mb-5" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Exporters</h3>
            <p>
              International buyers purchase bulk loads of refurbished or salvage electronics and apparel to ship overseas. We provide the documentation and logistical support needed for large export orders.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <Factory className="w-10 h-10 text-primary mb-5" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Refurbishers & Repair Shops</h3>
            <p>
              Technicians and repair businesses buy our salvage and untested electronics. They harvest parts from broken units to fix others, yielding incredibly high margins on repaired electronics, tools, and appliances.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
