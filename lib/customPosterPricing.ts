export interface CustomPosterConfig {
  sizeName: string;
  paperType: string;
  frameName: string;
}

export const POSTER_SIZES = [
  { name: 'A4', dimensions: '21 x 29.7 cm', additionalPrice: 0, aspectRatio: 21 / 29.7 },
  { name: 'A3', dimensions: '29.7 x 42 cm', additionalPrice: 199, aspectRatio: 29.7 / 42 },
  { name: 'A2', dimensions: '42 x 59.4 cm', additionalPrice: 449, aspectRatio: 42 / 59.4 },
  { name: '12 × 18 inch', dimensions: '30.5 x 45.7 cm', additionalPrice: 249, aspectRatio: 12 / 18 },
  { name: '18 × 24 inch', dimensions: '45.7 x 61 cm', additionalPrice: 549, aspectRatio: 18 / 24 },
  { name: '24 × 36 inch', dimensions: '61 x 91.4 cm', additionalPrice: 999, aspectRatio: 24 / 36 },
];

export const PAPER_TYPES = [
  { name: 'Matte', description: 'Matte Premium (300 GSM)', additionalPrice: 0 },
  { name: 'Glossy', description: 'Glossy Metallic (320 GSM)', additionalPrice: 49 },
  { name: 'Premium Matte', description: 'Archival Matte (350 GSM)', additionalPrice: 99 },
  { name: 'Fine Art', description: 'Cotton Rag Fine Art (380 GSM)', additionalPrice: 199 },
];

export const FRAME_FINISHES = [
  { name: 'No Frame', description: 'Unframed / Poster Only', additionalPrice: 0 },
  { name: 'Black', description: 'Matte Black Classic Frame', additionalPrice: 149 },
  { name: 'White', description: 'Minimalist White Frame', additionalPrice: 149 },
  { name: 'Wooden', description: 'Premium Natural Oak Frame', additionalPrice: 299 },
];

export const BASE_PRICE = 499;

export function calculateCustomPosterPrice(config: Partial<CustomPosterConfig>): number {
  let price = BASE_PRICE;

  const size = POSTER_SIZES.find(s => s.name === config.sizeName);
  if (size) {
    price += size.additionalPrice;
  }

  const paper = PAPER_TYPES.find(p => p.name === config.paperType);
  if (paper) {
    price += paper.additionalPrice;
  }

  const frame = FRAME_FINISHES.find(f => f.name === config.frameName);
  if (frame) {
    price += frame.additionalPrice;
  }

  return price;
}
