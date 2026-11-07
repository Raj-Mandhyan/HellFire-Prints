'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from '@/components/SafeImage';
import { useCart } from '@/context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, AlertCircle, Tag, Check, Sparkles, Clock } from 'lucide-react';
import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import {
  MINIMUM_ORDER_VALUE,
  DIWALI_OFFER_START_DISPLAY,
  DIWALI_OFFER_END_DISPLAY,
} from '@/lib/pricing';
import { DiyaLamp } from '@/components/DiwaliDecorations';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, isLoading, refreshCart } = useCart();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Coupon Form States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponFormError, setCouponFormError] = useState<string | null>(null);
  const [isProcessingCoupon, setIsProcessingCoupon] = useState(false);

  const isMinimumOrderMet = (cart?.total || 0) >= MINIMUM_ORDER_VALUE;
  const shortfallAmount = Math.max(0, MINIMUM_ORDER_VALUE - (cart?.total || 0));
  const formattedShortfall = shortfallAmount % 1 === 0 ? shortfallAmount.toFixed(0) : shortfallAmount.toFixed(2);

  const originalSubtotal = cart.originalSubtotal ?? cart.subtotal;
  const diwaliDiscount = cart.diwaliDiscount ?? 0;
  const totalSavings = cart.totalSavings ?? (diwaliDiscount + (cart.totalDiscount || 0));
  const offerPhase = cart.offerStatus?.phase ?? 'ACTIVE';

  // Calculate potential Diwali savings if offer is currently UPCOMING
  const potentialDiwaliSavings = cart.items.reduce((sum, item) => {
    const orig = (item.originalUnitPrice ?? item.unitPrice) * item.quantity;
    const diw = (item.diwaliUnitPrice ?? item.unitPrice) * item.quantity;
    return sum + Math.max(0, orig - diw);
  }, 0);

  const handleUpdateQuantity = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty <= 0) return;

    try {
      setUpdatingItemId(itemId);
      setErrorMsg(null);
      const res = await updateQuantity(itemId, newQty);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update item count.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to synchronize quantity with server.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItemId(itemId);
      setErrorMsg(null);
      const res = await removeFromCart(itemId);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to delete item from cart.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to remove item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Apply Coupon Action
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    try {
      setIsProcessingCoupon(true);
      setCouponFormError(null);

      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCodeInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
        setCouponCodeInput('');
      } else {
        setCouponFormError(data.error || 'Failed to apply coupon.');
      }
    } catch (err) {
      console.error(err);
      setCouponFormError('Failed to apply coupon due to server error.');
    } finally {
      setIsProcessingCoupon(false);
    }
  };

  // Remove Coupon Action
  const handleRemoveCoupon = async () => {
    try {
      setIsProcessingCoupon(true);
      setCouponFormError(null);

      const res = await fetch('/api/cart/coupon', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
      } else {
        setCouponFormError(data.error || 'Failed to remove coupon.');
      }
    } catch (err) {
      console.error(err);
      setCouponFormError('Failed to clear coupon.');
    } finally {
      setIsProcessingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="border-b border-amber-500/20 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                Your <span className="text-[#FFD700] diwali-gold-text-glow font-black">Festive Cart</span>
              </h1>
              <p className="text-neutral-400 mt-2 text-xs font-semibold tracking-wide">
                Review your archival prints and Diwali 2026 promotional savings.
              </p>
            </div>
            <div className="hidden sm:block">
              <DiyaLamp size="sm" delayMs={150} />
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Continue shopping
          </Link>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-950/20 border border-red-900 text-red-300 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          /* Loading State */
          <div className="text-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-t-transparent border-[#FFD700] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-black">Synchronizing cart state...</p>
          </div>
        ) : cart.items.length > 0 ? (
          /* Cart Items List Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Items Table */}
            <div className="lg:col-span-8 space-y-6">
              <ScrollReveal fiery={false}>
                <div className="space-y-6">
                  {/* Diwali Promotional Offer Status Banner */}
                  <div className="bg-gradient-to-r from-[#17080D] via-[#12060B] to-[#0F0A18] border border-[#FFD700]/35 rounded-3xl p-5 space-y-2.5 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-[#FFD700]/10 blur-2xl pointer-events-none"></div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[#FFD700] text-xs font-black uppercase tracking-widest">
                        <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse" />
                        <span>
                          {offerPhase === 'ACTIVE'
                            ? '🪔 DIWALI OFFER ACTIVE — FESTIVE DISCOUNTS APPLIED'
                            : offerPhase === 'UPCOMING'
                            ? '⏳ UPCOMING DIWALI SALE — STARTS 6 NOV, 8:00 PM IST'
                            : 'DIWALI OFFER ENDED — STANDARD PRICING ACTIVE'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        🎉 Free Express Delivery Unlocked
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-300 font-semibold leading-relaxed">
                      {offerPhase === 'ACTIVE' ? (
                        <p>
                          You are saving <span className="text-[#FFD700] font-black">₹{diwaliDiscount.toFixed(0)}</span> with Diwali Promotional Pricing (Valid until {DIWALI_OFFER_END_DISPLAY}).
                        </p>
                      ) : offerPhase === 'UPCOMING' ? (
                        <p>
                          Diwali Promotional Pricing (<span className="text-[#FFD700] font-bold">A3 ₹32, A4 ₹16, A5 ₹8, A6 ₹4</span> — saving you <span className="text-emerald-400 font-bold">₹{potentialDiwaliSavings.toFixed(0)}</span> on these items) unlocks automatically on <span className="text-white font-bold">{DIWALI_OFFER_START_DISPLAY}</span>. Outside the offer window, authoritative original prices apply.
                        </p>
                      ) : (
                        <p>
                          The Diwali promotional window ({DIWALI_OFFER_START_DISPLAY} – {DIWALI_OFFER_END_DISPLAY}) has expired. Original prices have been restored.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    {cart.items.map((item) => {
                      const origUnit = item.originalUnitPrice ?? item.unitPrice;
                      const mrpUnit = item.retailMrpUnitPrice ?? Math.max(origUnit, item.unitPrice);
                      const isDiscountedNow = item.unitPrice < origUnit;

                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0F0A0C] p-5.5 rounded-3xl border border-amber-500/20 gap-4 transition-all duration-300 shadow-sm hover:border-[#FFD700]/45 ${
                            updatingItemId === item.id ? 'opacity-40 pointer-events-none' : ''
                          }`}
                        >
                          {/* Left: Poster Details */}
                          <div className="flex items-center gap-4.5">
                            <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-900 flex-shrink-0 shadow-md">
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="space-y-1">
                              {item.productSlug === 'custom-poster' ? (
                                <>
                                  <span className="font-extrabold text-sm sm:text-base text-white leading-tight uppercase block tracking-wide">
                                    CUSTOM POSTER
                                  </span>
                                  <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold space-y-0.5">
                                    <p>Size: <span className="text-[#FFD700] font-bold">{item.sizeName}</span></p>
                                    <p className="text-neutral-500 font-bold">SKU: {item.SKU}</p>
                                  </div>
                                  <Link
                                    href={`/custom-poster?edit=${item.id}`}
                                    className="inline-block mt-2 text-[9px] font-black text-[#FFD700] hover:text-black uppercase tracking-widest border border-[#FFD700]/40 hover:border-[#FFD700] px-3 py-1 rounded-xl bg-[#FFD700]/10 hover:bg-[#FFD700] transition-all text-center active:scale-95"
                                  >
                                    Edit Customization
                                  </Link>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/product/${item.productSlug}`}
                                    className="font-extrabold text-sm sm:text-base text-white hover:text-[#FFD700] transition-colors duration-300 leading-tight uppercase block line-clamp-1 tracking-wide"
                                  >
                                    {item.productName}
                                  </Link>
                                  <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold space-y-0.5">
                                    <p>Size: <span className="text-[#FFD700] font-bold">{item.sizeName}</span></p>
                                    <p className="text-neutral-500 font-bold">SKU: {item.SKU}</p>
                                  </div>
                                </>
                              )}

                              {/* Festive Price Comparison Pill on Item */}
                              <div className="pt-1 flex items-center gap-2 flex-wrap">
                                {isDiscountedNow ? (
                                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                                    MRP ~~₹{mrpUnit}~~ • Base ~~₹{origUnit}~~ → Diwali Price: ₹{item.unitPrice} (Save ₹{origUnit - item.unitPrice}/unit)
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-2 py-0.5 rounded">
                                    MRP ~~₹{mrpUnit}~~ → Selling Price: ₹{item.unitPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quantity controls & pricing */}
                          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t sm:border-t-0 border-neutral-900/60 pt-4 sm:pt-0">
                            {/* Quantity Selector */}
                            <div className="flex items-center bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-inner">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                disabled={item.quantity <= 1}
                                className="px-3.5 py-2 text-neutral-400 hover:text-white disabled:text-neutral-700 transition-colors disabled:cursor-not-allowed cursor-pointer font-bold"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 py-1.5 text-xs font-mono font-black text-white bg-neutral-950 w-11 text-center border-x border-neutral-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                className="px-3 py-2 text-neutral-400 hover:text-white transition-colors cursor-pointer font-bold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price Snapshot */}
                            <div className="text-right flex flex-col justify-center min-w-[105px]">
                              {isDiscountedNow && (
                                <span className="text-[11px] font-mono text-neutral-500 line-through">
                                  ₹{(origUnit * item.quantity).toFixed(2)}
                                </span>
                              )}
                              <span className="font-mono font-extrabold text-[#FFD700] text-base">
                                ₹{item.lineTotal.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                                ₹{item.unitPrice.toFixed(0)} ea
                              </span>
                            </div>

                            {/* Remove Action */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-3 bg-neutral-950 border border-neutral-900 rounded-2xl text-neutral-500 hover:text-red-400 hover:border-red-950/60 transition-all active:scale-90 cursor-pointer"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Side: Order Summary Panel */}
            <div className="lg:col-span-4 space-y-6">
              <ScrollReveal fiery={false}>
                <div className="space-y-6">
                  {/* Order Calculations Summary */}
                  <div className="bg-[#0F0A0C] p-6 sm:p-8 border border-amber-500/25 rounded-3xl space-y-5 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#FFD700]/10 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                      <h3 className="text-[10px] text-neutral-300 font-black uppercase tracking-widest">
                        Order Summary
                      </h3>
                      <span
                        className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md border ${
                          offerPhase === 'ACTIVE'
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                            : offerPhase === 'UPCOMING'
                            ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {offerPhase === 'ACTIVE'
                          ? 'DIWALI SALE LIVE'
                          : offerPhase === 'UPCOMING'
                          ? 'PRE-SALE (STARTS 6 NOV)'
                          : 'STANDARD PRICING'}
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs font-extrabold uppercase tracking-widest">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Original Price Subtotal</span>
                        <span className={`font-mono ${diwaliDiscount > 0 ? 'text-neutral-400 line-through' : 'text-white'}`}>
                          ₹{originalSubtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-emerald-400">
                        <span>🪔 Diwali Discount</span>
                        <span className="font-mono font-black">
                          {diwaliDiscount > 0 ? `-₹${diwaliDiscount.toFixed(2)}` : '₹0.00'}
                        </span>
                      </div>

                      <div className="flex justify-between border-t border-neutral-900/80 pt-3">
                        <span className="text-neutral-300">Festive Subtotal</span>
                        <span className="font-mono text-white">₹{cart.subtotal.toFixed(2)}</span>
                      </div>

                      {/* Applied Coupon Discount */}
                      {cart.couponDiscount && cart.couponDiscount > 0 ? (
                        <div className="flex justify-between text-emerald-400">
                          <span>🔥 Coupon ({cart.appliedCoupon?.code})</span>
                          <span className="font-mono font-black">-₹{cart.couponDiscount.toFixed(2)}</span>
                        </div>
                      ) : null}

                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Delivery Charges</span>
                        <span className={`font-black uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg ${
                          cart.shippingFee === 0 || cart.shippingFee === undefined
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60'
                            : 'text-neutral-300 bg-neutral-950 border border-neutral-900'
                        }`}>
                          {cart.shippingFee === 0 || cart.shippingFee === undefined ? '₹0 (FREE)' : `₹${cart.shippingFee}`}
                        </span>
                      </div>

                      <div className="flex justify-between border-t border-neutral-900 pt-4 text-sm sm:text-base font-black text-white">
                        <span>Final Payable</span>
                        <span className="text-[#FFD700] font-mono">₹{cart.total.toFixed(2)}</span>
                      </div>

                      {totalSavings > 0 && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/35 border border-emerald-500/35 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
                          <span>🎉 TOTAL SAVINGS</span>
                          <span className="font-black">₹{totalSavings.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Minimum Order Value Status Banner (₹30) */}
                    {!isMinimumOrderMet ? (
                      <div className="p-3.5 bg-amber-950/30 border border-amber-500/50 rounded-xl space-y-1">
                        <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Minimum Order Value: ₹{MINIMUM_ORDER_VALUE}
                        </p>
                        <p className="text-[10px] text-neutral-300 font-semibold leading-normal">
                          Minimum order value is ₹{MINIMUM_ORDER_VALUE}. Add <span className="text-[#FFD700] font-black">₹{formattedShortfall}</span> more to place your order.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/25 border border-emerald-500/35 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Minimum Order Value (₹{MINIMUM_ORDER_VALUE}) Satisfied</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4 border-t border-neutral-900">
                      {isMinimumOrderMet ? (
                        <Link
                          href="/checkout"
                          className="w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg text-center active:scale-98 cursor-pointer diwali-button-glow"
                        >
                          <ShoppingBag className="w-4 h-4 text-black" />
                          Proceed to Checkout
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 text-neutral-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed select-none"
                        >
                          <ShoppingBag className="w-4 h-4 text-neutral-600" />
                          ADD ₹{formattedShortfall} MORE TO CHECKOUT
                        </button>
                      )}
                      <Link
                        href="/"
                        className="w-full inline-flex items-center justify-center border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900 text-neutral-400 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center active:scale-98"
                      >
                        Continue shopping
                      </Link>
                    </div>
                  </div>

                  {/* Coupon Engine Application Card */}
                  <div className="bg-[#0F0A0C] p-6 border border-amber-500/20 rounded-3xl space-y-4 shadow-md">
                    <h3 className="text-[10px] text-neutral-300 font-black uppercase tracking-widest border-b border-neutral-900 pb-3.5 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#FFD700]" />
                      Have a Coupon?
                    </h3>

                    {cart.appliedCoupon ? (
                      <div className="bg-emerald-950/15 border border-emerald-900/60 p-4.5 rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <div className="space-y-1">
                          <p className="font-black text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            {cart.appliedCoupon.code} APPLIED
                          </p>
                          <p className="text-[9px] text-neutral-500 leading-normal font-semibold">
                            {cart.appliedCoupon.discountType === 'PERCENTAGE'
                              ? `${cart.appliedCoupon.discountValue}% Off coupon discount applied.`
                              : `Flat ₹${cart.appliedCoupon.discountValue} discount applied.`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          disabled={isProcessingCoupon}
                          className="text-neutral-400 hover:text-red-400 font-black uppercase text-[9px] tracking-widest cursor-pointer ml-3 active:scale-95 transition-transform"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="COUPON CODE"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value)}
                            className="flex-1 bg-neutral-950 border border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase font-mono text-white focus:outline-none focus:border-[#FFD700] placeholder-neutral-700"
                          />
                          <button
                            type="submit"
                            disabled={isProcessingCoupon || !couponCodeInput.trim()}
                            className="bg-[#C1121F] hover:bg-[#A00F19] disabled:bg-neutral-950 border border-transparent disabled:border-neutral-900 text-white disabled:text-neutral-600 font-black px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                          >
                            Apply
                          </button>
                        </div>

                        {couponFormError && (
                          <p className="text-[10px] text-[#FF4D4D] flex items-center gap-1.5 font-bold uppercase tracking-wider leading-relaxed">
                            <AlertCircle className="w-3.5 h-3.5 text-[#C1121F] shrink-0" />
                            {couponFormError}
                          </p>
                        )}
                      </form>
                    )}

                    {/* Offer Validity Reference */}
                    <div className="pt-3 border-t border-neutral-900/60 space-y-1 text-[10px] text-neutral-400">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase">
                        <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
                        <span>Diwali Sale Window (IST)</span>
                      </div>
                      <p className="text-[9.5px] font-mono text-neutral-400">
                        Start: {DIWALI_OFFER_START_DISPLAY}
                      </p>
                      <p className="text-[9.5px] font-mono text-neutral-400">
                        End: {DIWALI_OFFER_END_DISPLAY}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-24 bg-[#0F0A0C]/40 border border-amber-500/20 rounded-3xl max-w-lg mx-auto space-y-6 shadow-sm">
            <ShoppingBag className="w-14 h-14 text-[#FFD700] mx-auto animate-pulse-fire" />
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider leading-none">Your Cart is Empty</h3>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Explore the Grand Diwali Sale 2026 — Posters starting at just ₹4!
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 diwali-button-glow cursor-pointer"
            >
              Shop Diwali Sale Now
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
