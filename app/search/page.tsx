import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProductCard } from '@/components/ProductCatalog';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
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

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  let products: ProductWithRelations[] = [];
  let errorMsg: string | null = null;

  if (query) {
    try {
      products = await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { SKU: { contains: query, mode: 'insensitive' } },
            { category: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
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
      console.error('Search query failed:', error);
      errorMsg = error instanceof Error ? error.message : String(error);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5] flex flex-col font-sans selection:bg-[#C1121F] selection:text-white overflow-x-hidden">
      {/* Brand Navigation Header */}
      <Navbar />

      {/* Atmospheric Effects */}
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-[#C1121F]/5 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[380px] h-[380px] rounded-full bg-[#f77f00]/3 blur-[140px] -z-10 pointer-events-none" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Page title and descriptive text */}
        <div className="border-b border-neutral-900 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              HELLFIRE <span className="text-[#C1121F] fiery-text-glow font-black">SEARCH</span>
            </h1>
            <p className="text-neutral-455 text-xs sm:text-sm font-semibold tracking-wide text-neutral-400">
              Query our Neon PostgreSQL database for prints, categories, and blueprints.
            </p>
          </div>
          {query && (
            <span className="self-start md:self-auto text-[10px] font-extrabold uppercase bg-neutral-950 border border-neutral-900 text-[#FF4D4D] px-4 py-2.5 rounded-full tracking-widest shadow-md">
              {products.length} Results Found
            </span>
          )}
        </div>

        {/* Refined Search Form inside Search Page */}
        <ScrollReveal fiery={false} className="max-w-2xl mx-auto w-full">
          <div className="bg-[#0F0F0F] border border-neutral-900/60 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#C1121F]/5 blur-2xl pointer-events-none" />
            <form action="/search" method="GET" className="space-y-4">
              <label htmlFor="search-input" className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">
                Search Catalog
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                <input
                  id="search-input"
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Type keywords e.g. anime, supercars, minimalist..."
                  required
                  className="w-full bg-[#050505] border border-neutral-850 rounded-2xl py-4 pl-12 pr-12 text-sm text-white placeholder-neutral-650 focus:outline-none focus:border-[#C1121F] transition-colors font-medium"
                />
                {query && (
                  <Link
                    href="/search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-neutral-900 hover:bg-neutral-800 rounded-full text-neutral-450 hover:text-white transition-colors"
                    title="Clear query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer shadow-lg shadow-red-950/20"
              >
                Execute Search Query
              </button>
            </form>
          </div>
        </ScrollReveal>

        {/* Results Render Area */}
        {errorMsg ? (
          <div className="max-w-xl mx-auto p-8 bg-red-950/20 border border-red-900/50 text-red-200 rounded-3xl text-center space-y-2">
            <h3 className="font-bold text-base uppercase text-red-400">Search Error</h3>
            <p className="text-xs font-mono text-neutral-400 bg-black/40 p-4 rounded-xl border border-red-950/30">{errorMsg}</p>
          </div>
        ) : !query ? (
          /* Initial empty query state */
          <ScrollReveal fiery={false} className="max-w-lg mx-auto w-full">
            <div className="text-center py-20 bg-neutral-950/20 border border-neutral-900 rounded-3xl space-y-4">
              <Search className="w-10 h-10 text-neutral-750 mx-auto" />
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                Ready to seek out high-contrast setups.
              </p>
            </div>
          </ScrollReveal>
        ) : products.length > 0 ? (
          /* Products Grid Results */
          <div className="space-y-6">
            <ScrollReveal fiery={false}>
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">
                Matches for &ldquo;<span className="text-white">{query}</span>&rdquo;
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <ScrollReveal key={product.id} staggerDelay={(idx % 4) * 60} fiery={false}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        ) : (
          /* No products match the query */
          <ScrollReveal fiery={false} className="max-w-lg mx-auto w-full">
            <div className="text-center py-24 bg-neutral-950/20 border border-neutral-900 rounded-3xl space-y-5">
              <p className="text-neutral-500 text-xs font-extrabold uppercase tracking-widest">
                No prints matching &ldquo;{query}&rdquo; were discovered.
              </p>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed font-medium">
                Check spelling or try search terms like &quot;anime&quot;, &quot;supercars&quot;, &quot;movies&quot;, or &quot;bauhaus&quot;.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="text-xs font-black text-[#C1121F] hover:text-[#FF4D4D] uppercase tracking-widest border border-neutral-900 px-5 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 transition-colors"
                >
                  Browse Full Catalog
                </Link>
              </div>
            </div>
          </ScrollReveal>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
