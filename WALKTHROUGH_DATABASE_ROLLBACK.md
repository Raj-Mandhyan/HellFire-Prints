# WALKTHROUGH: Targeted Database Rollback (`neondb`)

## Executive Summary

A targeted, non-destructive database rollback was executed on the **HellFire Prints** Neon PostgreSQL database (`neondb`) to restore it to the exact state it was in immediately **before** the previous session's modifications (Task 3: Admin Promotional Campaign tables + 335-poster catalogue expansion).

- **Zero Destructive Global Commands Used**: No `DROP DATABASE`, `TRUNCATE`, or `prisma migrate reset` operations were executed.
- **100% Pre-Existing Data Preserved**: All `21` original products, `12` original categories, `29` users, `44` orders, `57` order items, `31` payments, `3` reviews, `3` product likes, `22` custom posters, `2` coupons, `24` original product images, `470` original product variants, `20` original inventories, and `26` original product ratings remain completely intact.
- **Verified Pre-Rollback Backups**: Complete JSON snapshots of the entire database (`1,857.7 KB`) and the targeted rollback records (`1,310.9 KB`) were generated and verified in `backups/` prior to executing any deletion or schema alteration.

---

## 1. Previous Database State (Immediately Before Previous Session)

Immediately prior to the previous session's modifications, the database contained:

### 1.1 Pre-Session Table Counts
| Table | Pre-Session Record Count |
|---|---:|
| `User` | `29` |
| `Category` | `12` |
| `Product` | `21` |
| `ProductImage` | `24` |
| `ProductVariant` | `470` |
| `ProductSize` | `6` |
| `ProductFrame` | `4` |
| `ProductRating` | `26` |
| `ProductLike` | `3` |
| `Review` | `3` |
| `Inventory` | `20` |
| `Cart` | `0` |
| `CartItem` | `0` |
| `Order` | `44` |
| `OrderItem` | `57` |
| `Payment` | `31` |
| `Address` | `11` |
| `Coupon` | `2` |
| `CouponUsage` | `0` |
| `CustomPoster` | `22` |
| `CustomPosterDesign` | `0` |

### 1.2 Original 12 Categories
`anime`, `cars`, `formula-1`, `gaming`, `music`, `minimalist`, `movies`, `architecture`, `sports`, `technology`, `abstract-art`, `custom`

