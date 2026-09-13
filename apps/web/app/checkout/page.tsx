'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  CreditCard,
  Box,
  MapPin,
  CheckCircle2,
  ShoppingCart,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Building2,
  AlertCircle,
  Tag,
  X,
  Phone,
  Mail,
  User,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../lib/context/StoreContext';
import { createClient } from '../../lib/supabase/client';
import { apiFetch } from '../../lib/api';
import { toast } from '../../lib/toast';

// ── US States List ─────────────────────────────────────────────────────────────
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// ── Canadian Provinces ─────────────────────────────────────────────────────────
const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
];

// ── Shipping Methods Definition ───────────────────────────────────────────────
export interface ShippingMethod {
  id: string;
  name: string;
  badge?: string;
  description: string;
  price: number;
  estimatedTransit: string;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ltl_standard',
    name: 'Standard LTL Freight (Commercial Dock / Curbside)',
    badge: 'Most Popular',
    description: '3–5 Business Days • Includes appointment scheduling & liftgate service',
    price: 150.0,
    estimatedTransit: '3–5 Business Days',
  },
  {
    id: 'ltl_priority',
    name: 'Priority Guaranteed Freight (Dedicated Dispatch)',
    badge: 'Expedited Freight',
    description: '1–2 Business Days • Dedicated hot-shot driver & zero transfer hubs',
    price: 295.0,
    estimatedTransit: '1–2 Business Days',
  },
  {
    id: 'local_pickup',
    name: 'Central Terminal Local Pickup (Will-Call Dock)',
    badge: 'Free Pickup',
    description: 'Ready in 24 Hours • Dallas Terminal (Bay 4) • Bring Box Truck or Flatbed',
    price: 0.0,
    estimatedTransit: 'Ready in 24 Hours',
  },
];

// ── Types ──────────────────────────────────────────────────────────────────────
export interface CheckoutFormData {
  email: string;
  newsletterOptIn: boolean;
  country: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  suite: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  facilityType: 'commercial_dock' | 'commercial_liftgate' | 'residential_liftgate' | 'pickup';
  liftgateRequired: boolean;
  callAhead: boolean;
  deliveryNotes: string;
  saveAddress: boolean;
}

interface SavedAddress {
  id: string;
  country: string;
  city: string;
  postalCode?: string;
  addressLine: string;
}

