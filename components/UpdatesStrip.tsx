'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface UpdatesStripProps {
  updates: string[];
}

export default function UpdatesStrip({ updates }: UpdatesStripProps) {
  // Duplicate the updates array so we can render them twice for a seamless loop
  const doubledUpdates = [...updates, ...updates];

  return (
    <div className="max-w-5xl mx-auto px-4 w-full select-none pt-4 pb-2">
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
