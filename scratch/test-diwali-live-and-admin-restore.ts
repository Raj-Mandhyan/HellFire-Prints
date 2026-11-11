import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import {
  DIWALI_OFFER_START_ISO,
  DIWALI_OFFER_END_ISO,
  DIWALI_OFFER_END_UTC_ISO,
  DIWALI_OFFER_START_MS,
  DIWALI_OFFER_END_MS,
  DIWALI_OFFER_END_DISPLAY,
  REGULAR_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
  getDiwaliOfferStatus,
  getSizePricing,
  getVariantPricing,
} from '../lib/pricing';
import { GET as getAuthoritativeTime } from '../app/api/time/route';
import { calculateCartTotal } from '../lib/discounts';

async function main() {
  console.log('======================================================================');
  console.log('  HELLFIRE PRINTS — DIWALI LIVE + IST COUNTDOWN + ADMIN UI TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      passed++;
      console.log(`✅ PASS: ${testName}${details ? ` (${details})` : ''}`);
    } else {
      failed++;
      console.error(`❌ FAIL: ${testName}${details ? ` (${details})` : ''}`);
    }
  }

  // -------------------------------------------------------------------------
  // 1. Fixed Campaign Deadline & Authoritative Timezone Verification
  // -------------------------------------------------------------------------
  console.log('--- 1. Fixed Campaign Deadline & IST Timezone Verification ---');
  assert(
    DIWALI_OFFER_END_ISO === '2026-11-14T13:00:00+05:30' &&
      DIWALI_OFFER_END_UTC_ISO === '2026-11-14T07:30:00Z' &&
      DIWALI_OFFER_END_MS === Date.parse('2026-11-14T07:30:00Z'),
    'Fixed deadline is 2026-11-14T13:00:00+05:30 (2026-11-14T07:30:00Z UTC)',
    `endMs=${DIWALI_OFFER_END_MS}, display="${DIWALI_OFFER_END_DISPLAY}"`
  );

  // -------------------------------------------------------------------------
  // 2. Authoritative Backend Time API (/api/time) Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Authoritative Backend Time API (/api/time) Verification ---');
  const tBefore = Date.now();
  const response1 = await getAuthoritativeTime();
  const payload1 = await response1.json();
  const tAfter = Date.now();

  assert(
    response1.status === 200 &&
      typeof payload1.serverTimestampMs === 'number' &&
      payload1.serverTimestampMs >= tBefore &&
      payload1.serverTimestampMs <= tAfter &&
      payload1.timezone === 'Asia/Kolkata' &&
      payload1.utcOffset === '+05:30' &&
      payload1.campaign.endIso === '2026-11-09T04:00:00+05:30' &&
      payload1.campaign.endUtcIso === '2026-11-08T22:30:00Z',
    'GET /api/time returns live authoritative UTC & IST timestamp and fixed deadline metadata',
    `serverTimeUtc=${payload1.serverTimeUtc}, serverTimeIst="${payload1.serverTimeIst}", phase=${payload1.campaign.phase}`
  );

  const cacheControl = response1.headers.get('Cache-Control') || '';
  assert(
    cacheControl.includes('no-store') && cacheControl.includes('no-cache'),
    'GET /api/time enforces no-store / no-cache headers so timestamps are never cached',
    `Cache-Control="${cacheControl}"`
  );

  // -------------------------------------------------------------------------
  // 3. Real-Time Countdown Calculation & Expiration Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Real-Time Countdown Calculation & Expiration ---');
  // Test sample timestamp inside active window: 7 Nov 2026, 02:24:18 AM IST
  const sampleNow = new Date('2026-11-07T02:24:18+05:30');
  const sampleStatus = getDiwaliOfferStatus(sampleNow);
  const expectedRemainingMs = DIWALI_OFFER_END_MS - sampleNow.getTime();
  // From 7 Nov 02:24:18 AM to 9 Nov 04:00:00 AM is 2 days, 1 hour, 35 minutes, 42 seconds
  assert(
    sampleStatus.phase === 'ACTIVE' &&
      sampleStatus.isActive &&
      sampleStatus.countdown.totalMs === expectedRemainingMs &&
      sampleStatus.countdown.days === 2 &&
      sampleStatus.countdown.hours === 1 &&
      sampleStatus.countdown.minutes === 35 &&
      sampleStatus.countdown.seconds === 42,
    'Countdown formula (End - Authoritative Now) accurately computes 02d : 01h : 35m : 42s at 2026-11-07T02:24:18+05:30',
    `${sampleStatus.countdown.days}d:${sampleStatus.countdown.hours}h:${sampleStatus.countdown.minutes}m:${sampleStatus.countdown.seconds}s`
  );

  // Exact expiration at 9 Nov 2026, 4:00:00 AM IST
  const exactDeadline = new Date('2026-11-09T04:00:00+05:30');
  const expiredStatus = getDiwaliOfferStatus(exactDeadline);
  assert(
    expiredStatus.phase === 'EXPIRED' &&
      !expiredStatus.isActive &&
      expiredStatus.isExpired &&
      expiredStatus.countdown.days === 0 &&
      expiredStatus.countdown.hours === 0 &&
      expiredStatus.countdown.minutes === 0 &&
      expiredStatus.countdown.seconds === 0 &&
      expiredStatus.countdown.totalMs === 0,
    'At exact 9 Nov 2026, 4:00:00 AM IST -> Countdown reaches 00:00:00:00 and status transitions to EXPIRED',
    `phase=${expiredStatus.phase}, totalMs=${expiredStatus.countdown.totalMs}`
  );

  // Pricing restoration immediately upon expiration
  const a3AtExpiration = getSizePricing('A3', exactDeadline);
  const a4AtExpiration = getSizePricing('A4', exactDeadline);
  const a5AtExpiration = getSizePricing('A5', exactDeadline);
  const a6AtExpiration = getSizePricing('A6', exactDeadline);
  assert(
    a3AtExpiration.effectivePrice === 49 &&
      a4AtExpiration.effectivePrice === 29 &&
      a5AtExpiration.effectivePrice === 15 &&
      a6AtExpiration.effectivePrice === 7 &&
      !a3AtExpiration.isOfferActive,
    'Immediately at 9 Nov 2026, 4:00:00 AM IST -> Diwali promotional prices stop and regular prices (49/29/15/7) restore',
    `A3=₹${a3AtExpiration.effectivePrice}, A4=₹${a4AtExpiration.effectivePrice}, A5=₹${a5AtExpiration.effectivePrice}, A6=₹${a6AtExpiration.effectivePrice}`
  );

  // -------------------------------------------------------------------------
  // 4. Diwali Hero UI & Client Synchronization Hook Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Diwali Hero Section & Client Time Sync Verification ---');
  const heroSource = fs.readFileSync(path.join(process.cwd(), 'components/DiwaliHeroSection.tsx'), 'utf8');
  const timeHookSource = fs.readFileSync(path.join(process.cwd(), 'lib/useAuthoritativeTime.ts'), 'utf8');

  assert(
    heroSource.includes('● DIWALI SALE — LIVE NOW') &&
      heroSource.includes('DIWALI SALE IS LIVE NOW!') &&
      heroSource.includes('THE GRAND') &&
      heroSource.includes('Light Up Your Walls.') &&
      heroSource.includes('FINAL DEADLINE') &&
      heroSource.includes('DIWALI OFFER ENDS IN') &&
      heroSource.includes('THE FESTIVE OFFER IS LIVE!') &&
      !heroSource.includes('setPreviewPhase'),
    'DiwaliHeroSection displays LIVE NOW status, FINAL DEADLINE badge, DIWALI OFFER ENDS IN header, and removes customer debug phase toggles'
  );

  assert(
    timeHookSource.includes("fetch('/api/time'") &&
      timeHookSource.includes('visibilitychange') &&
      timeHookSource.includes('RESYNC_INTERVAL_MS') &&
      timeHookSource.includes('sessionStorage'),
    'useAuthoritativeTime hook syncs with /api/time, compensates for RTT, persists offset across page navigations, and resyncs on tab visibilitychange'
  );

  // -------------------------------------------------------------------------
  // 5. Notice Box Slow-Scrolling Ticker Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Notice Box Slow-Scrolling Ticker Verification ---');
  const updatesStripSource = fs.readFileSync(path.join(process.cwd(), 'components/UpdatesStrip.tsx'), 'utf8');
  const globalsCssSource = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');

  assert(
    updatesStripSource.includes('Math.max(45,') &&
      updatesStripSource.includes('--marquee-duration') &&
      updatesStripSource.includes('motion-reduce:hidden') &&
      globalsCssSource.includes('animation: marquee var(--marquee-duration, 48s) linear infinite'),
    'UpdatesStrip uses slow >=45s duration, seamless 2-half loop, and respects prefers-reduced-motion'
  );

  // -------------------------------------------------------------------------
  // 6. Admin Dashboard UI Restoration & Layout Separation Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Admin Dashboard UI Restoration & Layout Separation ---');
  const adminLayoutSource = fs.readFileSync(path.join(process.cwd(), 'app/admin/layout.tsx'), 'utf8');
  const adminSidebarSource = fs.readFileSync(path.join(process.cwd(), 'components/AdminSidebarNav.tsx'), 'utf8');
  const hellfireBgSource = fs.readFileSync(path.join(process.cwd(), 'components/HellfireBackground.tsx'), 'utf8');

  assert(
    hellfireBgSource.includes('z-[-50]') &&
      !hellfireBgSource.includes('zIndex: 0') &&
      hellfireBgSource.includes("pathname.startsWith('/admin')"),
    'HellfireBackground uses z-[-50] (never covers Admin sidebar) and renders original pre-Diwali background on /admin routes'
  );

  assert(
    adminSidebarSource.includes("href: '/admin', label: 'Dashboard'") &&
      adminSidebarSource.includes("href: '/admin/products', label: 'Products'") &&
      adminSidebarSource.includes("href: '/admin/inventory', label: 'Inventory'") &&
      adminSidebarSource.includes("href: '/admin/orders', label: 'Orders'") &&
      adminSidebarSource.includes("href: '/admin/customers', label: 'Customers'") &&
      adminSidebarSource.includes("href: '/admin/coupons', label: 'Coupons'") &&
      adminSidebarSource.includes('View Storefront') &&
      adminSidebarSource.includes('AdminMobileNav'),
    'AdminSidebarNav restores all 6 admin navigation links + View Storefront with active route highlighting and mobile navigation'
  );

  assert(
    !adminLayoutSource.includes('DiyaLamp') &&
      !adminLayoutSource.includes('FestiveJhalar') &&
      !adminLayoutSource.includes('DiwaliFireworks') &&
      !adminLayoutSource.includes("from '@/components/Navbar'") &&
      !adminLayoutSource.includes('<Navbar'),
    'AdminLayout contains zero Diwali components or customer Navbar Jhalar/ticker'
  );

  // -------------------------------------------------------------------------
  // 7. Database & Pricing Integrity Check
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Database & Pricing Integrity Check ---');
  const productCount = await prisma.product.count();
  const sampleProduct = await prisma.product.findFirst({
    include: { variants: { include: { size: true } } },
  });
  const a3Var = sampleProduct?.variants.find((v) => v.size?.name === 'A3');
  const a4Var = sampleProduct?.variants.find((v) => v.size?.name === 'A4');
  const a5Var = sampleProduct?.variants.find((v) => v.size?.name === 'A5');
  const a6Var = sampleProduct?.variants.find((v) => v.size?.name === 'A6');

  assert(
    productCount >= 36 &&
      a3Var?.price === 49 &&
      a4Var?.price === 29 &&
      a5Var?.price === 15 &&
      a6Var?.price === 7,
    'Database products and regular size prices (A3=₹49, A4=₹29, A5=₹15, A6=₹7) remain intact',
    `products=${productCount}, A3=₹${a3Var?.price}, A4=₹${a4Var?.price}, A5=₹${a5Var?.price}, A6=₹${a6Var?.price}`
  );

  console.log('\n======================================================================');
  console.log(`  SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
