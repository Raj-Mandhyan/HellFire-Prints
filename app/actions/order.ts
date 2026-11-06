'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { calculateCartTotal } from '@/lib/discounts';
import {
  getVariantUnitPrice,
  getSizePricing,
  MINIMUM_ORDER_VALUE,
} from '@/lib/pricing';
import { sendOrderAdminNotification } from '@/lib/email';

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
  paymentMethod?: string;
}

export interface PlaceCodOrderInput {
  selectedAddressId?: string;
  newAddress?: ShippingAddressInput;
  additionalNote?: string;
  paymentMethod?: string;
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
export async function initiatePaymentAction(
  input: InitiatePaymentInput,
  referenceDate?: Date
) {
  const now = referenceDate instanceof Date ? referenceDate : new Date();
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to initiate checkout.' };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return { error: 'Razorpay keys are not configured on the server.' };
  }

  if (!keyId.startsWith('rzp_live_')) {
    return { error: 'Invalid Razorpay configuration: Live payment mode requires credentials starting with rzp_live_.' };
  }

  const { selectedAddressId, newAddress, additionalNote, paymentMethod } = input;

  if (paymentMethod !== undefined && paymentMethod !== 'RAZORPAY') {
    return { error: 'Invalid payment method for online payment initiation.' };
  }

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

    // Use dynamic discounts engine to securely calculate prices server-side against IST offer window
    const breakdown = await calculateCartTotal(cart.id, now);
    const subtotal = breakdown.subtotal;
    const discount = breakdown.totalDiscount;
    const shippingFee = breakdown.shippingFee;
    const tax = 0;
    const total = breakdown.total;

