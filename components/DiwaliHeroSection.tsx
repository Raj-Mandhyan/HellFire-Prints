'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Flame, Clock, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import DiwaliFireworks from './DiwaliFireworks';
import { DiyaLamp, FestiveJhalar } from './DiwaliDecorations';
import {
  DIWALI_POSTER_SIZE_CARDS,
  DIWALI_OFFER_START_DISPLAY,
  DIWALI_OFFER_END_DISPLAY,
  MINIMUM_ORDER_VALUE,
  DiwaliOfferPhase,
} from '@/lib/pricing';
import { useAuthoritativeDiwaliStatus } from '@/lib/useAuthoritativeTime';
import { useCart } from '@/context/CartContext';

function padTwo(num: number): string {
  return String(Math.max(0, num)).padStart(2, '0');
}

interface DiwaliHeroSectionProps {
  initialServerTimeMs?: number;
}

export default function DiwaliHeroSection({ initialServerTimeMs }: DiwaliHeroSectionProps) {
  const { previewPhase, refreshCart } = useCart();
  const { status: liveStatus, isSynced } = useAuthoritativeDiwaliStatus({
    initialServerTimeMs,
    onActivate: () => {
      refreshCart();
    },
    onExpire: () => {
      refreshCart();
    },
  });
  const [burstCount, setBurstCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Authoritative phase from synchronized IST server clock
  const effectivePhase: DiwaliOfferPhase = previewPhase ?? liveStatus.phase;
  const countdown =
    effectivePhase === 'EXPIRED'
      ? { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
      : liveStatus.countdown;

  const isExpiredView = effectivePhase === 'EXPIRED';
  const isUpcomingView = effectivePhase === 'UPCOMING';
  const isActiveView = effectivePhase === 'ACTIVE';

  return (
    <section className="relative w-full overflow-hidden border-b border-amber-500/20 bg-gradient-to-b from-[#130408]/90 via-[#0B040A]/85 to-transparent pt-2 pb-16 sm:pb-24">
      {/* Top Hanging Festive Jhalar */}
      <FestiveJhalar variant="hero" className="mb-4" />

      {/* Background Interactive Fireworks Canvas */}
      <DiwaliFireworks
        intensity="hero"
        burstTrigger={burstCount}
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Ambient Cyber-Diwali Radial Spotlights */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full bg-gradient-to-r from-[#C1121F]/20 via-[#FFD700]/15 to-purple-600/20 blur-[130px] pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-8 sm:space-y-10">
        {/* Top Brand Presents Pill + Live Status Badge + Interactive Firecracker Button */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#1E070B] via-[#2A0B12] to-[#1E070B] border border-[#FFD700]/45 px-4 sm:px-5 py-2 rounded-full shadow-[0_0_25px_rgba(255,215,0,0.2)] backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#FFD700] animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">
              HELLFIRE PRINTS PRESENTS: THE GRAND DIWALI EXTENDED OFFER 2026
            </span>
            <Flame className="w-4 h-4 text-[#FF7B00] animate-pulse" />
          </div>

          {isActiveView && (
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-400/50 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.28)] backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.18em] text-emerald-300">
                ● THE DIWALI EXTENDED SALE IS LIVE NOW!
              </span>
            </div>
          )}

          {isUpcomingView && (
            <div className="inline-flex items-center gap-2 bg-amber-950/80 border border-amber-400/50 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.25)] backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.18em] text-amber-300">
                ● 48-HOUR EXTENDED OFFER • STARTING SOON
              </span>
            </div>
          )}

          {isExpiredView && (
            <div className="inline-flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 px-4 py-2 rounded-full">
              <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.18em] text-neutral-400">
                THE DIWALI EXTENDED OFFER HAS ENDED
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setBurstCount((c) => c + 1)}
            className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-200 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.25)]"
            title="Launch celebratory Diwali fireworks"
          >
            <span>🎆 Celebrate</span>
          </button>
        </div>

        {/* Grand Hero Headline with Flanking Glowing Diyas */}
        <div className="flex items-center justify-center gap-3 sm:gap-8 w-full">
          <div className="hidden md:flex flex-col items-center">
            <DiyaLamp size="lg" delayMs={0} />
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-4xl">
            <p className="text-xs sm:text-base font-black uppercase tracking-[0.3em] text-[#FFD700] diwali-gold-text-glow">
              YOU ASKED. WE LISTENED.
            </p>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.95] text-white">
              THE{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FF9E00] to-[#FF4D4D] diwali-gold-text-glow">
                DIWALI SALE
              </span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#FFD700] to-[#FCBF49]">
                IS BACK!
              </span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl font-bold tracking-wide text-amber-100/95 max-w-3xl mx-auto leading-relaxed">
              On overwhelming requests and demand from our customers, we&apos;re bringing back the Diwali Sale with a{' '}
              <span className="text-[#FFD700] font-black">SPECIAL EXTENDED OFFER!</span>
            </p>

            <p className="text-base sm:text-xl font-extrabold text-white tracking-wide">
              You missed it once. <span className="text-[#FF9E00]">Don&apos;t miss it again.</span>
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C1121F]/30 via-[#FF7B00]/25 to-[#FFD700]/30 border border-[#FFD700]/45">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">
                48 HOURS. EXCLUSIVE FESTIVE PRICES. ONE LAST CHANCE.
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center">
            <DiyaLamp size="lg" delayMs={450} />
          </div>
        </div>

        {/* Mobile Diyas Row */}
        <div className="flex md:hidden items-center justify-center gap-6 -my-2">
          <DiyaLamp size="sm" delayMs={0} />
          <DiyaLamp size="md" delayMs={250} />
          <DiyaLamp size="sm" delayMs={500} />
        </div>

        {/* Offer Validity Badges & Authoritative Real-Time IST Countdown Timer */}
        <div className="w-full max-w-4xl bg-gradient-to-b from-[#16070B]/95 to-[#0C0407]/95 border border-[#FFD700]/40 rounded-3xl p-5 sm:p-8 shadow-[0_0_55px_rgba(255,183,3,0.16)] backdrop-blur-xl space-y-6 relative overflow-hidden">
          {/* Top Golden Glow Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

          {/* Start & Final Deadline Authoritative IST Timestamps */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 border-b border-amber-500/15 pb-4 text-xs">
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2 rounded-xl">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest">
                OFFER START
              </span>
              <span className="text-emerald-200 font-mono font-bold text-[11px] sm:text-xs">
                {DIWALI_OFFER_START_DISPLAY}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300/95">
              <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Timezone: Asia/Kolkata (UTC+05:30)</span>
              {isMounted && isSynced && (
                <span className="text-emerald-300" aria-label="Synchronized with IST server clock">
                  • Synced
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/50 px-3.5 py-2 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest">
                OFFER ENDS
              </span>
              <span className="text-rose-100 font-mono font-bold text-[11px] sm:text-xs">
                {DIWALI_OFFER_END_DISPLAY}
              </span>
            </div>
          </div>

          {/* Live Countdown Header & 4-Unit Digital Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isActiveView
                    ? 'bg-emerald-400 animate-ping'
                    : isUpcomingView
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-neutral-500'
                }`}
              />
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.24em] text-[#FFD700] diwali-gold-text-glow">
                {isActiveView
                  ? 'THE DIWALI EXTENDED SALE IS LIVE NOW! • DIWALI EXTENDED OFFER ENDS IN'
                  : isUpcomingView
                  ? 'THE EXTENDED DIWALI OFFER STARTS IN'
                  : 'THE DIWALI EXTENDED OFFER HAS ENDED'}
              </span>
            </div>

            {/* 4-Unit Digital Countdown Blocks (DAYS : HOURS : MINUTES : SECONDS) */}
            <div
              className="flex items-center justify-center gap-2 sm:gap-4"
              role="timer"
              aria-live="polite"
              aria-atomic="true"
            >
              {[
                { value: padTwo(countdown.days), label: 'DAYS' },
                { value: padTwo(countdown.hours), label: 'HOURS' },
                { value: padTwo(countdown.minutes), label: 'MINUTES' },
                { value: padTwo(countdown.seconds), label: 'SECONDS' },
              ].map((unit, idx) => (
                <React.Fragment key={unit.label}>
                  <div className="flex flex-col items-center justify-center bg-[#090306] border border-[#FFD700]/45 rounded-2xl px-3.5 sm:px-6 py-3.5 sm:py-4.5 min-w-[70px] sm:min-w-[110px] shadow-[inset_0_0_24px_rgba(255,215,0,0.12),0_0_20px_rgba(255,183,3,0.1)] transition-all duration-300">
                    <span
                      key={`${unit.label}-${unit.value}`}
                      className="font-mono text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-wider drop-shadow-[0_0_14px_rgba(255,215,0,0.55)] transition-transform duration-200"
                    >
                      {unit.value}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-[#FCBF49] mt-1.5">
                      {unit.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <span className="text-xl sm:text-3xl font-black text-[#FFD700] animate-pulse select-none">
                      :
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Prominent Live Campaign Callout Message */}
            {!isExpiredView ? (
              <div className="pt-3 border-t border-amber-500/15 space-y-1.5 text-center">
                <p className="text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-[#FFD700]">
                  {isActiveView
                    ? 'THE DIWALI EXTENDED SALE IS LIVE NOW!'
                    : '48 HOURS • EXCLUSIVE FESTIVE PRICES • ONE LAST CHANCE'}
                </p>
                <p className="text-xs sm:text-sm text-neutral-200 font-medium">
                  {isActiveView
                    ? 'Grab your favourite posters at exclusive Diwali Extended Offer prices before the 48-hour window closes!'
                    : 'Extended festive prices unlock automatically on 12 November 2026 at 1:00 PM IST.'}
                </p>
                <p className="text-[11px] sm:text-xs font-mono font-bold text-amber-300">
                  Offer Start: {DIWALI_OFFER_START_DISPLAY} • Offer Ends: {DIWALI_OFFER_END_DISPLAY}
                </p>
              </div>
            ) : (
              <div className="py-3.5 px-6 bg-neutral-900/75 border border-neutral-800 rounded-2xl text-xs sm:text-sm font-bold text-neutral-300 uppercase tracking-wider">
                The 48-hour Grand Diwali Extended Offer (Ended {DIWALI_OFFER_END_DISPLAY}) has ended. Base Selling Prices are now active.
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* PROMOTIONAL PRICING SHOWCASE — A3, A4, A5, A6 */}
        {/* ================================================================= */}
        <div className="w-full max-w-6xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFD700]" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">
                EXCLUSIVE DIWALI FESTIVE PRICING — ALL 4 ARCHIVAL FORMATS
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full">
              Minimum Order Value: ₹{MINIMUM_ORDER_VALUE} Per Order
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {DIWALI_POSTER_SIZE_CARDS.map((card) => (
              <a
                key={card.sizeName}
                href="#catalog"
                className="group relative flex flex-col justify-between bg-gradient-to-b from-[#17080D]/95 via-[#0F0609]/95 to-[#0A0406]/95 border border-[#FFD700]/35 hover:border-[#FFD700] rounded-3xl p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_40px_rgba(255,215,0,0.22)] overflow-hidden"
              >
                {/* Subtle Corner Festive Glow */}
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#FFD700]/15 blur-2xl group-hover:bg-[#FFD700]/25 transition-all pointer-events-none" />

                <div className="space-y-3 relative z-10">
                  {/* Top Badge + Size Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {isExpiredView ? 'STANDARD PRICE' : card.badge}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300/90">
                      {card.dimensions}
                    </span>
                  </div>

                  {/* Poster Size Title */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-baseline gap-2">
                      <span>{card.sizeName}</span>
                      <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">
                        Poster
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">
                      {card.tagline}
                    </p>
                  </div>

                  {/* Price Reduction Display (Three-Tier during Diwali, Two-Tier when Expired) */}
                  <div className="pt-2 border-t border-amber-500/15">
                    {!isExpiredView ? (
                      <div className="space-y-1.5 animate-price-pop">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-mono">
                          <span className="text-neutral-400">
                            Retail MRP:{' '}
                            <span
                              className="line-through decoration-neutral-500 decoration-2 font-bold text-neutral-300"
                              title={`Retail MRP: ₹${card.retailMrp}`}
                            >
                              ₹{card.retailMrp}
                            </span>
                          </span>
                          <span className="text-neutral-300">
                            Normal Selling Price:{' '}
                            <span
                              className="line-through decoration-[#FF4D4D] decoration-2 font-bold text-amber-200/80"
                              title={`Normal Selling Price: ₹${card.baseSellingPrice}`}
                            >
                              ₹{card.baseSellingPrice}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                            DIWALI EXTENDED OFFER:
                          </span>
                          <span
                            className="text-3xl sm:text-4xl font-mono font-black text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                            title={`Diwali Selling Price: ₹${card.diwaliSellingPrice}`}
                          >
                            ₹{card.diwaliSellingPrice}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                            Additional Diwali Savings: ₹{card.savings} ({card.discountPercentage}% OFF)
                          </span>
                          <span className="text-[9px] font-mono font-bold text-amber-300/80 uppercase">
                            {isUpcomingView ? 'Starts 12 Nov, 1 PM' : 'Extended Offer'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-neutral-400">
                          Retail MRP:{' '}
                          <span className="line-through decoration-neutral-500 decoration-2 font-bold">
                            ₹{card.retailMrp}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-mono font-black text-white">
                            ₹{card.baseSellingPrice}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            Save ₹{card.normalDaySavings} off MRP
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CTA BUTTONS & TRUST STRIP */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <a
            href="#catalog"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black px-9 py-4 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 diwali-button-glow cursor-pointer"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            href="/custom-poster"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#120714]/90 hover:bg-[#1D0B24] border border-[#00E5FF]/50 hover:border-[#00E5FF] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(0,229,255,0.2)] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#00E5FF]" />
            <span>CUSTOM POSTER STUDIO</span>
          </Link>
        </div>

        {/* Festive Benefits Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-300 pt-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
            Min. Order Only ₹{MINIMUM_ORDER_VALUE}
          </span>
          <span className="text-amber-500/40">•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF7B00]" />
            300 GSM Heavyweight Matte
          </span>
          <span className="text-amber-500/40">•</span>
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#00E5FF]" />
            Razorpay &amp; Cash on Delivery
          </span>
        </div>
      </div>
    </section>
  );
}
