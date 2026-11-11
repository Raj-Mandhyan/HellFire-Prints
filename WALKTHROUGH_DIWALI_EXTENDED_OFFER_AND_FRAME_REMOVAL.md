# HellFire Prints — Frame Removal & Grand Diwali Extended Offer 2026 Walkthrough

**Project:** HellFire Prints E-Commerce Platform  
**Deliverable:** `WALKTHROUGH_DIWALI_EXTENDED_OFFER_AND_FRAME_REMOVAL.md`  
**Campaign Window:** `12 November 2026 — 1:00 PM IST` (`2026-11-12T07:30:00Z`) to `14 November 2026 — 1:00 PM IST` (`2026-11-14T07:30:00Z`)  
**Timezone:** `Asia/Kolkata (UTC+05:30)`

---

## 1. Executive Summary

This upgrade delivers two major architectural and product enhancements to **HellFire Prints**:

1. **Complete Frame Option Removal (Standalone Posters Only)**:
   - Removed all customer-facing and studio frame options, frame types, frame colours/finishes (`No Frame`, `Black Frame`, `White Frame`, `Wooden Frame`, `Obsidian Frame`, `Chrome Frame`), frame preview wrappers, and frame surcharges across the Homepage, Product Catalogue, Product Detail Pages, Custom Poster Studio, Cart, Checkout, Order Summaries, Transactional Emails, and Legal/Policy Pages.
   - Added strict server-side payload validation (`validateNoFrameSelection` in `lib/pricing.ts` and `app/api/cart/route.ts`) that rejects any obsolete frame-selection request with HTTP `400`.
   - Performed a non-destructive database migration (`prisma/migrations/20261112000100_remove_frame_options_and_extended_diwali/migration.sql`) clearing all `ProductVariant.frameId` and `ProductVariant.additionalPrice` values (`416` variants normalized to `frameId = NULL, additionalPrice = 0`) and making `CustomPoster.frameName` optional (`@default("")`), while preserving **100%** of existing products (`56`), variants (`610`), historical orders (`53`), and order items (`99`).

2. **The Grand Diwali Extended Offer 2026 (48-Hour Campaign)**:
   - Launched a high-impact **48-hour Grand Diwali Extended Offer 2026** running from **12 November 2026 at 1:00 PM IST** (`2026-11-12T13:00:00+05:30`) until **14 November 2026 at 1:00 PM IST** (`2026-11-14T13:00:00+05:30`).
   - Synchronized the real-time IST countdown timer across SSR, `/api/time`, `sessionStorage`, `visibilitychange`, and `focus` events so the timer never resets to `48:00:00` on page refresh, tab switch, or route navigation.
   - Integrated automatic Three-Tier Pricing activation and expiration (`Retail MRP`, `Base Selling Price`, `Diwali Selling Price`) across all customer-facing pages, Cart, and Checkout (Razorpay & Cash on Delivery).

---

## 2. Inspection of Previous Frame-Related Implementation

A full codebase audit (`git grep -n -i "frame"`) identified frame references across the following layers prior to this update:

