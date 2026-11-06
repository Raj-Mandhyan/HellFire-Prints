'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';
import { DiyaLamp, FestiveJhalar } from './DiwaliDecorations';

export default function Footer() {
  return (
    <footer className="bg-neutral-950/95 border-t border-amber-500/25 pb-16 pt-2 text-xs text-neutral-500 mt-auto select-none relative overflow-hidden">
      {/* Top Hanging Festive Jhalar */}
      <FestiveJhalar variant="footer" className="mb-10" />

      {/* Subtle Ambient Gold/Saffron Glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-left relative z-10">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="bg-gradient-to-br from-[#C1121F]/25 to-[#FFD700]/25 p-1.5 rounded-lg border border-amber-500/30 group-hover:scale-105 transition-all">
                <Flame className="w-5 h-5 text-[#FFD700]" />
              </div>
              <span className="font-black tracking-widest text-white text-[12px] uppercase">
                HELLFIRE <span className="text-[#FFD700]">PRINTS</span>
              </span>
            </Link>
            <DiyaLamp size="sm" delayMs={200} />
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed max-w-sm">
            Premium high-contrast poster art crafted for gamers, car enthusiasts, anime fans, movie buffs, and collectors. Light up your walls this Diwali 2026 with museum-grade 300 GSM archival prints.
          </p>
        </div>

        {/* Shop Column */}
        <div className="space-y-4">
          <h4 className="font-black uppercase text-white tracking-widest text-[11px] border-l-2 border-[#FFD700] pl-2">
            Shop Diwali Sale
          </h4>
          <ul className="space-y-2.5 text-[11px] font-semibold">
            <li>
              <Link href="/" className="hover:text-white hover:underline decoration-[#FFD700]/40 underline-offset-4 transition-colors">
                Home / Grand Diwali Sale
              </Link>
            </li>
            <li>
              <Link href="/#catalog" className="hover:text-white hover:underline decoration-[#FFD700]/40 underline-offset-4 transition-colors">
                Festive Catalog
              </Link>
            </li>
            <li>
              <Link href="/custom-poster" className="hover:text-[#FFD700] hover:underline decoration-[#FFD700]/40 underline-offset-4 transition-colors text-amber-400 font-bold">
                Custom Poster Studio
              </Link>
            </li>
          </ul>
        </div>

        {/* Company & Legal Column */}
        <div className="space-y-4">
          <h4 className="font-black uppercase text-white tracking-widest text-[11px] border-l-2 border-[#C1121F] pl-2">
            Support &amp; Legal
          </h4>
          <ul className="space-y-2.5 text-[11px] font-semibold">
            <li>
              <Link href="/about-us" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact-us" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/terms-and-conditions" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/cancellation-and-refund-policy" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Cancellation &amp; Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-900/60 mt-12 pt-8 text-center relative z-10 space-y-2">
        <p className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
          🪔 Shubh Deepavali 2026 • Light Up Your Walls • Celebrate Every Moment 🪔
        </p>
        <p className="text-[10px] text-neutral-600">
          © 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art. Engineered with heavy-duty construction.
        </p>
      </div>
    </footer>
  );
}
