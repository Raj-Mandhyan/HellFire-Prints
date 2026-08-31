import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle, Package, Calendar, Phone, ShieldCheck } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

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
    },
  });

  // Verify order existence and check ownership (User Isolation)
  if (!order || order.userId !== user.id) {
    notFound();
  }

  // Parse shipping snapshot safely from DB JSON field
  const addressSnapshot = order.shippingAddressSnapshot as unknown as ShippingAddressSnapshot;

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Success Banner */}
        <ScrollReveal>
          <div className="bg-[#161616] p-8 rounded-3xl border border-neutral-900 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500"></div>
            <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-900 text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">Order Confirmed!</h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Your configurations have been locked in. We have initiated high-contrast production checks.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Invoice Summary Card */}
        <ScrollReveal fiery={false}>
          <div className="bg-[#161616] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
              Invoice Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-neutral-400 font-medium">
              <div className="flex gap-2.5 items-start">
                <Package className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Order Number</p>
                  <p className="text-white mt-0.5 font-bold">{order.orderNumber}</p>
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
                <ShieldCheck className="w-4.5 h-4.5 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold">Status Badge</p>
                  <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400">
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
                          Size: {item.sizeName} {item.sizeDimensions ? `(${item.sizeDimensions})` : ''} | Finish: {item.paperType} | Frame: {item.frameName}
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
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-semibold text-white">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Delivery Charges</span>
                  <span className="font-semibold text-white">₹{order.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tax (Included)</span>
                  <span className="font-semibold text-white">₹{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-900 pt-4 text-sm font-black uppercase text-white">
                  <span>Grand Total</span>
                  <span className="text-[#FF4D4D]">₹{order.total.toFixed(2)}</span>
                </div>
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