| Layer | File | Previous Frame Implementation |
|---|---|---|
| **Custom Poster Studio** | `app/custom-poster/page.tsx` | Included `frameName` state (`'No Frame'`, `'Obsidian Frame'`, `'Chrome Frame'`), `Presentation Frame (Gallery Mockup)` selector UI, conditional CSS frame borders around the canvas, and `frameName` in `POST /api/cart`. |
| **Custom Poster Pricing** | `lib/customPosterPricing.ts` | Exported `FRAME_OPTIONS` (`No Frame`, `Black Frame`, `White Frame`, `Wooden Frame`) and accepted `frameName` in `calculateCustomPosterPrice()`. |
| **Centralized Pricing** | `lib/pricing.ts` | `VariantLike` included `frame?: { additionalPrice?: number }` and added `variant.frame?.additionalPrice` in fallback calculations. |
| **Product Detail Page** | `app/product/[slug]/page.tsx` & `components/ProductDetails.tsx` | Included `frame: true` in Prisma variant queries and filtered variants by `v.frame?.name`. |
| **Cart API & Context** | `app/api/cart/route.ts` & `context/CartContext.tsx` | Queried `frame: true`, returned `frameName` in cart item payloads, and persisted `frameName: 'No Frame'` on `CustomPoster`. |
| **Checkout Flow** | `app/checkout/page.tsx`, `components/CheckoutPageClient.tsx`, `app/actions/order.ts` | Queried `frame: true`, formatted `${item.sizeName} (${item.frameName})` in checkout summaries, and included `variant.frame?.name` in stock messages and `OrderItem` creation. |
| **Policy Pages** | `app/cancellation-and-refund-policy/page.tsx`, `app/shipping-policy/page.tsx`, `app/terms-and-conditions/page.tsx` | Referred to posters being "printed and custom-framed to order". |

---

## 3. Complete Frame Removal Across Frontend & Backend

1. **Product Pages (`app/product/[slug]/page.tsx`, `components/ProductDetails.tsx`, `components/ProductCatalog.tsx`)**:
   - Removed `frame: true` from Prisma `include` clauses and TypeScript payload types.
   - Customers select strictly from the four archival poster sizes (`A3`, `A4`, `A5`, `A6`).
2. **Cart & Checkout (`app/api/cart/route.ts`, `context/CartContext.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx`, `components/CheckoutPageClient.tsx`)**:
   - Removed `frame: true` from all cart queries and removed `frameName` from `CartItem` and `CartSummaryItem` interfaces.
   - Added `validateNoFrameSelection()` in `lib/pricing.ts` and enforced it in `POST /api/cart` so any request attempting to pass a `frameId`, `frameName` (e.g. `'Black Frame'`, `'Obsidian Frame'`), or `frame` object is immediately rejected with HTTP `400`:
     > `"Frame options are no longer available. All HellFire Prints posters are sold without frames."`
3. **Order Creation (`app/actions/order.ts`)**:
   - Both `initiatePaymentAction` (Razorpay) and `placeCodOrderAction` (Cash on Delivery) now record `frameName: null` on all newly created `OrderItem` rows and exclude `frame` from variant queries and stock validation messages.
4. **Legal & Policy Pages (`app/cancellation-and-refund-policy/page.tsx`, `app/shipping-policy/page.tsx`, `app/terms-and-conditions/page.tsx`)**:
   - Updated all policy descriptions to accurately describe standalone archival poster prints without frames.

---

## 4. Custom Poster Studio Frame Removal

In `app/custom-poster/page.tsx` and `lib/customPosterPricing.ts`:
- Removed `FRAME_OPTIONS` from `lib/customPosterPricing.ts`.
- Removed `frameName` state, `setFrameName` handlers, and the `Frame` icon import from `app/custom-poster/page.tsx`.
- Removed the **Presentation Frame (Gallery Mockup)** selector (`Frameless`, `Obsidian Matte`, `Chrome Edge`) from Stage 03 (`Size & Format`).
- Replaced the conditional frame border wrapper around the Fabric.js canvas with a clean frameless archival poster stage (`Frameless Archival Poster Canvas`).
- Updated the `A4` format subtitle from `'Standard Frame (Popular)'` to `'Standard Wall Print (Popular)'`.
- Removed `frameName` from the `POST /api/cart` request body when adding or updating a custom poster.

---

## 5. Pricing Logic Simplification (Poster-Only Pricing)

In `lib/pricing.ts`, `lib/customPosterPricing.ts`, and `lib/discounts.ts`:
- Removed `frame` from `VariantLike` and eliminated `(variant.frame?.additionalPrice || 0)` from `getVariantPricing()`.
- Every poster's price is determined solely by its **Poster Size (`A3`, `A4`, `A5`, `A6`)**, **Product-specific Admin Three-Tier Pricing overrides**, and the **Active Campaign Status**:

