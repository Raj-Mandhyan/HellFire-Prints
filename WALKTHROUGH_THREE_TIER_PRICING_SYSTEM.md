# WALKTHROUGH: HELLFIRE PRINTS — THREE-TIER PRODUCT PRICING SYSTEM WITH ADMIN-CONTROLLED DIWALI SELLING PRICES

## 1. Executive Summary
**HellFire Prints** has been upgraded with a comprehensive **Three-Tier Product Pricing System** across all poster sizes (`A3`, `A4`, `A5`, `A6`), editable exclusively by authenticated administrators in **Admin → Products**:

1. **Retail MRP** (`retailMrp` / `MRP`): The original retail/reference price of the product and size (displayed with a strikethrough on customer-facing pages and **never charged at checkout**).
2. **Base Selling Price** (`baseSellingPrice` / `price`): The actual selling price charged on normal, non-promotional days and after the Diwali Sale expires.
3. **Diwali Selling Price** (`diwaliSellingPrice` / `diwaliPrice`): The special promotional selling price charged during the active **Grand Diwali Sale 2026** (`6 November 2026, 8:00 PM IST` to `9 November 2026, 4:00 AM IST`, `Asia/Kolkata`, `2026-11-09T04:00:00+05:30` / `2026-11-08T22:30:00Z`).

The **Admin Dashboard** (`app/admin/**`, `components/ProductForm.tsx`, `components/ProductListTable.tsx`) strictly retains its original pre-Diwali dark/crimson administrative aesthetic without any festive decorations.

---

## 2. Database Schema Changes
In [`prisma/schema.prisma`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/prisma/schema.prisma):
- **`ProductVariant`**:
  - Added `retailMrp Float?` — Size-specific Retail MRP (`A3: ₹99, A4: ₹59, A5: ₹39, A6: ₹19` default).
  - Added `baseSellingPrice Float?` — Size-specific Base Selling Price (`A3: ₹49, A4: ₹29, A5: ₹15, A6: ₹7` default), kept synchronized with `ProductVariant.price` for 100% backward compatibility.
  - Added `diwaliSellingPrice Float?` — Size-specific Diwali Selling Price (`A3: ₹32, A4: ₹16, A5: ₹8, A6: ₹4` default).
- **`Product`**:
  - Added `diwaliPrice Float?` — A4 default Diwali Selling Price summary field, kept synchronized alongside `Product.MRP` (A4 Retail MRP) and `Product.price` (A4 Base Selling Price).
- **`OrderItem`**:
  - Added nullable snapshot fields `retailMrp Float?`, `baseSellingPrice Float?`, and `diwaliSellingPrice Float?` alongside `price Float` (the final unit price charged at order placement) so historical orders preserve their exact pricing breakdown permanently.

---

## 3. Prisma Migration Details
- Created migration [`prisma/migrations/20261107000100_add_three_tier_pricing/migration.sql`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/prisma/migrations/20261107000100_add_three_tier_pricing/migration.sql) using non-destructive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements.
- Executed [`scratch/apply-three-tier-pricing-migration.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/scratch/apply-three-tier-pricing-migration.ts) on Neon PostgreSQL (`neondb`):
  - **Pre-migration counts**: `Products = 48`, `Variants = 578`, `Orders = 50`, `OrderItems = 89`.
  - **Post-migration counts**: `Products = 48`, `Variants = 578`, `Orders = 50`, `OrderItems = 89`.
  - Existing product prices were preserved as `baseSellingPrice`, and `retailMrp` (`99 / 59 / 39 / 19`) and `diwaliSellingPrice` (`32 / 16 / 8 / 4`) were backfilled cleanly across all size variants.

---

## 4. Three-Tier Pricing Architecture
Implemented in [`lib/pricing.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/pricing.ts):

| Poster Size | Default Retail MRP (`RETAIL_MRP_SIZE_PRICES`) | Default Base Selling Price (`BASE_SELLING_SIZE_PRICES`) | Default Diwali Selling Price (`DIWALI_SIZE_PRICES`) | Additional Diwali Savings | Total Savings vs MRP |
|---|---:|---:|---:|---:|---:|
| **A3** (`29.7 × 42 cm`) | ₹99 | ₹49 | **₹32** | ₹17 (`35% OFF`) | ₹67 (`68% OFF`) |
| **A4** (`21 × 29.7 cm`) | ₹59 | ₹29 | **₹16** | ₹13 (`45% OFF`) | ₹43 (`73% OFF`) |
| **A5** (`14.8 × 21 cm`) | ₹39 | ₹15 | **₹8** | ₹7 (`47% OFF`) | ₹31 (`79% OFF`) |
| **A6** (`10.5 × 14.8 cm`) | ₹19 | ₹7 | **₹4** | ₹3 (`43% OFF`) | ₹15 (`79% OFF`) |