### 1.3 Original 21 Products
| # | Product ID | SKU | Slug | Title | Created At (UTC) |
|---:|---|---|---|---|---|
| 1 | `cmmwdb2650018fguk0k579t9w` | `ANM-001` | `cyberpunk-edgerunners-neon` | Cyberpunk Edgerunners Neon | `2026-03-18T11:32:56.861Z` |
| 2 | `cmmwdb309001dfguk5wsmh18x` | `ANM-002` | `spirited-away-bathhouse` | Spirited Away Bathhouse | `2026-03-18T11:32:57.946Z` |
| 3 | `cmmwdb3up001ifguk9z56l1n1` | `ANM-003` | `akira-neo-tokyo-bike` | Akira Neo-Tokyo Bike | `2026-03-18T11:32:59.041Z` |
| 4 | `cmmwdb4od001nfguk6mbe7x1r` | `CAR-001` | `porsche-911-gt3-rs-midnight` | Porsche 911 GT3 RS Midnight | `2026-03-18T11:33:00.109Z` |
| 5 | `cmmwdb5if001sfgukg0k6y1z2` | `CAR-002` | `nissan-skyline-gtr-r34-bayside` | Nissan Skyline GT-R R34 Bayside | `2026-03-18T11:33:01.192Z` |
| 6 | `cmmwdb6cq001xfguk0o396s4m` | `CAR-003` | `ferrari-f40-classic-red` | Ferrari F40 Classic Red | `2026-03-18T11:33:02.283Z` |
| 7 | `cmmwdb76w0022fgukw5p3u0t0` | `F1-001` | `monaco-gp-historic-corner` | Monaco GP Historic Corner | `2026-03-18T11:33:03.368Z` |
| 8 | `cmmwdb80y0027fguk379q1d72` | `F1-002` | `senna-mp4-4-rain-master` | Senna MP4/4 Rain Master | `2026-03-18T11:33:04.450Z` |
| 9 | `cmmwdb8u6002cfguk36s6c1n1` | `GAM-001` | `elden-ring-erdtree-horizon` | Elden Ring Erdtree Horizon | `2026-03-18T11:33:05.502Z` |
| 10 | `cmmwdb9ny002hfgukb3f5l2k9` | `GAM-002` | `ghost-of-tsushima-red-leaves` | Ghost of Tsushima Red Leaves | `2026-03-18T11:33:06.574Z` |
| 11 | `cmmwdbai5002mfgukc9q3j7v7` | `MUS-001` | `daft-punk-random-access` | Daft Punk Random Access | `2026-03-18T11:33:07.662Z` |
| 12 | `cmmwdbbc6002rfguk72m0d1r0` | `MUS-002` | `the-weeknd-after-hours-neon` | The Weeknd After Hours Neon | `2026-03-18T11:33:08.742Z` |
| 13 | `cmmwdbc6b002wfguk8w73k6z1` | `MIN-001` | `bauhaus-geometric-balance-01` | Bauhaus Geometric Balance 01 | `2026-03-18T11:33:09.827Z` |
| 14 | `cmmwdbd180031fguk7k21s4j0` | `MIN-002` | `solitude-in-desert-dunes` | Solitude in Desert Dunes | `2026-03-18T11:33:10.941Z` |
| 15 | `cmmwdij8s0000fgdczz3t98w0` | `MOV-001` | `interstellar-gargantua` | Interstellar Gargantua | `2026-03-18T11:38:45.580Z` |
| 16 | `cmmwdik2m0004fgdc1p20y0m0` | `ARC-001` | `brutalist-concrete-monolith` | Brutalist Concrete Monolith | `2026-03-18T11:38:46.654Z` |
| 17 | `cmmwdikw60008fgdc2z94l2g5` | `SPT-001` | `jordan-last-shot-silhouette` | Jordan Last Shot Silhouette | `2026-03-18T11:38:47.719Z` |
| 18 | `cmmwdilpk000cfgdcy7q4b1x2` | `TEC-001` | `quantum-processor-schematic` | Quantum Processor Schematic | `2026-03-18T11:38:48.776Z` |
| 19 | `cmmwdimiz000gfgdc7x08n4r3` | `ABS-001` | `obsidian-magma-flow` | Obsidian Magma Flow | `2026-03-18T11:38:49.836Z` |
| 20 | `cmmwdiowd000lfgdc4t51h3f8` | `ANM-004` | `evangelion-unit-01-awakening` | Evangelion Unit-01 Awakening | `2026-03-18T11:38:52.909Z` |
| 21 | `cmmy937j50000ikukf7653a07` | `CUSTOM-BASE` | `custom-poster` | Custom Poster | `2026-03-19T19:09:49.505Z` |

---

## 2. Database Changes Introduced During the Previous Session

Inspection of the database and scripts (`scratch/apply-schema.ts`, `prisma/seed-335-catalog.ts`, `prisma/catalog-335-data.ts`) identified the exact changes made during the previous session:

1. **Schema Additions**:
   - Created table `"PromotionalCampaign"` (`1` record seeded: `cmw2k4jj40000j4u40v5ap4al`, `slug: 'diwali-sale-2026'`).
   - Created table `"PromotionAuditLog"` (`6` audit log records created during testing).
   - Added column `"franchise"` (`TEXT`) to `"Product"`.
   - Added column `"tags"` (`TEXT[] DEFAULT ARRAY[]::TEXT[]`) to `"Product"`.
2. **Seeded Data Additions (`prisma/seed-335-catalog.ts`)**:
   - Inserted `11` new `Category` records (`tv-shows`, `cartoons`, `motivational`, `adventure`, `mountains-nature`, `beaches-coastal`, `tech-futuristic`, `cafe-food`, `inspirational-quotes`, `cars-automobiles`, `bikes-motorcycles`).
   - Inserted `335` new `Product` records with SKUs matching `HFP-CAT-*` (`HFP-CAT-MOV-001` through `HFP-CAT-BIK-015`).
   - Inserted `670` new `ProductImage` records (`2` images per new product).
   - Inserted `1,340` new `ProductVariant` records (`4` sizes A3/A4/A5/A6 per new product).
   - Inserted `335` new `Inventory` records (`1` inventory row per new product).
   - Inserted `1,005` new `ProductRating` records (`3` initial rating distribution rows per new product).

