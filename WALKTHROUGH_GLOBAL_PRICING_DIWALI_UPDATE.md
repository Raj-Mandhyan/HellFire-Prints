# WALKTHROUGH: HELLFIRE PRINTS — GLOBAL PRODUCT PRICING UPDATE & DIWALI DISCOUNT DISPLAY

**Project:** HellFire Prints (`Try_3`)  
**Database:** Neon Serverless PostgreSQL (`neondb`, Prisma v7.9.1)  
**Date:** November 2026  

---

## 1. Existing Pricing Architecture Inspection

Before modifying any pricing configuration or database records, the full pricing pipeline across the database schema, server actions, pricing utilities, and storefront components was inspected (`scratch/inspect-pricing-and-backup.ts`) and backed up to `backups/neondb-backup-before-global-pricing-update.json`.

### Database Schema (`prisma/schema.prisma`)
- **`Product`**:
  - `price` (`Float`): Stores the product's base/default regular price (corresponding to the standard `A4` poster size).
  - `MRP` (`Float`): Manufacturer retail price reference.
  - `discount` (`Float`, default `0`): Non-festival percentage discount field.
- **`ProductSize`**:
  - Stores poster size definitions (`A3`, `A4`, `A5`, `A6`, plus legacy `A1`, `A2`) with `name`, `dimensions`, `width`, `height`, and `additionalPrice`.
- **`ProductVariant`**:
  - Links each `Product` to a `ProductSize` (`sizeId`) and optional `ProductFrame` (`frameId`).
  - `price` (`Float?`): Stores the explicit regular price for that specific `(productId, sizeId)` combination.
  - `stock` (`Int`) and `SKU` (`String`).

### Application Pricing Layer (`lib/pricing.ts`, `lib/discounts.ts`, `lib/customPosterPricing.ts`)
- **`lib/pricing.ts`** is the single source of truth for:
  - Default regular poster prices by size (`REGULAR_SIZE_PRICES` / `ORIGINAL_SIZE_PRICES` / `DEFAULT_SIZE_PRICES`).
  - Diwali Offer promotional prices by size (`DIWALI_SIZE_PRICES`).
  - Strict IST (`Asia/Kolkata`, `UTC+05:30`) campaign window evaluation (`getDiwaliOfferStatus()`).
  - Size-level and variant-level pricing resolution (`getSizePricing()` and `getVariantPricing()`).
- **`lib/discounts.ts`** (`calculateCartTotal()`) computes cart subtotals, Diwali savings, coupon discounts, and enforces the `₹30` minimum order value (`MINIMUM_ORDER_VALUE = 30`).
- **`lib/customPosterPricing.ts`** (`calculateCustomPosterPrice()` and `getCustomPosterPricingDetails()`) delegates Custom Poster Studio pricing to `getSizePricing()` in `lib/pricing.ts`.

---

## 2. How Regular/Default Prices Are Stored

Regular (non-promotional) poster prices are stored in two synchronized locations:
1. **Database Records (`Product` & `ProductVariant` tables in `neondb`)**:
   - Every `Product` record stores `price = 29` (the standard `A4` regular price).
   - Every `ProductVariant` record stores the explicit size-specific regular price in `ProductVariant.price`:
     - `A3` variants: `price = 49`
     - `A4` variants: `price = 29`
     - `A5` variants: `price = 15`
     - `A6` variants: `price = 7`
2. **Centralized Default Configuration (`lib/pricing.ts`)**:
   ```ts
   export const ORIGINAL_SIZE_PRICES: Record<string, number> = {
     A3: 49,
     A4: 29,
     A5: 15,
     A6: 7,
   };
   export const REGULAR_SIZE_PRICES = ORIGINAL_SIZE_PRICES;
   export const DEFAULT_SIZE_PRICES = ORIGINAL_SIZE_PRICES;
   ```
   When a new product is created in **Admin → Products → Add New Product** (`components/ProductForm.tsx` and `createProductAction` in `app/admin/actions.ts`), its form inputs pre-fill with `DEFAULT_SIZE_PRICES` (`A6: ₹7`, `A5: ₹15`, `A4: ₹29`, `A3: ₹49`) and persist those values into `Product.price` and `ProductVariant.price`.