| Poster Size | Dimensions | Retail MRP (Strikethrough Only) | Base Selling Price (Normal Days) | Diwali Selling Price (Active Offer) | Additional Diwali Savings |
|---|---|---:|---:|---:|---:|
| **A3** | `29.7 × 42 cm` | `₹79` | `₹49` | **`₹32`** | `Save ₹17 (35% OFF)` |
| **A4** | `21 × 29.7 cm` | `₹49` | `₹29` | **`₹16`** | `Save ₹13 (45% OFF)` |
| **A5** | `14.8 × 21 cm` | `₹29` | `₹15` | **`₹8`** | `Save ₹7 (47% OFF)` |
| **A6** | `10.5 × 14.8 cm` | `₹19` | `₹7` | **`₹4`** | `Save ₹3 (43% OFF)` |

---

## 6. Database & Historical Order Compatibility

To guarantee zero data loss and full backward compatibility with historical orders:
- **No tables or columns were dropped**: `ProductFrame` and `OrderItem.frameName` remain intact in `prisma/schema.prisma` so all historical orders remain 100% queryable.
- **`CustomPoster.frameName` made optional**: Updated to `frameName String? @default("")` in `prisma/schema.prisma` and altered in Neon PostgreSQL (`ALTER TABLE "CustomPoster" ALTER COLUMN "frameName" DROP NOT NULL, ALTER COLUMN "frameName" SET DEFAULT '';`).
- **Variant Normalization**: Executed `UPDATE "ProductVariant" SET "frameId" = NULL, "additionalPrice" = 0 WHERE "frameId" IS NOT NULL OR "additionalPrice" != 0;`, clearing `416` legacy variant rows while preserving all `56` products, `610` variants, `53` orders, `99` order items, and `63` custom posters.

---

## 7. Grand Diwali Extended Offer 2026 Campaign Design

The **Grand Diwali Extended Offer 2026** is configured in `lib/pricing.ts` with fixed `Asia/Kolkata (UTC+05:30)` ISO-8601 boundaries:

```ts
export const DIWALI_OFFER_TIMEZONE = 'Asia/Kolkata';
export const DIWALI_OFFER_START_ISO = '2026-11-12T13:00:00+05:30';
export const DIWALI_OFFER_START_UTC_ISO = '2026-11-12T07:30:00Z';
export const DIWALI_OFFER_END_ISO = '2026-11-14T13:00:00+05:30';
export const DIWALI_OFFER_END_UTC_ISO = '2026-11-14T07:30:00Z';

export const DIWALI_OFFER_START_DISPLAY = '12 November 2026 — 1:00 PM IST';
export const DIWALI_OFFER_END_DISPLAY = '14 November 2026 — 1:00 PM IST';
```

---

## 8. Customer-Facing Hero Banner & Promotional Messaging

In `components/DiwaliHeroSection.tsx`:
- **Top Brand Pill**: `HELLFIRE PRINTS PRESENTS: THE GRAND DIWALI EXTENDED OFFER 2026`
- **Lead Tagline**: `YOU ASKED. WE LISTENED.`
- **Main Headline**: `# THE DIWALI SALE IS BACK!`
- **Subheadline**: *"On overwhelming requests and demand from our customers, we're bringing back the Diwali Sale with a SPECIAL EXTENDED OFFER! You missed it once. Don't miss it again."*
- **Urgency Pill**: `48 HOURS. EXCLUSIVE FESTIVE PRICES. ONE LAST CHANCE.`
- **Schedule Badges**:
  - `OFFER START`: `12 November 2026 — 1:00 PM IST`
  - `OFFER ENDS`: `14 November 2026 — 1:00 PM IST`
- **Primary CTA Button**: `SHOP NOW` (smooth-scrolls to `#catalog`) alongside `CUSTOM POSTER STUDIO`.

