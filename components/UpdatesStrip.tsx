'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface UpdatesStripProps {
  updates: string[];
  variant?: 'default' | 'top-notice';
  className?: string;
}

export default function UpdatesStrip({ updates, variant = 'default', className = '' }: UpdatesStripProps) {
  // If updates has few items, duplicate sufficiently so there's continuous scroll without gaps
  const baseItems = updates.length < 4 ? [...updates, ...updates, ...updates, ...updates] : updates;
  const doubledUpdates = [...baseItems, ...baseItems];

  if (variant === 'top-notice') {
    return (
      <div className={`w-full bg-[#120305]/95 border-b border-[#C1121F]/30 overflow-hidden relative select-none py-1.5 px-2 backdrop-blur-md z-50 group hover:border-[#C1121F]/60 transition-colors shadow-[0_2px_12px_rgba(193,18,31,0.12)] ${className}`}>
        <div className="w-full overflow-hidden relative">
          <div className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:hidden">
            {doubledUpdates.map((update, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-200 shrink-0 select-none">
                <span className="text-white drop-shadow-[0_1px_4px_rgba(193,18,31,0.4)]">{update}</span>
                <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse mx-4 shrink-0" />
              </div>
            ))}
          </div>

          {/* Reduced motion static fallback display */}
          <div className="hidden motion-reduce:flex flex-wrap justify-center items-center gap-2 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-200 py-0.5 select-none">
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse shrink-0" />
            <span className="text-white">{updates[0]}</span>
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
          <div className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused] motion-reduce:hidden">
            {doubledUpdates.map((update, idx) => (
              <div key={idx} className="flex items-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300 shrink-0 select-none">
                <span>{update}</span>
                <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse mx-4" />
              </div>
            ))}
          </div>
          
          {/* Reduced motion static fallback display */}
          <div className="hidden motion-reduce:flex flex-wrap justify-center items-center gap-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-300 py-1 select-none">
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse" />
            <span>{updates[0]}</span>
            <Flame className="w-3.5 h-3.5 text-[#C1121F] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
