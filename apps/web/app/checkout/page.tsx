'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, CreditCard, Box, MapPin, CheckCircle2 } from 'lucide-react';

const MOCK_CART = [
  { 
    id: '942503', 
    title: '1 Pallet, Kitchen and Dining, Luggage, Camping', 
    price: 250.00, 
    qty: 1, 
    img: 'https://images.unsplash.com/photo-1542314831-c6a4d14effd0?q=80&w=200&auto=format&fit=crop'
  },
  { 
    id: '112004', 
    title: 'Amazon Overstock Home Appliance Lot', 
    price: 1200.00, 
    qty: 1, 
    img: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=200&auto=format&fit=crop'
  }
];

export default function CheckoutPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = MOCK_CART.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = 150.00;
  const taxes = subtotal * 0.08;
  const total = subtotal + shipping + taxes;

  const handleCompleteOrder = () => {
    setIsProcessing(true);
    // Simulate real stripe checkout API delay
    setTimeout(() => {
       setIsProcessing(false);
       router.push('/checkout/success');
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row min-h-[calc(100vh-64px)]">
      
      {/* ── Left Column: Checkout Forms ── */}
      <div className="w-full lg:w-3/5 px-4 sm:px-6 lg:px-12 py-10 bg-white">
        
        {/* Breadcrumb Stepper */}
        <nav className="flex items-center text-xs font-semibold text-neutral-500 mb-8">
          <span className="text-primary pr-2">Cart</span>
          <ChevronRight className="w-3 h-3" />
          <span className={`px-2 ${activeStep >= 1 ? 'text-primary' : ''}`}>Information</span>
          <ChevronRight className="w-3 h-3" />
          <span className={`px-2 ${activeStep >= 2 ? 'text-primary' : ''}`}>Shipping</span>
          <ChevronRight className="w-3 h-3" />
          <span className={`px-2 ${activeStep >= 3 ? 'text-primary' : ''}`}>Payment</span>
        </nav>

        {activeStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Contact Information */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Contact</h2>
                <Link href="/login" className="text-sm text-blue-600 hover:underline">Log in</Link>
              </div>
              <input 
                type="email" 
                placeholder="Email or mobile phone number" 
                className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-neutral-500" 
              />
              <div className="mt-2.5 flex items-center gap-2">
                 <input type="checkbox" id="offers" className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary" />
                 <label htmlFor="offers" className="text-sm text-neutral-600">Email me with news and offers</label>
              </div>
            </section>

            {/* Shipping Address */}
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Shipping address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <select className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white">
                  <option>United States</option>
                  <option>Canada</option>
                </select>
                <input type="text" placeholder="First name" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Last name" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Company (optional)" className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Address" className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Apartment, suite, etc. (optional)" className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="City" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <select className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white">
                  <option>State</option>
                  <option>California</option>
                  <option>Texas</option>
                  <option>New York</option>
                  <option>Florida</option>
                </select>
                <input type="text" placeholder="ZIP code" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="tel" placeholder="Phone" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

               <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
                  <MapPin className="w-5 h-5 shrink-0 text-blue-500" />
                  <p>Freight delivery available. Valid contact number required for carrier delivery appointment.</p>
               </div>
            </section>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-2 gap-4">
              <button 
                onClick={() => router.back()}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Return to cart
              </button>
              <button 
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Continue to shipping
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             
             {/* Review block */}
             <div className="border border-neutral-200 rounded-2xl p-0 overflow-hidden text-sm">
                <div className="p-4 flex gap-4 items-center justify-between">
                   <div className="flex gap-6 max-w-sm">
                      <span className="text-neutral-500 w-16 shrink-0">Contact</span>
                      <span className="text-neutral-900 truncate">customer@example.com</span>
                   </div>
                   <button onClick={() => setActiveStep(1)} className="text-primary hover:underline font-medium text-xs">Change</button>
                </div>
                <div className="h-px w-full bg-neutral-200"></div>
                <div className="p-4 flex gap-4 items-center justify-between">
                   <div className="flex gap-6 max-w-sm">
                      <span className="text-neutral-500 w-16 shrink-0">Ship to</span>
                      <span className="text-neutral-900 truncate">123 Liquidation Ave, Austin, CA 90210</span>
                   </div>
                   <button onClick={() => setActiveStep(1)} className="text-primary hover:underline font-medium text-xs">Change</button>
                </div>
             </div>

             <section>
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Shipping Method</h2>
                <div className="border border-neutral-200 rounded-2xl overflow-hidden cursor-pointer bg-neutral-50/50">
                   <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                         <input type="radio" checked readOnly className="w-4 h-4 text-primary focus:ring-primary border-neutral-300" />
                         <span className="text-sm font-semibold text-neutral-900 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                           LTL Freight Shipping 
                           <span className="hidden sm:inline text-neutral-300">•</span>
                           <span className="text-xs text-neutral-500 font-normal mt-0.5 sm:mt-0">7-10 business days</span>
                         </span>
                      </div>
                      <span className="font-bold text-neutral-900">${shipping.toFixed(2)}</span>
                   </label>
                </div>
             </section>
             
             <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-2 gap-4">
              <button onClick={() => setActiveStep(1)} className="text-sm font-semibold text-primary hover:underline">
                Return to information
              </button>
              <button onClick={() => setActiveStep(3)} className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors">
                Continue to payment
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             
             <section>
               <h2 className="text-xl font-bold text-neutral-900 mb-1">Payment</h2>
               <p className="text-sm text-neutral-500 mb-4">All transactions are secure and encrypted via Stripe.</p>
               
               <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
                     <span className="font-semibold text-neutral-900">Credit Card</span>
                     <div className="flex gap-1">
                        <div className="w-8 h-5 bg-white border border-neutral-200 rounded flex items-center justify-center font-bold text-[8px] text-blue-800">VISA</div>
                        <div className="w-8 h-5 bg-white border border-neutral-200 rounded flex items-center justify-center font-bold text-[8px] text-orange-500">MC</div>
                     </div>
                  </div>
                  <div className="p-4 space-y-3 bg-neutral-50">
                     {/* Mock Stripe Elements wrapper */}
                     <div className="relative">
                       <CreditCard className="w-5 h-5 absolute left-3 top-3.5 text-neutral-400" />
                       <input type="text" placeholder="Card number" className="w-full pl-10 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Expiration date (MM / YY)" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                        <input type="text" placeholder="Security code" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                     </div>
                     <input type="text" placeholder="Name on card" className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
               </div>
             </section>
             
             <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-6 border-t border-neutral-200 gap-4">
              <button onClick={() => setActiveStep(2)} className="text-sm font-semibold text-primary hover:underline">
                Return to shipping
              </button>
              <button 
                onClick={handleCompleteOrder} 
                disabled={isProcessing}
                className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-black text-lg rounded-xl shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Pay ${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Right Column: Order Summary ── */}
      <div className="w-full lg:w-2/5 bg-neutral-50 px-4 sm:px-6 lg:px-12 py-10 border-l border-neutral-200 lg:min-h-full">
        
        <div className="sticky top-10 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 lg:hidden">Order Summary</h2>

          {/* Cart Items List */}
          <div className="space-y-4">
            {MOCK_CART.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-16 h-16 bg-white border border-neutral-200 rounded-xl overflow-visible shrink-0 group">
                   <Image src={item.img} alt={item.title} fill className="object-cover rounded-xl" />
                   <span className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-500/90 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10">{item.qty}</span>
                </div>
                <div className="flex-1 my-auto">
                   <h4 className="text-sm font-semibold text-neutral-900 leading-tight">{item.title}</h4>
                   <p className="text-[10px] text-neutral-500 uppercase font-bold mt-1 tracking-wider">Lot #{item.id}</p>
                </div>
                <div className="my-auto text-sm font-bold text-neutral-900">
                   ${(item.price * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-neutral-200"></div>

          {/* Discount Field */}
          <div className="flex gap-2">
             <input type="text" placeholder="Discount code or gift card" className="flex-1 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
             <button className="px-5 py-3.5 bg-neutral-200 text-neutral-500 font-bold rounded-xl transition-colors select-none">Apply</button>
          </div>

          <div className="h-px w-full bg-neutral-200"></div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
             <div className="flex justify-between items-center text-neutral-600">
               <span>Subtotal</span>
               <span className="font-semibold text-neutral-900">${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between items-center text-neutral-600">
               <span className="flex items-center gap-1">Shipping <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 rounded">{activeStep >= 2 ? 'LTL Freight' : '?'}</span></span>
               <span className="font-semibold text-neutral-900">{activeStep >= 2 ? `$${shipping.toFixed(2)}` : 'Calculated at next step'}</span>
             </div>
             <div className="flex justify-between items-center text-neutral-600 mb-4 pb-4">
               <span>Estimated taxes</span>
               <span className="font-semibold text-neutral-900">${taxes.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between items-center pt-2">
               <span className="text-base text-neutral-900">Total</span>
               <span className="text-3xl font-black text-neutral-900"><span className="text-sm font-normal text-neutral-500 mr-2">USD</span>${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
             </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
