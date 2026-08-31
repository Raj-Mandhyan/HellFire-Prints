/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import OrderStatusUpdater from '@/components/OrderStatusUpdater';
import Link from 'next/link';
import Image from '@/components/SafeImage';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Box } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  // Protect route
  await requireAdmin();

  const { id } = await params;

  // Query detailed Order from Neon PostgreSQL
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
          customPoster: true,
        },
      },
      payment: true,
      shipping: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  interface ShippingAddressSnapshot {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }

  // Determine address details from order.shippingAddressSnapshot (or order.shippingAddress)
  let shippingAddress: ShippingAddressSnapshot | null = order.shippingAddressSnapshot as unknown as ShippingAddressSnapshot;
  if (!shippingAddress && order.shippingAddressId) {
    shippingAddress = await prisma.address.findUnique({
      where: { id: order.shippingAddressId },
    }) as unknown as ShippingAddressSnapshot;
  }

  return (
    <div className="space-y-8">
      {/* Title / Back */}
      <div className="space-y-1">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs text-neutral-450 hover:text-white transition-colors group mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
              ORDER <span className="text-[#C1121F] font-mono">{order.orderNumber}</span>
            </h1>
            <p className="text-neutral-400 text-xs mt-0.5">
              Registered in local databases on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          <div>
            <span
              className={`inline-block px-3 py-1 text-xs font-black uppercase rounded-lg border ${
                order.orderStatus === 'DELIVERED'
                  ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400'
                  : order.orderStatus === 'CANCELLED'
                  ? 'bg-neutral-900 border-neutral-850 text-neutral-400'
                  : 'bg-amber-950/40 border-amber-900 text-amber-400'
              }`}
            >
              Order Status: {order.orderStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details, Products, Pricing */}
        <div className="lg:col-span-8 space-y-8">
          {/* Order Items */}
          <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-neutral-200 border-b border-neutral-900 pb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-[#C1121F]" />
              Ordered Itemsized List
            </h3>

            <div className="divide-y divide-neutral-900/60 space-y-4">
              {order.items.map((item) => {
                const isCustom = !!item.customPoster;
                const imageUrl = isCustom 
                  ? item.customPoster?.imageUrl || ''
                  : item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=80&q=80';

                // Helper to extract artwork URL from fabric configuration
                let artworkUrls: string[] = [];
                if (isCustom && item.customPoster?.configuration) {
                  try {
                    const config = typeof item.customPoster.configuration === 'string' 
                      ? JSON.parse(item.customPoster.configuration) 
                      : item.customPoster.configuration;
                    if (config && config.objects) {
                      artworkUrls = config.objects
                        .filter((obj: any) => obj.type === 'image' && obj.src)
                        .map((obj: any) => obj.src);
                    }
                  } catch (e) {
                    console.error("Error parsing design config:", e);
                  }
                }

                return (
                  <div key={item.id} className="flex items-start gap-4 pt-4 first:pt-0 group border-b border-neutral-900/40 pb-4 last:border-b-0">
                    <div className="relative w-12 h-16 rounded overflow-hidden bg-neutral-950 border border-neutral-900 flex-shrink-0">
                      <Image src={imageUrl} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-white text-xs truncate">
                        {isCustom ? 'Custom Poster Print' : item.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-1 uppercase font-medium leading-relaxed">
                        Size: {item.sizeName} {item.sizeDimensions ? `(${item.sizeDimensions})` : ''} <br />
                        Frame: {item.frameName} <br />
                        Paper: {item.paperType}
                      </p>
                      
                      {isCustom && (
                        <div className="mt-2 space-y-1.5">
                          <span className="inline-block text-[8px] bg-red-950/60 border border-red-900 text-[#FF4D4D] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                            Custom Print Order
                          </span>
                          {artworkUrls.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-[8px] text-neutral-500 font-bold block uppercase tracking-wider">Source Artwork Files:</span>
                              {artworkUrls.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex text-[9px] text-emerald-400 hover:text-white underline font-mono tracking-wider break-all bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded"
                                >
                                  Download Artwork File {artworkUrls.length > 1 ? i + 1 : ''}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9.5px] text-neutral-500 italic">No custom uploaded image layers (text-only design).</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-white text-xs font-mono">{formatCurrency(item.price)}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Qty {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-neutral-900/80 pt-6 space-y-3 font-mono text-[11px] text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-bold">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#FF4D4D]">
                  <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>{order.shippingFee > 0 ? formatCurrency(order.shippingFee) : '₹0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax GST (included)</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between border-t border-neutral-900 pt-3 text-sm text-white font-black">
                <span className="uppercase">Grand Total</span>
                <span className="font-mono text-[#FF4D4D]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Razorpay payments panel */}
          <div className="bg-[#161616] border border-neutral-900 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-neutral-200 border-b border-neutral-900 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#C1121F]" />
              Razorpay Transaction Records
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-3 font-mono">
                <div>
                  <p className="text-[9px] text-neutral-500 uppercase font-bold">Rzp Order ID</p>
                  <p className="text-white mt-0.5">{order.razorpayOrderId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 uppercase font-bold">Rzp Payment ID</p>
                  <p className="text-white mt-0.5">{order.payment?.razorpayPaymentId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 uppercase font-bold">Rzp Signature</p>
                  <p className="text-neutral-500 truncate mt-0.5 text-[10px]" title={order.payment?.razorpaySignature || 'N/A'}>
                    {order.payment?.razorpaySignature || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-neutral-500 uppercase font-bold">Gateway settled funds</p>
                  <p className="text-white font-mono font-bold mt-0.5">
                    {order.payment ? formatCurrency(order.payment.amount) : 'N/A'} {order.payment?.currency || 'INR'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 uppercase font-bold">Gateway payment status</p>
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-lg border mt-1.5 ${
                      order.paymentStatus === 'CAPTURED'
                        ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400'
                        : order.paymentStatus === 'FAILED'
                        ? 'bg-rose-950/40 border-rose-900 text-rose-400'
                        : 'bg-amber-950/40 border-amber-900 text-amber-400'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Updater, Customer Profile, Shipping Details */}
        <div className="lg:col-span-4 space-y-8">
          {/* Status Advancer Form */}
          <div className="bg-[#161616] border border-neutral-900 p-6 rounded-3xl space-y-4">
            <h4 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
              Advance Order State
            </h4>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.orderStatus} />
          </div>

          {/* Customer profile cards */}
          <div className="bg-[#161616] border border-neutral-900 p-6 rounded-3xl space-y-5">
            <h4 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
              Customer Information
            </h4>
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-neutral-500 text-[9px] uppercase font-bold">Name</p>
                  <p className="text-white font-bold">{order.user?.name || 'Guest Checkout'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#C1121F] shrink-0" />
                <div>
                  <p className="text-neutral-500 text-[9px] uppercase font-bold">Email address</p>
                  <p className="text-neutral-300 font-mono">{order.user?.email || 'N/A'}</p>
                </div>
              </div>
              {shippingAddress && (
                <>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#C1121F] shrink-0" />
                    <div>
                      <p className="text-neutral-500 text-[9px] uppercase font-bold">Phone Number</p>
                      <p className="text-neutral-300 font-mono">{shippingAddress.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#C1121F] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-neutral-500 text-[9px] uppercase font-bold">Shipping Destination</p>
                      <p className="text-neutral-300 font-medium">
                        {shippingAddress.name} <br />
                        {shippingAddress.street} <br />
                        {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode} <br />
                        {shippingAddress.country}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {order.additionalNote && (
                <div className="pt-4 border-t border-neutral-900/60 mt-4 space-y-1.5">
                  <p className="text-[#FF4D4D] text-[9px] uppercase font-bold tracking-wider">Customer Note / Special Instruction</p>
                  <div className="bg-[#C1121F]/5 border border-[#C1121F]/30 text-white px-3.5 py-2.5 rounded-2xl text-xs italic leading-relaxed">
                    &ldquo;{order.additionalNote}&rdquo;
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping logistics card */}
          <div className="bg-[#161616] border border-neutral-900 p-6 rounded-3xl space-y-4">
            <h4 className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest border-b border-neutral-900 pb-3">
              Shiprocket Logistics
            </h4>
            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <p className="text-[9px] text-neutral-500 uppercase font-bold">Shipment ID</p>
                <p className="text-white mt-0.5">{order.shipping?.shipmentId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-500 uppercase font-bold">AWB Code / Airway Bill</p>
                <p className="text-white mt-0.5">{order.shipping?.awbCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-500 uppercase font-bold">Courier Assigned</p>
                <p className="text-white mt-0.5">{order.shipping?.courierName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-500 uppercase font-bold">Shipment Status</p>
                <span className="inline-block bg-neutral-950 px-2 py-0.5 text-[9px] font-extrabold text-neutral-400 border border-neutral-900 rounded uppercase mt-1">
                  {order.shipping?.shipmentStatus || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
