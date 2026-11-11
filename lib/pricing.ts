/**
 * Centralized Three-Tier Promotional & Base Pricing Configuration for HellFire Prints
 * Includes strict IST time-bounded validation for The Grand Diwali Sale 2026.
 *
 * Pricing Hierarchy:
 *   Retail MRP >= Base Selling Price >= Diwali Selling Price >= 0
 *
 * Price Selection Rule:
 *   - Active Diwali Sale: Final Selling Price = Diwali Selling Price
 *   - Normal Days / Expired: Final Selling Price = Base Selling Price
 *   - Retail MRP is strictly a reference/strikethrough display value and is NEVER charged at checkout.
 */

export type PosterSizeCode = 'A3' | 'A4' | 'A5' | 'A6';
export type DiwaliOfferPhase = 'UPCOMING' | 'ACTIVE' | 'EXPIRED';

/**
 * Tier 1: Authoritative Default Retail MRP (in INR ₹) per poster size
 */
export const RETAIL_MRP_SIZE_PRICES: Record<string, number> = {
  A3: 99,
  A4: 59,
  A5: 39,
  A6: 19,
};

/**
 * Tier 2: Authoritative Default Base Selling Prices (Normal Days, in INR ₹) per poster size
 */
export const BASE_SELLING_SIZE_PRICES: Record<string, number> = {
  A3: 49,
  A4: 29,
  A5: 15,
  A6: 7,
};

/**
 * Backward-compatible alias for Base Selling Prices per poster size
 */
export const ORIGINAL_SIZE_PRICES: Record<string, number> = {
  ...BASE_SELLING_SIZE_PRICES,
};

/**
 * Backward-compatible alias for Regular / Base Selling Prices per poster size
 */
export const REGULAR_SIZE_PRICES: Record<string, number> = {
  ...BASE_SELLING_SIZE_PRICES,
};

/**
 * Tier 3: Authoritative Default Diwali Festival Sale 2026 Selling Prices (in INR ₹) per poster size
 */
export const DIWALI_SIZE_PRICES: Record<string, number> = {
  A3: 32,
  A4: 16,
  A5: 8,
  A6: 4,
};

/**
 * Default size prices alias (Base Selling Prices) preserved for Admin Product Form & backward compatibility
 */
export const DEFAULT_SIZE_PRICES: Record<string, number> = {
  ...BASE_SELLING_SIZE_PRICES,
};

/**
 * Authoritative Minimum Order Value (₹30 per order across all payment methods)
 */
export const MINIMUM_ORDER_VALUE = 30;

/**
 * Strict Grand Diwali Extended Offer 2026 Validity Window in Asia/Kolkata (IST, UTC+05:30)
 * Start: 12 November 2026 — 1:00 PM IST (2026-11-12T07:30:00Z UTC)
 * End:   14 November 2026 — 1:00 PM IST (2026-11-14T07:30:00Z UTC)
 * Duration: 48 Hours
 */
export const DIWALI_OFFER_TIMEZONE = 'Asia/Kolkata';
export const DIWALI_OFFER_START_ISO = '2026-11-12T13:00:00+05:30';
export const DIWALI_OFFER_START_UTC_ISO = '2026-11-12T07:30:00Z';
export const DIWALI_OFFER_END_ISO = '2026-11-14T13:00:00+05:30';
export const DIWALI_OFFER_END_UTC_ISO = '2026-11-14T07:30:00Z';

export const DIWALI_OFFER_START_MS = Date.parse(DIWALI_OFFER_START_ISO);
export const DIWALI_OFFER_END_MS = Date.parse(DIWALI_OFFER_END_ISO);

export const DIWALI_OFFER_START_DISPLAY = '12 November 2026 — 1:00 PM IST';
export const DIWALI_OFFER_END_DISPLAY = '14 November 2026 — 1:00 PM IST';

export interface ThreeTierPriceValues {
  retailMrp: number;
  baseSellingPrice: number;
  diwaliSellingPrice: number;
}

export interface CustomThreeTierPriceInput {
  retailMrp?: number | null;
  baseSellingPrice?: number | null;
  diwaliSellingPrice?: number | null;
}