---

## 3. How All Existing Products Were Updated to the New Regular Prices

A dedicated bulk database update and verification script (`scratch/execute-global-pricing-update.ts`) was executed against `neondb`:
1. **Pre-Update Backup**: Saved full database state to `backups/neondb-backup-before-global-pricing-update.json`.
2. **Bulk Product Base Price Update**:
   - Updated all existing `Product` records via `prisma.product.updateMany({ data: { price: 29 } })`.
3. **Bulk Size Variant Price Update**:
   - Updated all `A3` `ProductVariant` records to `price = 49`.
   - Updated all `A4` `ProductVariant` records to `price = 29`.
   - Updated all `A5` `ProductVariant` records to `price = 15`.
   - Updated all `A6` `ProductVariant` records to `price = 7`.
4. **Completeness Verification**:
   - Verified that every existing product in the catalogue has `ProductVariant` rows for all four poster sizes (`A3`, `A4`, `A5`, `A6`) with `0` mismatches.
   - Zero products, product IDs, slugs, descriptions, images, categories, reviews, likes, or historical orders were deleted or altered.

| Poster Size | Previous Regular Price | New Global Regular Price |
|---|---:|---:|
| **A3** | ₹99 | **₹49** |
| **A4** | ₹59 | **₹29** |
| **A5** | ₹39 | **₹15** |
| **A6** | ₹19 | **₹7** |

---

## 4. How Diwali Promotional Prices Are Configured

Diwali promotional prices are maintained as a separate promotional layer in `lib/pricing.ts` (`DIWALI_SIZE_PRICES`) and are **never** written over the stored regular prices in `Product.price` or `ProductVariant.price`:

```ts
export const DIWALI_SIZE_PRICES: Record<string, number> = {
  A3: 32,
  A4: 16,
  A5: 8,
  A6: 4,
};
```

| Poster Size | Regular Price (Stored) | Diwali Offer Price (Promotional Layer) | Customer Savings | Discount % |
|---|---:|---:|---:|---:|
| **A3** | ₹49 | **₹32** | **₹17** | 35% OFF |
| **A4** | ₹29 | **₹16** | **₹13** | 45% OFF |
| **A5** | ₹15 | **₹8** | **₹7** | 47% OFF |
| **A6** | ₹7 | **₹4** | **₹3** | 43% OFF |

- **Campaign Window (`Asia/Kolkata`, `UTC+05:30`)**:
  - **Starts**: `6 November 2026, 8:00 PM IST` (`2026-11-06T20:00:00+05:30`)
  - **Ends**: `9 November 2026, 4:00 AM IST` (`2026-11-09T04:00:00+05:30`)
- When the current server time is within the active window, `effectivePrice` resolves to `diwaliPrice` (`₹32 / ₹16 / ₹8 / ₹4`).
- Outside the window (before `6 Nov 2026 8:00 PM IST` or at/after `9 Nov 2026 4:00 AM IST`), `effectivePrice` automatically resolves to the product's stored regular price (`originalPrice`).

---

## 5. How Strikethrough Regular Prices and Diwali Prices Are Displayed

Across all customer-facing components, `getSizePricing()` and `getVariantPricing()` return `{ originalPrice, diwaliPrice, effectivePrice, savings, discountPercentage, isOfferActive }`:
- **Hero Section (`components/DiwaliHeroSection.tsx`)**:
  - Displays the four interactive size cards (`DIWALI_POSTER_SIZE_CARDS`) with struck-through regular prices (`~~₹49~~ → ₹32`, `~~₹29~~ → ₹16`, `~~₹15~~ → ₹8`, `~~₹7~~ → ₹4`), a `<badge>DIWALI OFFER</badge>` pill on A3, and explicit savings (`SAVE ₹17`, `SAVE ₹13`, `SAVE ₹7`, `SAVE ₹3`).
