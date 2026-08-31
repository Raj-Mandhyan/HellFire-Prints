'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from '@/components/SafeImage';
import { useCart } from '@/context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, AlertCircle, Tag, Check, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, isLoading, refreshCart } = useCart();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  
  // Coupon Form States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponFormError, setCouponFormError] = useState<string | null>(null);
  const [isProcessingCoupon, setIsProcessingCoupon] = useState(false);

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

  // Purchase Incentives Calculation
  const incentives = useMemo(() => {
    const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.subtotal;

    let qtyMessage = '';
    let qtyUnlocked = false;

    if (totalQty === 1) {
      qtyMessage = '🔥 Add 1 more poster to unlock 10% OFF your entire order!';
    } else if (totalQty === 2) {
      qtyMessage = '🔥 Add 1 more poster to unlock 15% OFF your entire order!';
    } else if (totalQty >= 3) {
      qtyMessage = '🎉 15% multi-buy discount unlocked!';
      qtyUnlocked = true;
    }

    const freeShippingThreshold = 1999.0;
    const isFreeShipping = subtotal >= freeShippingThreshold;
    const shippingMessage = isFreeShipping
      ? '🎉 Free shipping unlocked!'
      : `🔥 Add ₹${(freeShippingThreshold - subtotal).toFixed(0)} more to unlock FREE SHIPPING!`;

    return {
      qtyMessage,
      qtyUnlocked,
      shippingMessage,
      isFreeShipping,
      totalQty,
    };
  }, [cart.items, cart.subtotal]);

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="border-b border-neutral-900 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
              Your <span className="text-[#C1121F] fiery-text-glow font-black">Shopping Cart</span>
            </h1>
            <p className="text-neutral-400 mt-2 text-xs font-semibold tracking-wide">
              Review and customized prints configured for your environment.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-450 hover:text-white transition-colors group"
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
            <div className="w-8 h-8 border-2 border-t-transparent border-[#C1121F] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-black">Synchronizing cart state...</p>
          </div>
        ) : cart.items.length > 0 ? (
          /* Cart Items List Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Items Table */}
            <div className="lg:col-span-8 space-y-6">
              <ScrollReveal fiery={false}>
                <div className="space-y-6">
                  {/* Dynamic Purchase Incentives Banner */}
                  <div className="bg-[#0F0F0F] border border-neutral-900 rounded-3xl p-5.5 space-y-3 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-2 text-[#FF4D4D] text-xs font-black uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-[#C1121F] animate-pulse-fire" />
                      Active Shopping Incentives
                    </div>
                    <div className="space-y-1.5 text-xs text-neutral-450 font-bold uppercase tracking-wide">
                      <p className={incentives.qtyUnlocked ? 'text-emerald-405 text-emerald-400 font-extrabold' : ''}>
                        {incentives.qtyMessage}
                      </p>
                      <p className={incentives.isFreeShipping ? 'text-emerald-405 text-emerald-400 font-extrabold' : ''}>
                        {incentives.shippingMessage}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0F0F0F] p-5.5 rounded-3xl border border-neutral-900/80 gap-4 transition-all duration-300 shadow-sm hover:border-neutral-800 ${
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
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold space-y-0.5">
                              <p>{item.sizeName} • {item.paperType} • {item.frameName}</p>
                              <p className="text-neutral-600 font-bold">SKU: {item.SKU}</p>
                            </div>
                            <Link
                              href={`/custom-poster?edit=${item.id}`}
                              className="inline-block mt-2.5 text-[9px] font-black text-[#C1121F] hover:text-white uppercase tracking-widest border border-[#C1121F]/30 hover:border-[#C1121F] px-3 py-1.5 rounded-xl bg-[#C1121F]/5 hover:bg-[#C1121F]/15 transition-all text-center active:scale-95"
                            >
                              Edit Customization
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link 
                              href={`/product/${item.productSlug}`} 
                              className="font-extrabold text-sm sm:text-base text-white hover:text-[#FF4D4D] transition-colors duration-300 leading-tight uppercase block line-clamp-1 tracking-wide"
                            >
                              {item.productName}
                            </Link>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold space-y-0.5">
                              <p>{item.sizeName} ({item.frameName})</p>
                              <p className="text-neutral-600 font-bold">Finish: {item.paperType} | SKU: {item.SKU}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Quantity controls & pricing */}
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 sm:gap-10 border-t sm:border-t-0 border-neutral-900/60 pt-4 sm:pt-0">
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
                      <div className="text-right flex flex-col justify-center min-w-[90px]">
                        <span className="font-extrabold text-white text-base">₹{item.lineTotal.toFixed(2)}</span>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">₹{item.unitPrice.toFixed(0)} ea</span>
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
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

            {/* Right Side: Order Summary Panel */}
            <div className="lg:col-span-4 space-y-6">
              <ScrollReveal fiery={false}>
                <div className="space-y-6">
                  {/* Order Calculations Summary */}
                  <div className="bg-[#0F0F0F] p-6 sm:p-8 border border-neutral-900 rounded-3xl space-y-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none"></div>
                    <h3 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest border-b border-neutral-900 pb-3">
                      Order Summary
                    </h3>

                <div className="space-y-4 text-xs font-extrabold uppercase tracking-widest">
                  <div className="flex justify-between">
                    <span className="text-neutral-450">Subtotal</span>
                    <span className="font-mono text-white">₹{cart.subtotal.toFixed(2)}</span>
                  </div>

                  {/* Automatic Multi-Buy quantity discount */}
                  {cart.quantityDiscount && cart.quantityDiscount > 0 ? (
                    <div className="flex justify-between text-emerald-400">
                      <span>🔥 Multi-Buy Discount</span>
                      <span className="font-mono font-black">-₹{cart.quantityDiscount.toFixed(2)}</span>
                    </div>
                  ) : null}

                  {/* Applied Coupon Discount */}
                  {cart.couponDiscount && cart.couponDiscount > 0 ? (
                    <div className="flex justify-between text-emerald-400">
                      <span>🔥 Coupon ({cart.appliedCoupon?.code})</span>
                      <span className="font-mono font-black">-₹{cart.couponDiscount.toFixed(2)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-450">Delivery Charges</span>
                    <span className={`font-black uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-lg ${
                      cart.shippingFee === 0 
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60' 
                        : 'text-neutral-350 bg-neutral-950 border border-neutral-900'
                    }`}>
                      {cart.shippingFee === 0 ? '₹0' : `₹${cart.shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-900 pt-5 text-sm sm:text-base font-black text-white">
                    <span>Grand Total</span>
                    <span className="text-[#FF4D4D] font-mono">₹{cart.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-5 border-t border-neutral-900">
                  <Link
                    href="/checkout"
                    className="w-full inline-flex items-center justify-center gap-2.5 bg-[#C1121F] hover:bg-[#A00F19] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-950/20 text-center active:scale-98 cursor-pointer fiery-button-glow"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                    Proceed to Checkout
                  </Link>
                  <Link
                    href="/"
                    className="w-full inline-flex items-center justify-center border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900 text-neutral-450 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center active:scale-98"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>

              {/* Coupon Engine Application Card */}
              <div className="bg-[#0F0F0F] p-6 border border-neutral-900 rounded-3xl space-y-4 shadow-md">
                <h3 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest border-b border-neutral-900 pb-3.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#C1121F]" />
                  Have a Coupon?
                </h3>

                {cart.appliedCoupon ? (
                  /* Applied coupon state */
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
                      className="text-neutral-450 hover:text-red-400 font-black uppercase text-[9px] tracking-widest cursor-pointer ml-3 active:scale-95 transition-transform"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  /* Apply coupon form */
                  <form onSubmit={handleApplyCoupon} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="COUPON CODE"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase font-mono text-white focus:outline-none focus:border-[#C1121F] placeholder-neutral-750"
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

                {/* Active Available Coupons indicators */}
                <div className="space-y-2.5 pt-3.5 border-t border-neutral-900/60">
                  <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest block">Available Coupons:</span>
                  
                  <div className="space-y-2 text-[10px] text-neutral-450 leading-relaxed font-semibold uppercase tracking-wider">
                    <div className="p-3 bg-neutral-950/40 border border-neutral-900/50 rounded-xl space-y-1">
                      <p className="font-black text-white font-mono text-[#FF4D4D]">WELCOME10</p>
                      <p className="text-[8.5px] text-neutral-500 normal-case font-bold">10% OFF on your prints purchase. No minimum required.</p>
                    </div>
                    <div className="p-3 bg-neutral-950/40 border border-neutral-900/50 rounded-xl space-y-1">
                      <p className="font-black text-white font-mono text-[#FF4D4D]">SAVE150</p>
                      <p className="text-[8.5px] text-neutral-500 normal-case font-bold">₹150 OFF on orders above ₹1,499.</p>
                    </div>
                    <div className="p-3 bg-neutral-950/40 border border-neutral-900/50 rounded-xl space-y-1">
                      <p className="font-black text-white font-mono text-[#FF4D4D]">HELLFIRE15</p>
                      <p className="text-[8.5px] text-neutral-500 normal-case font-bold">15% OFF on orders above ₹1,499.</p>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-24 bg-[#0F0F0F]/30 border border-neutral-900 rounded-3xl max-w-lg mx-auto space-y-6 shadow-sm">
            <ShoppingBag className="w-14 h-14 text-[#C1121F] mx-auto animate-pulse-fire" />
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider leading-none">Your Cart is Empty</h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Add premium poster configurations to fuel your setup.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#C1121F] hover:bg-[#A00F19] text-white px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-950/30 active:scale-95 hover:shadow-[0_0_12px_rgba(193,18,31,0.45)] cursor-pointer"
            >
              Shop catalog now
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
