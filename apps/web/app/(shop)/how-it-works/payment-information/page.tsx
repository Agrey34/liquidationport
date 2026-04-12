import React from "react";
import { CreditCard, Landmark, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Payment Information | Liquidation Port",
};

export default function PaymentInformationPage() {
  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Payment Information</h1>
        <p className="text-lg text-gray-600 mb-12">
          We offer secure, flexible payment methods to ensure a smooth purchasing process for your business. All transactions are securely processed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Credit & Debit Cards</h3>
            <p className="text-gray-600">
              We accept all major credit and debit cards including Visa, Mastercard, American Express, and Discover. Cards are charged instantly upon checkout or upon an accepted offer.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Landmark className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Wire Transfer</h3>
            <p className="text-gray-600">
              For large transactions or truckload purchases, we require payment via wire transfer. Instructions will be provided in your invoice upon order confirmation.
            </p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl p-8 flex items-start space-x-4">
          <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-2">100% Secure Payments</h4>
            <p className="text-gray-600">
              Liquidation Port does not store your full credit card information. All transactions are processed via our PCI-DSS compliant payment processor (Stripe) to protect your financial data and prevent fraud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
