# WALKTHROUGH: HellFire Prints — Diwali Extended Offer 2026 Pricing Update

## 1. Executive Summary

This document covers the targeted promotional pricing update for the ongoing **Diwali Extended Offer 2026** across the **HellFire Prints** e-commerce platform. Only the **Diwali Selling Price** tier has been updated to the new promotional values (`A3: ₹40`, `A4: ₹20`, `A5: ₹10`, `A6: ₹5`), while preserving the Three-Tier Pricing Architecture (`Retail MRP` and `Normal Days Base Selling Price`), existing product/variant IDs, multi-piece set custom configurations, Admin Dashboard Three-Tier controls, the 48-hour IST campaign schedule (`12 November 2026 — 1:00 PM IST` to `14 November 2026 — 1:00 PM IST`), Frame Removal, Custom Poster Studio, Razorpay & Cash on Delivery (COD) checkout pipelines, and the `₹30` Minimum Order Value.

---

## 2. Previous vs. New Promotional Prices

| Poster Size | Retail MRP (Unchanged) | Normal Days Base Selling Price (Unchanged) | Previous Diwali Extended Price | **New Diwali Extended Selling Price** | Discount vs. Base Price | Discount vs. Retail MRP |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **A3** (`11.7" × 16.5"`) | `₹99` | `₹49` | `₹32` | **`₹40`** | `18% OFF` (`Save ₹9`) | `60% OFF` (`Save ₹59`) |
| **A4** (`8.3" × 11.7"`) | `₹59` | `₹29` | `₹16` | **`₹20`** | `31% OFF` (`Save ₹9`) | `66% OFF` (`Save ₹39`) |
| **A5** (`5.8" × 8.3"`) | `₹39` | `₹15` | `₹8` | **`₹10`** | `33% OFF` (`Save ₹5`) | `74% OFF` (`Save ₹29`) |
| **A6** (`4.1" × 5.8"`) | `₹19` | `₹7` | `₹4` | **`₹5`** | `29% OFF` (`Save ₹2`) | `74% OFF` (`Save ₹14`) |

---

## 3. Database Changes & Safe Bulk Pricing Update

- **Script Executed**: `scratch/update-diwali-extended-prices.ts`
- **Targeted Updates**:
  - Updated `ProductVariant.diwaliSellingPrice` by poster size (`A3 → ₹40`, `A4 → ₹20`, `A5 → ₹10`, `A6 → ₹5`) without altering `id`, `productId`, `sizeId`, `retailMrp`, `baseSellingPrice`, or `price`.
  - Updated standard single-poster `Product.diwaliPrice` to `₹20` (matching the default `A4` size) while preserving `Product.MRP`, `Product.price`, and admin-configured multi-piece set pricing (`3 Piece Set`, `10 Piece Set`, `50 Epic Music Collage Set`).
- **Zero Destructive Operations**:
  - **56 / 56** `Product` records preserved with identical IDs.
  - **610 / 610** `ProductVariant` records preserved with identical IDs.
  - **53 / 53** historical `Order` records and **99 / 99** `OrderItem` records preserved completely untouched.

---

## 4. Files Modified

