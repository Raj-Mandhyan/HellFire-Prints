'use client';

import React, { useId } from 'react';

interface DiyaLampProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  delayMs?: number;
}

/**
 * Artistic Digital Diya with animated multi-layer flickering golden flame,
 * warm radial illumination halo, and ornate cyber-traditional metallic vessel.
 */
export function DiyaLamp({ size = 'md', className = '', delayMs = 0 }: DiyaLampProps) {
  const uid = useId().replace(/:/g, '');
  const dimensions =
    size === 'lg'
      ? { width: 76, height: 84 }
      : size === 'sm'
      ? { width: 38, height: 42 }
      : { width: 54, height: 60 };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      aria-hidden="true"
    >
      {/* Warm Ambient Radial Halo */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-t from-amber-500/35 via-yellow-400/25 to-transparent blur-md animate-diya-halo"
        style={{ animationDelay: `${delayMs}ms` }}
      />

      {/* Floor Warm Reflection */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4/5 h-2 rounded-full bg-amber-500/30 blur-xs" />

      <svg
        viewBox="0 0 80 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-[0_6px_14px_rgba(255,183,3,0.35)]"
      >
        <defs>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="30%" r="45%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#FF7B00" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C1121F" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`flame-outer-${uid}`} x1="40" y1="6" x2="40" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF8D6" />
            <stop offset="35%" stopColor="#FFD700" />
            <stop offset="75%" stopColor="#FF7B00" />
            <stop offset="100%" stopColor="#C1121F" />
          </linearGradient>

          <linearGradient id={`flame-inner-${uid}`} x1="40" y1="14" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#FFE680" />
            <stop offset="100%" stopColor="#FF9E00" />
          </linearGradient>

          <linearGradient id={`bowl-body-${uid}`} x1="10" y1="46" x2="70" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9A1B1B" />
            <stop offset="35%" stopColor="#C1121F" />
            <stop offset="70%" stopColor="#7C1018" />
            <stop offset="100%" stopColor="#3B060A" />
          </linearGradient>

          <linearGradient id={`gold-rim-${uid}`} x1="8" y1="46" x2="72" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="25%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFF3B0" />
            <stop offset="75%" stopColor="#FCBF49" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Ambient SVG Glow Circle */}
        <circle cx="40" cy="28" r="26" fill={`url(#halo-${uid})`} className="animate-diya-halo" />

        {/* Animated Multi-Layer Flame Group */}
        <g className="animate-diya-flame" style={{ animationDelay: `${delayMs}ms` }}>
          {/* Outer Saffron/Gold Flame */}
          <path
            d="M40 7C40 7 27 22 27 33C27 40.5 32.8 46 40 46C47.2 46 53 40.5 53 33C53 22 40 7 40 7Z"
            fill={`url(#flame-outer-${uid})`}
          />
          {/* Inner White-Gold Core Flame */}
          <path
            d="M40 16C40 16 32.5 26 32.5 34C32.5 38.5 35.8 42.5 40 42.5C44.2 42.5 47.5 38.5 47.5 34C47.5 26 40 16 40 16Z"
            fill={`url(#flame-inner-${uid})`}
          />
          {/* Pure White Hot Tip */}
          <ellipse cx="40" cy="36" rx="3.2" ry="4.8" fill="#FFFFFF" fillOpacity="0.9" />
        </g>

        {/* Glowing Cotton Wick */}
        <path d="M40 43V49" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />

        {/* Golden Oil Pool Reflection */}
        <ellipse cx="40" cy="49" rx="26" ry="4.5" fill="#FF9E00" fillOpacity="0.45" />

        {/* Ornate Diya Vessel Body */}
        <path
          d="M9 48C9 48 13 73 40 73C67 73 71 48 71 48H9Z"
          fill={`url(#bowl-body-${uid})`}
          stroke={`url(#gold-rim-${uid})`}
          strokeWidth="2"
        />

        {/* Upper Ornate Gold Rim */}
        <path
          d="M7 48C20 52 60 52 73 48C66 45.5 14 45.5 7 48Z"
          fill={`url(#gold-rim-${uid})`}
        />

        {/* Geometric Festive Filigree Accents on Diya Bowl */}
        <path
          d="M18 56C25 61 55 61 62 56"
          stroke={`url(#gold-rim-${uid})`}
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        <circle cx="40" cy="61" r="2.5" fill="#FFD700" />
        <circle cx="29" cy="59.5" r="1.6" fill="#FCBF49" />
        <circle cx="51" cy="59.5" r="1.6" fill="#FCBF49" />

        {/* Pedestal Base */}
        <path
          d="M27 73L23 79H57L53 73H27Z"
          fill={`url(#gold-rim-${uid})`}
        />
      </svg>
    </div>
  );
}

interface FestiveJhalarProps {
  variant?: 'header' | 'hero' | 'footer';
  className?: string;
}

/**
 * Sophisticated Hanging Festive String Lights (Jhalars) with golden festoon cables,
 * geometric diamond lanterns, and alternating twinkling bulbs.
 */
export function FestiveJhalar({ variant = 'header', className = '' }: FestiveJhalarProps) {
  const strandCount = variant === 'hero' ? 14 : 18;
  const colors = ['#FFD700', '#FF7B00', '#00E5FF', '#FF4D4D', '#FCBF49', '#A855F7'];

  return (
    <div
      className={`w-full overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Top Golden Filigree Border Line */}
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFD700]/70 to-transparent shadow-[0_0_12px_rgba(255,215,0,0.6)]" />

      {/* Hanging String Bulbs Row */}
      <div className="flex items-start justify-around w-full px-2">
        {Array.from({ length: strandCount }).map((_, idx) => {
          const isLong = idx % 2 === 0;
          const color = colors[idx % colors.length];
          const delay = (idx * 190) % 2000;
          const cordHeight =
            variant === 'hero'
              ? isLong
                ? 'h-7 sm:h-9'
                : 'h-4 sm:h-5'
              : isLong
              ? 'h-4 sm:h-5'
              : 'h-2.5 sm:h-3.5';

          return (
            <div
              key={idx}
              className="flex flex-col items-center animate-jhalar-sway"
              style={{ animationDelay: `${delay}ms` }}
            >
              {/* Golden Hanging Cord */}
              <div className={`w-[1px] ${cordHeight} bg-gradient-to-b from-[#FFD700]/80 to-[#FCBF49]/40`} />

              {/* Glowing Diamond Bulb */}
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rotate-45 rounded-[2px] animate-jhalar-twinkle"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}, 0 0 18px ${color}`,
                  animationDelay: `${delay}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DiyaSectionDividerProps {
  label?: string;
  className?: string;
}

/**
 * Festive Section Divider featuring glowing Diyas & golden cyber-mandala lines
 */
export function DiyaSectionDivider({
  label = 'SHUBH DEEPAVALI • FESTIVAL OF LIGHTS 2026',
  className = '',
}: DiyaSectionDividerProps) {
  return (
    <div
      className={`max-w-5xl mx-auto px-6 py-4 flex flex-col items-center gap-2 select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="w-full flex items-center justify-center gap-4 sm:gap-6">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-amber-500/45 to-[#FFD700]" />
        <div className="flex items-end gap-3 sm:gap-5">
          <DiyaLamp size="sm" delayMs={350} />
          <DiyaLamp size="md" delayMs={0} />
          <DiyaLamp size="sm" delayMs={700} />
        </div>
        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-amber-500/45 to-[#FFD700]" />
      </div>
      {label && (
        <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-[0.28em] text-amber-300/80">
          {label}
        </span>
      )}
    </div>
  );
}

