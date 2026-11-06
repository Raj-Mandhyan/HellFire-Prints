import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle, Package, Calendar, Phone, ShieldCheck, CreditCard, Banknote, Hash, Sparkles } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { DiyaLamp, FestiveJhalar } from '@/components/DiwaliDecorations';
import { getSizePricing } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

interface ShippingAddressSnapshot {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface OrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch order details with snapshot items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          customPoster: true,
        },
      },
      payment: true,
    },
  });

  // Verify order existence and check ownership (User Isolation)
  if (!order || order.userId !== user.id) {
    notFound();
  }

  // Parse shipping snapshot safely from DB JSON field
  const addressSnapshot = order.shippingAddressSnapshot as unknown as ShippingAddressSnapshot;
  const isCod = order.paymentMethod === 'COD';
  const isPaid = order.paymentStatus === 'CAPTURED';

  // Calculate original price comparison & Diwali savings if applicable
  const originalItemsTotal = order.items.reduce((sum, item) => {
    const baseOriginal = getSizePricing(item.sizeName || 'A4', new Date('2026-11-01T00:00:00+05:30')).originalPrice;
    const refOriginal = Math.max(baseOriginal, item.price);
    return sum + refOriginal * item.quantity;
  }, 0);
  const diwaliOrderSavings = Math.max(0, originalItemsTotal - order.subtotal) + (order.discount || 0);

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Success Banner with Festive Diwali Lighting */}
        <ScrollReveal>
          <div className="bg-[#161616] p-8 rounded-3xl border border-[#FFD700]/30 flex flex-col items-center text-center space-y-4 relative overflow-hidden shadow-[0_0_45px_rgba(255,215,0,0.08)]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#C1121F] via-[#FFD700] to-[#C1121F]"></div>
            <FestiveJhalar variant="hero" className="opacity-75" />

            <div className="flex items-center justify-center gap-4 pt-3">
              <DiyaLamp size="sm" />
              <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-900 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <DiyaLamp size="sm" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] text-[9.5px] font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-[#FFD700]" />
                Shubh Deepavali • Grand Diwali Celebration 2026
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">Order Confirmed!</h2>
              <p className="text-xs text-neutral-300 max-w-lg mx-auto leading-relaxed">
                Your configurations have been locked in and high-contrast production checks have begun. May these prints light up your walls this festive season!
              </p>
            </div>

            {diwaliOrderSavings > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/35 border border-emerald-800/60 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                You saved ₹{diwaliOrderSavings.toFixed(0)} with HellFire Festive Pricing!
              </div>
            )}

            {isCod && (
              <div className="mt-2 bg-amber-950/25 border border-amber-900/60 px-5 py-3.5 rounded-2xl max-w-md w-full space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  Payment Method: Cash on Delivery
                </p>
                <p className="text-xs font-bold text-neutral-200">
                  {isPaid ? (
                    <>Payment of <span className="text-emerald-400 font-black font-mono">₹{order.total.toFixed(2)}</span> has been collected upon delivery.</>
                  ) : (
                    <>Amount Payable Upon Delivery: <span className="text-[#FFD700] font-black font-mono">₹{order.total.toFixed(2)}</span></>
                  )}
                </p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Invoice Summary Card */}
        <ScrollReveal fiery={false}>
          <div className="bg-[#161616] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
              Invoice Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-neutral-400 font-medium">
              <div className="flex gap-2.5 items-start">
                <Package className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Order Number</p>
                  <p className="text-white mt-0.5 font-bold font-mono">{order.orderNumber}</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <Hash className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Unique Order ID</p>
                  <p className="text-white mt-0.5 font-bold font-mono break-all text-[11px]">{order.id}</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <Calendar className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Purchase Date</p>
                  <p className="text-white mt-0.5 font-bold">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      dateStyle: 'long',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                {isCod ? (
                  <Banknote className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                ) : (
                  <CreditCard className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                )}
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Payment Method</p>
                  <p className="text-white mt-0.5 font-bold">
                    {isCod ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <ShieldCheck className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Payment Status</p>
                  <span
                    className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${
                      isPaid
                        ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400'
                        : order.paymentStatus === 'FAILED'
                        ? 'bg-rose-950/40 border-rose-900 text-rose-400'
                        : 'bg-amber-950/40 border-amber-900 text-amber-400'
                    }`}
                  >
                    {isCod
                      ? isPaid
                        ? 'PAID (COLLECTED)'
                        : 'PENDING (PAY ON DELIVERY)'
                      : order.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <ShieldCheck className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Order Status</p>
                  <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400">
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Order Items & Shipping split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items breakdown */}
          <ScrollReveal fiery={false} className="lg:col-span-7 w-full h-full">
            <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6 h-full">
              <h4 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
                Items Configured
              </h4>
              <div className="space-y-5">
                {order.items.map((item) => {
                  const isCustom = !!item.customPoster;
                  return (
                    <div key={item.id} className="flex justify-between items-center gap-4 text-xs pb-4 border-b border-neutral-900/60 last:border-b-0 last:pb-0 font-medium">
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm text-white uppercase block leading-tight">
                          {isCustom ? 'Custom Poster Print' : item.title}
                        </span>
                        <span className="text-[9px] text-neutral-500 uppercase tracking-wide block">
                          Size: {item.sizeName} {item.sizeDimensions ? `(${item.sizeDimensions})` : ''}{item.paperType ? ` | Finish: ${item.paperType}` : ''}{item.frameName ? ` | Frame: ${item.frameName}` : ''}
                        </span>
                        <span className="text-[10px] text-neutral-600 font-mono block">Qty: {item.quantity} × ₹{item.price.toFixed(0)}</span>

                        {isCustom && item.customPoster?.imageUrl && (
                          <a
                            href={item.customPoster.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[9px] text-[#C1121F] hover:text-white underline font-bold uppercase tracking-wider mt-1"
                          >
                            View Custom Layout Preview
                          </a>
                        )}
                      </div>
                      <span className="font-bold text-white shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Calculations totals */}
              <div className="space-y-3.5 text-xs border-t border-neutral-900 pt-5 font-medium">
                {originalItemsTotal > order.subtotal && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Original Price Subtotal</span>
                      <span className="font-semibold text-neutral-500 line-through font-mono">₹{originalItemsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#FFD700]">
                      <span>Diwali Festive Discount</span>
                      <span className="font-bold font-mono">-₹{(originalItemsTotal - order.subtotal).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-semibold text-white">₹{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span className="font-semibold">-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Delivery Charges</span>
                  <span className="font-semibold text-white">₹{order.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tax (Included)</span>
                  <span className="font-semibold text-white">₹{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Method</span>
                  <span className="font-bold text-white uppercase">
                    {isCod ? 'Cash on Delivery' : 'Razorpay Online'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-4 text-sm font-black uppercase text-white">
                  <span>Grand Total</span>
                  <span className="text-[#FF4D4D]">₹{order.total.toFixed(2)}</span>
                </div>

                {isCod && (
                  <div className="flex justify-between items-center bg-amber-950/20 border border-amber-900/50 px-4 py-3 rounded-2xl mt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      {isPaid ? 'Amount Paid on Delivery' : 'Amount Payable Upon Delivery'}
                    </span>
                    <span className="text-sm font-black font-mono text-white">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Shipping snapshot details */}
          <ScrollReveal fiery={false} className="lg:col-span-5 w-full h-full">
            <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6 h-full">
              <h4 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
                Delivery Details
              </h4>
              {addressSnapshot ? (
                <div className="space-y-4 text-xs text-neutral-400 leading-relaxed font-medium">
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Recipient Name</p>
                    <p className="text-white font-extrabold uppercase">{addressSnapshot.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Shipping Address</p>
                    <div className="text-white border-l-2 border-[#C1121F] pl-3 py-1 bg-neutral-950/20 rounded-r-md">
                      <p>{addressSnapshot.street}</p>
                      <p>{addressSnapshot.city}, {addressSnapshot.state} - {addressSnapshot.postalCode}</p>
                      <p className="text-neutral-500 mt-0.5 uppercase text-[10px]">{addressSnapshot.country}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Contact Phone</p>
                    <p className="text-white flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-[#C1121F]" />
                      {addressSnapshot.phone}
                    </p>
                  </div>
                  {order.additionalNote && (
                    <div className="space-y-1 pt-3 border-t border-neutral-900/60 mt-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Delivery Note / Instruction</p>
                      <div className="text-white bg-[#FF4D4D]/5 border border-[#FF4D4D]/25 px-4 py-3 rounded-2xl text-xs leading-relaxed italic">
                        &ldquo;{order.additionalNote}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Shipping details snapshot is unavailable.</p>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Link
            href="/account"
            className="w-full sm:w-auto text-center border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-400 hover:text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            My Account
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto text-center bg-[#C1121F] hover:bg-[#A00F19] text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-950/20"
          >
            Continue shopping
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
