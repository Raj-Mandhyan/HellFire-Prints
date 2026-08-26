import prisma from '@/lib/prisma';

/**
 * Merge guest cart (identified by sessionToken) with the authenticated user's cart.
 * Executed server-side upon successful registration or login.
 */
export async function mergeCarts(sessionToken: string, userId: string): Promise<void> {
  if (!sessionToken || !userId) return;

  try {
    // 1. Fetch guest cart
    const guestCart = await prisma.cart.findUnique({
      where: { sessionToken },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    // Case C/D: Guest has no cart or guest cart is empty, do nothing
    if (!guestCart || !guestCart.items.length) {
      return;
    }

    // 2. Fetch authenticated user's cart
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    // Case A: Guest has cart, user has no cart -> Transfer guest cart to user
    if (!userCart) {
      await prisma.cart.update({
        where: { id: guestCart.id },
        data: {
          userId: userId,
          sessionToken: null, // Detach guest session token
        },
      });
      return;
    }

    // Case B: Guest has cart, user already has cart -> Merge items
    await prisma.$transaction(async (tx) => {
      for (const guestItem of guestCart.items) {
        const matchingUserItem = userCart.items.find(
          (uItem) =>
            uItem.productId === guestItem.productId &&
            uItem.variantId === guestItem.variantId &&
            uItem.customPosterId === guestItem.customPosterId
        );

        if (matchingUserItem) {
          // Merge quantities
          let mergedQty = matchingUserItem.quantity + guestItem.quantity;

          // Enforce stock availability if a variant exists
          if (guestItem.variant) {
            mergedQty = Math.min(mergedQty, guestItem.variant.stock);
          }

          if (mergedQty > 0) {
            await tx.cartItem.update({
              where: { id: matchingUserItem.id },
              data: { quantity: mergedQty },
            });
          }
        } else {
          // Transfer guest item to user cart
          let transferQty = guestItem.quantity;
          if (guestItem.variant) {
            transferQty = Math.min(transferQty, guestItem.variant.stock);
          }

          if (transferQty > 0) {
            await tx.cartItem.create({
              data: {
                cartId: userCart.id,
                productId: guestItem.productId,
                variantId: guestItem.variantId,
                customPosterId: guestItem.customPosterId,
                quantity: transferQty,
              },
            });
          }
        }
      }

      // Cleanup guest cart records after successful merge to prevent orphaned duplicate carts
      await tx.cartItem.deleteMany({
        where: { cartId: guestCart.id },
      });
      await tx.cart.delete({
        where: { id: guestCart.id },
      });
    });
  } catch (error) {
    console.error('Error merging guest cart to user cart:', error);
  }
}