---

## 3. Records Removed

Using `scratch/execute-targeted-rollback.ts` inside an atomic database transaction after verifying zero foreign-key references from `OrderItem`, `CartItem`, `Review`, or `ProductLike`:

| Table | Records Removed | Selection Criteria |
|---|---:|---|
| `ProductImage` | `670` | `productId IN (SELECT id FROM "Product" WHERE "SKU" LIKE 'HFP-CAT-%')` |
| `ProductVariant` | `1,340` | `productId IN (SELECT id FROM "Product" WHERE "SKU" LIKE 'HFP-CAT-%')` |
| `Inventory` | `335` | `productId IN (SELECT id FROM "Product" WHERE "SKU" LIKE 'HFP-CAT-%')` |
| `ProductRating` | `1,005` | `productId IN (SELECT id FROM "Product" WHERE "SKU" LIKE 'HFP-CAT-%')` |
| `Product` | `335` | `SKU LIKE 'HFP-CAT-%'` (`HFP-CAT-MOV-001` .. `HFP-CAT-BIK-015`) |
| `Category` | `11` | `slug IN ('tv-shows', 'cartoons', 'motivational', 'adventure', 'mountains-nature', 'beaches-coastal', 'tech-futuristic', 'cafe-food', 'inspirational-quotes', 'cars-automobiles', 'bikes-motorcycles')` |
| `PromotionAuditLog` | `6` | Removed via `DROP TABLE IF EXISTS "PromotionAuditLog"` |
| `PromotionalCampaign` | `1` | Removed via `DROP TABLE IF EXISTS "PromotionalCampaign"` (`cmw2k4jj40000j4u40v5ap4al`) |

---

## 4. Schema Changes Reversed

The following DDL statements were executed to restore the PostgreSQL schema to its exact pre-session state:

```sql
DROP TABLE IF EXISTS "PromotionAuditLog";
DROP TABLE IF EXISTS "PromotionalCampaign";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "franchise";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "tags";
```

Post-execution verification against `information_schema.tables` and `information_schema.columns` confirmed:
- `remainingPromoTables`: `0`
- `remainingProductCols` (`franchise`, `tags`): `0`

---

## 5. Backup Location & Verification Status

Prior to executing any deletions or schema changes, `scratch/inspect-and-backup-db.ts` generated and verified two JSON backups:

1. **Full Database Backup (`23` tables)**:
   - **Path**: `backups/neondb-full-backup-before-rollback.json`
   - **Size**: `1,857.7 KB`
   - **Verification Status**: `VALID` — parsed and verified all `356` products, `23` categories, `44` orders, `57` order items, `31` payments, `29` users, and `1` promotional campaign prior to rollback.
2. **Targeted Rollback Records Snapshot**:
   - **Path**: `backups/rollback-target-records-backup.json`
   - **Size**: `1,310.9 KB`
   - **Verification Status**: `VALID` — contains all `335` removed products, `11` removed categories, `670` product images, `1,340` variants, `335` inventories, `1,005` ratings, `1` promotional campaign, and `6` audit logs.

---

## 6. Tables Affected

| Table | Operation Performed |
|---|---|
| `ProductImage` | Deleted `670` rows belonging to `HFP-CAT-*` products; preserved `24` original rows |
| `ProductVariant` | Deleted `1,340` rows belonging to `HFP-CAT-*` products; preserved `470` original rows |
| `Inventory` | Deleted `335` rows belonging to `HFP-CAT-*` products; preserved `20` original rows |
| `ProductRating` | Deleted `1,005` rows belonging to `HFP-CAT-*` products; preserved `26` original rows |
| `Product` | Deleted `335` `HFP-CAT-*` rows; dropped columns `franchise` and `tags`; preserved `21` original rows |
| `Category` | Deleted `11` newly seeded category rows; preserved `12` original rows |
| `PromotionAuditLog` | Dropped table (`6` rows) |
| `PromotionalCampaign` | Dropped table (`1` row) |

---

## 7. Records Preserved

Every single pre-existing business record was preserved without modification:

