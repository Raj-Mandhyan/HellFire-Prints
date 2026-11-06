'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Receipt,
  Users,
  Tag,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package, exact: false },
  { href: '/admin/inventory', label: 'Inventory', icon: Layers, exact: false },
  { href: '/admin/orders', label: 'Orders', icon: Receipt, exact: false },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, exact: false },
] as const;

export function AdminMobileNav() {
  const pathname = usePathname() || '/admin';
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden border-b border-neutral-900 bg-neutral-950/95 backdrop-blur-md relative z-30">
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-black uppercase tracking-widest text-white hover:border-[#C1121F] transition-colors cursor-pointer"
          aria-expanded={open}
          aria-label="Toggle Admin Navigation Menu"
        >
          {open ? <X className="w-4 h-4 text-[#C1121F]" /> : <Menu className="w-4 h-4 text-[#C1121F]" />}
          <span>Management Menu</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[10px] font-black text-neutral-400 hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Storefront
        </Link>
      </div>

      {/* Horizontal quick-access pill bar on mobile */}
      <nav
        aria-label="Admin Mobile Quick Navigation"
        className="flex items-center gap-1.5 overflow-x-auto px-4 pb-2.5 no-scrollbar"
      >
        {ADMIN_NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all ${
                isActive
                  ? 'bg-[#C1121F]/20 border-[#C1121F]/60 text-white shadow-[0_0_12px_rgba(193,18,31,0.2)]'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#C1121F] shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Expandable full mobile drawer when toggled */}
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-900 bg-neutral-950 space-y-1.5">
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-widest ${
                  isActive
                    ? 'bg-[#C1121F]/15 border-[#C1121F]/50 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60 border-transparent hover:border-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4 text-[#C1121F] shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebarNav() {
  const pathname = usePathname() || '/admin';

  return (
    <aside
      aria-label="Admin Sidebar Navigation"
      className="w-64 shrink-0 border-r border-neutral-900 bg-neutral-950/85 backdrop-blur-md hidden md:flex md:flex-col py-8 px-4 space-y-6 relative z-20"
    >
      <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-3.5 mb-2">
        Management Panel
      </div>

      <nav className="space-y-1.5 flex-1">
        {ADMIN_NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-xs font-black uppercase tracking-widest ${
                isActive
                  ? 'bg-[#C1121F]/15 text-white border-[#C1121F]/50 shadow-[0_0_15px_rgba(193,18,31,0.18)]'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60 border-transparent hover:border-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4 text-[#C1121F] shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-900/80 pt-6 px-3.5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[10px] font-black text-neutral-400 hover:text-red-400 uppercase tracking-widest transition-colors duration-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          View Storefront
        </Link>
      </div>
    </aside>
  );
}

