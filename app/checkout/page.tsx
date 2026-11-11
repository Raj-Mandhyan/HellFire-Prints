import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import CheckoutPageClient from '@/components/CheckoutPageClient';
import { calculateCartTotal } from '@/lib/discounts';
import { getSizePricing, getVariantPricing } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user's cart from PostgreSQL with customPoster included
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
          variant: {
            include: {
              size: true,
            },
          },
          customPoster: true,
        },
      },
    },
  });

  const savedAddresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const cartItemsCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  if (cartItemsCount === 0 || !cart || !cart.items.length) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 px-6">
          <div className="text-center py-20 bg-[#161616]/40 border border-neutral-900 rounded-3xl max-w-lg w-full space-y-6">
            <ShoppingBag className="w-12 h-12 text-[#C1121F] mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Your Cart is Empty</h3>
              <p className="text-xs text-neutral-500">You must add premium poster configurations to your cart before checking out.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#C1121F] hover:bg-[#A00F19] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to catalog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Pre-calculate server-side prices snapshot & calculate discounts breakdown
  const now = new Date();
  const breakdown = await calculateCartTotal(cart.id, now);

  const itemsSnapshot = cart.items.map((item) => {
    let retailMrpUnitPrice = 0;
    let originalUnitPrice = 0;
    let diwaliUnitPrice = 0;
    let unitPrice = 0;
    let productName = item.product.title;
    let productImage = item.product.images?.[0]?.url || '';
    let sizeName = item.variant?.size?.name || 'A4';
    let paperType = item.variant?.paperType || '';

    if (item.customPosterId && item.customPoster) {
      sizeName = item.customPoster.sizeName;
      paperType = item.customPoster.paperType;
      const customPricing = getSizePricing(sizeName, now);
      retailMrpUnitPrice = customPricing.retailMrp;
      originalUnitPrice = customPricing.originalPrice;
      diwaliUnitPrice = customPricing.diwaliPrice;
      unitPrice = customPricing.effectivePrice;
      productName = `Custom Poster Print`;
      productImage = item.customPoster.imageUrl;
    } else {
      const variantPricing = getVariantPricing(
        item.variant,
        item.product.price,
        now,
        undefined,
        item.product.MRP,
        item.product.diwaliPrice
      );
      retailMrpUnitPrice = variantPricing.retailMrp;
      originalUnitPrice = variantPricing.originalPrice;
      diwaliUnitPrice = variantPricing.diwaliPrice;
      unitPrice = variantPricing.effectivePrice;
    }

    const retailMrpLineTotal = retailMrpUnitPrice * item.quantity;
    const originalLineTotal = originalUnitPrice * item.quantity;
    const lineTotal = unitPrice * item.quantity;

    return {
      id: item.id,
      productName,
      productImage,
      sizeName,
      paperType,
      quantity: item.quantity,
      retailMrpUnitPrice,
      originalUnitPrice,
      diwaliUnitPrice,
      unitPrice,
      retailMrpLineTotal,
      originalLineTotal,
      lineTotal,
    };
  });

  const orderCalculations = {
    items: itemsSnapshot,
    retailMrpSubtotal: breakdown.retailMrpSubtotal,
    originalSubtotal: breakdown.originalSubtotal,
    diwaliDiscount: breakdown.diwaliDiscount,
    mrpSavings: breakdown.mrpSavings,
    subtotal: breakdown.subtotal,
    discount: breakdown.totalDiscount,
    totalSavings: breakdown.totalSavings,
    offerPhase: breakdown.offerStatus.phase,
    shippingFee: breakdown.shippingFee,
    tax: 0,
    total: breakdown.total,
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-[#C1121F] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <CheckoutPageClient
          savedAddresses={savedAddresses}
          calculations={orderCalculations}
        />
      </main>

      <Footer />
    </div>
  );
}
