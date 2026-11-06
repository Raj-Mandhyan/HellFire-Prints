# WALKTHROUGH: HELLFIRE PRINTS — DIWALI SALE LIVE UPDATE, REAL-TIME IST COUNTDOWN, NOTICE TICKER & ADMIN UI RESTORATION

**Project:** HellFire Prints (`Try_3`)  
**Database:** Neon Serverless PostgreSQL (`neondb`, Prisma v7.9.1)  
**Date:** November 2026  

---

## 1. Diwali Sale Activation (`LIVE NOW`)

The customer-facing storefront now prominently communicates that **The Grand Diwali Sale 2026** is **LIVE NOW** (`components/DiwaliHeroSection.tsx`):
- **Top Status Pill**: Displays an animated emerald live indicator (`● DIWALI SALE — LIVE NOW`).
- **Hero Overline & Headline**:
  - Overline: `DIWALI SALE IS LIVE NOW!`
  - Headline: `# THE GRAND DIWALI SALE 2026`
  - Subheadline: **Light Up Your Walls. Celebrate Every Moment.**
  - Description: *Enjoy exclusive festive prices on your favourite posters. Experience ultra-high-contrast 300 GSM archival wall prints engineered for next-gen setups, gaming battlestations, and modern spaces.*
- **Countdown Callout Footer**:
  - **THE FESTIVE OFFER IS LIVE!**
  - *Only limited time left to grab your favourite posters at exclusive Diwali prices.*
  - **Offer ends Monday, 9 November, 4:00 AM IST.**
- **Removed Customer-Facing Debug Phase Toggles**:
  - Removed the `UI State` debug buttons from `components/DiwaliHeroSection.tsx` so ordinary customers cannot manipulate or toggle the campaign state on the hero section.

---

## 2. Fixed Campaign Deadline

The campaign validity window and final deadline are strictly fixed in `lib/pricing.ts`:
- **Campaign Start**: `2026-11-06T20:00:00+05:30` (`6 November 2026 — 8:00 PM IST`)
- **Campaign Final Deadline (IST)**: `2026-11-09T04:00:00+05:30` (**Monday, 9 November 2026 — 4:00 AM IST**)
- **Equivalent UTC Timestamp**: `2026-11-08T22:30:00Z` (`1794177000000` epoch ms)
- Displayed on the Hero Countdown Card with a `<span class="bg-rose-600 ...">FINAL DEADLINE</span>` badge alongside **Monday, 9 November 2026 — 4:00 AM IST**.

---

## 3. IST Timezone Implementation

- All campaign start/end constants in `lib/pricing.ts` (`DIWALI_OFFER_START_ISO`, `DIWALI_OFFER_END_ISO`, `DIWALI_OFFER_START_MS`, `DIWALI_OFFER_END_MS`) use explicit ISO-8601 strings with the `+05:30` (`Asia/Kolkata`) offset.
- Because `Date.parse('2026-11-09T04:00:00+05:30')` evaluates to the exact UTC epoch millisecond `1794177000000` (`2026-11-08T22:30:00Z`), the deadline is immune to the user's browser-local timezone or OS timezone settings.
- `formatDateInIST()` uses `Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ... })` to format timestamps in Indian Standard Time.

---

## 4. Backend Time Synchronization (`/api/time` & `lib/useAuthoritativeTime.ts`)

### Authoritative Backend Endpoint (`app/api/time/route.ts`)
- Created `GET /api/time` with `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`.
- Dynamically generates and returns:
  - `serverTimeUtc`: Current server UTC ISO timestamp (`new Date().toISOString()`)
  - `serverTimestampMs`: Current server epoch milliseconds (`Date.now()`)
  - `serverTimeIst`: Formatted IST timestamp (`formatDateInIST(now)`)
  - `timezone`: `'Asia/Kolkata'`
  - `utcOffset`: `'+05:30'`
  - `campaign`: `{ startIso, endIso, endUtcIso, startTimestampMs, endTimestampMs, phase, isActive, isUpcoming, isExpired, countdown }`

