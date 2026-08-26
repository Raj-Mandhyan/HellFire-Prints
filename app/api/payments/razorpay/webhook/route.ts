import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { processSuccessfulPayment } from '@/app/actions/order';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header.' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook Configuration Error: RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook secret is not configured on the server.' }, { status: 500 });
    }

    // Verify signature using timingSafeEqual
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const genBuf = Buffer.from(expectedSignature, 'hex');
    const recBuf = Buffer.from(signature, 'hex');

    if (genBuf.length !== recBuf.length || !timingSafeEqual(genBuf, recBuf)) {
      console.warn('Invalid webhook signature verification block received.');
      return NextResponse.json({ error: 'Signature verification failed.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Process event types
    if (event.event === 'payment.captured') {
      const rpOrderId = event.payload.payment.entity.order_id;
      const rpPaymentId = event.payload.payment.entity.id;

      if (rpOrderId && rpPaymentId) {
        // Find corresponding local order record
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId: rpOrderId },
        });

        if (order) {
          await processSuccessfulPayment(order.id, rpOrderId, rpPaymentId);
          console.log(`Webhook successfully verified and captured payment for Order: ${order.orderNumber}`);
        }
      }
    } else if (event.event === 'payment.failed') {
      const rpOrderId = event.payload.payment.entity.order_id;

      if (rpOrderId) {
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId: rpOrderId },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
            },
          });
          console.log(`Webhook marked payment as FAILED for Order: ${order.orderNumber}`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.warn('Webhook unique constraint duplicate hit concurrently. Acknowledged capture.');
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error('Webhook endpoint execution failed:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