| File | Summary of Changes |
| :--- | :--- |
| `lib/pricing.ts` | Updated `DIWALI_SIZE_PRICES` to `{ A3: 40, A4: 20, A5: 10, A6: 5 }`. Automatically updates `DIWALI_POSTER_SIZE_CARDS`, `getSizePricing()`, `getVariantPricing()`, `lib/customPosterPricing.ts`, and `lib/constants.ts`. |
| `app/page.tsx` | Updated `DiyaSectionDivider` (`FESTIVE COLLECTION • A3 ₹40 • A4 ₹20 • A5 ₹10 • A6 ₹5`) and Custom Poster Studio festive callout (`A6 at ₹5 (~~₹7~~), A5 at ₹10 (~~₹15~~), A4 at ₹20 (~~₹29~~), and A3 at ₹40 (~~₹49~~)`). |
| `app/cart/page.tsx` | Updated upcoming Extended Offer banner (`A3 ₹40, A4 ₹20, A5 ₹10, A6 ₹5`) and empty-cart callout (`Posters starting at just ₹5!`). |
| `components/CheckoutPageClient.tsx` | Updated upcoming Extended Offer notice (`A3 ₹40, A4 ₹20, A5 ₹10, A6 ₹5`). |
| `components/DiwaliHeroSection.tsx` | Updated size showcase cards to display the full three-tier hierarchy (`Retail MRP: ~~₹99~~`, `Normal Selling Price: ~~₹49~~`, `DIWALI EXTENDED OFFER: ₹40`). |
| `components/ProductDetails.tsx` | Updated product detail pricing card and per-size selector buttons to display `Retail MRP: ~~₹99~~`, `Normal Selling Price: ~~₹49~~`, and `DIWALI EXTENDED OFFER: ₹40` dynamically from each product's database configuration. |
| `scratch/update-diwali-extended-prices.ts` | Non-destructive database update script for `ProductVariant.diwaliSellingPrice` and `Product.diwaliPrice`. |
| `scratch/test-diwali-extended-pricing-update.ts` | 15-point automated verification suite covering database integrity, Three-Tier pricing, Admin controls, Cart/Checkout totals, Razorpay, COD, Minimum Order Value, and campaign expiration. |
| `scratch/test-extended-offer-and-frame-removal.ts` | Updated assertions to reflect the new `₹40 / ₹20 / ₹10 / ₹5` Diwali Extended Offer prices (`31 / 31` checks passing). |

---

## 5. Backend Pricing & Checkout Validation