### Client Clock Synchronization Hook (`lib/useAuthoritativeTime.ts`)
1. **SSR Initial Seeding**: `app/page.tsx` passes `initialServerTimeMs={Date.now()}` to `<DiwaliHeroSection initialServerTimeMs={serverTimeMs} />`, so the very first server-rendered HTML frame already displays the exact remaining time without flashing a hardcoded placeholder.
2. **RTT-Compensated Offset Calculation**: On page load, `syncAuthoritativeClock()` fetches `/api/time`, measures the HTTP round-trip latency (`roundTripMs = responseEndMs - requestStartMs`), estimates the authoritative server time (`serverTimestampMs + roundTripMs / 2`), and stores `offsetMs = estimatedServerNowMs - responseEndMs`.
3. **Cross-Page Persistence**: `offsetMs` is stored both in a module-level singleton (`sharedServerOffsetMs`) and in `window.sessionStorage` (`hfp_server_clock_offset_ms_v1`), so navigating between pages never resets or restarts the countdown.
4. **Periodic & Tab-Visibility Resynchronization**:
   - Automatically resynchronizes with `/api/time` every `60` seconds (`RESYNC_INTERVAL_MS = 60_000`).
   - Immediately resynchronizes when the user returns to the browser tab (`document.addEventListener('visibilitychange')` and `window.addEventListener('focus')`).
5. **Graceful Network Failure Handling**: If `/api/time` is temporarily unreachable, the hook retains the last known `offsetMs` without crashing, jumping, or producing negative values.

---

## 5. Countdown Calculation

In `getDiwaliOfferStatus(now)` (`lib/pricing.ts`):
$$\text{diffMs} = \max\left(0,\ \text{DIWALI\_OFFER\_END\_MS} - \text{authoritativeNowMs}\right)$$
$$\text{totalSeconds} = \left\lfloor \frac{\text{diffMs}}{1000} \right\rfloor$$
- `days = Math.floor(totalSeconds / 86400)`
- `hours = Math.floor((totalSeconds % 86400) / 3600)`
- `minutes = Math.floor((totalSeconds % 3600) / 60)`
- `seconds = totalSeconds % 60`

For example, at `2026-11-07T02:24:18+05:30`, the countdown displays `02 DAYS : 01 HOURS : 35 MINUTES : 42 SECONDS` and decrements every second.

---

## 6. Countdown Expiration Behaviour

At `2026-11-09T04:00:00+05:30` (`2026-11-08T22:30:00Z`):
1. `diffMs` reaches `0`, displaying `00 DAYS : 00 HOURS : 00 MINUTES : 00 SECONDS`.
2. `status.phase` immediately transitions from `'ACTIVE'` to `'EXPIRED'`.
3. `useAuthoritativeDiwaliStatus` triggers `onExpire` in `CartContext` (`context/CartContext.tsx`), which automatically calls `refreshCart()`.
4. `ProductCatalog`, `ProductDetails`, `PosterSizeReference`, `CustomPosterBuilder`, `CartDrawer`, and `CheckoutPageClient` immediately switch from Diwali promotional prices (`₹32 / ₹16 / ₹8 / ₹4`) back to the stored regular prices (`₹49 / ₹29 / ₹15 / ₹7` or admin-customized regular prices).
5. Backend endpoints (`/api/cart`, `/api/payment/create-order`, `/api/payment/cod`) independently evaluate `getDiwaliOfferStatus(new Date())` on the server, ensuring expired promotional prices can never be forced via client manipulation.

---

## 7. Notice Ticker Animation Changes (`components/UpdatesStrip.tsx` & `app/globals.css`)

### Root Cause of Previous Fast Scrolling
Previously, `UpdatesStrip.tsx` quadrupled arrays with fewer than 4 items and then doubled them again (creating 8 to 16 long announcement items in a single row) and scrolled `-50%` in `28s`, resulting in a rushed >200px/sec scroll speed.

