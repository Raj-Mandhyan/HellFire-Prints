'use client';

import React from 'react';

interface FireEngulfLayerProps {
  progress: number;
  transitionState: 'hidden' | 'entering' | 'loading' | 'exiting';
  isLoading: boolean;
  prefersReducedMotion?: boolean;
}

const BACK_FLAME_CONFIGS = [
  { left: '-5vw', width: '30vw', scaleY: 1.25, dur: '5.2s', delay: '-0.3s', color: 'from-[#5C0A0A] via-[#A51C0A]/40 to-transparent' },
  { left: '15vw', width: '25vw', scaleY: 1.45, dur: '4.8s', delay: '-1.8s', color: 'from-[#3A0709] via-[#800C12]/45 to-transparent' },
  { left: '30vw', width: '35vw', scaleY: 1.15, dur: '5.6s', delay: '-0.9s', color: 'from-[#5C0A0A] via-[#A51C0A]/40 to-transparent' },
  { left: '50vw', width: '28vw', scaleY: 1.35, dur: '4.6s', delay: '-2.4s', color: 'from-[#3A0709] via-[#800C12]/45 to-transparent' },
  { left: '70vw', width: '32vw', scaleY: 1.20, dur: '5.4s', delay: '-1.2s', color: 'from-[#5C0A0A] via-[#A51C0A]/40 to-transparent' },
  { left: '85vw', width: '25vw', scaleY: 1.50, dur: '4.9s', delay: '-2.9s', color: 'from-[#3A0709] via-[#800C12]/45 to-transparent' },
];

const MAIN_FLAME_CONFIGS = [
  { left: '0vw', width: '20vw', scaleY: 1.0, dur: '3.6s', delay: '-0.5s', color: 'from-[#A51C0A] via-[#C63D0A]/70 to-transparent' },
  { left: '10vw', width: '24vw', scaleY: 1.2, dur: '4.2s', delay: '-2.1s', color: 'from-[#C63D0A] via-[#E85D04]/60 to-transparent' },
  { left: '25vw', width: '18vw', scaleY: 0.95, dur: '3.3s', delay: '-1.0s', color: 'from-[#A51C0A] via-[#C63D0A]/70 to-transparent' },
  { left: '35vw', width: '22vw', scaleY: 1.15, dur: '3.9s', delay: '-2.6s', color: 'from-[#C63D0A] via-[#E85D04]/60 to-transparent' },
  { left: '50vw', width: '26vw', scaleY: 1.05, dur: '4.5s', delay: '-1.4s', color: 'from-[#A51C0A] via-[#C63D0A]/70 to-transparent' },
  { left: '68vw', width: '18vw', scaleY: 1.25, dur: '3.5s', delay: '-3.1s', color: 'from-[#C63D0A] via-[#E85D04]/60 to-transparent' },
  { left: '78vw', width: '24vw', scaleY: 0.9, dur: '4.0s', delay: '-0.8s', color: 'from-[#A51C0A] via-[#C63D0A]/70 to-transparent' },
  { left: '88vw', width: '20vw', scaleY: 1.1, dur: '3.8s', delay: '-1.9s', color: 'from-[#C63D0A] via-[#E85D04]/60 to-transparent' },
];

const CORE_FLAME_CONFIGS = [
  { left: '5vw', width: '12vw', scaleY: 0.75, dur: '2.5s', delay: '-0.2s', color: 'from-[#E85D04] via-[#FF8C1A]/80 to-transparent' },
  { left: '20vw', width: '15vw', scaleY: 0.85, dur: '2.8s', delay: '-1.4s', color: 'from-[#FF8C1A] via-[#FFB000]/80 to-transparent' },
  { left: '40vw', width: '12vw', scaleY: 0.70, dur: '2.3s', delay: '-0.9s', color: 'from-[#E85D04] via-[#FF8C1A]/80 to-transparent' },
  { left: '60vw', width: '16vw', scaleY: 0.90, dur: '3.0s', delay: '-2.0s', color: 'from-[#FF8C1A] via-[#FFB000]/80 to-transparent' },
  { left: '75vw', width: '12vw', scaleY: 0.65, dur: '2.4s', delay: '-0.7s', color: 'from-[#E85D04] via-[#FF8C1A]/80 to-transparent' },
  { left: '88vw', width: '14vw', scaleY: 0.80, dur: '2.7s', delay: '-1.7s', color: 'from-[#FF8C1A] via-[#FFB000]/80 to-transparent' },
];