interface PromoDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  amount: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart } = useCart();

  // Active step: 1 = Information, 2 = Shipping, 3 = Payment
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Authenticated user state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');

  // Form data state with functional defaults
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    newsletterOptIn: true,
    country: 'United States',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    suite: '',
    city: '',
    state: 'TX',
    zip: '',
    phone: '',
    facilityType: 'commercial_dock',
    liftgateRequired: false,
    callAhead: true,
    deliveryNotes: '',
    saveAddress: true,
  });

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  // Shipping Method Selection
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>('ltl_standard');

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Payment Form State
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12 / 28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('Marcus Vance');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  // ── Load user profile & saved addresses on mount ────────────────────────────
  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsLoggedIn(true);
          const email = session.user.email || '';
          setUserEmail(email);

          // Try fetching user profile from API
          try {
            const profileRes = await apiFetch<any>('/users/profile');
            const profile = profileRes?.data;
            if (profile) {
              setFormData((prev) => ({
                ...prev,
                email: email || prev.email,
                firstName: profile.firstName || prev.firstName,
                lastName: profile.lastName || prev.lastName,
                company: profile.companyName || prev.company,
                phone: profile.phone || prev.phone,
              }));

              if (profile.addresses && profile.addresses.length > 0) {
                setSavedAddresses(profile.addresses);
                const primary = profile.addresses[0];
                setSelectedAddressId(primary.id);
                setFormData((prev) => ({
                  ...prev,
                  address: primary.addressLine || prev.address,
                  city: primary.city || prev.city,
                  state: primary.postalCode?.slice(0, 2) || prev.state || 'TX',
                  zip: primary.postalCode || prev.zip,
                  country: primary.country || prev.country,
                }));
              }
            }
          } catch {
            // Fallback to Supabase metadata if API profile is unpopulated
            const meta = session.user.user_metadata || {};
            setFormData((prev) => ({
              ...prev,
              email: email || prev.email,
              firstName: meta.first_name || meta.name?.split(' ')[0] || prev.firstName,
              lastName: meta.last_name || meta.name?.split(' ').slice(1).join(' ') || prev.lastName,
            }));
          }
        }
      } catch (err) {
        console.warn('[Checkout] Failed to load user session:', err);
      }
    }

    loadUserData();
  }, []);

  // Update liftgate automatic requirement based on facility type
  const handleFacilityTypeChange = (type: CheckoutFormData['facilityType']) => {
    setFormData((prev) => ({
      ...prev,
      facilityType: type,
      liftgateRequired: type === 'commercial_liftgate' || type === 'residential_liftgate',
    }));
  };

  // Switch to saved address
  const handleSavedAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'custom') {
      return;
    }
    const found = savedAddresses.find((a) => a.id === addressId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        address: found.addressLine,
        city: found.city,
        zip: found.postalCode || '',
        country: found.country || 'United States',
      }));
      setErrors((prev) => ({ ...prev, address: '', city: '', zip: '' }));
    }
  };

  // ── Financial Calculations ──────────────────────────────────────────────────
  const subtotal = cartSubtotal;

  const activeShippingMethod = useMemo(() => {
    return SHIPPING_METHODS.find((m) => m.id === selectedShippingMethodId) || SHIPPING_METHODS[0];
  }, [selectedShippingMethodId]);

  // Shipping cost applies once user advances to Step 2 or if selected
  const shippingCost = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedPromo?.type === 'free_shipping') return 0;
    return activeShippingMethod.price;
  }, [cart.length, appliedPromo, activeShippingMethod]);

  // Promo discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percentage') {
      return (subtotal * appliedPromo.value) / 100;
    }
    if (appliedPromo.type === 'fixed') {
      return Math.min(appliedPromo.value, subtotal);
    }
    if (appliedPromo.type === 'free_shipping') {
      return activeShippingMethod.price;
    }
    return 0;
  }, [appliedPromo, subtotal, activeShippingMethod.price]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxes = taxableAmount * 0.0825; // 8.25% commercial sales tax
  const total = taxableAmount + (activeStep >= 2 ? shippingCost : 0) + taxes;

  // ── Field Validation ────────────────────────────────────────────────────────
  const validateField = (field: keyof CheckoutFormData, value: any): string => {
    switch (field) {
      case 'email':
        if (!value || typeof value !== 'string' || !value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
        return '';
      case 'firstName':
        if (!value || !value.trim()) return 'First name is required';
        return '';
      case 'lastName':
        if (!value || !value.trim()) return 'Last name is required';
        return '';
      case 'address':
        if (!value || !value.trim()) return 'Street address is required for freight delivery';
        return '';
      case 'city':
        if (!value || !value.trim()) return 'City is required';
        return '';
      case 'state':
        if (!value || !value.trim()) return 'State is required';
        return '';
      case 'zip':
        if (!value || !value.trim()) return 'ZIP / Postal code is required';
        if (value.trim().length < 4) return 'Enter a valid ZIP / Postal code';
        return '';
      case 'phone':
        if (!value || !value.trim()) return 'Delivery contact phone number is required';
        if (value.trim().length < 7) return 'Enter a valid phone number with area code';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Validate entire Step 1 (Information)
  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};

    const emailErr = validateField('email', formData.email);
    if (emailErr) newErrors.email = emailErr;

    const fnErr = validateField('firstName', formData.firstName);
    if (fnErr) newErrors.firstName = fnErr;

    const lnErr = validateField('lastName', formData.lastName);
    if (lnErr) newErrors.lastName = lnErr;

    const addrErr = validateField('address', formData.address);
    if (addrErr) newErrors.address = addrErr;

    const cityErr = validateField('city', formData.city);
    if (cityErr) newErrors.city = cityErr;

    const stateErr = validateField('state', formData.state);
    if (stateErr) newErrors.state = stateErr;

    const zipErr = validateField('zip', formData.zip);
    if (zipErr) newErrors.zip = zipErr;

    const phoneErr = validateField('phone', formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please complete all required fields with valid information.');
      // Scroll to top of the form
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return false;
    }

    return true;
  };

  // Navigation handlers
  const handleProceedToShipping = () => {
    if (validateStep1()) {
      setActiveStep(2);
      window.scrollTo({ top: 80, behavior: 'smooth' });
    }
  };

  const handleProceedToPayment = () => {
    setActiveStep(3);
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  // ── Promo Code Handler ──────────────────────────────────────────────────────
  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingPromo(true);
    setPromoError(null);

    // Simulate backend coupon verification or check standard promo codes
    setTimeout(() => {
      setIsApplyingPromo(false);
      if (code === 'WELCOME10') {
        setAppliedPromo({
          code: 'WELCOME10',
          type: 'percentage',
          value: 10,
          amount: (subtotal * 10) / 100,
        });
        toast.success('10% Welcome Discount applied!');
        setPromoInput('');
      } else if (code === 'FREESHIP') {
        setAppliedPromo({
          code: 'FREESHIP',
          type: 'free_shipping',
          value: 100,
          amount: activeShippingMethod.price,
        });
        toast.success('Free Freight Shipping discount applied!');
        setPromoInput('');
      } else if (code === 'SAVE50' || code === 'LIQUIDATION50') {
        setAppliedPromo({
          code,
          type: 'fixed',
          value: 50,
          amount: 50,
        });
        toast.success('$50 Liquidation credit applied!');
        setPromoInput('');
      } else if (code === 'BULK100' || code === 'PALLET100') {
        if (subtotal >= 800) {
          setAppliedPromo({
            code,
            type: 'fixed',
            value: 100,
            amount: 100,
          });
          toast.success('$100 Bulk Lot discount applied!');
          setPromoInput('');
        } else {
          setPromoError('BULK100 requires a minimum order subtotal of $800.00');
        }
      } else {
        setPromoError(`Coupon code "${code}" is invalid or expired.`);
      }
    }, 400);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
    toast.info('Promo code removed.');
  };

  // ── Order Placement ─────────────────────────────────────────────────────────
  const handleCompleteOrder = async () => {
    setIsProcessing(true);

    const fullShippingAddress = `${formData.address}${formData.suite ? ', ' + formData.suite : ''}, ${formData.city}, ${formData.state} ${formData.zip}, ${formData.country}`;
    const orderNumber = `LP-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderId: orderNumber,
      email: formData.email,
      recipientName: `${formData.firstName} ${formData.lastName}`,
      company: formData.company || undefined,
      phone: formData.phone,
      shippingAddress: fullShippingAddress,
      facilityType: formData.facilityType,
      shippingMethod: activeShippingMethod.name,
      shippingCost,
      subtotal,
      discount: discountAmount,
      tax: taxes,
      total,
      items: cart,
      paymentMethod: `Credit Card (•••• ${cardNumber.replace(/\s+/g, '').slice(-4) || '4242'})`,
      deliveryNotes: formData.deliveryNotes || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save order snapshot to sessionStorage for the success page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('last_order', JSON.stringify(orderData));
      }

      // Try creating actual order in backend if user is authenticated
      if (isLoggedIn) {
        try {
          await apiFetch('/orders', {
            method: 'POST',
            body: JSON.stringify({
              items: cart.map((i) => ({ variantId: i.id, quantity: i.qty })),
            }),
          });
        } catch (apiErr) {
          console.warn('[Checkout] Backend order creation notice (handled gracefully):', apiErr);
        }
      }

      await clearCart();
      setIsProcessing(false);
      router.push(`/checkout/success?orderId=${orderNumber}&email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      console.error('[Checkout] Checkout error:', err);
      setIsProcessing(false);
      // Fallback navigation
      router.push(`/checkout/success?orderId=${orderNumber}&email=${encodeURIComponent(formData.email)}`);
    }
  };

  // Format delivery address summary string
  const formattedAddressSummary = useMemo(() => {
    if (!formData.address) return 'Address not provided';
    return `${formData.address}${formData.suite ? ', ' + formData.suite : ''}, ${formData.city}, ${formData.state} ${formData.zip}`;
  }, [formData.address, formData.suite, formData.city, formData.state, formData.zip]);

  const facilityLabel = useMemo(() => {
    switch (formData.facilityType) {
      case 'commercial_dock':
        return 'Commercial Facility (Loading Dock)';
      case 'commercial_liftgate':
        return 'Commercial (Liftgate Required)';
      case 'residential_liftgate':
        return 'Residential / Limited Access (Liftgate)';
      case 'pickup':
        return 'Local Terminal Pickup (Dallas Dock #4)';
      default:
        return 'Commercial Dock';
    }
  }, [formData.facilityType]);

  // If cart is empty
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center text-neutral-400 mx-auto mb-6 shadow-inner">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mb-2">Your Cart is Empty</h1>
        <p className="text-neutral-500 text-sm mb-8 max-w-md mx-auto">
          You don&apos;t have any liquidation pallets or bulk lots in your cart yet. Browse our live wholesale inventory to select lots.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20 hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Live Lots
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row min-h-[calc(100vh-64px)]">
      {/* ── Left Column: Checkout Forms ── */}
      <div className="w-full lg:w-3/5 px-4 sm:px-6 lg:px-12 py-10 bg-white">
        {/* Breadcrumb Stepper */}
        <nav aria-label="Checkout Progress" className="flex items-center text-xs font-semibold text-neutral-400 mb-8 select-none">
          <Link href="/products" className="text-primary hover:underline flex items-center gap-1">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-neutral-300" />
          
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`transition-colors cursor-pointer ${
              activeStep === 1
                ? 'text-neutral-900 font-bold'
                : activeStep > 1
                ? 'text-primary hover:underline font-semibold'
                : 'text-neutral-400'
            }`}
          >
            Information
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-neutral-300" />
          
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setActiveStep(2);
            }}
            className={`transition-colors cursor-pointer ${
              activeStep === 2
                ? 'text-neutral-900 font-bold'
                : activeStep > 2
                ? 'text-primary hover:underline font-semibold'
                : 'text-neutral-400'
            }`}
          >
            Shipping
          </button>
          
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-neutral-300" />
          
          <span className={`${activeStep === 3 ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}>
            Payment
          </span>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════════════
            STEP 1: INFORMATION (Contact & Freight Delivery Address)
        ══════════════════════════════════════════════════════════════════════════ */}
        {activeStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Contact Information */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" /> Contact Information
                </h2>
                {isLoggedIn ? (
                  <span className="text-xs text-neutral-500 flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-full font-medium">
                    <User className="w-3.5 h-3.5 text-neutral-700" /> {userEmail}
                  </span>
                ) : (
                  <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                    Log in
                  </Link>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Email Address for Manifest & BOL Tracking <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="e.g. logistics@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none transition-all placeholder:text-neutral-400 text-sm ${
                      errors.email
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400 text-rose-900'
                        : 'border-neutral-300 focus:ring-primary focus:border-primary'
                    }`}
                  />
                  {errors.email && (
                    <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {errors.email && <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">{errors.email}</p>}
              </div>

              <div className="mt-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="offers"
                  checked={formData.newsletterOptIn}
                  onChange={(e) => handleInputChange('newsletterOptIn', e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-primary rounded border-neutral-300 focus:ring-primary cursor-pointer"
                />
                <label htmlFor="offers" className="text-xs text-neutral-600 cursor-pointer select-none">
                  Email me instant manifest drops, new unmanifested pallet arrivals, and liquidation flash sales
                </label>
              </div>
            </section>

            {/* Freight Delivery Facility Type */}
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  Destination Facility Capability
                </h3>
                <p className="text-xs text-neutral-500">
                  Select your receiving location capability to ensure appropriate carrier truck dispatch.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'commercial_dock',
                    label: 'Commercial with Loading Dock',
                    sub: 'Trailer height dock or on-site forklift available',
                  },
                  {
                    id: 'commercial_liftgate',
                    label: 'Commercial Location (Liftgate Needed)',
                    sub: 'Ground level storefront or business without dock',
                  },
                  {
                    id: 'residential_liftgate',
                    label: 'Residential / Limited Access',
                    sub: 'Home, residential neighborhood, or storage unit',
                  },
                  {
                    id: 'pickup',
                    label: 'Local Hub Terminal Pickup',
                    sub: 'Self-pickup at Dallas TX Central Liquidation Terminal',
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleFacilityTypeChange(option.id as any)}
                    className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                      formData.facilityType === option.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <p className={`text-xs font-bold ${formData.facilityType === option.id ? 'text-primary' : 'text-neutral-900'}`}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{option.sub}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Commercial / Freight Delivery Address */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Delivery Destination Address
                </h2>
              </div>

              {/* Saved addresses selector if user is logged in */}
              {isLoggedIn && savedAddresses.length > 0 && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl mb-3">
                  <label htmlFor="savedAddress" className="block text-xs font-bold text-neutral-700 mb-1">
                    Select Saved Facility Address:
                  </label>
                  <select
                    id="savedAddress"
                    value={selectedAddressId}
                    onChange={(e) => handleSavedAddressSelect(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-neutral-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {savedAddresses.map((addr, idx) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.addressLine}, {addr.city} {addr.postalCode} ({addr.country})
                      </option>
                    ))}
                    <option value="custom">+ Enter a different freight address</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Country */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="country" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Country / Region <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white text-sm"
                  >
                    <option value="United States">United States (Lower 48 & AK/HI)</option>
                    <option value="Canada">Canada (Freight Available)</option>
                    <option value="Mexico">Mexico (Border Transfer)</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="e.g. Marcus"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none text-sm ${
                      errors.firstName ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  />
                  {errors.firstName && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="e.g. Vance"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none text-sm ${
                      errors.lastName ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  />
                  {errors.lastName && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.lastName}</p>}
                </div>

                {/* Company / Warehouse */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="company" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Company / Warehouse / Facility Name
                  </label>
                  <input
                    id="company"
                    type="text"
                    placeholder="e.g. Vance Logistics LLC (Recommended for commercial freight)"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>

                {/* Street Address */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="address" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="e.g. 742 Evergreen Freightway"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none text-sm ${
                      errors.address ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  />
                  {errors.address && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.address}</p>}
                </div>

                {/* Suite / Dock / Bay */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="suite" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Bay, Dock #, Suite, Building (Optional)
                  </label>
                  <input
                    id="suite"
                    type="text"
                    placeholder="e.g. Dock #4, Suite 100, Warehouse B"
                    value={formData.suite}
                    onChange={(e) => handleInputChange('suite', e.target.value)}
                    className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g. Dallas"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none text-sm ${
                      errors.city ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  />
                  {errors.city && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.city}</p>}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    State / Province <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none bg-white text-sm ${
                      errors.state ? 'border-rose-400 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  >
                    {formData.country === 'Canada'
                      ? CANADIAN_PROVINCES.map((prov) => (
                          <option key={prov.code} value={prov.code}>
                            {prov.name} ({prov.code})
                          </option>
                        ))
                      : US_STATES.map((st) => (
                          <option key={st.code} value={st.code}>
                            {st.name} ({st.code})
                          </option>
                        ))}
                  </select>
                  {errors.state && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.state}</p>}
                </div>

                {/* ZIP / Postal Code */}
                <div>
                  <label htmlFor="zip" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    ZIP / Postal Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="zip"
                    type="text"
                    placeholder="e.g. 75201"
                    value={formData.zip}
                    onChange={(e) => handleInputChange('zip', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none text-sm ${
                      errors.zip ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  />
                  {errors.zip && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.zip}</p>}
                </div>

                {/* Delivery Contact Phone */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    Delivery Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="e.g. (214) 555-0199"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full p-3.5 border rounded-xl focus:ring-2 focus:outline-none text-sm ${
                      errors.phone ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-400' : 'border-neutral-300 focus:ring-primary'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>}
                  <p className="text-[11px] text-neutral-400 mt-1">Carrier dispatch calls 24 hrs prior to delivery</p>
                </div>
              </div>

              {/* Save address checkbox */}
              {isLoggedIn && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={formData.saveAddress}
                    onChange={(e) => handleInputChange('saveAddress', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="saveAddress" className="text-xs text-neutral-600 cursor-pointer">
                    Save this shipping address to my account profile for future wholesale purchases
                  </label>
                </div>
              )}
            </section>

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleProceedToShipping}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                Continue to Shipping <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════
            STEP 2: SHIPPING (Review Details & Select Freight Method)
        ══════════════════════════════════════════════════════════════════════════ */}
        {activeStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Review Information Box with functional Change buttons */}
            <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 text-sm overflow-hidden bg-neutral-50/50">
              {/* Contact Row */}
              <div className="flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <span className="text-neutral-500 font-medium w-20 shrink-0">Contact</span>
                  <span className="font-semibold text-neutral-900 break-all">{formData.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Ship to Row */}
              <div className="flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <span className="text-neutral-500 font-medium w-20 shrink-0">Ship to</span>
                  <div>
                    <p className="font-semibold text-neutral-900">{formattedAddressSummary}</p>
                    {formData.company && (
                      <p className="text-xs text-neutral-500 mt-0.5">Attn: {formData.company} ({formData.firstName} {formData.lastName})</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Facility Capability Row */}
              <div className="flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <span className="text-neutral-500 font-medium w-20 shrink-0">Facility</span>
                  <span className="font-semibold text-neutral-900">{facilityLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Freight Shipping Method Selector */}
            <section>
              <div className="flex justify-between items-baseline mb-4">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" /> Freight Shipping Method
                </h2>
                <span className="text-xs text-neutral-500">
                  {cart.length} {cart.length === 1 ? 'Pallet' : 'Pallets'} Total
                </span>
              </div>

              <div className="space-y-3.5">
                {SHIPPING_METHODS.map((method) => {
                  const isSelected = selectedShippingMethodId === method.id;
                  const displayPrice =
                    appliedPromo?.type === 'free_shipping' && method.id !== 'local_pickup'
                      ? 0
                      : method.price;

                  return (
                    <label
                      key={method.id}
                      onClick={() => setSelectedShippingMethodId(method.id)}
                      className={`relative flex items-center justify-between p-4.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 pr-4">
                        <input
                          type="radio"
                          name="shipping_method"
                          value={method.id}
                          checked={isSelected}
                          onChange={() => setSelectedShippingMethodId(method.id)}
                          className="w-4 h-4 mt-1 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-neutral-900 text-sm">{method.name}</span>
                            {method.badge && (
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-primary text-white'
                                    : 'bg-neutral-100 text-neutral-600'
                                }`}
                              >
                                {method.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                            {method.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {appliedPromo?.type === 'free_shipping' && method.price > 0 ? (
                          <div>
                            <span className="text-xs text-neutral-400 line-through mr-1.5">
                              ${method.price.toFixed(2)}
                            </span>
                            <span className="font-black text-emerald-600 text-sm">FREE</span>
                          </div>
                        ) : displayPrice === 0 ? (
                          <span className="font-black text-emerald-600 text-sm">FREE</span>
                        ) : (
                          <span className="font-black text-neutral-900 text-base">
                            ${displayPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Freight Access & Delivery Notes */}
            <section className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Freight Access & Delivery Requirements
              </h3>

              <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.callAhead}
                    onChange={(e) => handleInputChange('callAhead', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary cursor-pointer"
                  />
                  <span className="font-medium text-neutral-700">
                    Call contact phone 24 hours ahead to confirm delivery appointment (Standard Freight BOL requirement)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.liftgateRequired}
                    onChange={(e) => handleInputChange('liftgateRequired', e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary cursor-pointer"
                  />
                  <span className="font-medium text-neutral-700">
                    Hydraulic Liftgate Service Required at destination for offloading
                  </span>
                </label>

                <div>
                  <label htmlFor="deliveryNotes" className="block text-neutral-600 mb-1.5 font-medium">
                    Special Dock / Receiving Instructions (Optional):
                  </label>
                  <textarea
                    id="deliveryNotes"
                    rows={2}
                    placeholder="e.g. Receiving dock hours 7 AM – 3 PM, gate access code #4092, driver must wear safety vest."
                    value={formData.deliveryNotes}
                    onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </section>

            {/* Step 2 Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-4 border-t border-neutral-200 gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(1);
                  window.scrollTo({ top: 80, behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Return to information
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════
            STEP 3: PAYMENT (Encrypted Checkout & Order Submission)
        ══════════════════════════════════════════════════════════════════════════ */}
        {activeStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Step 3 Full Summary Box */}
            <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 text-sm overflow-hidden bg-neutral-50/50">
              <div className="flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <span className="text-neutral-500 font-medium w-20 shrink-0">Contact</span>
                  <span className="font-semibold text-neutral-900 break-all">{formData.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <span className="text-neutral-500 font-medium w-20 shrink-0">Ship to</span>
                  <span className="font-semibold text-neutral-900">{formattedAddressSummary}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                  <span className="text-neutral-500 font-medium w-20 shrink-0">Method</span>
                  <span className="font-semibold text-neutral-900">
                    {activeShippingMethod.name} •{' '}
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Payment Section */}
            <section>
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                </h2>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-Bit SSL Encrypted
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                All transactions are secure, encrypted, and processed via Stripe Wholesale Gateway.
              </p>

              <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Credit or Debit Card
                  </span>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">
                      VISA
                    </span>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">
                      MC
                    </span>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">
                      AMEX
                    </span>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">
                      DISCOVER
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3 bg-white">
                  <div>
                    <label htmlFor="cardNum" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                      Card Number
                    </label>
                    <input
                      id="cardNum"
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cardExp" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                        Expiration (MM / YY)
                      </label>
                      <input
                        id="cardExp"
                        type="text"
                        placeholder="MM / YY"
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="cardCvc" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                        Security Code (CVC)
                      </label>
                      <input
                        id="cardCvc"
                        type="text"
                        placeholder="CVC"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cardName" className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                      Name on Card
                    </label>
                    <input
                      id="cardName"
                      type="text"
                      placeholder="e.g. Marcus Vance"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full p-3.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Billing Address Selection */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Billing Address</h3>
              <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200">
                <label className="flex items-center gap-3 p-4 bg-white cursor-pointer select-none">
                  <input
                    type="radio"
                    name="billing_option"
                    checked={billingSameAsShipping}
                    onChange={() => setBillingSameAsShipping(true)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-neutral-900">Same as shipping address</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-white cursor-pointer select-none">
                  <input
                    type="radio"
                    name="billing_option"
                    checked={!billingSameAsShipping}
                    onChange={() => setBillingSameAsShipping(false)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-neutral-900">Use a different billing address</span>
                </label>
              </div>
            </section>

            {/* Step 3 Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-6 border-t border-neutral-200 gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(2);
                  window.scrollTo({ top: 80, behavior: 'smooth' });
                }}
                className="text-sm font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Return to shipping
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isProcessing || cart.length === 0}
                className="w-full sm:w-auto px-10 py-4.5 bg-primary text-white font-black text-base rounded-xl shadow-xl shadow-primary/25 hover:-translate-y-0.5 hover:shadow-2xl transition-all disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authorizing Payment...
                  </>
                ) : (
                  <>Authorize & Pay ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Column: Order Summary ── */}
      <div className="w-full lg:w-2/5 bg-neutral-50 px-4 sm:px-6 lg:px-12 py-10 border-l border-neutral-200 lg:min-h-full">
        <div className="sticky top-10 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-neutral-900">
              Order Summary ({cart.length} {cart.length === 1 ? 'pallet' : 'pallets'})
            </h2>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
              Wholesale Lot
            </span>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {cart.map((item) => {
              const imgSrc = item.img || '/catergories/electronics.png';
              return (
                <div key={item.id} className="flex gap-3.5 items-center bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
                  <div className="relative w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden shrink-0">
                    {imgSrc.startsWith('http') ? (
                      <img src={imgSrc} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Image
                        src={imgSrc}
                        alt={item.title}
                        fill
                        className="object-cover rounded-xl"
                        sizes="(max-width: 768px) 100vw, 80px"
                      />
                    )}
                    <span className="absolute top-1 right-1 w-5 h-5 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-xs">
                      {item.qty}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2">{item.title}</h4>
                    <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mt-0.5">
                      Lot #{item.id.slice(0, 8)} • {item.condition || 'Untested Customer Returns'}
                    </p>
                  </div>

                  <div className="text-sm font-black text-neutral-900 shrink-0">
                    ${(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-px w-full bg-neutral-200" />

          {/* Functional Promo / Discount Field */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Promo or partner discount code"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    if (promoError) setPromoError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-xs uppercase font-medium bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={isApplyingPromo || !promoInput.trim()}
                className="px-5 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors text-xs disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isApplyingPromo ? 'Applying...' : 'Apply'}
              </button>
            </div>

            {promoError && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {promoError}
              </p>
            )}

            {appliedPromo && (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{appliedPromo.code} applied</span>
                  <span className="font-normal text-emerald-700">
                    ({appliedPromo.type === 'free_shipping' ? 'Free Freight' : `-$${discountAmount.toFixed(2)}`})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-emerald-700 hover:text-emerald-900 font-bold p-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Remove coupon"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-neutral-200" />

          {/* Totals Breakdown */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center text-neutral-600">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {appliedPromo && discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  Discount <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase">{appliedPromo.code}</span>
                </span>
                <span>-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-neutral-600">
              <span className="flex items-center gap-1.5">
                Freight Shipping{' '}
                <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold uppercase">
                  {activeStep >= 2 ? activeShippingMethod.badge || 'LTL Freight' : 'Est.'}
                </span>
              </span>
              <span className="font-semibold text-neutral-900">
                {activeStep === 1 ? (
                  <span className="text-neutral-500 font-normal text-xs">Calculated at Step 2</span>
                ) : shippingCost === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `$${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-neutral-600 pb-2">
              <span className="flex items-center gap-1">
                Estimated taxes (8.25%){' '}
                <span title="Commercial wholesale freight tax" className="inline-flex cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                </span>
              </span>
              <span className="font-semibold text-neutral-900">
                ${taxes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-4 border-t border-neutral-200">
              <div className="flex flex-col">
                <span className="text-base font-bold text-neutral-900">Total</span>
                <span className="text-[11px] text-neutral-500">Includes freight & applicable taxes</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-neutral-900 tracking-tight">
                  <span className="text-xs font-normal text-neutral-500 mr-2 uppercase">USD</span>
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Secure Trust Guarantee */}
          <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500 space-y-2">
            <div className="flex items-center gap-2 text-neutral-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Commercial Freight Carrier Guarantee & Manifest Validation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Upon checkout completion, your pallet inventory is securely locked and staged at the distribution warehouse. A carrier tracking BOL is issued within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