- **Top Announcement & Marquee Strips (`components/Navbar.tsx`, `lib/constants.ts`, `app/page.tsx`)**:
  - Dynamically display `A3 ~~₹49~~ ₹32 • A4 ~~₹29~~ ₹16 • A5 ~~₹15~~ ₹8 • A6 ~~₹7~~ ₹4`.
- **Product Catalogue Cards (`components/ProductCatalog.tsx`)**:
  - Each `ProductCard` resolves the product's `A4` regular price (`a4Pricing.originalPrice`, default `₹29` or admin-customized) and displays:
    - Top badge: `DIWALI SALE • 45% OFF` and `A6 FROM ₹4 (~~₹7~~)`.
    - Price block: `~~₹29~~` (strikethrough) `₹16 (A4)` with `SAVE ₹13` and `Festive Price` badges.
- **Product Detail Page (`components/ProductDetails.tsx`)**:
  - **Main Price Banner**: Displays `<badge>DIWALI SPECIAL OFFER</badge>`, the selected size's struck-through regular price (`~~₹49~~` / `~~₹29~~` / `~~₹15~~` / `~~₹7~~`), the glowing gold Diwali price (`₹32` / `₹16` / `₹8` / `₹4`), and `You Save ₹17 (35% OFF)`.
  - **Size Selector Grid (`A3`, `A4`, `A5`, `A6`)**: Each size card shows its dimensions, `~~₹49~~ → ₹32 (Save ₹17)`, `~~₹29~~ → ₹16 (Save ₹13)`, `~~₹15~~ → ₹8 (Save ₹7)`, `~~₹7~~ → ₹4 (Save ₹3)`.
  - **Poster Size Reference Guide (`components/PosterSizeReference.tsx`)**: Visual size comparison diagram displays `~~₹49~~ → ₹32`, `~~₹29~~ → ₹16`, `~~₹15~~ → ₹8`, and `~~₹7~~ → ₹4`.

---

## 6. How the Admin → Products Interface Was Preserved

- **Zero Visual Changes to Admin UI**:
  - `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/products/page.tsx`, `app/admin/products/new/page.tsx`, `app/admin/products/[id]/edit/page.tsx`, `components/ProductListTable.tsx`, and `components/ProductForm.tsx` remain in their clean, standard administrative layout without any Diwali banners, fireworks, or festive styling.
- **Admin Price Editing Controls Intact**:
  - In `components/ProductForm.tsx`, administrators have the **Size-Specific Pricing (₹)** section with individual numeric inputs for:
    - `A6 Price (₹)` (Default: `₹7`)
    - `A5 Price (₹)` (Default: `₹15`)
    - `A4 Price (₹)` (Default: `₹29`)
    - `A3 Price (₹)` (Default: `₹49`)
  - Plus the core `Price (₹) — Base / A4` and `MRP (₹)` inputs.

---

## 7. How Individual Product Price Editing by Administrators Works

1. **Authentication & Authorization**:
   - Both `createProductAction` and `updateProductAction` in `app/admin/actions.ts` call `await requireAdmin()`, which verifies the server-side JWT session (`lib/auth.ts`) and checks `session.role === 'ADMIN'` against the database. Ordinary customers cannot access `/admin/*` (protected by `middleware.ts`) or invoke admin server actions.
2. **Isolated Per-Product Database Updates**:
   - When an administrator edits a product in `/admin/products/[id]/edit` and submits the form, `updateProductAction` validates `price_A6`, `price_A5`, `price_A4`, and `price_A3` and updates **only** that specific product (`where: { id }`) and its variants (`where: { productId: id, sizeId: size.id }`).
   - If the administrator updates `price_A4` while leaving the base `price` field untouched, `updateProductAction` automatically synchronizes `Product.price` with `price_A4` so the Admin Products table and storefront fallback remain consistent.
3. **Reflected Immediately in Customer-Facing Strikethrough & Post-Sale Price**:
   - Because `getVariantPricing(variant, fallbackProductPrice, now, overridePhase)` in `lib/pricing.ts` passes the product variant's stored `price` as `customRegularPrice` to `getSizePricing()`, any custom regular price set by an administrator (for example, setting a special poster's `A3` regular price to `₹59`) immediately:
     - Displays `~~₹59~~ → ₹32 (Save ₹27)` on the storefront during the Diwali Offer.
     - Charges `₹32` during the active Diwali Offer window and `₹59` once the offer expires.
     - Never overwrites the administrator's custom regular price in the database.