const EMBER_CONFIGS = [
  { left: '8%', size: '3.5px', delay: '0s', dur: '4.5s', drift: '25px', height: '-110vh' },
  { left: '18%', size: '5px', delay: '-0.8s', dur: '5.2s', drift: '-35px', height: '-105vh' },
  { left: '28%', size: '3px', delay: '-2.1s', dur: '3.8s', drift: '15px', height: '-115vh' },
  { left: '38%', size: '4.5px', delay: '-1.3s', dur: '4.9s', drift: '-25px', height: '-100vh' },
  { left: '48%', size: '3px', delay: '-3.0s', dur: '4.2s', drift: '30px', height: '-120vh' },
  { left: '58%', size: '6px', delay: '-0.4s', dur: '5.8s', drift: '-15px', height: '-108vh' },
  { left: '68%', size: '4px', delay: '-1.7s', dur: '4.6s', drift: '20px', height: '-112vh' },
  { left: '78%', size: '3.5px', delay: '-2.6s', dur: '3.9s', drift: '-30px', height: '-104vh' },
  { left: '88%', size: '5px', delay: '-1.1s', dur: '5.0s', drift: '25px', height: '-116vh' },
  { left: '96%', size: '3px', delay: '-3.3s', dur: '4.1s', drift: '-20px', height: '-110vh' },
];

