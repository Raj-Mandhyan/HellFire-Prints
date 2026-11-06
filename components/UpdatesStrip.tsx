'use client';

import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';

interface UpdatesStripProps {
  updates: string[];
  variant?: 'default' | 'top-notice';
  durationSeconds?: number;
  className?: string;
}

/**
 * Premium slow-scrolling announcement ticker.
 * Uses two identical flex halves translated from 0% to -50% for a mathematically seamless loop
 * without jumps or resets, calibrated to a calm, readable news-ticker velocity (~45s–80s per cycle).
 */
export default function UpdatesStrip({
  updates,
  variant = 'default',
  durationSeconds,
  className = '',
}: UpdatesStripProps) {
  // Ensure at least 2 items per half so wide viewports are always filled without over-duplicating
  const halfItems = useMemo(() => {
    if (!updates || updates.length === 0) return [];
    return updates.length === 1 ? [updates[0], updates[0]] : updates;
  }, [updates]);

  // Calculate a slow, consistent reading speed (~45s minimum, scaled by character length so velocity stays steady)
  const computedDurationSeconds = useMemo(() => {
    if (typeof durationSeconds === 'number' && durationSeconds > 0) {
      return durationSeconds;
    }
    const totalChars = halfItems.reduce((sum, item) => sum + item.length, 0);
    // ~0.14s per character with a 45s floor gives ~45s for 2 announcements and ~75s for 4 announcements
    return Math.max(45, Math.round(totalChars * 0.14));
  }, [halfItems, durationSeconds]);

  const marqueeStyle = useMemo(
    () =>
      ({
        '--marquee-duration': `${computedDurationSeconds}s`,
        animationDuration: `${computedDurationSeconds}s`,
      }) as React.CSSProperties,
    [computedDurationSeconds]
  );

  if (halfItems.length === 0) return null;

  if (variant === 'top-notice') {
    return (
      <div
        className={`w-full bg-[#120305]/95 border-b border-[#C1121F]/30 overflow-hidden relative select-none py-1.5 px-2 backdrop-blur-md z-50 group hover:border-[#C1121F]/60 transition-colors shadow-[0_2px_12px_rgba(193,18,31,0.12)] ${className}`}
      >
        <div className="w-full overflow-hidden relative">
          <div
            className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:hidden"
            style={marqueeStyle}
          >
            {[0, 1].map((halfIdx) => (
              <div
                key={halfIdx}
                className="flex shrink-0 items-center"
                aria-hidden={halfIdx === 1 ? 'true' : undefined}
              >
                {halfItems.map((update, idx) => (
                  <div
                    key={`${halfIdx}-${idx}`}
                    className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-200 shrink-0 select-none"
                  >
                    <span className="text-white drop-shadow-[0_1px_4px_rgba(193,18,31,0.4)] px-2">
                      {update}
                    </span>
                    <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse mx-6 shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Reduced motion static fallback display */}
          <div className="hidden motion-reduce:flex flex-wrap justify-center items-center gap-2 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-200 py-0.5 select-none">
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse shrink-0" />
            <span className="text-white">{halfItems[0]}</span>
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 w-full select-none pt-4 pb-2 ${className}`}>
      <div className="relative w-full overflow-hidden bg-neutral-900/45 border border-neutral-850/80 rounded-2xl py-3 px-4 flex items-center shadow-[0_0_15px_rgba(193,18,31,0.06)] backdrop-blur-sm group hover:border-[#C1121F]/30 hover:shadow-[0_0_20px_rgba(193,18,31,0.12)] transition-all duration-300">
        {/* Subtle fiery glow decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#C1121F]/5 via-transparent to-[#C1121F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

        <div className="w-full overflow-hidden relative">
          <div
            className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:hidden"
            style={marqueeStyle}
          >
            {[0, 1].map((halfIdx) => (
              <div
                key={halfIdx}
                className="flex shrink-0 items-center"
                aria-hidden={halfIdx === 1 ? 'true' : undefined}
              >
                {halfItems.map((update, idx) => (
                  <div
                    key={`${halfIdx}-${idx}`}
                    className="flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300 shrink-0 select-none"
                  >
                    <span className="px-2">{update}</span>
                    <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse mx-6 shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Reduced motion static fallback display */}
          <div className="hidden motion-reduce:flex flex-wrap justify-center items-center gap-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300 py-1 select-none">
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse shrink-0" />
            <span>{halfItems[0]}</span>
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