---

## 8. How Cart Pricing Works

- **Client Cart Drawer (`components/CartDrawer.tsx`) & Server Cart API (`app/api/cart/route.ts`)**:
  - Each cart item resolves its pricing via `getVariantPricing(item.variant, item.product.price)` (or `getCustomPosterPricingDetails()` for custom posters).
  - Line items display the struck-through regular price (`~~₹49~~`, `~~₹29~~`, `~~₹15~~`, `~~₹7~~`), the active Diwali price (`₹32`, `₹16`, `₹8`, `₹4`), and per-line savings (`Save ₹17`, `Save ₹13`, `Save ₹7`, `Save ₹3`).
- **Centralized Server Calculation (`calculateCartTotal` in `lib/discounts.ts`)**:
  - Sums `originalSubtotal` using each item's stored regular price (`49 / 29 / 15 / 7` or admin-customized regular price).
  - Sums `subtotal` using each item's effective price (`32 / 16 / 8 / 4` during the active Diwali window, or regular price outside the window).
  - Computes `diwaliDiscount = originalSubtotal - subtotal` and `totalSavings = diwaliDiscount + discountAmount`.
  - Guarantees no double-discounting.

---

## 9. How Checkout Pricing Works

- **Checkout Page (`app/checkout/page.tsx`)**:
  - Displays each order item with its struck-through regular total and active Diwali total.
  - Displays the **Order Summary** breakdown:
    - **Original Subtotal**: `₹...` (struck through)
    - **Diwali Festival Savings**: `-₹...`
    - **Festive Subtotal**: `₹...`
    - **Shipping**: `FREE`
    - **Total Payable**: `₹...`
    - **Total Festive Savings Banner**: `You are saving ₹... on this order with the Diwali Festival Sale!`
- **Minimum Order Value (`₹30`) Enforcement**:
  - Enforced both in the UI (Cart Drawer & Checkout button disabled with clear message when `total < 30`) and on the backend (`app/api/payment/create-order/route.ts` and `app/api/payment/cod/route.ts` return HTTP `400` if `total < 30`).

---

## 10. How Razorpay and COD Flows Were Verified

- **Razorpay Online Payment (`app/api/payment/create-order/route.ts` & `app/api/payment/verify/route.ts`)**:
  - Calls `calculateCartTotal(cart.id)` on the server, verifies `total >= 30`, and creates a Razorpay order for `Math.round(total * 100)` paise using the exact Diwali promotional total during the active window.
  - Stores each `OrderItem.price` at the exact unit price charged (`getVariantUnitPrice`).
- **Cash on Delivery (`app/api/payment/cod/route.ts`)**:
  - Calls `calculateCartTotal(cart.id)` on the server, verifies `total >= 30`, and creates the order in a Prisma transaction with `paymentMethod = 'COD'`, `paymentStatus = 'PENDING'`, `status = 'PROCESSING'`, and `Payment(provider = 'COD', status = 'PENDING')` without invoking Razorpay.

---

## 11. How Custom Poster Studio Pricing Works

- **`lib/customPosterPricing.ts`** & **`components/CustomPosterBuilder.tsx`**:
  - `calculateCustomPosterPrice()` and `getCustomPosterPricingDetails()` read directly from `getSizePricing(sizeName, now, overridePhase)` in `lib/pricing.ts`.
  - In the Custom Poster Studio UI (`components/CustomPosterBuilder.tsx`), the size selector buttons display:
    - **A3**: `~~₹49~~ ₹32 (Save ₹17)`
    - **A4**: `~~₹29~~ ₹16 (Save ₹13)`
    - **A5**: `~~₹15~~ ₹8 (Save ₹7)`
    - **A6**: `~~₹7~~ ₹4 (Save ₹3)`
  - When added to cart (`app/api/cart/route.ts`), the server recalculates the price via `calculateCustomPosterPrice()`, and `calculateCartTotal()` dynamically evaluates custom posters against the IST offer window so stale carts automatically revert to `₹49 / ₹29 / ₹15 / ₹7` after `9 November 2026, 4:00 AM IST`.

