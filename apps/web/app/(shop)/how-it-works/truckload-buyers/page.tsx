import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Truckload Buyers | Liquidation Port",
};

export default function TruckloadBuyersPage() {
  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Truckload Buyers</h1>
        <p className="text-xl text-gray-600 mb-10">
          Source full truckloads of customer returns, overstock, and closeouts directly from top U.S. retailers at a fraction of MSRP.
        </p>

        <div className="bg-[#f8f9fa] rounded-2xl p-8 mb-12 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dedicated Account Management</h2>
          <p className="text-gray-600 mb-6">
            If you have the warehouse capacity to receive full 53 truckloads (approx. 24-26 pallets), you may qualify for a dedicated account manager. Our team provides custom-built manifests, predictable freight pricing, and first-access to exclusive merchandise lots before they hit the open marketplace.
          </p>
          <ul className="space-y-3 text-gray-700 font-medium mb-8">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Negotiated Truckload Pricing
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Dedicated Brokerage & Freight Solutions
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Direct facility-to-facility transit
            </li>
          </ul>
          <Link
            href="/contact"
            className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            Contact Sales Team <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements for Truckload Shipping</h2>
        <div className="prose max-w-none text-gray-600">
          <p>
            To receive a full truckload, your facility must be equipped to handle commercial 53-foot semi-trailers. This generally requires:
          </p>
          <ul>
            <li>A commercial address zoned for heavy traffic.</li>
            <li>A raised loading dock or a forklift capable of removing pallets from the rear of the trailer.</li>
            <li>The ability to completely unload the trailer within the 2-hour allotted carrier window to avoid detention fees.</li>
            <li>A valid Resale Certificate on file.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
