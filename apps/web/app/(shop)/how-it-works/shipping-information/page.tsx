import React from "react";
import { Truck, Package, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Shipping Information | Liquidation Port",
};

export default function ShippingInformationPage() {
  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Shipping Information</h1>
        <p className="text-lg text-gray-600 mb-12">
          Understanding our shipping policies and freight options will help you accurately calculate your landed costs and successfully receive your inventory.
        </p>

        <div className="space-y-12">
          {/* Section 1 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Freight Shipping</h3>
              <p className="text-gray-600 mb-4">
                The majority of our inventory is sold by the pallet or truckload. This requires LTL (Less Than Truckload) or FTL (Full Truckload) freight shipping. During checkout, our system will automatically calculate shipping costs based on weight, dimensions, and the distance to your destination.
              </p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>You must indicate whether your destination requires a liftgate (if you do not have a loading dock or forklift).</li>
                <li>Residential deliveries often incur additional surcharges from freight carriers.</li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <Package className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Buyer Arranged Shipping</h3>
              <p className="text-gray-600">
                You also have the option to arrange your own shipping. If you choose this, you must schedule the pickup with the specific warehouse facility indicated on the listing. A Bill of Lading (BOL) must be provided to our team at least 24 hours prior to pickup. Please note that warehouse hours vary by location.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Receiving Your Order</h3>
              <p className="text-gray-600">
                Upon delivery, it is your responsibility to inspect the freight before signing the delivery receipt (POD). Count the pallets and shrink wrap. If there is visible damage or missing pallets, you MUST note this on the POD before the driver leaves. Failure to do so may result in denied claims.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
