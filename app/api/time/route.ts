import { NextResponse } from 'next/server';
import {
  DIWALI_OFFER_TIMEZONE,
  DIWALI_OFFER_START_ISO,
  DIWALI_OFFER_END_ISO,
  DIWALI_OFFER_END_UTC_ISO,
  DIWALI_OFFER_START_MS,
  DIWALI_OFFER_END_MS,
  getDiwaliOfferStatus,
  formatDateInIST,
} from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Authoritative Server Time Endpoint for HellFire Prints Diwali Sale 2026.
 * Returns the live server UTC timestamp, epoch milliseconds, IST formatted timestamp,
 * and authoritative Diwali campaign status & countdown against the fixed deadline:
 *   2026-11-09T04:00:00+05:30 (2026-11-08T22:30:00Z)
 */
export async function GET() {
  const now = new Date();
  const status = getDiwaliOfferStatus(now);

  return NextResponse.json(
    {
      serverTimeUtc: now.toISOString(),
      serverTimestampMs: now.getTime(),
      serverTimeIst: formatDateInIST(now),
      timezone: DIWALI_OFFER_TIMEZONE,
      utcOffset: '+05:30',
      campaign: {
        startIso: DIWALI_OFFER_START_ISO,
        endIso: DIWALI_OFFER_END_ISO,
        endUtcIso: DIWALI_OFFER_END_UTC_ISO,
        startTimestampMs: DIWALI_OFFER_START_MS,
        endTimestampMs: DIWALI_OFFER_END_MS,
        phase: status.phase,
        isActive: status.isActive,
        isUpcoming: status.isUpcoming,
        isExpired: status.isExpired,
        countdown: status.countdown,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