---

## 9. Notice Box / Announcement Ticker Update

In `lib/constants.ts` and `components/Navbar.tsx`:
- Updated the scrolling notice bar and announcement strip to prominently feature:
  - `"🪔 YOU ASKED, WE LISTENED! THE DIWALI SALE IS BACK FOR 48 HOURS ONLY! SHOP NOW AT HELLFIRE PRINTS! — Minimum order value is ₹30."`
  - `"✨ THE GRAND DIWALI EXTENDED OFFER 2026: 12 NOV 2026 (1:00 PM IST) TO 14 NOV 2026 (1:00 PM IST) • A3 ₹32 (Was ₹49) • A4 ₹16 (Was ₹29) • A5 ₹8 (Was ₹15) • A6 ₹4 (Was ₹7)"`
- Preserved the smooth, readable marquee ticker animation speed (`46s` desktop / `36s` mobile, paused on hover).

---

## 10. Real-Time IST Countdown Architecture (12 Nov 1:00 PM → 14 Nov 1:00 PM IST)

The countdown system (`app/api/time/route.ts` + `lib/useAuthoritativeTime.ts`) uses a multi-layered synchronization architecture:
1. **Authoritative Backend Time Endpoint (`GET /api/time`)**:
   - Returns `serverTimestampMs`, `serverTimeUtc`, `serverTimeIst`, `startIso` (`2026-11-12T13:00:00+05:30`), `startUtcIso` (`2026-11-12T07:30:00Z`), `endIso` (`2026-11-14T13:00:00+05:30`), `endUtcIso` (`2026-11-14T07:30:00Z`), and the computed `campaign` status with `Cache-Control: no-store`.
2. **Round-Trip Latency Compensation & Offset Persistence (`lib/useAuthoritativeTime.ts`)**:
   - Computes `estimatedServerNowMs = data.serverTimestampMs + Math.round(roundTripMs / 2)` and stores `offsetMs` in both module memory (`sharedServerOffsetMs`) and `window.sessionStorage` (`hfp_server_clock_offset_ms_v1`).
   - Seeds the initial offset immediately from SSR `initialServerTimeMs` so first paint, page refreshes, and route navigations never jump or reset to `48:00:00`.
   - Automatically resynchronizes every `60s` and immediately on `visibilitychange` (tab switch return) and `window.focus`.

---

## 11. Automatic Campaign Activation & Expiration Logic

`getDiwaliOfferStatus(now)` in `lib/pricing.ts` evaluates `currentTimeMs` against `DIWALI_OFFER_START_MS` and `DIWALI_OFFER_END_MS`:

1. **Before `12 November 2026 — 1:00 PM IST` (`phase === 'UPCOMING'`)**:
   - Hero status displays: `THE EXTENDED DIWALI OFFER STARTS IN` with live countdown to `12 November 2026, 1:00 PM IST`.
   - Checkout & Cart charge **Base Selling Price** (`A3 ₹49, A4 ₹29, A5 ₹15, A6 ₹7`) while previewing the upcoming Extended Offer savings.
2. **From `12 November 2026 — 1:00 PM IST` until `14 November 2026 — 1:00 PM IST` (`phase === 'ACTIVE'`)**:
   - At `12 Nov 1:00 PM IST`, `useAuthoritativeDiwaliStatus` fires `onActivate()`, automatically refreshing the Cart and transitioning the UI to:
     - `● THE DIWALI EXTENDED SALE IS LIVE NOW!`
     - Countdown header: `THE DIWALI EXTENDED SALE IS LIVE NOW! • DIWALI EXTENDED OFFER ENDS IN` counting down to `14 November 2026, 1:00 PM IST`.
   - Product pages, Custom Poster Studio, Cart, and Checkout automatically apply **Diwali Selling Price** (`A3 ₹32, A4 ₹16, A5 ₹8, A6 ₹4` or admin-configured `diwaliSellingPrice`).
