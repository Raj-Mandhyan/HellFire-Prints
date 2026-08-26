'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { calculateCartTotal } from '@/lib/discounts';

interface ShippingAddressInput {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface InitiatePaymentInput {
  selectedAddressId?: string;
  newAddress?: ShippingAddressInput;
  additionalNote?: string;
}

interface VerifyPaymentInput {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Initiate checkout payment by creating local order and server-side Razorpay order
 */
export async function initiatePaymentAction(input: InitiatePaymentInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to initiate checkout.' };
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === 'rzp_test_yourKeyIdHere' || keySecret === 'yourRazorpayKeySecretHere') {
    return { error: 'Razorpay keys are not configured. Please add active rzp_test keys in the .env file.' };
  }

  const { selectedAddressId, newAddress, additionalNote } = input;

  try {
    // 1. Fetch user cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
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

    if (!cart || !cart.items.length) {
      return { error: 'Your cart is empty. Please add items to checkout.' };
    }

    // 2. Validate product/variant existence and stock availability
    for (const item of cart.items) {
      const product = item.product;
      const variant = item.variant;

      if (item.customPosterId && item.customPoster) {
        // Custom poster has no inventory limitations or variant check
        continue;
      }

      if (!product || !variant) {
        return { error: 'Some items in your cart are no longer available.' };
      }

      if (variant.stock < item.quantity) {
        return {
          error: `Insufficient stock for "${product.title}" - Size ${variant.size?.name || ''} (${variant.frame?.name || ''}). Only ${variant.stock} units left.`,
        };
      }
    }

    // Use dynamic discounts engine to securely calculate prices server-side
    const breakdown = await calculateCartTotal(cart.id);
    const subtotal = breakdown.subtotal;
    const discount = breakdown.totalDiscount;
    const shippingFee = breakdown.shippingFee;
    const tax = 0;
    const total = breakdown.total;

    // 3. Resolve shipping address details
    let addressId = selectedAddressId;

    if (!addressId && newAddress) {
      const { name, phone, street, city, state, postalCode, country } = newAddress;
      const trimmedName = name ? name.trim() : '';
      const trimmedPhone = phone ? phone.trim() : '';
      const trimmedStreet = street ? street.trim() : '';
      const trimmedCity = city ? city.trim() : '';
      const trimmedState = state ? state.trim() : '';
      const trimmedPostalCode = postalCode ? postalCode.trim() : '';
      const trimmedCountry = country ? country.trim() : 'India';

      if (!trimmedName || !trimmedPhone || !trimmedStreet || !trimmedCity || !trimmedState || !trimmedPostalCode) {
        return { error: 'Please fill in all required shipping address fields.' };
      }

      if (trimmedPhone.length < 10 || trimmedPhone.length > 15) {
        return { error: 'Please enter a valid phone number (10-15 digits).' };
      }

      if (trimmedPostalCode.length < 5 || trimmedPostalCode.length > 10) {
        return { error: 'Please enter a valid postal/zip code.' };
      }

      const savedAddress = await prisma.address.create({
        data: {
          userId: user.id,
          name: trimmedName,
          phone: trimmedPhone,
          street: trimmedStreet,
          city: trimmedCity,
          state: trimmedState,
          postalCode: trimmedPostalCode,
          country: trimmedCountry,
          isDefault: false,
        },
      });
      addressId = savedAddress.id;
    }

    if (!addressId) {
      return { error: 'Please select or add a shipping address.' };
    }

    const targetAddress = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
    });

    if (!targetAddress) {
      return { error: 'Shipping address not found.' };
    }

    const shippingAddressSnapshot = {
      name: targetAddress.name,
      phone: targetAddress.phone,
      street: targetAddress.street,
      city: targetAddress.city,
      state: targetAddress.state,
      postalCode: targetAddress.postalCode,
      country: targetAddress.country,
    };

