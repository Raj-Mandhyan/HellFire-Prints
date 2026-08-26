import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCartTotal } from '@/lib/discounts';

export const dynamic = 'force-dynamic';

// POST: Apply a coupon to the cart
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    const user = await getCurrentUser();
    let cart = null;

    if (user) {
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });
    } else {
      const cookieStore = await import('next/headers').then((m) => m.cookies());
      const sessionToken = cookieStore.get('cart_session_token')?.value;

      if (sessionToken) {
        cart = await prisma.cart.findUnique({
          where: { sessionToken },
        });
      }
    }

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found.' }, { status: 404 });
    }

    // Lookup and validate the coupon
    const couponCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: 'This coupon is inactive.' }, { status: 400 });
    }

    const now = new Date();
    if (coupon.startDate > now || coupon.endDate < now) {
      return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit.' }, { status: 400 });
    }

    // Temporarily verify the cart subtotal requirement
    const totals = await calculateCartTotal(cart.id, couponCode);
    if (totals.couponError) {
      return NextResponse.json({ error: totals.couponError }, { status: 400 });
    }

    // Update cart
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode },
    });

    return NextResponse.json({ success: true, message: 'Coupon applied successfully!' });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE: Remove applied coupon from the cart
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    let cart = null;

    if (user) {
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });
    } else {
      const cookieStore = await import('next/headers').then((m) => m.cookies());
      const sessionToken = cookieStore.get('cart_session_token')?.value;

      if (sessionToken) {
        cart = await prisma.cart.findUnique({
          where: { sessionToken },
        });
      }
    }

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found.' }, { status: 404 });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    return NextResponse.json({ success: true, message: 'Coupon removed.' });
  } catch (error) {
    console.error('Error removing coupon:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
