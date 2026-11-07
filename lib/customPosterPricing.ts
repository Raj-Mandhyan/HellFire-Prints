import {
  RETAIL_MRP_SIZE_PRICES,
  BASE_SELLING_SIZE_PRICES,
  ORIGINAL_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
  getSizePricing,
  DiwaliOfferPhase,
} from './pricing';

export const POSTER_SIZES = [
  {
    name: 'A6',
    dimensions: '10.5 × 14.8 cm',
    aspectRatio: 10.5 / 14.8,
    retailMrp: RETAIL_MRP_SIZE_PRICES.A6,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A6,
    price: ORIGINAL_SIZE_PRICES.A6,
    originalPrice: ORIGINAL_SIZE_PRICES.A6,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A6,
    diwaliPrice: DIWALI_SIZE_PRICES.A6,
    savings: BASE_SELLING_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A6 - DIWALI_SIZE_PRICES.A6,
    badge: 'DIWALI SPECIAL OFFER',
  },
  {
    name: 'A5',
    dimensions: '14.8 × 21 cm',
    aspectRatio: 14.8 / 21,
    retailMrp: RETAIL_MRP_SIZE_PRICES.A5,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A5,
    price: ORIGINAL_SIZE_PRICES.A5,
    originalPrice: ORIGINAL_SIZE_PRICES.A5,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A5,
    diwaliPrice: DIWALI_SIZE_PRICES.A5,
    savings: BASE_SELLING_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A5 - DIWALI_SIZE_PRICES.A5,
    badge: 'DIWALI SPECIAL OFFER',
  },
  {
    name: 'A4',
    dimensions: '21 × 29.7 cm',
    aspectRatio: 21 / 29.7,
    retailMrp: RETAIL_MRP_SIZE_PRICES.A4,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A4,
    price: ORIGINAL_SIZE_PRICES.A4,
    originalPrice: ORIGINAL_SIZE_PRICES.A4,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A4,
    diwaliPrice: DIWALI_SIZE_PRICES.A4,
    savings: BASE_SELLING_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A4 - DIWALI_SIZE_PRICES.A4,
    badge: 'DIWALI SPECIAL OFFER',
  },
  {
    name: 'A3',
    dimensions: '29.7 × 42 cm',
    aspectRatio: 29.7 / 42,
    retailMrp: RETAIL_MRP_SIZE_PRICES.A3,
    baseSellingPrice: BASE_SELLING_SIZE_PRICES.A3,
    price: ORIGINAL_SIZE_PRICES.A3,
    originalPrice: ORIGINAL_SIZE_PRICES.A3,
    diwaliSellingPrice: DIWALI_SIZE_PRICES.A3,
    diwaliPrice: DIWALI_SIZE_PRICES.A3,
    savings: BASE_SELLING_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3,
    mrpSavings: RETAIL_MRP_SIZE_PRICES.A3 - DIWALI_SIZE_PRICES.A3,
    badge: 'DIWALI SPECIAL OFFER',
  },
];

export const PAPER_TYPES = [
  { name: 'Matte', additionalPrice: 0 },
  { name: 'Glossy', additionalPrice: 0 },
  { name: 'Premium Heavyweight', additionalPrice: 0 },
];

export const FRAME_OPTIONS = [
  { name: 'No Frame', additionalPrice: 0 },
  { name: 'Black Frame', additionalPrice: 0 },
  { name: 'White Frame', additionalPrice: 0 },
  { name: 'Wooden Frame', additionalPrice: 0 },
];

export function calculateCustomPosterPrice(
  config: {
    sizeName: string;
    paperType?: string;
    frameName?: string;
  },
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase
): number {
  const details = getSizePricing(config.sizeName || 'A4', now, overridePhase);
  return details.effectivePrice;
}

export function getCustomPosterPricingDetails(
  sizeName: string = 'A4',
  now: Date = new Date(),
  overridePhase?: DiwaliOfferPhase
) {
  return getSizePricing(sizeName || 'A4', now, overridePhase);
}