- **Users**: `29` preserved (`0` deleted)
- **Categories**: `12` preserved (`anime`, `cars`, `formula-1`, `gaming`, `music`, `minimalist`, `movies`, `architecture`, `sports`, `technology`, `abstract-art`, `custom`)
- **Products**: `21` preserved (`ANM-001` through `CUSTOM-BASE`)
- **ProductImages**: `24` preserved
- **ProductVariants**: `470` preserved
- **ProductSizes**: `6` preserved (`A3`, `A4`, `A5`, `A6`, `12x18`, `18x24`)
- **ProductFrames**: `4` preserved
- **ProductRatings**: `26` preserved
- **ProductLikes**: `3` preserved
- **Reviews**: `3` preserved
- **Inventories**: `20` preserved
- **Orders**: `44` preserved
- **OrderItems**: `57` preserved
- **Payments**: `31` preserved (both `RAZORPAY` and `COD` records intact)
- **Addresses**: `11` preserved
- **Coupons**: `2` preserved
- **CustomPosters**: `22` preserved

---

## 8. Prisma & Codebase Synchronisation

1. **`prisma/schema.prisma`**: Verified clean pre-session schema (no `PromotionalCampaign`, no `PromotionAuditLog`, no `franchise`/`tags` on `Product`, while retaining `PaymentMethod` enum with `RAZORPAY` and `COD`).
2. **Prisma Client Generation**: Ran `npx prisma generate` to regenerate `@prisma/client` matching the restored database schema.
3. **Removed Leftover Untracked Task 3 Files**: Removed untracked files from the previous session (`lib/promotions.ts`, `app/admin/promotions/`, `app/api/admin/`, `app/api/promotions/`, `components/AdminPromotionsClient.tsx`, `prisma/seed-335-catalog.ts`, `prisma/catalog-335-data.ts`, `scratch/apply-schema.ts`, `scratch/test-admin-and-catalog.ts`, `scratch/test-cloudinary-poster.ts`) so that no code references dropped tables or columns.

---

## 9. Tests Performed

1. **Rollback Verification Script (`scratch/execute-targeted-rollback.ts`)**:
   - Verified post-rollback counts across all tables match the exact pre-session state (`21` products, `12` categories, `44` orders, `31` payments, `0` remaining promotional tables, `0` remaining `franchise`/`tags` columns).
2. **COD & Razorpay Integration Test Suite (`scratch/test-cod-integration.ts`)**:
   - Verified all `17/17` tests pass against the restored database (`RAZORPAY` and `COD` order creation, inventory decrement, payment status transitions, and cleanup).
3. **Diwali Festival Sale 2026 Test Suite (`scratch/test-diwali-offer.ts`)**:
   - Verified all `19/19` tests pass against the restored database (A3 ₹99→₹32, A4 ₹59→₹16, A5 ₹39→₹8, A6 ₹19→₹4, ₹30 minimum order validation, Custom Poster Studio pricing, Razorpay and COD order flows).
4. **Production Next.js Build (`npm run build`)**:
   - Verified full TypeScript compilation and Next.js production build succeed cleanly.

---

## 10. Final Database State

| Metric / Table | Final Count / State |
|---|---|
| `User` | `29` |
| `Category` | `12` |
| `Product` | `21` |
| `ProductImage` | `24` |
| `ProductVariant` | `470` |
| `ProductSize` | `6` |
| `ProductFrame` | `4` |
| `ProductRating` | `26` |
| `ProductLike` | `3` |
| `Review` | `3` |
| `Inventory` | `20` |
| `Order` | `44` |
| `OrderItem` | `57` |
| `Payment` | `31` |
| `Address` | `11` |
| `Coupon` | `2` |
| `CustomPoster` | `22` |
| `"PromotionalCampaign"` table | Dropped (`0` tables remaining) |
| `"PromotionAuditLog"` table | Dropped (`0` tables remaining) |
| `"Product"."franchise"` & `"Product"."tags"` | Dropped (`0` columns remaining) |

---

## 11. Any Changes That Could Not Safely Be Reversed

- **Database Changes**: **None.** `100%` of the database records, tables, and columns introduced during the previous session were safely and completely reversed.
- **External CDN Note**: SVG poster assets uploaded to the external Cloudinary folder `hellfire-prints/catalog/` during the previous session exist only in external object storage and are no longer referenced by any database record. All `24` original product images for the `21` original products remain untouched.

