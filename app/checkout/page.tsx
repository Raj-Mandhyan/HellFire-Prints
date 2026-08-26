import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Flame } from 'lucide-react';
import CheckoutPageClient from '@/components/CheckoutPageClient';
import { calculateCartTotal } from '@/lib/discounts';

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
              frame: true,
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
        <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-center text-xs text-neutral-500 mt-auto">
          <div className="flex justify-center items-center gap-2">
            <Flame className="w-4 h-4 text-[#C1121F]" />
            <span className="font-extrabold tracking-widest text-white text-[10px]">
              HELLFIRE PRINTS
            </span>
          </div>
          <p>© 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art.</p>
        </footer>
      </div>
    );
  }

  // Pre-calculate server-side prices snapshot & calculate discounts breakdown
  const breakdown = await calculateCartTotal(cart.id);

  const itemsSnapshot = cart.items.map((item) => {
    let unitPrice = 0;
    let productName = item.product.title;
    let productImage = item.product.images?.[0]?.url || '';
    let sizeName = item.variant?.size?.name || 'A4';
    let frameName = item.variant?.frame?.name || 'No Frame';
    let paperType = item.variant?.paperType || 'Matte';

    if (item.customPosterId && item.customPoster) {
      unitPrice = item.customPoster.price;
      productName = `Custom Poster Print`;
      productImage = item.customPoster.imageUrl;
      sizeName = item.customPoster.sizeName;
      frameName = item.customPoster.frameName;
      paperType = item.customPoster.paperType;
    } else {
      unitPrice = item.product.price + (item.variant?.additionalPrice || 0);
    }

    const lineTotal = unitPrice * item.quantity;

    return {
      id: item.id,
      productName,
      productImage,
      sizeName,
      frameName,
      paperType,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    };
  });

  const orderCalculations = {
    items: itemsSnapshot,
    subtotal: breakdown.subtotal,
    discount: breakdown.totalDiscount,
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

      <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-center text-xs text-neutral-500 mt-auto">
        <div className="flex justify-center items-center gap-2">
          <Flame className="w-4 h-4 text-[#C1121F]" />
          <span className="font-extrabold tracking-widest text-white text-[10px]">
            HELLFIRE PRINTS
          </span>
        </div>
        <p>© 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art.</p>
      </footer>
    </div>
  );
}
