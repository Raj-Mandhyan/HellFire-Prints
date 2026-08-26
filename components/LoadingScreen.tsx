'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Flame } from 'lucide-react';
import FireEngulfLayer from './FireEngulfLayer';

const STATUS_MESSAGES = [
  'INITIALIZING SECURE PROTOCOL...',
  'DECRYPTING ENVIRONMENT COMPONENTS...',
  'CONNECTING TO HELLFIRE PIPELINE...',
  'ESTABLISHING SHADER BUFFER DATA...',
  'CACHING PRINTS METADATA...',
  'SYNCHRONIZING SECURE DATABASE...',
  'COMPILING CINEMATIC ARTWORK...',
  'INJECTING RENDER LAYERS...',
  'ASSEMBLING HIGH-TECH ENVIRONMENT...',
];

function LoadingScreenContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [transitionState, setTransitionState] = useState<'hidden' | 'entering' | 'loading' | 'exiting'>('hidden');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('SYSTEM COLD');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showTimeRef = useRef<number>(0);

  // Detect system reduced motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Defer setState inside effect to avoid synchronous cascading renders warning
    const rAction = requestAnimationFrame(() => {
      setPrefersReducedMotion(mediaQuery.matches);
    });

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => {
      cancelAnimationFrame(rAction);
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  // Trigger the loading screen exiting sequence
  const stopLoading = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }

    // If it hasn't actually shown yet (very fast load), do nothing
    if (!showTimeRef.current) {
      setIsLoading(false);
      setTransitionState('hidden');
      return;
    }

    const elapsed = Date.now() - showTimeRef.current;
    const minDisplay = 650; // Guarantee the user gets a premium look once triggered
    const remainingTime = Math.max(0, minDisplay - elapsed);

    setTimeout(() => {
      // Step 1: Hit 100% progress
      setProgress(100);
      setStatusText('CORE ENVIRONMENT READY');

      // Step 2: Brief wait to showcase 100% progress before exiting
      setTimeout(() => {
        setTransitionState('exiting');
        
        // Step 3: Complete exit transition
        setTimeout(() => {
          setIsLoading(false);
          setTransitionState('hidden');
          showTimeRef.current = 0;
          if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
            maxTimeoutRef.current = null;
          }
        }, 400); // match globals.css transition durations
      }, 200);
    }, remainingTime);
  }, []);

  // Trigger the loading screen entering sequence
  const startLoading = useCallback(() => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);

    // Minimum display threshold (180ms delay before showing loader to prevent flickers on instant page loads)
    startTimerRef.current = setTimeout(() => {
      showTimeRef.current = Date.now();
      setIsLoading(true);
      setTransitionState('entering');
      setProgress(5);
      setStatusText('INITIALIZING...');

      // Safe backup timeout (10 seconds max loading before auto-fadeout)
      maxTimeoutRef.current = setTimeout(() => {
        stopLoading();
      }, 10000);
    }, 180);
  }, [stopLoading]);

  // Hook into navigation events
  useEffect(() => {
    // Stop loading when pathname or search parameters change (signaling complete page load)
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  // Document listener for link clicks & form submissions
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target || !(target instanceof HTMLAnchorElement)) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Skip external links
      const isExternal = href.startsWith('http') && !href.startsWith(window.location.origin);
      if (isExternal) return;

      // Skip hash, anchors, download, new-tabs, and key modifiers
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        target.hasAttribute('download') ||
        target.getAttribute('target') === '_blank' ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
      ) {
        return;
      }

      // Check URL equivalence to prevent showing loader on same page clicks
      let targetPathSearch = '';
      try {
        const targetUrl = new URL(target.href);
        targetPathSearch = targetUrl.pathname + targetUrl.search;
      } catch {
        if (href.startsWith('/')) {
          targetPathSearch = href;
        } else {
          return;
        }
      }

      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl === targetPathSearch) {
        return;
      }

      startLoading();
    };

    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const action = form.getAttribute('action') || '';
      
      // Intercept internal forms (e.g. Search redirects)
      if (action.startsWith('http') && !action.startsWith(window.location.origin)) {
        return;
      }
      
      startLoading();
    };

    const handlePopState = () => {
      startLoading();
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleFormSubmit);
    window.addEventListener('popstate', handlePopState);

    // Initial load screen hydration animation (makes page mount feel organic)
    let hideTimer: NodeJS.Timeout;
    const hydrationTimer = setTimeout(() => {
      setIsLoading(true);
      setTransitionState('loading');
      setProgress(30);
      setStatusText('HYDRATING INTERFACE...');
      
      hideTimer = setTimeout(() => {
        stopLoading();
      }, 450);
    }, 50);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleFormSubmit);
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(hydrationTimer);
      if (hideTimer) clearTimeout(hideTimer);
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [startLoading, stopLoading]);

  // Set transition entering sub-state once active
  useEffect(() => {
    if (transitionState === 'entering') {
      const frame = requestAnimationFrame(() => {
        setTransitionState('loading');
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [transitionState]);

  // Manage simulated progress steps
  useEffect(() => {
    if (transitionState !== 'loading' || progress >= 90) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        const step = Math.floor(Math.random() * 8) + 2; // Increments of 2-10%
        return Math.min(90, prev + step);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [transitionState, progress]);

  // Rotate technical status messages
  useEffect(() => {
    if (transitionState !== 'loading') return;

    let index = 0;
    const interval = setInterval(() => {
      setStatusText(STATUS_MESSAGES[index % STATUS_MESSAGES.length]);
      index++;
    }, 280);

    return () => clearInterval(interval);
  }, [transitionState]);

  // Scroll locking during active load state
  useEffect(() => {
    if (isLoading && transitionState !== 'exiting') {
      document.body.classList.add('loading-lock-scroll');
    } else {
      document.body.classList.remove('loading-lock-scroll');
    }

    return () => {
      document.body.classList.remove('loading-lock-scroll');
    };
  }, [isLoading, transitionState]);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#080304]/98 transition-all duration-300 ease-out select-none ${
        transitionState === 'exiting' ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      role="status"
      aria-live="polite"
      aria-busy={transitionState === 'loading'}
    >
      {/* Fire Engulf Visual Layer */}
      <FireEngulfLayer
        progress={progress}
        transitionState={transitionState}
        isLoading={isLoading}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Background visual layers */}
      <div className="absolute inset-0 bg-[#080304]"></div>
      
      {/* Layer 1: Animated Radial Glows */}
      <div className={`absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#3A0709] blur-[120px] opacity-25 mix-blend-screen transition-opacity ${
        prefersReducedMotion ? '' : 'animate-glow-float-1'
      }`}></div>
      <div className={`absolute bottom-[20%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-[#5C0A0A] blur-[120px] opacity-20 mix-blend-screen transition-opacity ${
        prefersReducedMotion ? '' : 'animate-glow-float-2'
      }`}></div>

      {/* Layer 2: Cyber Grid Overlay */}
      <div className="cyber-grid"></div>

      {/* Layer 3: Scanline overlays */}
      {!prefersReducedMotion && <div className="cyber-scanline"></div>}
      <div className="cyber-scanlines-overlay"></div>

      {/* Main HUD container */}
      <div className={`relative flex flex-col items-center justify-center p-8 sm:p-12 md:p-14 rounded-3xl border border-neutral-900 bg-neutral-950/75 backdrop-blur-md hud-glow z-10 transition-transform duration-500 ${
        transitionState === 'entering' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Futuristic HUD brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#C1121F] opacity-70"></div>
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#C1121F] opacity-70"></div>
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#C1121F] opacity-70"></div>
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#C1121F] opacity-70"></div>

        {/* Small futuristic decorations/specs */}
        <div className="absolute top-4 left-10 text-[7px] font-mono text-neutral-600 tracking-widest hidden sm:block">
          SYS_LINK: ACTIVE [0x08F9]
        </div>
        <div className="absolute top-4 right-10 text-[7px] font-mono text-neutral-600 tracking-widest hidden sm:block">
          LOC_PORT: 3000
        </div>
        <div className="absolute bottom-4 left-10 text-[7px] font-mono text-neutral-600 tracking-widest hidden sm:block">
          SECURE_SSL: TRUE
        </div>
        <div className="absolute bottom-4 right-10 text-[7px] font-mono text-neutral-600 tracking-widest hidden sm:block">
          ENV_VER: v2.4.0
        </div>

        {/* HUD Circular Rotating Ring (SVG) */}
        <div className="absolute w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] flex items-center justify-center pointer-events-none opacity-40">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
          >
            {/* Outer dash rotating clockwise */}
            <circle
              className={`stroke-[#C1121F]/40 fill-none ${prefersReducedMotion ? '' : 'hud-ring-outer'}`}
              cx="50"
              cy="50"
              r="45"
              strokeWidth="0.8"
              strokeDasharray="6 4"
            />
            {/* Middle dash rotating counter-clockwise */}
            <circle
              className={`stroke-[#FF4D4D]/60 fill-none ${prefersReducedMotion ? '' : 'hud-ring-inner'}`}
              cx="50"
              cy="50"
              r="40"
              strokeWidth="1.2"
              strokeDasharray="30 10 10 10 15 15"
            />
            {/* Inner tiny dotted circle */}
            <circle
              className="stroke-[#fcbf49]/35 fill-none"
              cx="50"
              cy="50"
              r="35"
              strokeWidth="0.5"
              strokeDasharray="1 2"
            />
          </svg>
        </div>

        {/* Central Logo Panel */}
        <div className={`flex flex-col items-center z-20 ${prefersReducedMotion ? '' : 'cyber-periodic-glitch'}`}>
          <div className="logo-scan-wrapper flex flex-col items-center">
            {/* Horizontal scanline gradient across logo */}
            {!prefersReducedMotion && <div className="logo-scan-line"></div>}

            {/* Official Brand Icon representation */}
            <div className="bg-gradient-to-br from-[#C1121F] to-[#FF4D4D] p-3.5 sm:p-4.5 rounded-2xl shadow-[0_0_20px_rgba(193,18,31,0.5)] border border-[#C1121F]/30 mb-3.5 transition-transform duration-300">
              <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            {/* Brand Title */}
            <span className="font-extrabold tracking-[0.25em] text-lg sm:text-xl md:text-2xl text-white text-center">
              HELLFIRE <span className="text-[#C1121F] fiery-text-glow font-black">PRINTS</span>
            </span>
          </div>
        </div>

        {/* HUD Segmented Progress Bar */}
        <div className="w-56 sm:w-64 max-w-full flex flex-col gap-2 mt-8 z-20">
          <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono font-bold tracking-widest uppercase">
            <span>ENVIRONMENT LOADER</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full h-3 bg-neutral-950 border border-neutral-900 rounded-lg overflow-hidden p-[2px]">
            <div
              className="h-full progress-bar-fill rounded-sm shadow-[0_0_10px_rgba(193,18,31,0.45)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <span className="text-[8.5px] text-[#FF4D4D]/90 font-mono tracking-widest text-center mt-3 cyber-status-text min-h-[14px]">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoadingScreen() {
  return (
    <Suspense fallback={null}>
      <LoadingScreenContent />
    </Suspense>
  );
}