    // Authoritative Server-side Minimum Order Validation (₹30)
    const payableMerchandiseTotal = Math.max(0, subtotal - discount);
    if (payableMerchandiseTotal < MINIMUM_ORDER_VALUE || total < MINIMUM_ORDER_VALUE) {
      const shortfall = MINIMUM_ORDER_VALUE - payableMerchandiseTotal;
      const formattedShortfall = shortfall % 1 === 0 ? shortfall.toFixed(0) : shortfall.toFixed(2);
      return {
        error: `Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${formattedShortfall} more to place your order.`,
      };
    }

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
        const revalidatedCustomPrice = getSizePricing(item.customPoster.sizeName || 'A4', now).effectivePrice;
        return {
          productId: item.productId,
          variantId: null,
          customPosterId: item.customPosterId,
          title: `Custom Poster Print`,
          price: revalidatedCustomPrice,
          quantity: item.quantity,
          sizeName: item.customPoster.sizeName,
          sizeDimensions: "",
          frameName: item.customPoster.frameName,
          paperType: item.customPoster.paperType,
        };
      } else {
        const unitPrice = getVariantUnitPrice(item.variant, item.product.price, now);
        return {
          productId: item.productId,
          variantId: item.variantId,
          customPosterId: null,
          title: item.product.title,
          price: unitPrice,
          quantity: item.quantity,
          sizeName: item.variant?.size?.name || 'A4',
          sizeDimensions: item.variant?.size?.dimensions || '',
          frameName: item.variant?.frame?.name || null,
          paperType: item.variant?.paperType || null,
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
        paymentMethod: 'RAZORPAY',
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

    let rzpOrder;
    try {
      rzpOrder = await rzp.orders.create({
        amount: Math.round(total * 100), // paise conversion
        currency: 'INR',
        receipt: localOrder.id,
      });
    } catch (rzpErr: unknown) {
      console.error('Razorpay order creation API call failed:', (rzpErr as Error)?.message || rzpErr);
      await prisma.order.update({
        where: { id: localOrder.id },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED',
        },
      });
      return { error: 'Payment gateway order creation failed. Please try again later.' };
    }

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
 * Place a Cash on Delivery (COD) order without initiating a Razorpay transaction
 */
export async function placeCodOrderAction(
  input: PlaceCodOrderInput,
  referenceDate?: Date
) {
  const now = referenceDate instanceof Date ? referenceDate : new Date();
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to place an order.' };
  }

  // Server-side validation of payment method and protection against status tampering
  const rawInput = input as Record<string, unknown>;
  if ('paymentStatus' in rawInput || 'orderStatus' in rawInput) {
    return { error: 'Direct manipulation of paymentStatus or orderStatus is not permitted.' };
  }

  if (input.paymentMethod !== undefined && input.paymentMethod !== 'COD') {
    return { error: 'Invalid payment method. Expected COD.' };
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

    // 3. Use dynamic discounts engine to securely calculate prices server-side against IST offer window
    const breakdown = await calculateCartTotal(cart.id, now);
    const subtotal = breakdown.subtotal;
    const discount = breakdown.totalDiscount;
    const shippingFee = breakdown.shippingFee;
    const tax = 0;
    const total = breakdown.total;

    // Authoritative Server-side Minimum Order Validation (₹30)
    const payableMerchandiseTotal = Math.max(0, subtotal - discount);
    if (payableMerchandiseTotal < MINIMUM_ORDER_VALUE || total < MINIMUM_ORDER_VALUE) {
      const shortfall = MINIMUM_ORDER_VALUE - payableMerchandiseTotal;
      const formattedShortfall = shortfall % 1 === 0 ? shortfall.toFixed(0) : shortfall.toFixed(2);
      return {
        error: `Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${formattedShortfall} more to place your order.`,
      };
    }

    // 4. Resolve shipping address details
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

    const itemsToCreate = cart.items.map((item) => {
      if (item.customPosterId && item.customPoster) {
        const revalidatedCustomPrice = getSizePricing(item.customPoster.sizeName || 'A4', now).effectivePrice;
        return {
          productId: item.productId,
          variantId: null,
          customPosterId: item.customPosterId,
          title: `Custom Poster Print`,
          price: revalidatedCustomPrice,
          quantity: item.quantity,
          sizeName: item.customPoster.sizeName,
          sizeDimensions: '',
          frameName: item.customPoster.frameName,
          paperType: item.customPoster.paperType,
        };
      } else {
        const unitPrice = getVariantUnitPrice(item.variant, item.product.price, now);
        return {
          productId: item.productId,
          variantId: item.variantId,
          customPosterId: null,
          title: item.product.title,
          price: unitPrice,
          quantity: item.quantity,
          sizeName: item.variant?.size?.name || 'A4',
          sizeDimensions: item.variant?.size?.dimensions || '',
          frameName: item.variant?.frame?.name || null,
          paperType: item.variant?.paperType || null,
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

    // 5. Atomic transaction: lock/clear cart to prevent duplicate orders, decrement inventory, create COD Order & Payment
    const codOrder = await prisma.$transaction(async (tx) => {
      // Atomic duplicate prevention: delete cart items first within transaction
      // If a concurrent checkout request already deleted them, deletedCartItems.count will be 0
      const deletedCartItems = await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      if (deletedCartItems.count === 0) {
        throw new Error('Your cart is empty or this order has already been placed.');
      }

      // Validate and decrement inventory for standard variants
      for (const item of cart.items) {
        if (item.customPosterId && item.customPoster) continue;
        if (!item.variantId) continue;

        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            size: true,
            frame: true,
          },
        });

        if (!variant) {
          throw new Error(`Product variant for "${item.product.title}" is no longer available.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.product.title}" - Size ${variant.size?.name || ''} (${variant.frame?.name || ''}). Only ${variant.stock} units left.`
          );
        }

        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: variant.stock - item.quantity,
          },
        });

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

      const orderNumber = `HFP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal,
          discount,
          couponCode: breakdown.appliedCoupon?.code || null,
          shippingFee,
          tax,
          total,
          paymentMethod: 'COD',
          orderStatus: 'CONFIRMED',
          paymentStatus: 'PENDING',
          razorpayOrderId: null,
          shippingAddressId: addressId,
          shippingAddressSnapshot,
          additionalNote: sanitizedNote,
          items: {
            create: itemsToCreate,
          },
        },
      });

      // Create corresponding COD Payment record with PENDING status
      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          amount: total,
          currency: 'INR',
          razorpayOrderId: null,
          razorpayPaymentId: null,
          razorpaySignature: null,
        },
      });

      // Reset applied coupon on cart if present
      if (cart.couponCode) {
        await tx.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
        });
      }

      return createdOrder;
    });

    return {
      success: true,
      orderId: codOrder.id,
      orderNumber: codOrder.orderNumber,
      paymentMethod: 'COD' as const,
      paymentStatus: codOrder.paymentStatus,
      orderStatus: codOrder.orderStatus,
      total: codOrder.total,
    };
  } catch (error: unknown) {
    console.error('COD order creation failed:', error);
    const msg = error instanceof Error ? error.message : 'Failed to place Cash on Delivery order.';
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

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { error: 'Razorpay credentials are not configured on the server.' };
  }

  if (!keyId.startsWith('rzp_live_')) {
    return { error: 'Invalid Razorpay configuration: Live payment mode requires credentials starting with rzp_live_.' };
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

    if (order.paymentMethod === 'COD') {
      return { error: 'Cash on Delivery orders cannot be verified through Razorpay.' };
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

    // Fetch the payment details from Razorpay to verify status from source of truth
    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    let payment;
    try {
      payment = await rzp.payments.fetch(razorpay_payment_id);
    } catch (fetchErr: unknown) {
      console.error('Failed to fetch payment details from Razorpay:', (fetchErr as Error)?.message || fetchErr);
      return { error: 'Could not verify payment status with the gateway. Please contact support.' };
    }

    if (!payment) {
      return { error: 'Payment details not found on the gateway.' };
    }

    if (payment.order_id !== razorpay_order_id) {
      return { error: 'Payment order reference mismatch.' };
    }

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return { error: `Payment status is invalid. Status: ${payment.status}` };
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
  let updatedOrder;
  try {
    updatedOrder = await prisma.$transaction(async (tx) => {
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

      if (order.paymentMethod === 'COD') {
        throw new Error('Cash on Delivery orders cannot be processed via Razorpay payment capture.');
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
            paymentMethod: 'RAZORPAY',
            amount: order.total,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature: razorpaySignature || null,
            paymentStatus: 'CAPTURED',
          },
        });
      }

      // 4. Update local Order statuses
      const finalOrder = await tx.order.update({
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

      return finalOrder;
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.warn(`Concurrent transaction conflict for order ${orderId} resolved gracefully.`);
      const confirmedOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (confirmedOrder && confirmedOrder.orderStatus === 'CONFIRMED') {
        updatedOrder = confirmedOrder;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  // Trigger admin email notification asynchronously outside transaction.
  // Idempotent locking inside sendOrderAdminNotification ensures no duplicate sends.
  try {
    await sendOrderAdminNotification(orderId);
  } catch (emailErr) {
    console.error(`[Admin Email] Non-blocking notification dispatch error for order ${orderId}:`, emailErr);
  }

  return updatedOrder;
}