3. **After `14 November 2026 — 1:00 PM IST` (`phase === 'EXPIRED'`)**:
   - At `14 Nov 1:00 PM IST`, `useAuthoritativeDiwaliStatus` fires `onExpire()`, automatically refreshing the Cart and transitioning the UI to:
     - `THE DIWALI EXTENDED OFFER HAS ENDED`
   - Promotional pricing deactivates automatically and **Base Selling Price** is restored across all pages and payment flows.

---

## 12. Three-Tier Pricing Integration During & After the Extended Offer

- **During Active Extended Offer (`12 Nov 1:00 PM IST` – `14 Nov 1:00 PM IST`)**:
  - **Retail MRP**: Displayed with strikethrough (`₹49` for A4) — never charged.
  - **Base Selling Price**: Displayed with strikethrough (`₹29` for A4) — normal-day price.
  - **Diwali Selling Price**: Highlighted in festive gold (`₹16` for A4) — **charged at checkout**.
- **Outside / After Extended Offer (`UPCOMING` & `EXPIRED`)**:
  - **Retail MRP**: Displayed with strikethrough (`₹49` for A4) — never charged.
  - **Base Selling Price**: Highlighted as active selling price (`₹29` for A4) — **charged at checkout**.

---

## 13. Cart, Checkout, Razorpay & COD Verification

- **Cart (`app/api/cart/route.ts`, `lib/discounts.ts`, `app/cart/page.tsx`)**:
  - Dynamically recalculates `retailMrpSubtotal`, `originalSubtotal` (Base Selling Subtotal), `diwaliDiscount`, and `total` against the authoritative server timestamp on every request.
- **Checkout (`app/checkout/page.tsx`, `components/CheckoutPageClient.tsx`, `app/actions/order.ts`)**:
  - Both **Razorpay (`initiatePaymentAction` / `verifyPaymentAction`)** and **Cash on Delivery (`placeCodOrderAction`)** recalculate totals on the server using `calculateCartTotal(cart.id, now)` and never trust client-submitted prices or client clocks.
  - Enforces the **`₹30` Minimum Order Value** (`MINIMUM_ORDER_VALUE = 30`) across both Razorpay and COD.

---

## 14. Admin Dashboard Preservation

- The Admin Dashboard (`app/admin/layout.tsx`, `app/admin/products/**`, `components/ProductForm.tsx`, `components/ProductListTable.tsx`) remains in its clean, original pre-Diwali UI with zero festive overlays.
- Authenticated administrators retain full control over the Three-Tier Pricing fields (`Retail MRP`, `Base Selling Price`, `Diwali Selling Price`) per poster size (`A3`, `A4`, `A5`, `A6`) with server-side hierarchy validation (`Retail MRP >= Base Selling Price >= Diwali Selling Price > 0`).

---

## 15. Files Modified