1. **Dynamic Price Resolution (`lib/pricing.ts` & `lib/discounts.ts`)**:
   - `calculateCartTotal()` resolves every cart item (`ProductVariant` and `CustomPoster`) on the server using `getVariantPricing(variant, product.price, now)` and `calculateCustomPosterPrice({ sizeName }, now)`.
   - During the active campaign window (`12 Nov 2026 1:00 PM IST` – `14 Nov 2026 1:00 PM IST`), `effectivePrice` resolves to `diwaliSellingPrice` (`₹40 / ₹20 / ₹10 / ₹5` for standard single posters, or the product's custom `diwaliSellingPrice` for multi-piece sets).
   - Once the campaign expires after `14 Nov 2026 1:00 PM IST`, `effectivePrice` automatically reverts to `baseSellingPrice` (`₹49 / ₹29 / ₹15 / ₹7`).
2. **Razorpay & Cash on Delivery (COD) Server-Side Enforcement**:
   - `app/api/razorpay/route.ts` and `app/checkout/actions.ts` recompute `calculateCartTotal(cart.id)` on the server and never trust client-submitted prices.
   - Razorpay receives `Math.round(cartBreakdown.total * 100)` in paise (e.g., `2 × A4 @ ₹20 + 1 × A3 @ ₹40 = ₹80` → `8000` paise).
   - COD records `cartBreakdown.total` (`₹80`) directly on the created `Order`.
3. **Minimum Order Value (`₹30`)**:
   - `MINIMUM_ORDER_VALUE = 30` remains strictly enforced across the Cart, Checkout UI, `/api/razorpay`, and `createOrder` server actions.

---

## 6. Frontend Display Changes

Across the Homepage Hero (`components/DiwaliHeroSection.tsx`), Product Cards (`components/ProductCard.tsx`), Product Detail pages (`components/ProductDetails.tsx`), Custom Poster Studio (`components/CustomPosterModal.tsx`), Cart (`app/cart/page.tsx`), and Checkout (`components/CheckoutPageClient.tsx`), customers see the clear three-tier pricing breakdown during the active offer:

- **A3 Example**:
  - `Retail MRP: ~~₹99~~`
  - `Normal Selling Price: ~~₹49~~`
  - `DIWALI EXTENDED OFFER: ₹40`
- **A4 Example**:
  - `Retail MRP: ~~₹59~~`
  - `Normal Selling Price: ~~₹29~~`
  - `DIWALI EXTENDED OFFER: ₹20`
- **A5 Example**:
  - `Retail MRP: ~~₹39~~`
  - `Normal Selling Price: ~~₹15~~`
  - `DIWALI EXTENDED OFFER: ₹10`
- **A6 Example**:
  - `Retail MRP: ~~₹19~~`
  - `Normal Selling Price: ~~₹7~~`
  - `DIWALI EXTENDED OFFER: ₹5`

---

## 7. Admin Functionality Preserved

- **Admin → Products (`components/ProductForm.tsx` & `app/admin/actions.ts`)**:
  - Authenticated administrators retain full, independent editing control over all three pricing fields (`Retail MRP`, `Base Selling Price`, and `Diwali Selling Price`) for every poster size (`A3`, `A4`, `A5`, `A6`).
  - Default values for new products or newly toggled sizes automatically pre-fill with the updated Diwali Extended Offer prices (`A3: ₹40`, `A4: ₹20`, `A5: ₹10`, `A6: ₹5`).
  - Server-side validation (`validateThreeTierPriceHierarchy`) enforces `Retail MRP >= Base Selling Price >= Diwali Selling Price > 0`.
  - The Admin Dashboard retains its clean, pre-Diwali UI.

---

## 8. Testing Performed

1. **`npx tsx scratch/test-diwali-extended-pricing-update.ts` (`15 / 15 Passed`)**:
   - `[Check 1]` All 56 products and global announcement/notice tickers reflect the updated Diwali Extended Offer prices.
   - `[Check 2]` `A3` Diwali Extended Selling Price is `₹40`.
   - `[Check 3]` `A4` Diwali Extended Selling Price is `₹20`.
   - `[Check 4]` `A5` Diwali Extended Selling Price is `₹10`.
   - `[Check 5]` `A6` Diwali Extended Selling Price is `₹5`.
   - `[Check 6]` `Retail MRP` (`₹99 / ₹59 / ₹39 / ₹19` and product-specific MRPs) remains completely unchanged.
   - `[Check 7]` `Base Selling Price` (`₹49 / ₹29 / ₹15 / ₹7` and multi-piece set Base Prices) remains completely unchanged.
   - `[Check 8]` Admins can independently edit all three pricing fields in `Admin → Products`.
   - `[Check 9]` Cart calculations (`2 × A4 + 1 × A3` → `MRP ₹217`, `Base ₹107`, `Diwali Discount -₹27`, `Total ₹80`) are accurate.
   - `[Check 10]` Checkout & Custom Poster Studio calculations match `₹40 / ₹20 / ₹10 / ₹5`.
   - `[Check 11]` Razorpay receives the exact final amount in paise (`8000` paise for `₹80`).
   - `[Check 12]` Cash on Delivery (COD) uses the exact final amount (`₹80`).
   - `[Check 13]` Minimum order value of `₹30` remains enforced (`1 × A4 = ₹20` blocked with `₹10` shortfall).
   - `[Check 14]` Extended Offer schedule (`12 Nov 2026 1:00 PM IST` to `14 Nov 2026 1:00 PM IST`) is preserved and expiration automatically restores Base Selling Prices (`₹107`).
   - `[Check 15]` All 53 historical orders and 99 order items remain 100% unchanged.
2. **`npx tsx scratch/test-extended-offer-and-frame-removal.ts` (`31 / 31 Passed`)**:
   - Verified end-to-end compatibility with Frame Removal, Custom Poster Studio, and the 48-hour Extended Offer countdown.
3. **Static Typecheck, Lint & Production Build**:
   - `npx tsc --noEmit` — 0 errors.
   - `npm run lint` — 0 errors.
   - `npx next build` — Clean production build across all routes.

---

## 9. Outstanding Issues

- **None.** All requirements have been implemented and verified.