### Fix Implemented
1. **Two-Half Seamless Loop Architecture (`components/UpdatesStrip.tsx`)**:
   - Renders two identical `flex shrink-0 items-center` halves (`[0, 1]`) inside `.animate-marquee`.
   - Translating from `translate3d(0, 0, 0)` to `translate3d(-50%, 0, 0)` moves the first half out while placing the second identical half at the exact pixel origin of the first, looping continuously with zero jump or reset.
2. **Substantially Slower News-Ticker Velocity**:
   - Calibrated duration dynamically based on character count with a `45s` floor (`Math.max(45, Math.round(totalChars * 0.14))` seconds, and `--marquee-duration: 48s` fallback in `app/globals.css`).
   - The top navbar notice strip now takes ~`45s–48s` per cycle and the homepage announcement strip takes ~`75s–85s` per cycle (~35px/sec), giving customers plenty of time to read every announcement comfortably.
3. **Accessibility (`prefers-reduced-motion`)**:
   - Preserved `motion-reduce:hidden` on the scrolling track, a static centered fallback (`hidden motion-reduce:flex`), and `@media (prefers-reduced-motion: reduce)` in `app/globals.css`.

---

## 8. Admin Dashboard UI Restoration & 9. Navigation Sidebar Fixes

### Root Cause of the Invisible Admin Sidebar
Inspection of Git history (`commit b2e10a9e4a4caa89c44d42e1c386dd8202b5cb93`) revealed two critical regressions introduced when Diwali styles were added:
1. **`components/HellfireBackground.tsx` Stacking Context Bug**:
   - Originally, `HellfireBackground` had `className="fixed inset-0 ... z-[-50] bg-[#080304]"`.
   - During the Diwali update, `z-[-50]` was replaced with `style={{ zIndex: 0 }}`.
   - Per the CSS 2.1 stacking context specification, a positioned element with `z-index: 0` (`<HellfireBackground />` with an opaque `#080304` layer) paints **on top of** non-positioned (`position: static`) block elements. Because `<aside>` in `app/admin/layout.tsx` was `position: static` (whereas `<header>` had `sticky z-40` and `<main>` had `relative`), `<HellfireBackground />` painted its opaque `#080304` backdrop directly **over** `<aside>`, rendering the Admin Sidebar invisible!
2. **Missing Original CSS Rules in `app/globals.css` & Invalid Tailwind Classes**:
   - Overwriting `app/globals.css` during the Diwali update removed `.bg-\[\#161616\]`, `.bg-\[\#0F0F0F\]`, `.border-neutral-900`, `.border-neutral-850`, `.scroll-reveal`, and `.animate-fade-in`.
   - `app/admin/layout.tsx` also used non-existent Tailwind v4 color classes (`text-neutral-450`, `text-neutral-550`, `bg-neutral-905`) and lacked mobile navigation (`hidden md:block` on `<aside>`).

### Restoration Implemented
1. **Restored `z-[-50]` and Pathname Separation in `components/HellfireBackground.tsx`**:
   - Restored `z-[-50]` on `HellfireBackground` so it always renders behind all DOM elements.
   - Added route detection (`const isAdminRoute = pathname.startsWith('/admin')`): when on `/admin/*`, `HellfireBackground` renders the exact original pre-Diwali dark crimson/obsidian background (`intensity = 0.3`) with **zero** Diwali purple/gold/cyber-blue overlays or Diwali sparks.
2. **Restored Original Admin Layout & Created `components/AdminSidebarNav.tsx`**:
   - Restored the original `HELLFIRE ADMIN` header, `Management Panel` desktop sidebar (`w-64 shrink-0 border-r border-neutral-900 bg-neutral-950/85 backdrop-blur-md hidden md:flex md:flex-col py-8 px-4 space-y-6 relative z-20`), and all 6 administrative navigation links:
     - **Dashboard** (`/admin`)
     - **Products** (`/admin/products`)
     - **Inventory** (`/admin/inventory`)
     - **Orders** (`/admin/orders`)
     - **Customers** (`/admin/customers`)
     - **Coupons** (`/admin/coupons`)
     - Plus **View Storefront** (`/`) and **Exit Dashboard** (`/`).
   - Added active route highlighting (`bg-[#C1121F]/15 text-white border-[#C1121F]/50`) and a responsive mobile navigation bar/drawer (`AdminMobileNav`) for `< md` screens.
   - Removed the customer-facing `<Navbar />` from the non-admin Access Denied view in `app/admin/layout.tsx`.