    // 4. Create local order record with PENDING status (unpaid)
    const orderNumber = `HFP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const itemsToCreate = cart.items.map((item) => {
      if (item.customPosterId && item.customPoster) {
        return {
          productId: item.productId,
          variantId: null,
          customPosterId: item.customPosterId,
          title: `Custom Poster Print`,
          price: item.customPoster.price,
          quantity: item.quantity,
          sizeName: item.customPoster.sizeName,
          sizeDimensions: "",
          frameName: item.customPoster.frameName,
          paperType: item.customPoster.paperType,
        };
      } else {
        const unitPrice = item.product.price + (item.variant?.additionalPrice || 0);
        return {
          productId: item.productId,
          variantId: item.variantId,
          customPosterId: null,
          title: item.product.title,
          price: unitPrice,
          quantity: item.quantity,
          sizeName: item.variant?.size?.name || 'A4',
          sizeDimensions: item.variant?.size?.dimensions || '',
          frameName: item.variant?.frame?.name || 'No Frame',
          paperType: item.variant?.paperType || 'Matte',
        };
      }
    });

    let sanitizedNote = null;
    if (additionalNote) {
      sanitizedNote = additionalNote.trim();
      if (sanitizedNote.length > 500) {
        sanitizedNote = sanitizedNote.substring(0, 500);
      }
    }

    const localOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        discount,
        couponCode: breakdown.appliedCoupon?.code || null,
        shippingFee,
        tax,
        total,
        orderStatus: 'PENDING',
        paymentStatus: 'CREATED',
        shippingAddressId: addressId,
        shippingAddressSnapshot,
        additionalNote: sanitizedNote,
        items: {
          create: itemsToCreate,
        },
      },
    });

    // 5. Instantiate server-side Razorpay order
    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const rzpOrder = await rzp.orders.create({
      amount: Math.round(total * 100), // paise conversion
      currency: 'INR',
      receipt: localOrder.id,
    });

    // Save Razorpay order ID
    await prisma.order.update({
      where: { id: localOrder.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return {
      success: true,
      orderId: localOrder.id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      keyId,
      userEmail: user.email || '',
      userName: user.name || '',
    };
  } catch (error: unknown) {
    console.error('Razorpay payment initiation failed:', error);
    const msg = error instanceof Error ? error.message : 'Failed to initiate checkout payment.';
    return { error: msg };
  }
}

/**
 * Verify client payment credentials and update order status
 */
export async function verifyPaymentAction(input: VerifyPaymentInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to verify payment.' };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return { error: 'Razorpay credentials secret key is missing.' };
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { error: 'Missing required payment verification tokens.' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: 'Order not found.' };
    }

    if (order.userId !== user.id) {
      return { error: 'Unauthorized order access.' };
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return { error: 'Invalid order reference mismatch.' };
    }

    // HMAC-SHA256 signature verification with timingSafeEqual
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated = createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    const genBuf = Buffer.from(generated, 'hex');
    const recBuf = Buffer.from(razorpay_signature, 'hex');

    if (genBuf.length !== recBuf.length || !timingSafeEqual(genBuf, recBuf)) {
      return { error: 'Payment signature validation failed. Mismatch detected.' };
    }

    // Process order confirmations
    await processSuccessfulPayment(order.id, razorpay_order_id, razorpay_payment_id, razorpay_signature);

    return { success: true };
  } catch (error: unknown) {
    console.error('Payment verification failed:', error);
    const msg = error instanceof Error ? error.message : 'Payment verification failed.';
    return { error: msg };
  }
}

/**
 * Reusable transaction block to fulfill order, decrement inventory, and clear cart
 */
export async function processSuccessfulPayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature?: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch order details
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found.`);
      }

      // Idempotency: skip if already processed successfully
      if (order.orderStatus === 'CONFIRMED') {
        return order;
      }

      // 2. Validate inventory limits and lock/decrement stock
      for (const item of order.items) {
        if (!item.variantId) continue;

        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            size: true,
            frame: true,
          },
        });

        if (!variant) {
          throw new Error(`Product variant for "${item.title}" is no longer available.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.title}" - Size ${variant.size?.name || ''} (${variant.frame?.name || ''}). Only ${variant.stock} units left.`
          );
        }

        // Decrement stock
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: variant.stock - item.quantity,
          },
        });

        // Also decrement overall product inventory
        if (item.productId) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // 3. Create unique Payment entry
      const existingPayment = await tx.payment.findUnique({
        where: { razorpayPaymentId },
      });

      if (!existingPayment) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: razorpaySignature || null,
            paymentStatus: 'CAPTURED',
          },
        });
      }

      // 4. Update local Order statuses
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CONFIRMED',
          paymentStatus: 'CAPTURED',
        },
      });

      // 5. Purge cart records
      if (order.userId) {
        const userCart = await tx.cart.findUnique({
          where: { userId: order.userId },
        });
        if (userCart) {
          await tx.cartItem.deleteMany({
            where: { cartId: userCart.id },
          });
        }
      }

      return updatedOrder;
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.warn(`Concurrent transaction conflict for order ${orderId} resolved gracefully.`);
      const confirmedOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (confirmedOrder && confirmedOrder.orderStatus === 'CONFIRMED') {
        return confirmedOrder;
      }
    }
    throw error;
  }
}
