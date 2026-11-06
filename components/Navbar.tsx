'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, Flame, Search, X, MoreVertical, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import UpdatesStrip from '@/components/UpdatesStrip';
import { FestiveJhalar } from '@/components/DiwaliDecorations';
import { MINIMUM_ORDER_VALUE, ORIGINAL_SIZE_PRICES, DIWALI_SIZE_PRICES } from '@/lib/pricing';

export default function Navbar() {
  const { cartCount } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearchClick = () => {
    if (showSearch) {
      if (searchVal.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      } else {
        setShowSearch(false);
      }
    } else {
      setShowSearch(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchSession = () => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.authenticated) {
          setIsAuthenticated(true);
          if (data.user?.role === 'ADMIN') {
            setIsAdmin(true);
          }
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      })
      .catch((err) => console.error('Session fetch error:', err));
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${isScrolled
        ? 'premium-glass shadow-xl shadow-black/80 border-b border-amber-500/25 bg-neutral-950/85 backdrop-blur-xl'
        : 'border-b border-amber-500/15 bg-neutral-950/60 backdrop-blur-md'
      }`}>
      <UpdatesStrip
        updates={[
          `🪔 THE GRAND DIWALI SALE 2026: A3 ₹${DIWALI_SIZE_PRICES.A3} (Was ₹${ORIGINAL_SIZE_PRICES.A3}) • A4 ₹${DIWALI_SIZE_PRICES.A4} (Was ₹${ORIGINAL_SIZE_PRICES.A4}) • A5 ₹${DIWALI_SIZE_PRICES.A5} (Was ₹${ORIGINAL_SIZE_PRICES.A5}) • A6 ₹${DIWALI_SIZE_PRICES.A6} (Was ₹${ORIGINAL_SIZE_PRICES.A6}) — Minimum order value is ₹${MINIMUM_ORDER_VALUE}.`,
          `✨ VALID 6 NOV 2026 (8:00 PM IST) TO 9 NOV 2026 (4:00 AM IST) —Orders will be placed for a minimum total of Rs. ${MINIMUM_ORDER_VALUE}.`,
        ]}
        variant="top-notice"
      />
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-[#C1121F] via-[#FF7B00] to-[#FFD700] p-1.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(255,215,0,0.6)] group-active:scale-95">
            <Flame className="w-5 h-5 text-black animate-pulse-fire" />
          </div>
          <span className="font-extrabold tracking-widest text-lg sm:text-xl text-white transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-amber-200">
            HELLFIRE <span className="text-[#FFD700] transition-colors duration-300 group-hover:text-[#FF9E00] diwali-gold-text-glow font-black">PRINTS</span>
          </span>
        </Link>

        {/* Center: Primary Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm text-neutral-300 font-extrabold uppercase tracking-widest">
          <Link
            href="/"
            className={`hover:text-white transition-colors relative py-1.5 group ${
              pathname === '/' ? 'text-white font-bold' : ''
            }`}
          >
            Home
            <span
              className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] transition-all duration-300 rounded-full ${
                pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>
          <Link
            href="/#catalog"
            className="hover:text-white transition-colors relative py-1.5 group flex items-center gap-1.5"
          >
            <span>Catalog</span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#C1121F] to-[#FFD700] text-black text-[8px] font-black tracking-widest shadow-sm">
              DIWALI SALE
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] group-hover:w-full transition-all duration-300 rounded-full" />
          </Link>
          <Link
            href="/custom-poster"
            className={`hover:text-white transition-colors relative py-1.5 group flex items-center gap-1 ${
              pathname === '/custom-poster' ? 'text-white font-bold' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Custom Poster Studio</span>
            <span
              className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#00E5FF] to-[#FFD700] transition-all duration-300 rounded-full ${
                pathname === '/custom-poster' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>
        </nav>

        {/* Right Side: Quick Action Icons */}
        <div className="flex items-center gap-3 sm:gap-4 text-neutral-300">
          <Link
            href="/custom-poster"
            className={`md:hidden text-[10px] uppercase tracking-widest font-black px-3.5 py-2 rounded-full border transition-all duration-300 active:scale-95 ${pathname === '/custom-poster'
                ? 'bg-gradient-to-r from-[#C1121F] to-[#FFD700] border-transparent text-black shadow-lg shadow-amber-950/30'
                : 'bg-neutral-900 border-amber-500/30 text-amber-200 hover:text-white hover:border-amber-400'
              }`}
          >
            Custom Poster
          </Link>

          <div className="flex items-center gap-1.5">
            {showSearch && (
              <form onSubmit={handleSearchSubmit} className="relative flex items-center animate-fade-in">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search posters..."
                  className="bg-neutral-900 border border-amber-500/40 text-white rounded-xl px-3 py-1.5 text-xs w-32 sm:w-44 placeholder-neutral-500 focus:outline-none focus:border-[#FFD700] transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setShowSearch(false); setSearchVal(''); }}
                  className="absolute right-2 text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={handleSearchClick}
              className="p-2.5 hover:text-[#FFD700] transition-all hover:scale-110 active:scale-90 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>

          <Link href="/cart" className="p-2.5 hover:text-[#FFD700] transition-all hover:scale-110 active:scale-90 relative" aria-label="Cart">
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/50 border border-neutral-950">
                {cartCount}
              </span>
            )}
          </Link>

          <Link href={isAuthenticated ? "/account" : "/login"} className="p-2.5 hover:text-[#FFD700] transition-all hover:scale-110 active:scale-90" aria-label="Account">
            <User className="w-4.5 h-4.5" />
          </Link>

          {/* Three-Dot Popover Menu */}
          <div className="relative flex items-center" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 transition-all hover:scale-110 active:scale-90 cursor-pointer ${
                isMenuOpen ? 'text-[#FFD700] scale-110' : 'hover:text-white text-neutral-300'
              }`}
              aria-label="Toggle Navigation Menu"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-11 w-72 bg-neutral-950/95 backdrop-blur-xl rounded-2xl p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-amber-500/30 z-50 animate-fade-in text-left space-y-4">
                
                {/* Category: Account */}
                <div className="space-y-1.5">
                  <h4 className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest border-b border-neutral-900/60 pb-1.5 pl-1 select-none">
                    My Account
                  </h4>
                  <ul className="space-y-1 text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    {isAuthenticated ? (
                      <li>
                        <Link
                          href="/account"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                            pathname === '/account' ? 'bg-[#C1121F]/15 border border-[#C1121F]/30 text-white font-bold' : 'hover:bg-neutral-900/40 border border-transparent hover:text-white'
                          }`}
                        >
                          <span>Dashboard & Orders</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                        </Link>
                      </li>
                    ) : (
                      <>
                        <li>
                          <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                              pathname === '/login' ? 'bg-[#C1121F]/15 border border-[#C1121F]/30 text-white font-bold' : 'hover:bg-neutral-900/40 border border-transparent hover:text-white'
                            }`}
                          >
                            <span>Sign In</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/signup"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                              pathname === '/signup' ? 'bg-[#C1121F]/15 border border-[#C1121F]/30 text-white font-bold' : 'hover:bg-neutral-900/40 border border-transparent hover:text-white'
                            }`}
                          >
                            <span>Register</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Category: Admin (Conditional) */}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest border-b border-neutral-900/60 pb-1.5 pl-1 select-none">
                      Admin Clearance
                    </h4>
                    <ul className="space-y-1 text-xs font-semibold uppercase tracking-wider text-neutral-300">
                      <li>
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                            pathname.startsWith('/admin') ? 'bg-[#C1121F]/15 border border-[#C1121F]/30 text-[#FF4D4D] font-bold' : 'hover:bg-neutral-900/40 border border-transparent hover:text-white'
                          }`}
                        >
                          <span>Admin Control Panel</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#C1121F]" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/test-db"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                            pathname === '/test-db' ? 'bg-[#C1121F]/15 border border-[#C1121F]/30 text-[#FF4D4D] font-bold' : 'hover:bg-neutral-900/40 border border-transparent hover:text-white'
                          }`}
                        >
                          <span>Live Database Test</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#C1121F]" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Category: Company Info */}
                <div className="space-y-1.5">
                  <h4 className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest border-b border-neutral-900/60 pb-1.5 pl-1 select-none">
                    Information
                  </h4>
                  <ul className="space-y-1 text-[11px] font-semibold text-neutral-400">
                    <li>
                      <Link
                        href="/about-us"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                          pathname === '/about-us' ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-900/30 hover:text-neutral-200'
                        }`}
                      >
                        <span>About Us</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact-us"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                          pathname === '/contact-us' ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-900/30 hover:text-neutral-200'
                        }`}
                      >
                        <span>Contact Us</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terms-and-conditions"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                          pathname === '/terms-and-conditions' ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-900/30 hover:text-neutral-200'
                        }`}
                      >
                        <span>Terms & Conditions</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/privacy-policy"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                          pathname === '/privacy-policy' ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-900/30 hover:text-neutral-200'
                        }`}
                      >
                        <span>Privacy Policy</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/shipping-policy"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                          pathname === '/shipping-policy' ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-900/30 hover:text-neutral-200'
                        }`}
                      >
                        <span>Shipping Policy</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/cancellation-and-refund-policy"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                          pathname === '/cancellation-and-refund-policy' ? 'bg-neutral-900 text-white font-bold' : 'hover:bg-neutral-900/30 hover:text-neutral-200'
                        }`}
                      >
                        <span>Refund Policy</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-25" />
                      </Link>
                    </li>
                  </ul>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Hanging Festive Jhalar on non-home pages */}
      {pathname !== '/' && <FestiveJhalar variant="header" />}
    </header>
  );
}
