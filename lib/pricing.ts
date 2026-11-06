/**
 * Centralized Promotional & Base Pricing Configuration for HellFire Prints
 * Includes strict IST time-bounded validation for The Grand Diwali Sale 2026.
 */

export type PosterSizeCode = 'A3' | 'A4' | 'A5' | 'A6';
export type DiwaliOfferPhase = 'UPCOMING' | 'ACTIVE' | 'EXPIRED';

/**
 * Authoritative Regular / Base Prices (in INR ₹) per poster size
 */
export const ORIGINAL_SIZE_PRICES: Record<string, number> = {
  A3: 49,
  A4: 29,
  A5: 15,
  A6: 7,
};

/**
 * Alias for Regular / Base Prices per poster size
 */
export const REGULAR_SIZE_PRICES: Record<string, number> = {
  ...ORIGINAL_SIZE_PRICES,
};

/**
 * Authoritative Diwali Festival Sale 2026 Promotional Prices (in INR ₹) per poster size
 */
export const DIWALI_SIZE_PRICES: Record<string, number> = {
  A3: 32,
  A4: 16,
  A5: 8,
  A6: 4,
};

/**
 * Default size prices alias (Regular Prices) preserved for Admin Product Form & backward compatibility
 */
export const DEFAULT_SIZE_PRICES: Record<string, number> = {
  ...ORIGINAL_SIZE_PRICES,
};

/**
 * Authoritative Minimum Order Value (₹30 per order across all payment methods)
 */
export const MINIMUM_ORDER_VALUE = 30;

/**
 * Strict Diwali Offer Validity Window in Asia/Kolkata (IST, UTC+05:30)
 * Start: 6 November 2026 — 8:00 PM IST
 * End:   Monday, 9 November 2026 — 4:00 AM IST (2026-11-08T22:30:00Z UTC)
 */
export const DIWALI_OFFER_TIMEZONE = 'Asia/Kolkata';
export const DIWALI_OFFER_START_ISO = '2026-11-06T20:00:00+05:30';
export const DIWALI_OFFER_END_ISO = '2026-11-09T04:00:00+05:30';
export const DIWALI_OFFER_END_UTC_ISO = '2026-11-08T22:30:00Z';

export const DIWALI_OFFER_START_MS = Date.parse(DIWALI_OFFER_START_ISO);
export const DIWALI_OFFER_END_MS = Date.parse(DIWALI_OFFER_END_ISO);

export const DIWALI_OFFER_START_DISPLAY = '6 November 2026 — 8:00 PM IST';
export const DIWALI_OFFER_END_DISPLAY = 'Monday, 9 November 2026 — 4:00 AM IST';

export interface DiwaliCountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export interface DiwaliOfferStatus {
  phase: DiwaliOfferPhase;
  isActive: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
  startTimeMs: number;
  endTimeMs: number;
  currentTimeMs: number;
  targetTimeMs: number;
  countdown: DiwaliCountdownParts;
  formattedNowIST: string;
}

/**
 * Format any Date into an explicit IST (Asia/Kolkata) human-readable timestamp
 */
export function formatDateInIST(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: DIWALI_OFFER_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date) + ' IST';
  } catch {
    return date.toISOString();
  }
}

/**
 * Compute the authoritative Diwali Offer status & countdown for a given timestamp.
 * Uses fixed +05:30 epoch boundaries so browser-local or server-local timezone settings
 * never cause inconsistencies.
 */