---

## 12. Files Created or Modified

### Modified Files
1. **`lib/pricing.ts`**:
   - Updated `ORIGINAL_SIZE_PRICES` (`REGULAR_SIZE_PRICES` / `DEFAULT_SIZE_PRICES`) to `{ A3: 49, A4: 29, A5: 15, A6: 7 }`.
   - Preserved `DIWALI_SIZE_PRICES` at `{ A3: 32, A4: 16, A5: 8, A6: 4 }`.
   - Enhanced `getSizePricing()` to accept an optional `customRegularPrice` parameter and updated `getVariantPricing()` to pass the variant's stored regular price so administrator per-product price edits are reflected in `originalPrice`, `savings`, and post-sale `effectivePrice`.
   - Updated `DIWALI_POSTER_SIZE_CARDS` badges (`DIWALI OFFER`) and savings (`₹17`, `₹13`, `₹7`, `₹3`).
2. **`lib/constants.ts`**:
   - Updated `ANNOUNCEMENT_UPDATES` and `TOP_NOTICE_UPDATES` to dynamically interpolate `ORIGINAL_SIZE_PRICES` (`49/29/15/7`) and `DIWALI_SIZE_PRICES` (`32/16/8/4`).
3. **`components/Navbar.tsx`**:
   - Updated top festive notice strip to dynamically display `ORIGINAL_SIZE_PRICES` (`49/29/15/7`) and `DIWALI_SIZE_PRICES` (`32/16/8/4`).
4. **`app/page.tsx`**:
   - Included `variants: { include: { size: true } }` in storefront product query and updated Custom Poster Studio banner text to `A6 at ₹4 (~~₹7~~), A5 at ₹8 (~~₹15~~), A4 at ₹16 (~~₹29~~), and A3 at ₹32 (~~₹49~~)`.
5. **`app/search/page.tsx`**:
   - Included `variants: { include: { size: true } }` in search product query so `ProductCard` has variant pricing context.
6. **`components/ProductCatalog.tsx`**:
   - Updated `ProductCard` to resolve each product's `A4` and `A6` regular prices from its variants (`a4RegularPrice`, `a6RegularPrice`) and updated the catalogue header subtitle to use `ORIGINAL_SIZE_PRICES` and `DIWALI_SIZE_PRICES`.
7. **`components/ProductDetails.tsx`**:
   - Updated `sizes` and `activeSizePricing` to use `getVariantPricing()` so administrator-customized regular prices on individual products are reflected in the strikethrough price, savings badge, and size selector cards.
8. **`app/api/cart/route.ts`**:
   - Updated fallback `custom-poster` base product creation price to `29.0` (`MRP: 49.0`).
9. **`app/admin/actions.ts`**:
   - Enhanced `updateProductAction` so that if an administrator updates `price_A4` while leaving the base `price` field unchanged, `Product.price` automatically syncs with `price_A4`.

### Created Scripts & Backups
10. **`backups/neondb-backup-before-global-pricing-update.json`**: Full pre-update JSON backup of all database tables.
11. **`scratch/inspect-pricing-and-backup.ts`**: Database pricing inspection and backup script.
12. **`scratch/execute-global-pricing-update.ts`**: Bulk regular price update and verification script.
13. **`scratch/test-diwali-offer.ts`**: Automated verification test suite for global regular pricing, Diwali promotional pricing, admin per-product price override, minimum order value (`₹30`), and IST offer window transitions.

---

## 13. Database Update Details

Executed via `npx tsx --env-file=.env scratch/execute-global-pricing-update.ts`:
- **Products Updated**: All `43` existing products in `neondb` updated to `Product.price = 29`.
- **ProductVariants Updated**:
  - `A3` variants (`134` rows): `price = 49`
  - `A4` variants (`134` rows): `price = 29`
  - `A5` variants (`43` rows): `price = 15`
  - `A6` variants (`43` rows): `price = 7`