---

## 5. Admin → Products UI Updates
In [`components/ProductForm.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductForm.tsx) and [`components/ProductListTable.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductListTable.tsx):
- Retained the exact pre-Diwali Admin Dashboard UI (`#161616` / `#0F0F0F` dark cards, `#C1121F` crimson accents).
- Upgraded the **Three-Tier Size Pricing** grid so each of the 4 poster sizes (`A3`, `A4`, `A5`, `A6`) provides three independent editable inputs:
  - **Retail MRP (₹)**: `mrp_A3`, `mrp_A4`, `mrp_A5`, `mrp_A6`
  - **Base Selling Price (₹)**: `price_A3`, `price_A4`, `price_A5`, `price_A6`
  - **Diwali Selling Price (₹)**: `diwali_A3`, `diwali_A4`, `diwali_A5`, `diwali_A6`
- Synchronized the A4 size inputs with the A4 summary inputs (`MRP`, `price`, `diwaliPrice`).
- Updated `ProductListTable.tsx` to display the A4 Base Selling Price alongside `MRP ₹... • Diwali ₹...` in the Admin product table.

---

## 6. Per-Size Pricing Configuration (A3, A4, A5, A6)
In [`app/admin/actions.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/admin/actions.ts):
- `parseAndValidateSizeTierPrices(formData)` extracts and validates `mrp_A3..A6`, `price_A3..A6`, and `diwali_A3..A6`.
- Both `createProductAction` and `updateProductAction` persist `retailMrp`, `baseSellingPrice`, `price` (`= baseSellingPrice`), and `diwaliSellingPrice` to each size's `ProductVariant` record in Neon PostgreSQL, and revalidate `/`, `/search`, `/cart`, `/checkout`, `/product/[slug]`, and `/admin/products`.

---

## 7. Backend Security and Admin Authorization
- Every product creation, update, and deletion action in [`app/admin/actions.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/admin/actions.ts) calls `await requireAdmin()` from [`lib/auth.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/auth.ts) before parsing or writing any data.
- Unauthenticated or non-admin users cannot access `/admin/products` or invoke `createProductAction` / `updateProductAction`.

---

## 8. Price Hierarchy Validation Logic
Implemented in `validateThreeTierPriceHierarchy` in [`lib/pricing.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/pricing.ts):
$$\text{Retail MRP} \ge \text{Base Selling Price} \ge \text{Diwali Selling Price} > 0$$
- Rejects `NaN`, non-finite, zero, or negative values.
- Returns a clear error if `Retail MRP < Base Selling Price` (e.g., `Size A3: Retail MRP (₹39) must be greater than or equal to Base Selling Price (₹49).`).
- Returns a clear error if `Base Selling Price < Diwali Selling Price` (e.g., `Size A3: Base Selling Price (₹29) must be greater than or equal to Diwali Selling Price (₹32).`).
- Rounds monetary values to at most 2 decimal places (`roundCurrency`).

---

## 9. Automatic Price Selection Logic
In [`lib/pricing.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/pricing.ts) (`getSizePricing` & `getVariantPricing`):
```ts
const effectivePrice = isOfferActive ? diwaliSellingPrice : baseSellingPrice;
```
- **When Diwali Sale is Active (`phase === 'ACTIVE'`)**: `Final Selling Price = Diwali Selling Price`.
- **On Normal Days or After Sale Expiry (`phase === 'UPCOMING'` or `'EXPIRED'`)**: `Final Selling Price = Base Selling Price`.
- **Retail MRP is strictly a reference display value and is never charged at checkout.**

---

## 10. Customer-Facing Price Display During Active Diwali Sale
Across [`components/DiwaliHeroSection.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/DiwaliHeroSection.tsx), [`components/ProductCatalog.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductCatalog.tsx), [`components/ProductDetails.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductDetails.tsx), and [`app/custom-poster/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/custom-poster/page.tsx):
- Displays **Retail MRP** with a strikethrough (e.g., `Retail MRP: ~~₹99~~`).
- Displays **Base Selling Price** with a strikethrough (e.g., `Base Selling Price: ~~₹49~~`).
- Displays the **`DIWALI SPECIAL OFFER`** badge.
- Highlights the **Diwali Selling Price** (e.g., **`₹32`**) as the primary price along with `Additional Diwali Savings: ₹17 (35% OFF)`.

---

## 11. Customer-Facing Price Display on Normal Days / After Sale Expiry
When the Diwali Sale expires (`9 November 2026, 4:00 AM IST`):
- Displays **Retail MRP** with a strikethrough (e.g., `Retail MRP: ~~₹99~~`).
- Displays **Selling Price** (`Base Selling Price`, e.g., **`₹49`**) with `Save ₹50 off MRP`.
- The Diwali Selling Price is automatically hidden and no longer applied.

---

## 12. Cart Calculation Updates
In [`lib/discounts.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/discounts.ts), [`app/api/cart/route.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/api/cart/route.ts), [`context/CartContext.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/context/CartContext.tsx), and [`app/cart/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/cart/page.tsx):
- Computes `retailMrpSubtotal`, `originalSubtotal` (Base Selling Price subtotal), `diwaliDiscount`, `mrpSavings`, and `subtotal` (`effectivePrice` subtotal).
- Preserves the `₹30` minimum order value (`MINIMUM_ORDER_VALUE = 30`) and free shipping (`shippingFee = 0`).

---

## 13. Checkout Calculation Updates
In [`app/checkout/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/checkout/page.tsx) and [`components/CheckoutPageClient.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/CheckoutPageClient.tsx):
- Displays per-item `MRP ~~₹...~~ • Base ~~₹...~~ → ₹... each` and `Retail MRP Subtotal` / `Base Selling Subtotal` / `Diwali Discount` / `Final Payable`.

---

## 14. Razorpay Payment Integration Verification
In [`app/actions/order.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/actions/order.ts) (`initiatePaymentAction` & `verifyPaymentAction`):
- Recomputes the order total strictly on the server using `calculateCartTotal(cart.id, now)`.
- Converts the effective total (`Diwali Selling Price` when active, `Base Selling Price` when expired) to paise (`Math.round(total * 100)`) for Razorpay order creation.
- Snapshots `price`, `retailMrp`, `baseSellingPrice`, and `diwaliSellingPrice` on each created `OrderItem`.

