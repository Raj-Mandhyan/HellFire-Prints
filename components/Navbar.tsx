'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, Flame, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const { cartCount } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState('');

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

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.authenticated) {
          setIsAuthenticated(true);
          if (data.user?.role === 'ADMIN') {
            setIsAdmin(true);
          }
        }
      })
      .catch((err) => console.error('Session fetch error:', err));
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${isScrolled
        ? 'premium-glass shadow-xl shadow-black/80 border-b border-neutral-900/80 bg-neutral-950/80'
        : 'border-b border-transparent bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-[#C1121F] to-[#FF4D4D] p-1.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(193,18,31,0.7)] group-active:scale-95">
            <Flame className="w-5 h-5 text-white animate-pulse-fire" />
          </div>
          <span className="font-extrabold tracking-widest text-lg sm:text-xl text-white transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400">
            HELLFIRE <span className="text-[#C1121F] transition-colors duration-300 group-hover:text-[#FF4D4D] fiery-text-glow font-black">PRINTS</span>
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm text-neutral-400 font-extrabold uppercase tracking-widest">
          <Link href="/" className="hover:text-white transition-colors relative py-1.5 group">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C1121F] to-[#f77f00] group-hover:w-full transition-all duration-300 rounded-full" />
          </Link>
          <Link
            href="/custom-poster"
            className={`hover:text-white transition-colors relative py-1.5 group ${pathname === '/custom-poster' ? 'text-[#FF4D4D] fiery-text-glow font-black' : ''
              }`}
          >
            Custom Poster
            <span className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#C1121F] to-[#f77f00] transition-all duration-300 rounded-full ${pathname === '/custom-poster' ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
          </Link>
          {isAdmin && (
            <Link href="/test-db" className="hover:text-white transition-all text-xs bg-neutral-900/60 border border-neutral-800/80 px-3.5 py-1.5 rounded-full text-[#FF4D4D] hover:border-[#C1121F]/60 transition-all duration-300 hover:shadow-[0_0_12px_rgba(193,18,31,0.25)] hover:scale-105 active:scale-98">Live DB Test</Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="hover:text-white transition-all text-xs bg-[#C1121F]/15 border border-[#C1121F]/40 px-3.5 py-1.5 rounded-full text-[#FF4D4D] font-extrabold tracking-wider hover:bg-[#C1121F]/30 hover:border-[#C1121F]/70 hover:shadow-[0_0_15px_rgba(193,18,31,0.35)] transition-all duration-300 hover:scale-105 active:scale-98">Admin</Link>
          )}
          <a href="#catalog" className="hover:text-white transition-colors relative py-1.5 group">
            Catalog
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C1121F] to-[#f77f00] group-hover:w-full transition-all duration-300 rounded-full" />
          </a>
        </nav>

        {/* Right Side: Quick Action Icons */}
        <div className="flex items-center gap-3 sm:gap-4 text-neutral-450">
          <Link
            href="/custom-poster"
            className={`md:hidden text-[10px] uppercase tracking-widest font-black px-3.5 py-2 rounded-full border transition-all duration-300 active:scale-95 ${pathname === '/custom-poster'
                ? 'bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] border-transparent text-white shadow-lg shadow-red-950/30'
                : 'bg-neutral-900 border-neutral-850 text-neutral-350 hover:text-white hover:border-neutral-700'
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
                  className="bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-1.5 text-xs w-32 sm:w-44 placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-all"
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
              onClick={handleSearchClick}
              className="p-2.5 hover:text-white transition-all hover:scale-110 active:scale-90 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>



          <Link href="/cart" className="p-2.5 hover:text-white transition-all hover:scale-110 active:scale-90 relative" aria-label="Cart">
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-black/50 border border-neutral-950">
                {cartCount}
              </span>
            )}
          </Link>

          <Link href={isAuthenticated ? "/account" : "/login"} className="p-2.5 hover:text-white transition-all hover:scale-110 active:scale-90" aria-label="Account">
            <User className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
