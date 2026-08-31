'use client';

import React, { useState } from 'react';
import Image from './SafeImage';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { initiatePaymentAction, verifyPaymentAction } from '@/app/actions/order';
import { MapPin, User, Phone, Map, AlertCircle, ShoppingBag, Plus, Check } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CartSummaryItem {
  id: string;
  productName: string;
  productImage: string;
  sizeName: string;
  frameName: string;
  paperType: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface CheckoutPageClientProps {
  savedAddresses: SavedAddress[];
  calculations: {
    items: CartSummaryItem[];
    subtotal: number;
    discount?: number;
    shippingFee: number;
    tax: number;
    total: number;
  };
}

export default function CheckoutPageClient({
  savedAddresses,
  calculations,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { refreshCart, triggerOrderConfirmed } = useCart();
  const hasTriggeredRef = React.useRef(false);

  // Address selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses[0]?.id || ''
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(
    savedAddresses.length === 0
  );

  // New address form state
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [additionalNote, setAdditionalNote] = useState('');

  // Action/validation feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamically load Razorpay standard script from official CDN
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'Razorpay' in window) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Validate form inputs
  const validateAddress = () => {
    if (showNewAddressForm) {
      const { name, phone, street, city, state, postalCode } = newAddress;
      if (!name || name.trim().length < 2) return 'Please enter a valid full name.';
      if (!phone || phone.trim().length < 10) return 'Please enter a valid 10-digit phone number.';
      if (!street || street.trim().length < 5) return 'Please enter a valid street address.';
      if (!city || city.trim().length < 2) return 'Please enter a valid city.';
      if (!state || state.trim().length < 2) return 'Please enter a valid state.';
      if (!postalCode || postalCode.trim().length < 5) return 'Please enter a valid postal/PIN code.';
    } else if (!selectedAddressId) {
      return 'Please select a shipping address.';
    }
    return null;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isVerifying) return;

    const validationError = validateAddress();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = showNewAddressForm
        ? { newAddress, additionalNote }
        : { selectedAddressId, additionalNote };

      // 1. Create local order and call Razorpay orders API server-side
      const res = await initiatePaymentAction(payload);

      if (res && res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      if (!res || !res.razorpayOrderId) {
        setErrorMsg('Failed to initialize payment gateway.');
        setIsSubmitting(false);
        return;
      }

      // 2. Dynamically load script from Razorpay CDN
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setErrorMsg('Failed to load Razorpay checkout SDK. Check your internet connection.');
        setIsSubmitting(false);
        return;
      }

      // 3. Configure checkout modal parameters
      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: 'INR',
        name: 'Hellfire Prints',
        description: 'Premium Poster Configurator Purchase',
        order_id: res.razorpayOrderId,
        prefill: {
          name: res.userName,
          email: res.userEmail,
        },
        theme: {
          color: '#C1121F', // Crimson red theme
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setIsVerifying(true);
          setErrorMsg(null);
          try {
            // 4. Securely verify signatures server-side
            const verifyRes = await verifyPaymentAction({
              orderId: res.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes && verifyRes.success) {
              if (!hasTriggeredRef.current) {
                hasTriggeredRef.current = true;
                triggerOrderConfirmed(res.orderId);
              }
              await refreshCart();
              setTimeout(() => {
                router.push(`/account/orders/${res.orderId}`);
              }, 2200);
            } else {
              setErrorMsg(verifyRes?.error || 'Payment signature verification failed.');
              setIsVerifying(false);
              setIsSubmitting(false);
            }
          } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Signature verification request failed.';
            setErrorMsg(msg);
            setIsVerifying(false);
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setErrorMsg('Payment cancelled. You can retry placing the order.');
          },
        },
      };

      const windowWithRazorpay = window as unknown as {
        Razorpay: new (options: unknown) => { open: () => void };
      };
      const rzp = new windowWithRazorpay.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during checkout.';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-neutral-900 pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
          Secure <span className="text-[#C1121F] fiery-text-glow font-black">Checkout</span>
        </h1>
        <p className="text-neutral-455 text-xs font-semibold tracking-wide mt-2">
          Confirm your delivery address and customized poster specifications.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/20 border border-red-900 text-red-300 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#C1121F] flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Shipping Addresses */}
        <div className="lg:col-span-8 space-y-6">
          <ScrollReveal fiery={false}>
            <div className="bg-[#0F0F0F] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none"></div>
              <h3 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest border-b border-neutral-900 pb-3">
                Shipping Address
              </h3>

            {/* Saved Addresses List */}
            {savedAddresses.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setShowNewAddressForm(false);
                      }}
                      className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex flex-col justify-between h-40 shadow-sm active:scale-98 ${
                        selectedAddressId === addr.id && !showNewAddressForm
                          ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow-lg shadow-red-950/20'
                          : 'border-neutral-900 bg-neutral-950/45 text-neutral-400 hover:border-neutral-750'
                      }`}
                    >
                      <div className="space-y-2.5 w-full">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-extrabold text-xs uppercase text-white truncate max-w-[80%] tracking-wider">
                            {addr.name}
                          </span>
                          {selectedAddressId === addr.id && !showNewAddressForm && (
                            <span className="bg-[#C1121F] text-white p-0.5 rounded-full shadow">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold line-clamp-2 leading-relaxed text-neutral-400">{addr.street}</p>
                        <p className="text-[10px] font-semibold text-neutral-500">{addr.city}, {addr.state} - {addr.postalCode}</p>
                      </div>
                      <div className="text-[9.5px] font-mono tracking-wider font-bold flex items-center gap-1.5 border-t border-neutral-900 pt-2 w-full text-neutral-500">
                        <Phone className="w-3 h-3 text-[#C1121F]" />
                        {addr.phone}
                      </div>
                    </button>
                  ))}

                  {/* Add New Address Option Card */}
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className={`p-5 rounded-2xl border text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center h-40 gap-2.5 active:scale-98 shadow-sm ${
                      showNewAddressForm
                        ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow-lg shadow-red-950/20'
                        : 'border-dashed border-neutral-900 bg-transparent text-neutral-500 hover:border-neutral-750 hover:text-white'
                    }`}
                  >
                    <Plus className="w-6 h-6 text-[#C1121F] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Use a New Address
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* New Address Form Fields */}
            {showNewAddressForm && (
              <div className="space-y-4 pt-5 border-t border-neutral-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="name" className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                    Recipient Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      id="name"
                      placeholder="John Doe"
                      required
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="phone" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="tel"
                      id="phone"
                      placeholder="9876543210"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="street" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                    Street Address (Line 1 & 2)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-neutral-500" />
                    <textarea
                      id="street"
                      placeholder="Flat No, Apartment Name, Street Name, Area"
                      required
                      rows={2}
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                    City
                  </label>
                  <div className="relative">
                    <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      id="city"
                      placeholder="Bengaluru"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label htmlFor="state" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    placeholder="Karnataka"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 px-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                  />
                </div>

                {/* Postal Code */}
                <div className="space-y-1.5">
                  <label htmlFor="postalCode" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                    PIN / Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    placeholder="560001"
                    required
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 px-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label htmlFor="country" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    placeholder="India"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-3 px-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Additional Order Note (Optional) */}
            <div className="space-y-2.5 pt-6 border-t border-neutral-900 mt-6">
              <label htmlFor="additionalNote" className="text-[10px] text-neutral-455 font-black uppercase tracking-widest block">
                Additional Note (Optional)
              </label>
              <textarea
                id="additionalNote"
                rows={3}
                maxLength={500}
                placeholder="Add any special instructions (e.g. Please call before delivery, leave with security desk)..."
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                className="w-full bg-[#050505] border border-neutral-900 rounded-2xl py-3.5 px-4 text-xs font-semibold text-white placeholder-neutral-700 focus:outline-none focus:border-[#C1121F] transition-colors resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest">
                <span>Sanitized instruction for package delivery.</span>
                <span className="font-mono">{additionalNote.length}/500</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

        {/* Right Side: Order Summary Review */}
        <div className="lg:col-span-4 space-y-6">
          <ScrollReveal fiery={false}>
            <div className="bg-[#0F0F0F] border border-neutral-900 p-6 rounded-3xl space-y-6 shadow-md">
              <h3 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest border-b border-neutral-900 pb-3">
                Order Items Summary
              </h3>

            {/* Items Breakdown */}
            <div className="space-y-4.5 max-h-[260px] overflow-y-auto pr-1">
              {calculations.items.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs justify-between items-center pb-3 border-b border-neutral-900/60 last:border-b-0 last:pb-0">
                  <div className="flex gap-3 items-center max-w-[70%]">
                    <div className="relative w-10 h-12 rounded-lg bg-neutral-950 overflow-hidden border border-neutral-900 flex-shrink-0 shadow">
                      <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-white uppercase truncate block tracking-wide">{item.productName}</span>
                      <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block mt-0.5">
                        {item.sizeName} ({item.frameName}) × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-white font-mono shrink-0">₹{item.lineTotal.toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-4 text-xs font-extrabold uppercase tracking-widest border-t border-neutral-900 pt-5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-mono text-white">₹{calculations.subtotal.toFixed(2)}</span>
              </div>
              {calculations.discount && calculations.discount > 0 ? (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono font-black">-₹{calculations.discount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Delivery Charges</span>
                <span className={`font-black uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg ${
                  calculations.shippingFee === 0 
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60' 
                    : 'text-neutral-350 bg-neutral-950 border border-neutral-900'
                }`}>
                  {calculations.shippingFee === 0 ? '₹0' : `₹${calculations.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tax (Included)</span>
                <span className="font-mono text-neutral-550">₹0.00</span>
              </div>
              <div className="flex justify-between border-t border-neutral-900 pt-5 text-sm sm:text-base font-black text-white">
                <span>Grand Total</span>
                <span className="text-[#FF4D4D] font-mono">₹{calculations.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={isSubmitting || isVerifying}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] border-transparent text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 disabled:bg-neutral-950 disabled:border-neutral-900 disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer active:scale-97 fiery-button-glow shadow-lg shadow-red-950/20"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>VERIFYING PAYMENT...</span>
                </>
              ) : isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  <span>OPENING GATEWAY...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4.5 h-4.5 text-white animate-pulse" />
                  <span>PAY ₹{calculations.total.toFixed(0)}</span>
                </>
              )}
            </button>
          </div>
        </ScrollReveal>
      </div>
      </form>
    </div>
  );
}
