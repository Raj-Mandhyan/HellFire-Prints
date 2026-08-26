import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { calculateCartTotal } from '@/lib/discounts';
import { calculateCustomPosterPrice } from '@/lib/customPosterPricing';

export const dynamic = 'force-dynamic';

// GET: Retrieve the cart (authenticated user or guest session)
export async function GET() {
  try {
    const user = await getCurrentUser();
    let cart = null;

    if (user) {
      // Find cart associated with authenticated user
      cart = await prisma.cart.findUnique({
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
    } else {
      // Find cart associated with guest session token
      const cookieStore = await import('next/headers').then((m) => m.cookies());
      const sessionToken = cookieStore.get('cart_session_token')?.value;

      if (sessionToken) {
        cart = await prisma.cart.findUnique({
          where: { sessionToken },
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
      }
    }

    if (!cart || !cart.items.length) {
      return NextResponse.json({ items: [], subtotal: 0, total: 0 });
    }

    const items = cart.items.map((item) => {
      let unitPrice = 0;
      let productName = item.product.title;
      let productSlug = item.product.slug;
      let productImage = item.product.images?.[0]?.url || '';
      let sizeName = item.variant?.size?.name || 'A4';
      let frameName = item.variant?.frame?.name || 'No Frame';
      let paperType = item.variant?.paperType || 'Matte';
      let stock = item.variant?.stock || 0;
      let SKU = item.variant?.SKU || item.product.SKU;

      if (item.customPosterId && item.customPoster) {
        unitPrice = item.customPoster.price;
        productName = `Custom Poster Print`;
        productSlug = 'custom-poster';
        productImage = item.customPoster.imageUrl;
        sizeName = item.customPoster.sizeName;
        frameName = item.customPoster.frameName;
        paperType = item.customPoster.paperType;
        stock = 9999;
        SKU = `HFP-CUST-${sizeName}-${paperType.substring(0, 3).toUpperCase()}`.replace(/\s+/g, '');
      } else {
        unitPrice = item.product.price + (item.variant?.additionalPrice || 0);
      }

      const lineTotal = unitPrice * item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        productName,
        productSlug,
        productImage,
        variantId: item.variantId,
        customPosterId: item.customPosterId,
        configuration: item.customPoster?.configuration || null,
        orientation: item.customPoster?.orientation || null,
        sizeName,
        frameName,
        paperType,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        stock,
        SKU,
      };
    });

    const breakdown = await calculateCartTotal(cart.id);

    return NextResponse.json({
      id: cart.id,
      items,
      subtotal: breakdown.subtotal,
      quantityDiscount: breakdown.quantityDiscount,
      couponDiscount: breakdown.couponDiscount,
      totalDiscount: breakdown.totalDiscount,
      shippingFee: breakdown.shippingFee,
      total: breakdown.total,
      appliedCoupon: breakdown.appliedCoupon,
      couponError: breakdown.couponError,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST: Add an item to the cart (user or guest)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, variantId, quantity, customPoster } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be at least 1.' }, { status: 400 });
    }

    let finalProductId = productId;
    let customPosterId: string | null = null;

    if (customPoster) {
      const baseProduct = await prisma.product.findUnique({
        where: { slug: 'custom-poster' },
      });
      if (!baseProduct) {
        return NextResponse.json({ error: 'Custom poster base product not found.' }, { status: 500 });
      }
      finalProductId = baseProduct.id;

      // Secure pricing recalculation on the server
      const calculatedPrice = calculateCustomPosterPrice({
        sizeName: customPoster.sizeName,
        paperType: customPoster.paperType,
        frameName: customPoster.frameName,
      });

      if (body.customPosterId) {
        // If customPosterId is provided, update the existing configuration
        const cp = await prisma.customPoster.update({
          where: { id: body.customPosterId },
          data: {
            imageUrl: customPoster.imageUrl,
            orientation: customPoster.orientation || 'PORTRAIT',
            sizeName: customPoster.sizeName || 'A4',
            frameName: customPoster.frameName || 'No Frame',
            paperType: customPoster.paperType || 'Matte',
            price: calculatedPrice,
            configuration: customPoster.configuration || null,
          },
        });
        
        // Update cart item quantity
        const cartItem = await prisma.cartItem.findFirst({
          where: { customPosterId: cp.id },
        });
        if (cartItem) {
          await prisma.cartItem.update({
            where: { id: cartItem.id },
            data: { quantity },
          });
        }
        
        return NextResponse.json({ success: true });
      } else {
        // Create brand new custom poster configuration
        const cp = await prisma.customPoster.create({
          data: {
            imageUrl: customPoster.imageUrl,
            orientation: customPoster.orientation || 'PORTRAIT',
            sizeName: customPoster.sizeName || 'A4',
            frameName: customPoster.frameName || 'No Frame',
            paperType: customPoster.paperType || 'Matte',
            price: calculatedPrice,
            configuration: customPoster.configuration || null,
          },
        });
        customPosterId = cp.id;
      }
    } else {
      if (!productId || !variantId) {
        return NextResponse.json({ error: 'Product and Variant IDs are required.' }, { status: 400 });
      }

      // Verify product and variant
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });

      if (!product || !variant) {
        return NextResponse.json({ error: 'Product or variant not found.' }, { status: 404 });
      }

      if (variant.stock < quantity) {
        return NextResponse.json({ error: `Only ${variant.stock} units available in stock.` }, { status: 400 });
      }
    }

    const user = await getCurrentUser();
    let cart = null;
    let newSessionToken: string | null = null;

    if (user) {
      // 1. Resolve user's cart
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: user.id },
        });
      }
    } else {
      // 2. Resolve guest cart
      const cookieStore = await import('next/headers').then((m) => m.cookies());
      const sessionToken = cookieStore.get('cart_session_token')?.value;

      if (sessionToken) {
        cart = await prisma.cart.findUnique({
          where: { sessionToken },
        });
      }

      if (!sessionToken || !cart) {
        newSessionToken = randomUUID();
        cart = await prisma.cart.create({
          data: { sessionToken: newSessionToken },
        });
      }
    }

    if (customPosterId) {
      // Add custom poster to cart
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: finalProductId,
          variantId: null,
          customPosterId,
          quantity,
        },
      });
    } else {
      // Add normal item to cart logic
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId,
          customPosterId: null,
        },
      });

      if (existingItem) {
        // Since variant is guaranteed to exist here (customPosterId is null)
        const variant = await prisma.productVariant.findUnique({ where: { id: variantId! } });
        const newQuantity = existingItem.quantity + quantity;
        if (variant && variant.stock < newQuantity) {
          return NextResponse.json(
            { error: `Cannot add more units. Only ${variant.stock} units available in total.` },
            { status: 400 }
          );
        }

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId,
            quantity,
          },
        });
      }
    }

    const response = NextResponse.json({ success: true });

    // Set guest token cookie if a new session was created
    if (newSessionToken) {
      response.cookies.set('cart_session_token', newSessionToken, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT: Update item quantity (user or guest)
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid input parameters.' }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found.' }, { status: 404 });
    }

    if (cartItem.variant && cartItem.variant.stock < quantity) {
      return NextResponse.json(
        { error: `Only ${cartItem.variant.stock} units available in stock.` },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE: Remove item from cart (user or guest)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get('cartItemId');

    if (!cartItemId) {
      return NextResponse.json({ error: 'Cart item ID is required.' }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found.' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