3. **Restored Original CSS Utilities in `app/globals.css`**:
   - Restored `.bg-\[\#161616\]`, `.bg-\[\#0F0F0F\]`, `.border-neutral-900`, `.border-neutral-850`, `.premium-glass`, `.scroll-reveal`, `.animate-fade-in`, `input:focus`, and custom scrollbars while preserving all Diwali animations for customer-facing pages.

---

## 10. Customer / Admin Layout Separation

| Website Section | Route(s) | Active Theme & Layout |
|---|---|---|
| Homepage | `/` | Full Diwali UI (`DiwaliHeroSection`, `FestiveJhalar`, `DiwaliFireworks`, `DiyaLamp`, Diwali `HellfireBackground`) |
| Product Catalogue & Search | `/#catalog`, `/search` | Full Diwali UI (`ProductCatalog`, `ProductCard` with strikethrough & Diwali badges) |
| Product Details | `/product/[slug]` | Full Diwali UI (`ProductDetails`, `PosterSizeReference`, `DiyaLamp`) |
| Cart & Cart Drawer | `/cart`, `CartDrawer` | Full Diwali UI (Festive savings banner, strikethrough regular prices) |
| Checkout & Order Confirmation | `/checkout`, `/account/orders/[orderId]` | Full Diwali UI (`CheckoutPageClient`, `OrderCelebration`, Razorpay & COD) |
| Customer Profile | `/account` | Full Diwali UI |
| Custom Poster Studio | `/custom-poster` | Full Diwali UI (`CustomPosterBuilder` with Diwali size pricing) |
| **Admin Dashboard & Management** | `/admin`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/customers`, `/admin/coupons` | **Original Pre-Diwali Admin UI** (`AdminLayout`, `AdminSidebarNav`, original `HellfireBackground` at `0.3` intensity, zero Diwali elements) |

---

## 11. Files Created

1. **`app/api/time/route.ts`**: Authoritative server time API endpoint (`GET /api/time`) returning dynamic UTC, epoch ms, IST formatted time, and campaign countdown state with `no-store` cache headers.
2. **`lib/useAuthoritativeTime.ts`**: Client-side clock synchronization hook (`useAuthoritativeDiwaliStatus`, `syncAuthoritativeClock`, `getAuthoritativeNow`) with RTT compensation, `sessionStorage` persistence across page navigation, 60s periodic resync, and `visibilitychange` / `focus` tab resync.
3. **`components/AdminSidebarNav.tsx`**: Client navigation component for the original Admin Dashboard (`AdminSidebarNav` for desktop and `AdminMobileNav` for mobile/tablet) with active route highlighting.
4. **`scratch/test-diwali-live-and-admin-restore.ts`**: Automated verification suite testing the authoritative time API, IST countdown calculation, exact expiration transition, slow marquee ticker, and Admin UI restoration.
5. **`WALKTHROUGH_DIWALI_LIVE_ADMIN_UI_RESTORE.md`**: This walkthrough documentation file.

---

## 12. Files Modified

1. **`lib/pricing.ts`**: Added `DIWALI_OFFER_END_UTC_ISO = '2026-11-08T22:30:00Z'` and updated `DIWALI_OFFER_END_DISPLAY = 'Monday, 9 November 2026 — 4:00 AM IST'`.
2. **`context/CartContext.tsx`**: Integrated `useAuthoritativeDiwaliStatus` into `CartProvider`, exposed `liveOfferStatus`, and wired `onExpire` to automatically trigger `refreshCart()` when the campaign expires.
3. **`components/DiwaliHeroSection.tsx`**: Updated to display `● DIWALI SALE — LIVE NOW`, `DIWALI SALE IS LIVE NOW!`, `FINAL DEADLINE: Monday, 9 November 2026 — 4:00 AM IST`, `DIWALI OFFER ENDS IN`, and `THE FESTIVE OFFER IS LIVE!`, driven by `useAuthoritativeDiwaliStatus`, and removed customer debug state toggles.
4. **`app/page.tsx`**: Passed `initialServerTimeMs={Date.now()}` to `<DiwaliHeroSection />` for zero-jump SSR hydration.
5. **`components/ProductCatalog.tsx`** & **`components/ProductDetails.tsx`**: Connected directly to `liveOfferStatus` from `useCart()` for real-time expiration updates.
6. **`components/UpdatesStrip.tsx`**: Replaced over-duplicated fast marquee with a two-half seamless loop and a slow `>= 45s` character-scaled duration.
7. **`components/HellfireBackground.tsx`**: Fixed `zIndex: 0` stacking context bug back to `z-[-50]` and separated `/admin` routes (original pre-Diwali background) from customer-facing routes (Diwali 2026 background).
8. **`app/admin/layout.tsx`**: Restored clean pre-Diwali Admin layout with `AdminSidebarNav`, `AdminMobileNav`, explicit `relative z-10`/`z-20` stacking, and valid Tailwind contrast classes.
9. **`app/globals.css`**: Restored original pre-Diwali CSS rules required by Admin and core components alongside customer-facing Diwali animations and slowed `.animate-marquee`.

---

## 13. Testing Performed

1. **Diwali Live + Real-Time IST Countdown + Admin UI Test Suite (`npx tsx --env-file=.env scratch/test-diwali-live-and-admin-restore.ts`) — `13/13` Passed**:
   - Verified fixed deadline `2026-11-09T04:00:00+05:30` (`2026-11-08T22:30:00Z`, `1794177000000` ms).
   - Verified `GET /api/time` returns dynamic UTC & IST timestamps with `no-store` headers.
   - Verified countdown calculation (`2026-11-07T02:24:18+05:30` -> `02 DAYS : 01 HOURS : 35 MINUTES : 42 SECONDS`).
   - Verified exact expiration at `2026-11-09T04:00:00+05:30` (`00:00:00:00`, `EXPIRED`, regular prices `₹49 / ₹29 / ₹15 / ₹7` restored).
   - Verified `UpdatesStrip` slow marquee configuration (`>= 45s`, `prefers-reduced-motion`).
   - Verified `HellfireBackground` (`z-[-50]`, `/admin` route separation), `AdminSidebarNav` (all 6 links + `View Storefront`), and `AdminLayout` (zero Diwali components).
2. **Global Pricing & Diwali Offer Suite (`npx tsx --env-file=.env scratch/test-diwali-offer.ts`) — `22/22` Passed**.
3. **COD & Razorpay Integration Suite (`npx tsx --env-file=.env scratch/test-cod-integration.ts`) — `17/17` Passed**.
4. **Next.js Production Build (`npm run build`) — Passed with `0` errors** (including `/api/time` route and all `/admin/*` and customer routes).

---

## 14. Deployment Considerations

- **Server Clock NTP Synchronization**: Standard cloud hosting environments (Vercel, Railway, AWS, Render) maintain NTP-synchronized system clocks. Because `GET /api/time` and all server actions evaluate `Date.now()` in UTC against the fixed ISO deadline `2026-11-09T04:00:00+05:30` (`1794177000000`), the server's local timezone environment variable (`TZ`) does not affect the epoch comparison, and `Intl.DateTimeFormat` explicitly formats display strings in `Asia/Kolkata`.
- **No Caching on `/api/time`**: `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store, no-cache, must-revalidate` ensure CDNs and browsers never serve a stale timestamp.

---

## 15. Outstanding Limitations

- None. All customer-facing Diwali Sale features, the real-time synchronized IST countdown, the slowed announcement ticker, and the original pre-Diwali Admin Dashboard UI and sidebar are verified and working as expected.

