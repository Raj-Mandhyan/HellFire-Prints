import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCatalog from '@/components/ProductCatalog';
import UpdatesStrip from '@/components/UpdatesStrip';
import ScrollReveal from '@/components/ScrollReveal';
import DiwaliHeroSection from '@/components/DiwaliHeroSection';
import { DiyaSectionDivider, DiyaLamp } from '@/components/DiwaliDecorations';
import { ANNOUNCEMENT_UPDATES } from '@/lib/constants';
import { getServerTimestampMs } from '@/lib/pricing';
import { ShieldCheck, Truck, Zap, Sparkles } from 'lucide-react';
import { Prisma } from '@prisma/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    inventory: true;
    images: true;
    variants: {
      include: {
        size: true;
      };
    };
    reviews: {
      select: {
        rating: true;
      };
    };
  };
}>;

export default async function HomePage() {
  let products: ProductWithRelations[] = [];
  let errorMsg: string | null = null;

  try {
    products = await prisma.product.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
        inventory: true,
        images: true,
        variants: {
          include: {
            size: true,
          },
        },
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
    console.error('Database fetch failed on storefront:', error);
    errorMsg = error instanceof Error ? error.message : String(error);
  }

  const serverTimeMs = getServerTimestampMs();

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Brand Navigation Header */}
      <Navbar />

      {/* Grand Diwali Sale 2026 Hero Section with Live IST Countdown, Diyas, Jhalars & Fireworks */}
      <DiwaliHeroSection initialServerTimeMs={serverTimeMs} />

      {/* Updates Marquee Strip */}
      <UpdatesStrip updates={ANNOUNCEMENT_UPDATES} />

      {/* Festive Diya Section Divider */}
      <DiyaSectionDivider label="FESTIVE COLLECTION • A3 ₹40 • A4 ₹20 • A5 ₹10 • A6 ₹5" />

      {/* Main Content Area: Product Catalog */}
      <main className="flex-grow">
        {errorMsg ? (
          <div className="max-w-xl mx-auto my-20 p-8 bg-red-950/20 border border-red-900/50 text-red-200 rounded-3xl text-center space-y-4">
            <h3 className="font-bold text-lg uppercase text-red-400">Database Connection Error</h3>
            <p className="text-xs font-mono text-neutral-400 bg-black/40 p-4 rounded-xl border border-red-950/30">{errorMsg}</p>
          </div>
        ) : (
          <ProductCatalog products={products} />
        )}
      </main>

      {/* Festive Custom Poster Studio Banner */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0F0508] via-[#1B0810] to-[#0B081A] border border-[#FFD700]/35 p-8 sm:p-14 shadow-[0_0_50px_rgba(255,183,3,0.12)] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#FFD700]/15 blur-3xl pointer-events-none"></div>
            <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/40 text-[#FFD700] px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                Custom Poster Studio • Diwali Festive Pricing Included
              </div>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                DESIGN YOUR OWN <span className="text-[#FFD700] diwali-gold-text-glow">MASTERPIECE</span>
              </h2>
              <p className="text-neutral-300 text-xs sm:text-sm font-medium leading-relaxed">
                Upload your personal photography, digital art, or custom typography. Enjoy full Diwali Sale discounts on custom prints: A6 at ₹5 (~~₹7~~), A5 at ₹10 (~~₹15~~), A4 at ₹20 (~~₹29~~), and A3 at ₹40 (~~₹49~~).
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <DiyaLamp size="md" delayMs={150} />
              </div>
              <Link
                href="/custom-poster"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all duration-300 hover:scale-105 diwali-button-glow shadow-xl"
              >
                Launch Customizer
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Brand Value / Features Strip */}
      <section className="border-t border-amber-500/20 bg-[#0A0507]/90 py-20 px-6 mt-12">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#12070B] border border-amber-500/20 hover:border-[#FFD700]/50 transition-all duration-300">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#FFD700]">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">300 GSM Heavy-Stock</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Archival-grade matte finish that absorbs glare and renders pitch blacks with razor-sharp contrast.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#12070B] border border-amber-500/20 hover:border-[#FFD700]/50 transition-all duration-300">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#FFD700]">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Reinforced Tube Delivery</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Rolled in acid-free protective tissue and shipped inside crush-proof industrial cardboard cylinders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#12070B] border border-amber-500/20 hover:border-[#FFD700]/50 transition-all duration-300">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#FFD700]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Fade-Resistant Pigment</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Printed with ultra-density UV-resistant inks engineered to retain vibrant saturation for decades.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Brand Footer */}
      <Footer />
    </div>
  );
}
