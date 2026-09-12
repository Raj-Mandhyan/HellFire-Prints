/**
 * Authoritative size definitions and default pricing for Hellfire Prints posters.
 * Only 4 standard poster sizes are supported: A6, A5, A4, A3.
 */

export const DEFAULT_SIZE_PRICES: Record<'A6' | 'A5' | 'A4' | 'A3', number> = {
  A6: 19,
  A5: 39,
  A4: 59,
  A3: 99,
};

export const ALLOWED_SIZES = ['A6', 'A5', 'A4', 'A3'] as const;
export type AllowedSize = typeof ALLOWED_SIZES[number];

// Display dimensions for UI formatting
export const SIZE_DISPLAY_DIMENSIONS: Record<AllowedSize, string> = {
  A6: '10.5 × 14.8 cm',
  A5: '14.8 × 21 cm',
  A4: '21 × 29.7 cm',
  A3: '29.7 × 42 cm',
};

/**
 * Authoritatively calculates the unit price of a product variant.
 * If the variant has an explicit `price` assigned in the database, that price is used.
 * Otherwise, falls back to `productPrice + additionalPrice` for backward compatibility.
 */
export function getVariantUnitPrice(
  variant: { price?: number | null; additionalPrice?: number | null } | null | undefined,
  productPrice: number
): number {
  if (variant && variant.price !== null && variant.price !== undefined) {
    return variant.price;
  }
  return productPrice + (variant?.additionalPrice || 0);
}