/**
 * Round monetary value to at most 2 decimal places
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validate the Three-Tier Pricing hierarchy:
 *   Retail MRP >= Base Selling Price >= Diwali Selling Price >= 0
 */
export function validateThreeTierPriceHierarchy(
  retailMrp: number,
  baseSellingPrice: number,
  diwaliSellingPrice: number,
  label: string = 'Poster'
): { valid: boolean; error?: string; normalized: ThreeTierPriceValues } {
  if (
    typeof retailMrp !== 'number' ||
    typeof baseSellingPrice !== 'number' ||
    typeof diwaliSellingPrice !== 'number' ||
    !Number.isFinite(retailMrp) ||
    !Number.isFinite(baseSellingPrice) ||
    !Number.isFinite(diwaliSellingPrice)
  ) {
    return {
      valid: false,
      error: `${label}: All three prices (Retail MRP, Base Selling Price, Diwali Selling Price) must be valid numbers.`,
      normalized: { retailMrp: 0, baseSellingPrice: 0, diwaliSellingPrice: 0 },
    };
  }

  const normMrp = roundCurrency(retailMrp);
  const normBase = roundCurrency(baseSellingPrice);
  const normDiwali = roundCurrency(diwaliSellingPrice);

  if (normMrp < 0 || normBase < 0 || normDiwali < 0) {
    return {
      valid: false,
      error: `${label}: Negative prices are not permitted.`,
      normalized: { retailMrp: normMrp, baseSellingPrice: normBase, diwaliSellingPrice: normDiwali },
    };
  }

  if (normBase <= 0 || normDiwali <= 0 || normMrp <= 0) {
    return {
      valid: false,
      error: `${label}: All prices must be greater than ₹0.`,
      normalized: { retailMrp: normMrp, baseSellingPrice: normBase, diwaliSellingPrice: normDiwali },
    };
  }

  if (normMrp < normBase) {
    return {
      valid: false,
      error: `${label}: Retail MRP (₹${normMrp}) must be greater than or equal to Base Selling Price (₹${normBase}).`,
      normalized: { retailMrp: normMrp, baseSellingPrice: normBase, diwaliSellingPrice: normDiwali },
    };
  }

  if (normBase < normDiwali) {
    return {
      valid: false,
      error: `${label}: Base Selling Price (₹${normBase}) must be greater than or equal to Diwali Selling Price (₹${normDiwali}).`,
      normalized: { retailMrp: normMrp, baseSellingPrice: normBase, diwaliSellingPrice: normDiwali },
    };
  }

  return {
    valid: true,
    normalized: {
      retailMrp: normMrp,
      baseSellingPrice: normBase,
      diwaliSellingPrice: normDiwali,
    },
  };
}

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
 * Returns the current server epoch timestamp in milliseconds
 */
export function getServerTimestampMs(): number {
  return Date.now();
}

/**
 * Format any Date into an explicit IST (Asia/Kolkata) human-readable timestamp
 */