export function getDiwaliOfferStatus(now: Date = new Date()): DiwaliOfferStatus {
  const currentTimeMs = now.getTime();

  let phase: DiwaliOfferPhase;
  let targetTimeMs: number;

  if (currentTimeMs < DIWALI_OFFER_START_MS) {
    phase = 'UPCOMING';
    targetTimeMs = DIWALI_OFFER_START_MS;
  } else if (currentTimeMs >= DIWALI_OFFER_START_MS && currentTimeMs < DIWALI_OFFER_END_MS) {
    phase = 'ACTIVE';
    targetTimeMs = DIWALI_OFFER_END_MS;
  } else {
    phase = 'EXPIRED';
    targetTimeMs = DIWALI_OFFER_END_MS;
  }

  const diffMs = Math.max(0, targetTimeMs - currentTimeMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    phase,
    isActive: phase === 'ACTIVE',
    isUpcoming: phase === 'UPCOMING',
    isExpired: phase === 'EXPIRED',
    startTimeMs: DIWALI_OFFER_START_MS,
    endTimeMs: DIWALI_OFFER_END_MS,
    currentTimeMs,
    targetTimeMs,
    countdown: {
      days,
      hours,
      minutes,
      seconds,
      totalMs: diffMs,
    },
    formattedNowIST: formatDateInIST(now),
  };
}

/**
 * Returns true ONLY during the valid offer window (6 Nov 2026 8:00 PM IST to 9 Nov 2026 4:00 AM IST)
 */
export function isDiwaliOfferActive(now: Date = new Date()): boolean {
  return getDiwaliOfferStatus(now).isActive;
}

export interface SizePricingDetails {
  sizeName: string;
  originalPrice: number;
  diwaliPrice: number;
  effectivePrice: number;
  savings: number;
  activeDiscount: number;
  discountPercentage: number;
  isOfferActive: boolean;
  phase: DiwaliOfferPhase;
}

/**
 * Resolve complete pricing details for a poster size (A3, A4, A5, A6).
 * Distinguishes:
 * A. Regular/Base Price (`originalPrice`): defaults to ORIGINAL_SIZE_PRICES[size], or uses `customRegularPrice` when an admin customizes a product's regular price.
 * B. Promotional/Diwali Price (`diwaliPrice`): separate promotional layer applied only during the active Diwali campaign.
 */
export function getSizePricing(
  sizeName: string = 'A4',
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase,
  customRegularPrice?: number | null
): SizePricingDetails {
  const normalized = (sizeName || 'A4').trim().toUpperCase();
  const defaultRegularPrice = ORIGINAL_SIZE_PRICES[normalized] ?? ORIGINAL_SIZE_PRICES.A4;
  const originalPrice =
    typeof customRegularPrice === 'number' && !Number.isNaN(customRegularPrice) && customRegularPrice > 0
      ? customRegularPrice
      : defaultRegularPrice;
  const diwaliPrice = DIWALI_SIZE_PRICES[normalized] ?? DIWALI_SIZE_PRICES.A4;

  const status = getDiwaliOfferStatus(now);
  const phase = overridePhase ?? status.phase;
  const isOfferActive = phase === 'ACTIVE';

  const effectivePrice = isOfferActive ? diwaliPrice : originalPrice;
  const savings = Math.max(0, originalPrice - diwaliPrice);
  const activeDiscount = isOfferActive ? savings : 0;
  const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return {
    sizeName: normalized,
    originalPrice,
    diwaliPrice,
    effectivePrice,
    savings,
    activeDiscount,
    discountPercentage,
    isOfferActive,
    phase,
  };
}

/**
 * Full catalogue of the 4 standard poster sizes with dimensions and pricing
 */
