import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProductCatalog from '@/components/ProductCatalog';
import { Flame, ArrowRight, Monitor, Car, Film, Compass } from 'lucide-react';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import UpdatesStrip from '@/components/UpdatesStrip';
import { COMPANY_UPDATES } from '@/lib/constants';
import ScrollReveal from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    inventory: true;
    images: true;
    reviews: {
      select: {
        rating: true;
      };
    };
  };
}>;

export default async function Home() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  let products: ProductWithRelations[] = [];
  let errorMsg: string | null = null;

  try {
    // Fetch products dynamically from Neon PostgreSQL via Prisma Client
    products = await prisma.product.findMany({
      include: {
        category: true,
        inventory: true,
        images: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error: unknown) {
    console.error('Failed to load catalog products:', error);
    errorMsg = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Brand Navigation Header */}
      <Navbar />

      {/* Hero / Cinematic Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-24 px-6 sm:px-12 border-b border-neutral-900/60 overflow-hidden bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-[#120505] via-[#050505] to-[#050505]">
        {/* Cinematic Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(193,18,31,0.03)_1.5px,transparent_1.5px)] bg-[size:28px_28px] opacity-70 pointer-events-none" />

        {/* Dynamic Atmospheric Glow Elements */}
        <div className="absolute top-[15%] left-[8%] w-[380px] h-[380px] rounded-full bg-[#C1121F]/10 blur-[130px] -z-10 pointer-events-none animate-glow-float-1" />
        <div className="absolute bottom-[15%] right-[8%] w-[450px] h-[450px] rounded-full bg-[#f77f00]/6 blur-[150px] -z-10 pointer-events-none animate-glow-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] rounded-full bg-[#C1121F]/3 blur-[160px] -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative">
          {/* Flame Icon Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-neutral-950/80 border border-neutral-850/80 rounded-full text-[10px] sm:text-xs font-extrabold text-[#FF4D4D] tracking-widest uppercase shadow-xl shadow-black/30 backdrop-blur-md animate-fade-in">
            <Flame className="w-4 h-4 text-[#C1121F] animate-pulse-fire" />
            Premium Poster Prints India
          </div>

          {/* Main Hero Header */}
          <div className="space-y-5 animate-slide-up animation-delay-100 opacity-0 style-for-fade-in" style={{ animationFillMode: 'forwards' }}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white uppercase select-none">
              Fuel Your Walls. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1121F] via-[#FF4D4D] to-[#f77f00] fiery-text-glow">
                Ignite Your Style.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-neutral-400 text-xs sm:text-sm md:text-base font-semibold leading-relaxed tracking-wide">
              Premium high-contrast poster art crafted for gamers, car enthusiasts, anime fans, movie buffs, and collectors. Rebuild your environment with high-definition cinematic art prints.
            </p>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-slide-up animation-delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <a
              href="#catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white px-8 py-4.5 rounded-2xl font-black tracking-wider uppercase text-xs transition-all duration-300 hover:scale-105 active:scale-98 fiery-button-glow cursor-pointer"
            >
              Shop Collection
              <ArrowRight className="w-4 h-4" />
            </a>

            {isAdmin && (
              <Link
                href="/test-db"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-850 text-neutral-350 hover:text-white px-8 py-4.5 rounded-2xl font-black tracking-wider uppercase text-xs transition-all duration-300 hover:scale-105 hover:border-neutral-700 active:scale-98"
              >
                Database Status
              </Link>
            )}
          </div>

          {/* Category Icons quick indicator */}
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto gap-4 text-[10px] sm:text-xs text-neutral-450 uppercase tracking-widest font-black animate-fade-in animation-delay-300 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-3 py-4 bg-neutral-950/50 border border-neutral-900/60 rounded-2xl hover:border-neutral-800 hover:bg-neutral-900/40 hover:text-white transition-all duration-300 hover:scale-102">
              <Monitor className="w-4 h-4 text-[#C1121F]" />
              Gaming
            </div>
            <div className="flex items-center justify-center gap-3 py-4 bg-neutral-950/50 border border-neutral-900/60 rounded-2xl hover:border-neutral-800 hover:bg-neutral-900/40 hover:text-white transition-all duration-300 hover:scale-102">
              <Car className="w-4 h-4 text-[#C1121F]" />
              Supercars
            </div>
            <div className="flex items-center justify-center gap-3 py-4 bg-neutral-950/50 border border-neutral-900/60 rounded-2xl hover:border-neutral-800 hover:bg-neutral-900/40 hover:text-white transition-all duration-300 hover:scale-102">
              <Film className="w-4 h-4 text-[#C1121F]" />
              Movies
            </div>
            <div className="flex items-center justify-center gap-3 py-4 bg-neutral-950/50 border border-neutral-900/60 rounded-2xl hover:border-neutral-800 hover:bg-neutral-900/40 hover:text-white transition-all duration-300 hover:scale-102">
              <Compass className="w-4 h-4 text-[#C1121F]" />
              Bauhaus
            </div>
          </div>
        </div>
      </section>

      {/* Updates Strip Ticker */}
      <ScrollReveal fiery={false}>
        <UpdatesStrip updates={COMPANY_UPDATES} />
      </ScrollReveal>

      {/* Main Catalog / Content */}
      <main className="flex-1 bg-transparent relative">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        {errorMsg ? (
          <div className="max-w-4xl mx-auto my-16 p-8 bg-red-950/20 border border-red-900/50 text-red-200 rounded-3xl text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-red-950/30 blur-xl pointer-events-none" />
            <h3 className="font-extrabold uppercase text-lg text-red-400 tracking-wider">Database Offline</h3>
            <p className="text-xs font-mono text-neutral-400 bg-black/40 p-4 rounded-xl border border-red-950/30">{errorMsg}</p>
          </div>
        ) : (
          <ProductCatalog products={products} />
        )}
      </main>

      {/* Footer */}
      <ScrollReveal fiery={false}>
        <footer className="bg-neutral-950 border-t border-neutral-900/80 py-16 text-center text-xs text-neutral-500 space-y-6">
          <div className="flex justify-center items-center gap-2.5">
            <div className="bg-[#C1121F]/15 p-1 rounded-lg border border-[#C1121F]/20">
              <Flame className="w-4 h-4 text-[#C1121F]" />
            </div>
            <span className="font-black tracking-widest text-white text-[11px] uppercase">
              HELLFIRE PRINTS
            </span>
          </div>
          <p className="max-w-md mx-auto text-[11px] leading-relaxed">
            © 2026 Hellfire Prints. All rights reserved. Premium Cinematic Poster Art. Engineered with heavy-duty construction.
          </p>
        </footer>
      </ScrollReveal>
    </div>
  );
}
