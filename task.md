# Task: Product-Specific Size Pricing

- [x] Update `prisma/schema.prisma` with `price Float?` on `ProductVariant` <!-- id: 0 -->
- [x] Push schema changes and generate Prisma Client <!-- id: 1 -->
- [x] Create `lib/pricing.ts` helper and run backfill for existing variants <!-- id: 2 -->
- [x] Update `prisma/seed.ts` to use new default prices (A6: 19, A5: 39, A4: 59, A3: 99) <!-- id: 3 -->
- [x] Update Admin New Product form in `components/ProductForm.tsx` & `app/admin/actions.ts` <!-- id: 4 -->
- [x] Update Admin Edit Product page & action (`app/admin/products/[id]/edit/page.tsx`, `ProductForm.tsx`, `updateProductAction`) <!-- id: 5 -->
- [x] Update Storefront size selection and pricing in `components/ProductDetails.tsx` <!-- id: 6 -->
- [x] Update Cart, Checkout, and Order creation pipeline (`app/api/cart/route.ts`, `lib/discounts.ts`, `app/checkout/page.tsx`, `app/actions/order.ts`) <!-- id: 7 -->
- [x] Run Prisma generation, TypeScript check, ESLint, and Next.js production build <!-- id: 8 -->
- [x] Perform comprehensive functional verification (create product, edit product, storefront, cart, checkout, Razorpay, isolation, order preservation) <!-- id: 9 -->
