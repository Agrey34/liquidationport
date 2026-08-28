'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, CreditCard, Box, MapPin, CheckCircle2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '../../lib/context/StoreContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart } = useCart();
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartSubtotal;
  const shipping = cart.length > 0 ? 150.00 : 0;
  const taxes = subtotal * 0.08;
  const total = subtotal + (activeStep >= 2 ? shipping : 0) + taxes;

  const handleCompleteOrder = () => {
    setIsProcessing(true);
    // Simulate real checkout API execution
    setTimeout(() => {
       clearCart();
       setIsProcessing(false);
       router.push('/checkout/success');
    }, 2000);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mx-auto mb-6">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">Your Cart is Empty</h1>
        <p className="text-neutral-500 text-sm mb-8">
          You don&apos;t have any liquidation pallets in your cart yet. Browse our live inventory to select lots.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row min-h-[calc(100vh-64px)]">
      
      {/* ── Left Column: Checkout Forms ── */}
      <div className="w-full lg:w-3/5 px-4 sm:px-6 lg:px-12 py-10 bg-white">
        
        {/* Breadcrumb Stepper */}
        <nav className="flex items-center text-xs font-semibold text-neutral-500 mb-8">
          <Link href="/products" className="text-primary pr-2 hover:underline">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <span className={`px-2 ${activeStep >= 1 ? 'text-primary font-bold' : ''}`}>Information</span>
          <ChevronRight className="w-3 h-3" />
          <span className={`px-2 ${activeStep >= 2 ? 'text-primary font-bold' : ''}`}>Shipping</span>
          <ChevronRight className="w-3 h-3" />
          <span className={`px-2 ${activeStep >= 3 ? 'text-primary font-bold' : ''}`}>Payment</span>
        </nav>

        {activeStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Contact Information */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Contact Information</h2>
                <Link href="/login" className="text-sm text-blue-600 hover:underline">Log in</Link>
              </div>
              <input 
                type="email" 
                placeholder="Email or mobile phone number" 
                defaultValue="buyer@liquidationport.com"
                className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-neutral-500" 
              />
              <div className="mt-2.5 flex items-center gap-2">
                 <input type="checkbox" id="offers" defaultChecked className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary" />
                 <label htmlFor="offers" className="text-sm text-neutral-600">Email me with new pallet arrivals and manifests</label>
              </div>
            </section>

            {/* Shipping Address */}
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Commercial / Freight Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <select className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white">
                  <option>United States</option>
                  <option>Canada</option>
                </select>
                <input type="text" placeholder="First name" defaultValue="Marcus" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Last name" defaultValue="Vance" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Company / Warehouse Name" defaultValue="Vance Logistics LLC" className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Street Address" defaultValue="742 Evergreen Freightway" className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Bay, Dock #, Suite (optional)" defaultValue="Dock #4" className="col-span-1 sm:col-span-2 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="City" defaultValue="Dallas" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <select className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white">
                  <option>Texas (TX)</option>
                  <option>California (CA)</option>
                  <option>New York (NY)</option>
                  <option>Florida (FL)</option>
                  <option>Illinois (IL)</option>
                </select>
                <input type="text" placeholder="ZIP code" defaultValue="75201" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                <input type="text" placeholder="Delivery Phone" defaultValue="(214) 555-0199" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setActiveStep(2)} 
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Shipping <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Review Address Box */}
            <div className="border border-neutral-200 rounded-2xl p-4 divide-y divide-neutral-100 text-sm">
               <div className="flex justify-between items-center pb-3">
                  <span className="text-neutral-500">Contact</span>
                  <span className="font-semibold text-neutral-900">buyer@liquidationport.com</span>
                  <button onClick={() => setActiveStep(1)} className="text-xs text-primary font-bold hover:underline cursor-pointer">Change</button>
               </div>
               <div className="flex justify-between items-center pt-3">
                  <span className="text-neutral-500">Ship to</span>
                  <span className="font-semibold text-neutral-900 truncate max-w-[200px] sm:max-w-none">742 Evergreen Freightway, Dallas TX</span>
                  <button onClick={() => setActiveStep(1)} className="text-xs text-primary font-bold hover:underline cursor-pointer">Change</button>
               </div>
            </div>

            {/* Shipping Method */}
            <section>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Freight Shipping Method</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border-2 border-primary bg-primary/5 rounded-2xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" defaultChecked className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">Standard LTL Freight (Commercial Dock)</p>
                      <p className="text-xs text-neutral-500">3-5 Business Days • Liftgate Included</p>
                    </div>
                  </div>
                  <span className="font-black text-neutral-900">${shipping.toFixed(2)}</span>
                </label>

                <label className="flex items-center justify-between p-4 border border-neutral-200 rounded-2xl cursor-pointer hover:bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">Priority Guaranteed Freight</p>
                      <p className="text-xs text-neutral-500">1-2 Business Days • Dedicated Truck Dispatch</p>
                    </div>
                  </div>
                  <span className="font-black text-neutral-900">$295.00</span>
                </label>
              </div>
            </section>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-4 gap-4">
              <button onClick={() => setActiveStep(1)} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                Return to information
              </button>
              <button 
                onClick={() => setActiveStep(3)} 
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Payment Options */}
             <section>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Payment</h2>
                <p className="text-sm text-neutral-500 mb-4">All transactions are secure and encrypted via Stripe.</p>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                   <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                         <CreditCard className="w-4 h-4" /> Credit or Debit Card
                      </span>
                      <div className="flex gap-1.5">
                         <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200">VISA</span>
                         <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200">MC</span>
                         <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200">AMEX</span>
                      </div>
                   </div>

                   <div className="p-4 space-y-3 bg-white">
                      <input type="text" placeholder="Card number" defaultValue="4242 •••• •••• 4242" className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                      <div className="grid grid-cols-2 gap-3">
                         <input type="text" placeholder="Expiration date (MM / YY)" defaultValue="12 / 28" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                         <input type="text" placeholder="Security code (CVC)" defaultValue="888" className="p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                      </div>
                      <input type="text" placeholder="Name on card" defaultValue="Marcus Vance" className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                   </div>
                </div>
             </section>
             
             <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-6 border-t border-neutral-200 gap-4">
              <button onClick={() => setActiveStep(2)} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                Return to shipping
              </button>
              <button 
                onClick={handleCompleteOrder} 
                disabled={isProcessing}
                className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-black text-lg rounded-xl shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Order...
                  </>
                ) : (
                  <>Pay ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Right Column: Order Summary ── */}
      <div className="w-full lg:w-2/5 bg-neutral-50 px-4 sm:px-6 lg:px-12 py-10 border-l border-neutral-200 lg:min-h-full">
        
        <div className="sticky top-10 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900">Order Summary ({cart.length} {cart.length === 1 ? 'pallet' : 'pallets'})</h2>

          {/* Cart Items List */}
          <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {cart.map((item) => {
              const imgSrc = item.img || '/catergories/electronics.png';
              return (
                <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
                  <div className="relative w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden shrink-0">
                     {imgSrc.startsWith('http') ? (
                       <img src={imgSrc} alt={item.title} className="w-full h-full object-cover" />
                     ) : (
                       <Image src={imgSrc} alt={item.title} fill className="object-cover rounded-xl" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                     )}
                     <span className="absolute top-1 right-1 w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10">
                       {item.qty}
                     </span>
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-sm font-semibold text-neutral-900 leading-tight line-clamp-2">{item.title}</h4>
                     <p className="text-[10px] text-neutral-500 uppercase font-bold mt-1 tracking-wider">Lot #{item.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-sm font-black text-neutral-900 shrink-0">
                     ${(item.price * item.qty).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-px w-full bg-neutral-200"></div>

          {/* Discount Field */}
          <div className="flex gap-2">
             <input type="text" placeholder="Promo or partner discount code" className="flex-1 p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white" />
             <button className="px-5 py-3.5 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors text-sm cursor-pointer">Apply</button>
          </div>

          <div className="h-px w-full bg-neutral-200"></div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
             <div className="flex justify-between items-center text-neutral-600">
               <span>Subtotal</span>
               <span className="font-semibold text-neutral-900">
                 ${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </span>
             </div>
             <div className="flex justify-between items-center text-neutral-600">
               <span className="flex items-center gap-1">Freight Shipping <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 rounded">{activeStep >= 2 ? 'LTL Freight' : 'Est.'}</span></span>
               <span className="font-semibold text-neutral-900">
                 {activeStep >= 2 ? `$${shipping.toFixed(2)}` : 'Calculated at step 2'}
               </span>
             </div>
             <div className="flex justify-between items-center text-neutral-600 mb-4 pb-4">
               <span>Estimated taxes (8%)</span>
               <span className="font-semibold text-neutral-900">
                 ${taxes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </span>
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
               <span className="text-base font-bold text-neutral-900">Total</span>
               <span className="text-3xl font-black text-neutral-900">
                 <span className="text-xs font-normal text-neutral-500 mr-2 uppercase">USD</span>
                 ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </span>
             </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
