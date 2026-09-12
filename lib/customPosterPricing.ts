import { DEFAULT_SIZE_PRICES, SIZE_DISPLAY_DIMENSIONS, AllowedSize } from '@/lib/pricing';

export interface CustomPosterConfig {
  sizeName: string;
  paperType?: string;
  frameName?: string;
}

export const POSTER_SIZES = [
  { name: 'A6', dimensions: SIZE_DISPLAY_DIMENSIONS.A6, price: DEFAULT_SIZE_PRICES.A6, additionalPrice: 0, aspectRatio: 10.5 / 14.8 },
  { name: 'A5', dimensions: SIZE_DISPLAY_DIMENSIONS.A5, price: DEFAULT_SIZE_PRICES.A5, additionalPrice: 0, aspectRatio: 14.8 / 21 },
  { name: 'A4', dimensions: SIZE_DISPLAY_DIMENSIONS.A4, price: DEFAULT_SIZE_PRICES.A4, additionalPrice: 0, aspectRatio: 21 / 29.7 },
  { name: 'A3', dimensions: SIZE_DISPLAY_DIMENSIONS.A3, price: DEFAULT_SIZE_PRICES.A3, additionalPrice: 0, aspectRatio: 29.7 / 42 },
];

export const PAPER_TYPES = [
  { name: 'Matte', description: 'Matte Premium (300 GSM)', additionalPrice: 0 },
];

export const FRAME_FINISHES = [
  { name: 'No Frame', description: 'Unframed / Poster Only', additionalPrice: 0 },
];

export const BASE_PRICE = 0;

export function calculateCustomPosterPrice(config: Partial<CustomPosterConfig>): number {
  const sizeName = (config.sizeName || 'A4') as AllowedSize;
  return DEFAULT_SIZE_PRICES[sizeName] ?? 59;
}