export default function FireEngulfLayer({
  progress,
  transitionState,
  isLoading,
  prefersReducedMotion = false,
}: FireEngulfLayerProps) {
  if (!isLoading) return null;

  // Calculate flame height based on progress (0% - 100%)
  // Height increases non-linearly across ignition, awakening, escalation, inferno, and engulf
  let baseHeight = 0;
  if (progress <= 20) {
    baseHeight = 6 + (progress / 20) * 8; // Phase 1: 6% to 14% height
  } else if (progress <= 40) {
    baseHeight = 14 + ((progress - 20) / 20) * 14; // Phase 2: 14% to 28% height
  } else if (progress <= 65) {
    baseHeight = 28 + ((progress - 40) / 25) * 22; // Phase 3: 28% to 50% height
  } else if (progress <= 85) {
    baseHeight = 50 + ((progress - 65) / 20) * 25; // Phase 4: 50% to 75% height
  } else {
    baseHeight = 75 + ((progress - 85) / 15) * 45; // Phase 5: 75% to 120% height (engulfs HUD)
  }

  // Handle layer position z-index (climbs above the loader during the final engulf phase)
  const isEngulfPhase = progress >= 85;
  const zIndexClass = isEngulfPhase ? 'z-[25]' : 'z-[5]';

  // Coordinate exiting/dissolving transition
  const getContainerStyle = (): React.CSSProperties => {
    const isExiting = transitionState === 'exiting' || transitionState === 'hidden';
    return {
      transform: isExiting ? 'translateY(100%)' : 'translateY(0%)',
      opacity: isExiting ? 0 : 1,
      transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-in-out',
      pointerEvents: 'none',
    };
  };

  return (
    <div
      className={`fixed inset-0 overflow-hidden select-none pointer-events-none ${zIndexClass}`}
      style={getContainerStyle()}
    >
      {/* SVG filter for organic fire turbulence displacement mapping */}
      <svg className="hidden absolute w-0 h-0">
        <defs>
          <filter id="fire-turbulence">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.035"
              numOctaves="3"
              result="noise"
              seed="1"
            >
              <animate
                attributeName="baseFrequency"
                dur="6s"
                values="0.012 0.035;0.012 0.11;0.012 0.035"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="32"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Layer 1: Heat Glow Back Layer (crimson/dark red, slower movement) */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none opacity-85"
        style={{ transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {BACK_FLAME_CONFIGS.map((f, i) => (
          <div
            key={`glow-${i}`}
            className="absolute bottom-0 rounded-full mix-blend-screen"
            style={{
              left: f.left,
              width: f.width,
              height: `${baseHeight * f.scaleY * 1.15}vh`,
              animation: prefersReducedMotion ? 'none' : `fire-flicker ${f.dur} ease-in-out infinite ${f.delay}`,
              background: `radial-gradient(ellipse at bottom, ${f.color})`,
              transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: isEngulfPhase ? 0.95 : 0.75,
            }}
          />
        ))}
      </div>

      {/* Layer 2: Main Flames Layer (warm orange-red, distorted by turbulence) */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none turbulence-fire"
        style={{ transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {MAIN_FLAME_CONFIGS.map((f, i) => (
          <div
            key={`flame-${i}`}
            className="absolute bottom-0 rounded-full mix-blend-screen"
            style={{
              left: f.left,
              width: f.width,
              height: `${baseHeight * f.scaleY}vh`,
              animation: prefersReducedMotion ? 'none' : `fire-flicker ${f.dur} ease-in-out infinite ${f.delay}`,
              background: `radial-gradient(ellipse at bottom, ${f.color})`,
              transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: isEngulfPhase ? 1 : 0.85,
            }}
          />
        ))}
      </div>

      {/* Layer 3: Hot Highlights Layer (bright golden/amber core cores, faster flicker) */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none turbulence-fire"
        style={{ transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {CORE_FLAME_CONFIGS.map((f, i) => (
          <div
            key={`core-${i}`}
            className="absolute bottom-0 rounded-full mix-blend-screen"
            style={{
              left: f.left,
              width: f.width,
              height: `${baseHeight * f.scaleY * 0.8}vh`,
              animation: prefersReducedMotion ? 'none' : `fire-flicker ${f.dur} ease-in-out infinite ${f.delay}`,
              background: `radial-gradient(ellipse at bottom, ${f.color})`,
              transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: isEngulfPhase ? 1 : 0.9,
            }}
          />
        ))}
      </div>

      {/* Layer 4: Rising Ember System (scaled with loading progress) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {EMBER_CONFIGS.map((e, i) => {
          // Scale density/opacity based on progress benchmarks
          let emberOpacity = 0;
          if (progress >= 15) {
            emberOpacity = progress >= 85 ? 0.9 : 0.65;
          }

          return (
            <div
              key={`ember-${i}`}
              className="absolute bottom-[-10px] rounded-full animate-rise-ember"
              style={{
                left: e.left,
                width: e.size,
                height: e.size,
                backgroundColor: '#E85D04',
                boxShadow: '0 0 6px #fcbf49, 0 0 2px #E85D04',
                animationDuration: e.dur,
                animationDelay: e.delay,
                opacity: emberOpacity,
                transition: 'opacity 0.4s ease-in-out',
                '--rise-height': e.height,
                '--drift': e.drift,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* Layer 5: Viewport Engulf Solid Overlay (Fades in red/black to swallow old page completely) */}
      {progress >= 86 && (
        <div
          className="fixed inset-0 pointer-events-none bg-gradient-to-t from-[#080304] via-[#2A0507]/90 to-[#080304] transition-opacity duration-500 ease-out"
          style={{
            opacity: progress >= 95 ? 1 : (progress - 86) / 9 * 0.9,
            zIndex: 26,
          }}
        />
      )}
    </div>
  );
}
