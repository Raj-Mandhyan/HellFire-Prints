'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDiwaliOfferStatus,
  DiwaliOfferStatus,
  DIWALI_OFFER_START_MS,
} from '@/lib/pricing';

const OFFSET_STORAGE_KEY = 'hfp_server_clock_offset_ms_v1';
const RESYNC_INTERVAL_MS = 60_000; // Periodically resynchronize every 60 seconds

// Module-level shared offset so client-side route navigation never restarts or jumps the countdown
let sharedServerOffsetMs: number | null = null;
let lastSyncTimestampMs = 0;
let activeSyncPromise: Promise<number> | null = null;

function readStoredOffset(): number | null {
  if (sharedServerOffsetMs !== null) {
    return sharedServerOffsetMs;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(OFFSET_STORAGE_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        sharedServerOffsetMs = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore storage read errors in restricted browsing modes
  }
  return null;
}

function writeStoredOffset(offsetMs: number): void {
  sharedServerOffsetMs = offsetMs;
  lastSyncTimestampMs = Date.now();
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(OFFSET_STORAGE_KEY, String(offsetMs));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Returns the current authoritative Date adjusted by the synchronized server-client clock offset.
 */
export function getAuthoritativeNow(fallbackServerTimeMs?: number): Date {
  const offset = readStoredOffset();
  if (offset !== null) {
    return new Date(Date.now() + offset);
  }
  if (typeof fallbackServerTimeMs === 'number' && Number.isFinite(fallbackServerTimeMs)) {
    return new Date(fallbackServerTimeMs);
  }
  return new Date();
}

/**
 * Synchronizes the local clock offset against the backend `/api/time` endpoint,
 * compensating for half of the HTTP round-trip latency.
 */
export async function syncAuthoritativeClock(force = false): Promise<number> {
  if (typeof window === 'undefined') return 0;

  if (!force && sharedServerOffsetMs !== null && Date.now() - lastSyncTimestampMs < 5_000) {
    return sharedServerOffsetMs;
  }

  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    try {
      const requestStartMs = Date.now();
      const response = await fetch('/api/time', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
      const responseEndMs = Date.now();

      if (!response.ok) {
        return readStoredOffset() ?? 0;
      }

      const data = await response.json();
      if (typeof data?.serverTimestampMs === 'number' && Number.isFinite(data.serverTimestampMs)) {
        const roundTripMs = Math.max(0, responseEndMs - requestStartMs);
        const estimatedServerNowMs = data.serverTimestampMs + Math.round(roundTripMs / 2);
        const newOffsetMs = estimatedServerNowMs - responseEndMs;

        // Smooth out tiny jitter (< 250ms) when an offset is already established to prevent digit flicker
        const existingOffset = readStoredOffset();
        if (existingOffset !== null && Math.abs(newOffsetMs - existingOffset) < 250) {
          lastSyncTimestampMs = Date.now();
          return existingOffset;
        }

        writeStoredOffset(newOffsetMs);
        return newOffsetMs;
      }
    } catch {
      // Network failure: gracefully retain existing offset (or 0) without crashing or jumping
    } finally {
      activeSyncPromise = null;
    }
    return readStoredOffset() ?? 0;
  })();

  return activeSyncPromise;
}

export interface UseAuthoritativeDiwaliStatusOptions {
  initialServerTimeMs?: number;
  onActivate?: () => void;
  onExpire?: () => void;
}

/**
 * Hook that continuously computes the authoritative Grand Diwali Extended Offer status & countdown
 * against:
 *   Start: 12 November 2026, 1:00:00 PM IST (`2026-11-12T13:00:00+05:30` / `2026-11-12T07:30:00Z`)
 *   End:   14 November 2026, 1:00:00 PM IST (`2026-11-14T13:00:00+05:30` / `2026-11-14T07:30:00Z`)
 *
 * Features:
 * - Seeds offset immediately from SSR `initialServerTimeMs` or `sessionStorage` so page refresh & route changes never jump.
 * - Synchronizes with `/api/time` on mount, every 60s, and whenever the browser tab regains visibility/focus.
 * - Updates every 1 second and triggers `onActivate` / `onExpire` immediately on phase transitions.
 */
export function useAuthoritativeDiwaliStatus(
  options: UseAuthoritativeDiwaliStatusOptions = {}
): {
  status: DiwaliOfferStatus;
  isSynced: boolean;
  offsetMs: number;
  resync: () => Promise<void>;
} {
  const { initialServerTimeMs, onActivate, onExpire } = options;
  const onActivateRef = useRef(onActivate);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onActivateRef.current = onActivate;
    onExpireRef.current = onExpire;
  }, [onActivate, onExpire]);

  // Deterministic initial reference timestamp so SSR and initial client hydration always match 100%
  const initialReferenceMs =
    typeof initialServerTimeMs === 'number' && Number.isFinite(initialServerTimeMs)
      ? initialServerTimeMs
      : DIWALI_OFFER_START_MS;

  const [status, setStatus] = useState<DiwaliOfferStatus>(() =>
    getDiwaliOfferStatus(new Date(initialReferenceMs))
  );

  // Initialize to deterministic defaults for SSR + hydration; updated inside useEffect after mount & sync
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const prevPhaseRef = useRef(status.phase);

  const tick = useCallback(() => {
    const nextStatus = getDiwaliOfferStatus(getAuthoritativeNow(initialServerTimeMs));
    setStatus(nextStatus);

    if (prevPhaseRef.current === 'UPCOMING' && nextStatus.phase === 'ACTIVE') {
      prevPhaseRef.current = 'ACTIVE';
      onActivateRef.current?.();
    } else if (prevPhaseRef.current === 'ACTIVE' && nextStatus.phase === 'EXPIRED') {
      prevPhaseRef.current = 'EXPIRED';
      onExpireRef.current?.();
    } else {
      prevPhaseRef.current = nextStatus.phase;
    }
  }, [initialServerTimeMs]);

  const resync = useCallback(async () => {
    const syncedOffset = await syncAuthoritativeClock(true);
    setOffsetMs(syncedOffset);
    setIsSynced(true);
    tick();
  }, [tick]);

  useEffect(() => {
    let isMounted = true;

    // Seed offset from SSR initialServerTimeMs on first client mount if no offset is stored yet
    const existingOffset = readStoredOffset();
    if (
      existingOffset === null &&
      typeof initialServerTimeMs === 'number' &&
      Number.isFinite(initialServerTimeMs)
    ) {
      writeStoredOffset(initialServerTimeMs - Date.now());
    }

    // 1. Post-hydration immediate tick and authoritative backend sync
    const immediateTimer = window.setTimeout(() => {
      if (!isMounted) return;
      tick();
    }, 0);

    syncAuthoritativeClock(false).then((syncedOffset) => {
      if (!isMounted) return;
      setOffsetMs(syncedOffset);
      setIsSynced(true);
      tick();
    });

    // 2. 1-second real-time countdown update interval
    const secondInterval = window.setInterval(tick, 1000);

    // 3. Periodic resynchronization with backend every 60 seconds
    const resyncInterval = window.setInterval(() => {
      syncAuthoritativeClock(true).then((syncedOffset) => {
        if (!isMounted) return;
        setOffsetMs(syncedOffset);
        setIsSynced(true);
        tick();
      });
    }, RESYNC_INTERVAL_MS);

    // 4. Resynchronize immediately when user returns to browser tab or window regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
        syncAuthoritativeClock(true).then((syncedOffset) => {
          if (!isMounted) return;
          setOffsetMs(syncedOffset);
          setIsSynced(true);
          tick();
        });
      }
    };

    const handleWindowFocus = () => {
      tick();
      syncAuthoritativeClock(false).then((syncedOffset) => {
        if (!isMounted) return;
        setOffsetMs(syncedOffset);
        setIsSynced(true);
        tick();
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearTimeout(immediateTimer);
      window.clearInterval(secondInterval);
      window.clearInterval(resyncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [tick, initialServerTimeMs]);

  return { status, isSynced, offsetMs, resync };
}