- **Data Integrity Check**:
  - All `43` products, `562` variants, `12` categories, `67` product images, `3` reviews, `3` likes, `44` orders, `31` payments, and `29` users remained 100% intact (`0` mismatches).

---

## 14. Test Scenarios Executed

1. **Automated Global Pricing & Diwali Offer Suite (`npx tsx --env-file=.env scratch/test-diwali-offer.ts`) — `21/21` Assertions Passed**:
   - Standard global regular prices verified (`A3=₹49, A4=₹29, A5=₹15, A6=₹7`).
   - Diwali Offer promotional prices verified (`A3=₹32, A4=₹16, A5=₹8, A6=₹4`).
   - Strikethrough & savings calculations verified:
     - `A3`: `~~₹49~~ → ₹32` (Save `₹17`, `35% OFF`)
     - `A4`: `~~₹29~~ → ₹16` (Save `₹13`, `45% OFF`)
     - `A5`: `~~₹15~~ → ₹8` (Save `₹7`, `47% OFF`)
     - `A6`: `~~₹7~~ → ₹4` (Save `₹3`, `43% OFF`)
   - Administrator individual product regular price override (`A3 = ₹59`) verified: displays `~~₹59~~ → ₹32 (Save ₹27)` during the active Diwali window and restores to `₹59` after expiration.
   - Strict IST validity window (`6 Nov 2026, 8:00 PM IST` to `9 Nov 2026, 4:00 AM IST`) verified across `UPCOMING`, `ACTIVE`, and `EXPIRED` phases.
   - Custom Poster Studio dynamic pricing verified (`₹29` before -> `₹16` during Diwali -> `₹29` after expiration for `A4`; `₹32` during -> `₹49` after expiration for `A3`).
   - Cart calculation & `₹30` minimum order enforcement verified (`1x A4 = ₹16` blocked with `₹14` shortfall; `2x A4 = ₹32` with `₹58` regular subtotal and `₹26` Diwali savings allowed; stale cart after expiration automatically restored to `₹58`).
2. **Automated COD & Razorpay Integration Suite (`npx tsx --env-file=.env scratch/test-cod-integration.ts`) — `17/17` Scenarios Passed**:
   - Verified COD order creation, stock decrement, cart clearing, Razorpay order creation & HMAC signature verification, admin status transitions, and historical order preservation.
3. **Production Build Verification (`npm run build`)**:
   - `prisma generate && next build` completed with `0` TypeScript or build errors.

---

## 15. Final Verification Summary

| Requirement | Status | Verification Evidence |
|---|---|---|
| Global Regular Pricing (`A3 ₹49, A4 ₹29, A5 ₹15, A6 ₹7`) stored in DB | **VERIFIED** | All `43` products and `354` A3/A4/A5/A6 variants updated in `neondb` (`0` mismatches) |
| Newly created products default to `₹49 / ₹29 / ₹15 / ₹7` | **VERIFIED** | `DEFAULT_SIZE_PRICES` in `lib/pricing.ts`, `components/ProductForm.tsx`, and `app/admin/actions.ts` |
| Customer-facing strikethrough & Diwali prices (`₹32 / ₹16 / ₹8 / ₹4`) | **VERIFIED** | Hero cards, Navbar notice, ProductCatalog cards, ProductDetails, PosterSizeReference, CustomPosterBuilder, CartDrawer, Checkout |
| Savings (`₹17 / ₹13 / ₹7 / ₹3`) prominently displayed | **VERIFIED** | Verified across all storefront components and `21/21` automated tests |
| Admin Dashboard & Admin → Products UI unchanged | **VERIFIED** | Zero Diwali visual modifications in `app/admin/*`, `components/ProductForm.tsx`, or `components/ProductListTable.tsx` |
| Admin individual product price editing preserved & isolated | **VERIFIED** | `updateProductAction` + `getVariantPricing()` tested & verified |
| Razorpay, COD, Minimum Order (`₹30`), & IST Timer preserved | **VERIFIED** | `21/21` Diwali tests + `17/17` COD/Razorpay tests + `npm run build` passed |

