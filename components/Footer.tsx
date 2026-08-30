'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-900/80 py-16 text-xs text-neutral-500 mt-auto select-none">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-2">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="bg-[#C1121F]/15 p-1.5 rounded-lg border border-[#C1121F]/20 group-hover:scale-105 transition-all">
              <Flame className="w-5 h-5 text-[#C1121F]" />
            </div>
            <span className="font-black tracking-widest text-white text-[12px] uppercase">
              HELLFIRE <span className="text-[#C1121F]">PRINTS</span>
            </span>
          </Link>
          <p className="text-neutral-450 text-[11px] leading-relaxed max-w-sm">
            Premium high-contrast poster art crafted for gamers, car enthusiasts, anime fans, movie buffs, and collectors. Rebuild your environment with high-definition cinematic art prints.
          </p>
        </div>

        {/* Shop Column */}
        <div className="space-y-4">
          <h4 className="font-black uppercase text-white tracking-widest text-[11px] border-l-2 border-[#C1121F] pl-2">
            Shop
          </h4>
          <ul className="space-y-2.5 text-[11px] font-semibold">
            <li>
              <Link href="/" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Home / Collection
              </Link>
            </li>
            <li>
              <Link href="/#catalog" className="hover:text-white hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors">
                Catalog
              </Link>
            </li>
            <li>
              <Link href="/custom-poster" className="hover:text-[#FF4D4D] hover:underline decoration-[#C1121F]/40 underline-offset-4 transition-colors text-[#C1121F] font-bold">
                Custom Poster Studio
              </Link>
            </li>
          </ul>
        </div>

        {/* Company & Legal Column */}
        <div className="space-y-4">
          <h4 className="font-black uppercase text-white tracking-widest text-[11px] border-l-2 border-[#C1121F] pl-2">
            Support & Legal
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
                Terms & Conditions
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
                Cancellation & Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-900/60 mt-12 pt-8 text-center">
        <p className="text-[10px] text-neutral-600">
          © 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art. Engineered with heavy-duty construction.
        </p>
      </div>
    </footer>
  );
}