| File | Summary of Changes |
|---|---|
| `prisma/schema.prisma` | Made `CustomPoster.frameName` optional (`String? @default("")`) while keeping all historical models/columns intact. |
| `prisma/migrations/20261112000100_remove_frame_options_and_extended_diwali/migration.sql` | Non-destructive SQL migration dropping `NOT NULL` on `CustomPoster.frameName` and clearing `frameId`/`additionalPrice` on `ProductVariant`. |
| `lib/pricing.ts` | Updated campaign window to `12 Nov 2026 1:00 PM IST` – `14 Nov 2026 1:00 PM IST`, added `validateNoFrameSelection()`, and removed `frame` surcharge from `getVariantPricing()`. |
| `lib/customPosterPricing.ts` | Removed `FRAME_OPTIONS` and `frameName` parameter from `calculateCustomPosterPrice()`. |
| `lib/discounts.ts` | Removed `frame: true` from cart item variant queries. |
| `lib/constants.ts` | Updated `ANNOUNCEMENT_UPDATES` and `TOP_NOTICE_UPDATES` with the 48-hour Grand Diwali Extended Offer messaging. |
| `app/api/time/route.ts` | Included `startUtcIso` (`2026-11-12T07:30:00Z`) and `endUtcIso` (`2026-11-14T07:30:00Z`) in the authoritative time response. |
| `lib/useAuthoritativeTime.ts` | Added `onActivate` callback alongside `onExpire` so the UI and Cart automatically refresh at both `12 Nov 1:00 PM IST` and `14 Nov 1:00 PM IST`. |
| `components/Navbar.tsx` | Updated top notice ticker with `"YOU ASKED, WE LISTENED! THE DIWALI SALE IS BACK FOR 48 HOURS ONLY! SHOP NOW AT HELLFIRE PRINTS!"`. |
| `components/DiwaliHeroSection.tsx` | Updated hero banner with Grand Diwali Extended Offer 2026 headlines, `OFFER START` / `OFFER ENDS` badges, phase-specific countdown headers, and `SHOP NOW` CTA. |
| `components/ProductCatalog.tsx` | Passed `effectivePhase` to `getVariantPricing()` and added clear `UPCOMING`, `ACTIVE`, and `EXPIRED` price displays. |
| `app/product/[slug]/page.tsx` & `components/ProductDetails.tsx` | Removed `frame: true` and variant frame filtering; updated Three-Tier pricing display for `UPCOMING`, `ACTIVE`, and `EXPIRED` phases. |
| `app/custom-poster/page.tsx` | Removed `Presentation Frame (Gallery Mockup)`, `frameName` state, and frame CSS classes; updated studio pricing for `effectivePhase`. |
| `app/api/cart/route.ts` & `context/CartContext.tsx` | Enforced `validateNoFrameSelection()`, removed `frameName` from cart payloads, and subscribed `CartContext` to `onActivate` & `onExpire`. |
| `app/cart/page.tsx`, `app/checkout/page.tsx`, `components/CheckoutPageClient.tsx` | Removed frame display from cart/checkout items and updated Extended Offer status banners. |
| `app/actions/order.ts` | Removed `frame: true` from order queries and set `frameName: null` on newly created `OrderItem` records. |
| `app/account/orders/[orderId]/page.tsx`, `app/admin/orders/[id]/page.tsx`, `lib/email.ts` | Cleaned up order item displays so new orders show no frame field while historical orders remain readable. |
| `app/cancellation-and-refund-policy/page.tsx`, `app/shipping-policy/page.tsx`, `app/terms-and-conditions/page.tsx` | Removed framing references from customer-facing policy pages. |

---

## 16. Automated & Manual Test Results

Executed `npx tsx scratch/test-extended-offer-and-frame-removal.ts` against the live Neon PostgreSQL database (`31 / 31` checks passed):

- **Frame Removal (`FR-1` to `FR-7`)**:
  - `FR-1`: No frame options appear on any product page (`PASS`)
  - `FR-2`: No frame options appear in Custom Poster Studio (`PASS`)
  - `FR-3`: No frame options appear in Cart (`PASS`)
  - `FR-4`: No frame options appear in Checkout (`PASS`)
  - `FR-5`: No frame charges are added to any order or variant (`0` variants with frame surcharge) (`PASS`)
  - `FR-6`: Backend rejects obsolete frame-selection inputs (`frameId`, `Black Frame`, `Obsidian Frame`) (`PASS`)
  - `FR-7`: Historical orders (`53`) and products (`56`) remain 100% readable and intact (`PASS`)