---

## 15. Cash on Delivery (COD) Integration Verification
In [`app/actions/order.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/actions/order.ts) (`placeCodOrderAction`) and [`app/account/orders/[orderId]/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/account/orders/%5BorderId%5D/page.tsx):
- Records the exact payable amount (`Diwali Selling Price` during active Diwali Sale, `Base Selling Price` after expiration) on `Order` and `Payment` (`paymentMethod: 'COD'`, `paymentStatus: 'PENDING'`, `orderStatus: 'CONFIRMED'`).
- Snapshots `price`, `retailMrp`, `baseSellingPrice`, and `diwaliSellingPrice` on each created `OrderItem`.

---

## 16. Files Created and Modified
### Created
- [`prisma/migrations/20261107000100_add_three_tier_pricing/migration.sql`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/prisma/migrations/20261107000100_add_three_tier_pricing/migration.sql)
- [`scratch/apply-three-tier-pricing-migration.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/scratch/apply-three-tier-pricing-migration.ts)
- [`scratch/test-three-tier-pricing.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/scratch/test-three-tier-pricing.ts)
- [`WALKTHROUGH_THREE_TIER_PRICING_SYSTEM.md`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/WALKTHROUGH_THREE_TIER_PRICING_SYSTEM.md)

### Modified
- [`prisma/schema.prisma`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/prisma/schema.prisma)
- [`lib/pricing.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/pricing.ts)
- [`lib/discounts.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/discounts.ts)
- [`lib/customPosterPricing.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/customPosterPricing.ts)
- [`components/ProductForm.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductForm.tsx)
- [`components/ProductListTable.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductListTable.tsx)
- [`app/admin/actions.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/admin/actions.ts)
- [`components/DiwaliHeroSection.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/DiwaliHeroSection.tsx)
- [`components/ProductCatalog.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductCatalog.tsx)
- [`components/ProductDetails.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/ProductDetails.tsx)
- [`app/custom-poster/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/custom-poster/page.tsx)
- [`app/api/cart/route.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/api/cart/route.ts)
- [`context/CartContext.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/context/CartContext.tsx)
- [`app/cart/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/cart/page.tsx)
- [`app/checkout/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/checkout/page.tsx)
- [`components/CheckoutPageClient.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/components/CheckoutPageClient.tsx)
- [`app/actions/order.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/actions/order.ts)
- [`app/account/orders/[orderId]/page.tsx`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/app/account/orders/%5BorderId%5D/page.tsx)
- [`lib/email.ts`](file:///d:/CODING/1.%20Projects%20(Portfolio)/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20(Hellfire%20Mega%20Project)/Try_4/11.%20Project-4%20(Hellfire)%20Backup-5/Try_3/lib/email.ts)

---

## 17. Testing and Verification Results
- **20-Scenario Automated Verification Suite (`npx tsx --env-file=.env scratch/test-three-tier-pricing.ts`)**: **20 / 20 Passed (100%)**.
- **TypeScript Typecheck (`npx tsc --noEmit`)**: **0 Errors**.
- **ESLint (`npm run lint`)**: **0 Errors, 0 Warnings**.
- **Production Build (`npm run build`)**: **Succeeded cleanly**.