export function formatDateInIST(date: Date = new Date()): string {
  try {
    return (
      new Intl.DateTimeFormat('en-IN', {
        timeZone: DIWALI_OFFER_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date) + ' IST'
    );
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
 * Returns true ONLY during the valid Grand Diwali Extended Offer window
 * (12 Nov 2026 1:00 PM IST to 14 Nov 2026 1:00 PM IST)
 */
export function isDiwaliOfferActive(now: Date = new Date()): boolean {
  return getDiwaliOfferStatus(now).isActive;
}

/**
 * Validates that a customer cart/checkout/custom-poster payload does not attempt
 * to select or apply any frame option, since HellFire Prints sells posters strictly without frames.
 */
export function validateNoFrameSelection(input: {
  frameId?: unknown;
  frameName?: unknown;
  frame?: unknown;
}): { valid: boolean; error?: string } {
  const hasFrameId =
    typeof input.frameId === 'string'
      ? input.frameId.trim().length > 0
      : input.frameId !== undefined && input.frameId !== null;

  const normalizedFrameName =
    typeof input.frameName === 'string' ? input.frameName.trim() : '';
  const hasSelectedFrameName =
    normalizedFrameName.length > 0 &&
    normalizedFrameName.toLowerCase() !== 'no frame' &&
    normalizedFrameName.toLowerCase() !== 'none';

  const hasFrameObject =
    input.frame !== undefined &&
    input.frame !== null &&
    (typeof input.frame === 'string'
      ? input.frame.trim().length > 0 &&
        input.frame.trim().toLowerCase() !== 'no frame' &&
        input.frame.trim().toLowerCase() !== 'none'
      : true);

  if (hasFrameId || hasSelectedFrameName || hasFrameObject) {
    return {
      valid: false,
      error: 'Frame options are no longer available. All HellFire Prints posters are sold without frames.',
    };
  }

  return { valid: true };
}

export interface SizePricingDetails {
  sizeName: string;
  /** Tier 1: Retail MRP (reference strikethrough price, NEVER charged at checkout) */
  retailMrp: number;
  /** Tier 2: Base Selling Price (charged on normal non-promotional days) */
  baseSellingPrice: number;
  /** Tier 3: Diwali Selling Price (charged during active Diwali Sale) */
  diwaliSellingPrice: number;
  /** Alias for baseSellingPrice (preserved for backward compatibility) */
  originalPrice: number;
  /** Alias for diwaliSellingPrice (preserved for backward compatibility) */
  diwaliPrice: number;
  /** Final Selling Price: diwaliSellingPrice if offer active, else baseSellingPrice */
  effectivePrice: number;
  /** Additional Diwali savings vs Base Selling Price (baseSellingPrice - diwaliSellingPrice) */
  savings: number;
  /** Explicit alias for additional Diwali savings (baseSellingPrice - diwaliSellingPrice) */
  diwaliSavings: number;
  /** Normal-day savings vs Retail MRP (retailMrp - baseSellingPrice) */
  normalDaySavings: number;
  /** Total savings vs Retail MRP at the current effectivePrice (retailMrp - effectivePrice) */
  mrpSavings: number;
  /** Active promotional discount (diwaliSavings when offer is active, else 0) */
  activeDiscount: number;
  /** Percentage discount of Diwali Selling Price off Base Selling Price */
  discountPercentage: number;
  /** Percentage discount of Effective Price off Retail MRP */
  mrpDiscountPercentage: number;
  /** Percentage discount of Base Selling Price off Retail MRP */
  normalDayDiscountPercentage: number;
  isOfferActive: boolean;
  phase: DiwaliOfferPhase;
}

function isPositiveNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val > 0;
}

/**
 * Resolve complete Three-Tier pricing details for a poster size (A3, A4, A5, A6).
 * Distinguishes:
 * A. Retail MRP (`retailMrp`): Reference retail price (never charged).
 * B. Base Selling Price (`baseSellingPrice` / `originalPrice`): Charged on normal days / after campaign expiry.
 * C. Diwali Selling Price (`diwaliSellingPrice` / `diwaliPrice`): Charged during the active Diwali campaign.
 */
export function getSizePricing(
  sizeName: string = 'A4',
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase,
  customPrices?: number | null | CustomThreeTierPriceInput
): SizePricingDetails {
  const normalized = (sizeName || 'A4').trim().toUpperCase();
  const defaultMrp = RETAIL_MRP_SIZE_PRICES[normalized] ?? RETAIL_MRP_SIZE_PRICES.A4;
  const defaultBasePrice = BASE_SELLING_SIZE_PRICES[normalized] ?? BASE_SELLING_SIZE_PRICES.A4;
  const defaultDiwaliPrice = DIWALI_SIZE_PRICES[normalized] ?? DIWALI_SIZE_PRICES.A4;

  let baseSellingPrice = defaultBasePrice;
  let diwaliSellingPrice = defaultDiwaliPrice;
  let retailMrp = defaultMrp;

  if (typeof customPrices === 'number' && Number.isFinite(customPrices) && customPrices > 0) {
    baseSellingPrice = roundCurrency(customPrices);
    diwaliSellingPrice = roundCurrency(Math.min(baseSellingPrice, defaultDiwaliPrice));
    retailMrp = roundCurrency(Math.max(defaultMrp, baseSellingPrice));
  } else if (customPrices && typeof customPrices === 'object') {
    if (isPositiveNumber(customPrices.baseSellingPrice)) {
      baseSellingPrice = roundCurrency(customPrices.baseSellingPrice);
    }
    if (isPositiveNumber(customPrices.diwaliSellingPrice)) {
      diwaliSellingPrice = roundCurrency(customPrices.diwaliSellingPrice);
    } else {
      diwaliSellingPrice = roundCurrency(Math.min(baseSellingPrice, defaultDiwaliPrice));
    }
    if (isPositiveNumber(customPrices.retailMrp)) {
      retailMrp = roundCurrency(customPrices.retailMrp);
    } else {
      retailMrp = roundCurrency(Math.max(defaultMrp, baseSellingPrice));
    }
  }

  // Enforce hierarchy safety in case legacy data has inconsistent values
  if (diwaliSellingPrice > baseSellingPrice) {
    diwaliSellingPrice = baseSellingPrice;
  }
  if (retailMrp < baseSellingPrice) {
    retailMrp = baseSellingPrice;
  }

  const status = getDiwaliOfferStatus(now);
  const phase = overridePhase ?? status.phase;
  const isOfferActive = phase === 'ACTIVE';

  // Automatic Price Selection Logic:
  // If Diwali Sale is active -> Diwali Selling Price
  // Otherwise -> Base Selling Price
  // Retail MRP is NEVER used as the checkout/charging price.
  const effectivePrice = isOfferActive ? diwaliSellingPrice : baseSellingPrice;

  const diwaliSavings = roundCurrency(Math.max(0, baseSellingPrice - diwaliSellingPrice));
  const normalDaySavings = roundCurrency(Math.max(0, retailMrp - baseSellingPrice));
  const mrpSavings = roundCurrency(Math.max(0, retailMrp - effectivePrice));
  const activeDiscount = isOfferActive ? diwaliSavings : 0;

  const discountPercentage =
    baseSellingPrice > 0 ? Math.round((diwaliSavings / baseSellingPrice) * 100) : 0;
  const mrpDiscountPercentage =
    retailMrp > 0 ? Math.round((mrpSavings / retailMrp) * 100) : 0;
  const normalDayDiscountPercentage =
    retailMrp > 0 ? Math.round((normalDaySavings / retailMrp) * 100) : 0;

  return {
    sizeName: normalized,
    retailMrp,
    baseSellingPrice,
    diwaliSellingPrice,
    originalPrice: baseSellingPrice,
    diwaliPrice: diwaliSellingPrice,
    effectivePrice,
    savings: diwaliSavings,
    diwaliSavings,
    normalDaySavings,
    mrpSavings,
    activeDiscount,
    discountPercentage,
    mrpDiscountPercentage,
    normalDayDiscountPercentage,
    isOfferActive,
    phase,
  };
}

/**
 * Full catalogue of the 4 standard poster sizes with dimensions and Three-Tier pricing
 */
export const DIWALI_POSTER_SIZE_CARDS = [
  {
    sizeName: 'A3',
    dimensions: '29.7 × 42 cm',
    tagline: 'Statement Wall Print',
    badge: 'DIWALI SPECIAL OFFER',
    retailMrp: RETAIL_MRP_SIZE_PRICES.A3,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A3,
    originalPrice: BASE_SELLING_SIZE_PRICES.A3,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A3,
    diwaliPrice: DIWALI_SIZE_PRICES.A3,
    savings: BASE_SELLING_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3,
    normalDaySavings: RETAIL_MRP_SIZE_PRICES.A3 - BASE_SELLING_SIZE_PRICES.A3,
    discountPercentage: Math.round(
      ((BASE_SELLING_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3) / BASE_SELLING_SIZE_PRICES.A3) * 100
    ),
    mrpDiscountPercentage: Math.round(
      ((RETAIL_MRP_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3) / RETAIL_MRP_SIZE_PRICES.A3) * 100
    ),
  },
  {
    sizeName: 'A4',
    dimensions: '21 × 29.7 cm',
    tagline: 'Most Popular Standard Size',
    badge: 'DIWALI SPECIAL OFFER',
    retailMrp: RETAIL_MRP_SIZE_PRICES.A4,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A4,
    originalPrice: BASE_SELLING_SIZE_PRICES.A4,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A4,
    diwaliPrice: DIWALI_SIZE_PRICES.A4,
    savings: BASE_SELLING_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4,
    normalDaySavings: RETAIL_MRP_SIZE_PRICES.A4 - BASE_SELLING_SIZE_PRICES.A4,
    discountPercentage: Math.round(
      ((BASE_SELLING_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4) / BASE_SELLING_SIZE_PRICES.A4) * 100
    ),
    mrpDiscountPercentage: Math.round(
      ((RETAIL_MRP_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4) / RETAIL_MRP_SIZE_PRICES.A4) * 100
    ),
  },
  {
    sizeName: 'A5',
    dimensions: '14.8 × 21 cm',
    tagline: 'Desk & Gallery Setup',
    badge: 'DIWALI SPECIAL OFFER',
    retailMrp: RETAIL_MRP_SIZE_PRICES.A5,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A5,
    originalPrice: BASE_SELLING_SIZE_PRICES.A5,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A5,
    diwaliPrice: DIWALI_SIZE_PRICES.A5,
    savings: BASE_SELLING_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5,
    normalDaySavings: RETAIL_MRP_SIZE_PRICES.A5 - BASE_SELLING_SIZE_PRICES.A5,
    discountPercentage: Math.round(
      ((BASE_SELLING_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5) / BASE_SELLING_SIZE_PRICES.A5) * 100
    ),
    mrpDiscountPercentage: Math.round(
      ((RETAIL_MRP_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5) / RETAIL_MRP_SIZE_PRICES.A5) * 100
    ),
  },
  {
    sizeName: 'A6',
    dimensions: '10.5 × 14.8 cm',
    tagline: 'Collectible Mini Print',
    badge: 'DIWALI SPECIAL OFFER',
    retailMrp: RETAIL_MRP_SIZE_PRICES.A6,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A6,
    originalPrice: BASE_SELLING_SIZE_PRICES.A6,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A6,
    diwaliPrice: DIWALI_SIZE_PRICES.A6,
    savings: BASE_SELLING_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6,
    normalDaySavings: RETAIL_MRP_SIZE_PRICES.A6 - BASE_SELLING_SIZE_PRICES.A6,
    discountPercentage: Math.round(
      ((BASE_SELLING_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6) / BASE_SELLING_SIZE_PRICES.A6) * 100
    ),
    mrpDiscountPercentage: Math.round(
      ((RETAIL_MRP_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6) / RETAIL_MRP_SIZE_PRICES.A6) * 100
    ),
  },
] as const;

export interface VariantLike {
  price?: number | null;
  retailMrp?: number | null;
  baseSellingPrice?: number | null;
  diwaliSellingPrice?: number | null;
  additionalPrice?: number | null;
  size?: {
    name?: string;
    additionalPrice?: number;
  } | null;
}

/**
 * Resolves full Three-Tier pricing details (retailMrp, baseSellingPrice, diwaliSellingPrice, effectivePrice, savings)
 * for a product variant. Respects administrator-customized prices stored on the variant or product.
 * Strictly excludes any frame surcharges as posters are sold without frames.
 */
export function getVariantPricing(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = BASE_SELLING_SIZE_PRICES.A4,
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase,
  fallbackProductMrp?: number | null,
  fallbackProductDiwaliPrice?: number | null
): SizePricingDetails {
  const sizeName = variant?.size?.name?.trim().toUpperCase();

  if (sizeName && sizeName in BASE_SELLING_SIZE_PRICES) {
    const customBase = isPositiveNumber(variant?.baseSellingPrice)
      ? variant!.baseSellingPrice
      : isPositiveNumber(variant?.price)
      ? variant!.price
      : sizeName === 'A4' && isPositiveNumber(fallbackProductPrice)
      ? fallbackProductPrice
      : undefined;

    const customMrp = isPositiveNumber(variant?.retailMrp)
      ? variant!.retailMrp
      : sizeName === 'A4' && isPositiveNumber(fallbackProductMrp)
      ? fallbackProductMrp
      : undefined;

    const customDiwali = isPositiveNumber(variant?.diwaliSellingPrice)
      ? variant!.diwaliSellingPrice
      : sizeName === 'A4' && isPositiveNumber(fallbackProductDiwaliPrice)
      ? fallbackProductDiwaliPrice
      : undefined;

    return getSizePricing(sizeName, now, overridePhase, {
      retailMrp: customMrp,
      baseSellingPrice: customBase,
      diwaliSellingPrice: customDiwali,
    });
  }

  // Fallback for any custom or legacy non-standard size (strictly without frame charges)
  let fallbackBase = isPositiveNumber(fallbackProductPrice)
    ? fallbackProductPrice
    : BASE_SELLING_SIZE_PRICES.A4;
  if (isPositiveNumber(variant?.baseSellingPrice)) {
    fallbackBase = variant!.baseSellingPrice!;
  } else if (isPositiveNumber(variant?.price)) {
    fallbackBase = variant!.price!;
  } else if (variant) {
    fallbackBase =
      fallbackBase +
      (variant.size?.additionalPrice || 0) +
      (variant.additionalPrice || 0);
  }

  const fallbackMrp = isPositiveNumber(variant?.retailMrp)
    ? Math.max(fallbackBase, variant!.retailMrp!)
    : isPositiveNumber(fallbackProductMrp)
    ? Math.max(fallbackBase, fallbackProductMrp!)
    : Math.max(fallbackBase, RETAIL_MRP_SIZE_PRICES.A4);

  const fallbackDiwali = isPositiveNumber(variant?.diwaliSellingPrice)
    ? Math.min(fallbackBase, variant!.diwaliSellingPrice!)
    : isPositiveNumber(fallbackProductDiwaliPrice)
    ? Math.min(fallbackBase, fallbackProductDiwaliPrice!)
    : fallbackBase;

  return getSizePricing(sizeName || 'A4', now, overridePhase, {
    retailMrp: fallbackMrp,
    baseSellingPrice: fallbackBase,
    diwaliSellingPrice: fallbackDiwali,
  });
}

/**
 * Resolves the authoritative effective unit price for a product variant.
 * Returns the Diwali Selling Price when the offer is ACTIVE, and the
 * Base Selling Price when UPCOMING or EXPIRED. Never returns Retail MRP.
 */
export function getVariantUnitPrice(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = BASE_SELLING_SIZE_PRICES.A4,
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase,
  fallbackProductMrp?: number | null,
  fallbackProductDiwaliPrice?: number | null
): number {
  return getVariantPricing(
    variant,
    fallbackProductPrice,
    now,
    overridePhase,
    fallbackProductMrp,
    fallbackProductDiwaliPrice
  ).effectivePrice;
}

/**
 * Resolves the authoritative Base Selling Price (normal-day price) for a product variant.
 */
export function getVariantOriginalPrice(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = BASE_SELLING_SIZE_PRICES.A4,
  fallbackProductMrp?: number | null,
  fallbackProductDiwaliPrice?: number | null
): number {
  return getVariantPricing(
    variant,
    fallbackProductPrice,
    new Date(),
    undefined,
    fallbackProductMrp,
    fallbackProductDiwaliPrice
  ).baseSellingPrice;
}

/**
 * Resolves the authoritative Retail MRP for a product variant.
 */
export function getVariantRetailMrp(
  variant: VariantLike | null | undefined,
  fallbackProductPrice: number = BASE_SELLING_SIZE_PRICES.A4,
  fallbackProductMrp?: number | null,
  fallbackProductDiwaliPrice?: number | null
): number {
  return getVariantPricing(
    variant,
    fallbackProductPrice,
    new Date(),
    undefined,
    fallbackProductMrp,
    fallbackProductDiwaliPrice
  ).retailMrp;
}
