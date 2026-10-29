import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCartTotal } from '@/lib/discounts';
import { MINIMUM_ORDER_VALUE } from '@/lib/pricing';
import { initiatePaymentAction } from '@/app/actions/order';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create an order.' }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart || !cart.items.length) {
      return NextResponse.json({ error: 'Your cart is empty. Please add items to checkout.' }, { status: 400 });
    }

    // Authoritative Server-side Minimum Order Validation (₹50)
    // Server recalculates the total from trusted product prices, sizes, and quantities
    const breakdown = await calculateCartTotal(cart.id);
    const payableMerchandiseTotal = Math.max(0, breakdown.subtotal - breakdown.totalDiscount);

    if (payableMerchandiseTotal < MINIMUM_ORDER_VALUE || breakdown.total < MINIMUM_ORDER_VALUE) {
      const shortfall = MINIMUM_ORDER_VALUE - payableMerchandiseTotal;
      const formattedShortfall = shortfall % 1 === 0 ? shortfall.toFixed(0) : shortfall.toFixed(2);
      return NextResponse.json(
        {
          error: `Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${formattedShortfall} more to place your order.`,
          minimumOrderValue: MINIMUM_ORDER_VALUE,
          currentTotal: breakdown.total,
          shortfall: Number(formattedShortfall),
        },
        { status: 400 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Empty or no JSON body provided
    }

    const res = await initiatePaymentAction(body);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json(res, { status: 201 });
  } catch (error) {
    console.error('Order creation API error:', error);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