- **Extended Campaign (`EC-1` to `EC-10`)**:
  - `EC-1`: Before `12 Nov 2026 1:00 PM IST`, campaign is `UPCOMING` and counts down to start time (`PASS`)
  - `EC-2`: At `12 Nov 2026 1:00 PM IST`, campaign activates (`ACTIVE`, `2d 0h` remaining) (`PASS`)
  - `EC-3`: Promotional Diwali Selling Prices (`A3 ₹32, A4 ₹16, A5 ₹8, A6 ₹4`) become applicable (`PASS`)
  - `EC-4`: During active campaign, countdown counts down to `14 Nov 2026 1:00 PM IST` (`PASS`)
  - `EC-5`: Page refresh preserves accurate remaining time via `/api/time` & `sessionStorage` offset (`PASS`)
  - `EC-6`: Tab switch and focus return immediately resynchronize countdown (`PASS`)
  - `EC-7`: Route navigation preserves accurate remaining time without jumping (`PASS`)
  - `EC-8`: Countdown never resets to `48:00:00` (`0d 0h 0m 1s` at `14 Nov 12:59:59 PM IST`) (`PASS`)
  - `EC-9`: At `14 Nov 2026 1:00 PM IST`, campaign expires (`EXPIRED`, `00:00:00:00`) (`PASS`)
  - `EC-10`: After expiration, Base Selling Prices (`A3 ₹49, A4 ₹29, A5 ₹15, A6 ₹7`) are automatically restored (`PASS`)
- **Payments (`PM-1` to `PM-6`)**:
  - `PM-1`: Razorpay works during the active offer with Diwali Selling Price (`2× A4 = ₹32`) (`PASS`)
  - `PM-2`: Cash on Delivery (COD) works during the active offer (`2× A4 = ₹32`) (`PASS`)
  - `PM-3`: Razorpay works outside/after offer expiration with Base Selling Price (`2× A4 = ₹58`) (`PASS`)
  - `PM-4`: Cash on Delivery (COD) works outside/after offer expiration with Base Selling Price (`2× A4 = ₹58`) (`PASS`)
  - `PM-5`: Minimum order value of `₹30` is strictly enforced (`1× A4 = ₹16` blocked with `₹14` shortfall) (`PASS`)
  - `PM-6`: Retail MRP (`₹98` for `2× A4`) is never charged at checkout in any phase (`PASS`)
- **Website (`WB-1` to `WB-8`)**:
  - `WB-1` to `WB-8`: Homepage, Product Catalogue, Product Detail Pages, Custom Poster Studio, Cart/Checkout, Admin Dashboard normal UI, Hydration safety, and Policy Pages all verified (`PASS`)

---

## 17. Production Readiness Assessment

- **TypeScript Typecheck (`npx tsc --noEmit`)**: Passed with `0` errors.
- **ESLint (`npm run lint`)**: Passed cleanly.
- **Next.js Production Build (`npm run build`)**: Compiled and generated all routes cleanly.
- **Database Integrity**: All `56` products, `610` variants, `53` orders, `99` order items, and `63` custom posters verified intact in Neon PostgreSQL.

---

## 18. Final Verification Checklist

- [x] All frame options removed from Product Pages, Custom Poster Studio, Cart, Checkout, and Policy Pages.
- [x] Backend rejects obsolete frame-selection payloads (`validateNoFrameSelection`).
- [x] Zero frame surcharges exist in pricing calculations or `ProductVariant` database records.
- [x] Historical orders and products remain 100% intact.
- [x] Grand Diwali Extended Offer 2026 configured for `12 November 2026 — 1:00 PM IST` to `14 November 2026 — 1:00 PM IST` (`Asia/Kolkata`).
- [x] Hero section and Notice Ticker updated with `"YOU ASKED, WE LISTENED! THE DIWALI SALE IS BACK FOR 48 HOURS ONLY!"`.
- [x] Real-time IST countdown synchronized with `/api/time` across refreshes, tab switches, and route changes.
- [x] Automatic activation at `12 Nov 1:00 PM IST` and automatic expiration at `14 Nov 1:00 PM IST`.
- [x] Admin Dashboard preserved in its normal pre-Diwali UI with full Three-Tier Pricing controls.