export const DIWALI_POSTER_SIZE_CARDS = [
  {
    sizeName: 'A3',
    dimensions: '29.7 × 42 cm',
    tagline: 'Statement Wall Print',
    badge: 'DIWALI OFFER',
    originalPrice: ORIGINAL_SIZE_PRICES.A3,
    diwaliPrice: DIWALI_SIZE_PRICES.A3,
    savings: ORIGINAL_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3,
    discountPercentage: Math.round(((ORIGINAL_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3) / ORIGINAL_SIZE_PRICES.A3) * 100),
  },
  {
    sizeName: 'A4',
    dimensions: '21 × 29.7 cm',
    tagline: 'Most Popular Standard Size',
    badge: 'DIWALI OFFER',
    originalPrice: ORIGINAL_SIZE_PRICES.A4,
    diwaliPrice: DIWALI_SIZE_PRICES.A4,
    savings: ORIGINAL_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4,
    discountPercentage: Math.round(((ORIGINAL_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4) / ORIGINAL_SIZE_PRICES.A4) * 100),
  },
  {
    sizeName: 'A5',
    dimensions: '14.8 × 21 cm',
    tagline: 'Desk & Gallery Setup',
    badge: 'DIWALI OFFER',
    originalPrice: ORIGINAL_SIZE_PRICES.A5,
    diwaliPrice: DIWALI_SIZE_PRICES.A5,
    savings: ORIGINAL_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5,
    discountPercentage: Math.round(((ORIGINAL_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5) / ORIGINAL_SIZE_PRICES.A5) * 100),
  },
  {
    sizeName: 'A6',
    dimensions: '10.5 × 14.8 cm',
    tagline: 'Collectible Mini Print',
    badge: 'DIWALI OFFER',
    originalPrice: ORIGINAL_SIZE_PRICES.A6,
    diwaliPrice: DIWALI_SIZE_PRICES.A6,
    savings: ORIGINAL_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6,
    discountPercentage: Math.round(((ORIGINAL_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6) / ORIGINAL_SIZE_PRICES.A6) * 100),
  },
] as const;

export interface VariantLike {
  price?: number | null;
  additionalPrice?: number | null;
  size?: {
    name?: string;
    additionalPrice?: number;
  } | null;
  frame?: {
    additionalPrice?: number;
  } | null;
}

/**
 * Resolves full pricing details (original, Diwali, effective, savings) for a product variant.
 * Respects administrator-customized regular prices stored on `variant.price` (or `fallbackProductPrice`),
 * while keeping Diwali promotional prices as a separate layer applied only when the campaign is active.
 */
export function getVariantPricing(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = ORIGINAL_SIZE_PRICES.A4,
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase
): SizePricingDetails {
  const sizeName = variant?.size?.name?.trim().toUpperCase();

  if (sizeName && sizeName in ORIGINAL_SIZE_PRICES) {
    const customRegularPrice =
      variant && typeof variant.price === 'number' && !Number.isNaN(variant.price) && variant.price > 0
        ? variant.price
        : sizeName === 'A4' && typeof fallbackProductPrice === 'number' && fallbackProductPrice > 0
        ? fallbackProductPrice
        : undefined;
    return getSizePricing(sizeName, now, overridePhase, customRegularPrice);
  }

  // Fallback for any custom or legacy non-standard size
  let fallbackPrice = fallbackProductPrice > 0 ? fallbackProductPrice : ORIGINAL_SIZE_PRICES.A4;
  if (variant && typeof variant.price === 'number' && variant.price > 0) {
    fallbackPrice = variant.price;
  } else if (variant) {
    fallbackPrice =
      fallbackProductPrice +
      (variant.size?.additionalPrice || 0) +
      (variant.frame?.additionalPrice || 0) +
      (variant.additionalPrice || 0);
  }

  const status = getDiwaliOfferStatus(now);
  const phase = overridePhase ?? status.phase;

  return {
    sizeName: sizeName || 'A4',
    originalPrice: fallbackPrice,
    diwaliPrice: fallbackPrice,
    effectivePrice: fallbackPrice,
    savings: 0,
    activeDiscount: 0,
    discountPercentage: 0,
    isOfferActive: phase === 'ACTIVE',
    phase,
  };
}

/**
 * Resolves the authoritative effective unit price for a product variant.
 * Returns the Diwali promotional price when the offer is ACTIVE, and the
 * Original price when UPCOMING or EXPIRED.
 */
export function getVariantUnitPrice(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = ORIGINAL_SIZE_PRICES.A4,
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase
): number {
  return getVariantPricing(variant, fallbackProductPrice, now, overridePhase).effectivePrice;
}

/**
 * Resolves the authoritative Original (pre-Diwali) unit price for a product variant.
 */
export function getVariantOriginalPrice(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = ORIGINAL_SIZE_PRICES.A4
): number {
  return getVariantPricing(variant, fallbackProductPrice).originalPrice;
}
