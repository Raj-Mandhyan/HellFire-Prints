'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from './SafeImage';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react';
import { Prisma } from '@prisma/client';
import ScrollReveal from './ScrollReveal';
import {
  getVariantPricing,
  ORIGINAL_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
  DIWALI_OFFER_START_MS,
} from '@/lib/pricing';
import { useCart } from '@/context/CartContext';

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
}> & {
  diwaliPrice?: number | null;
  variants?: Array<{
    price?: number | null;
    retailMrp?: number | null;
    baseSellingPrice?: number | null;
    diwaliSellingPrice?: number | null;
    size?: {
      name: string;
    } | null;
  }>;
};

interface ProductCatalogProps {
  products: ProductWithRelations[];
}

interface ProductCardProps {
  product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
  const { previewPhase, liveOfferStatus } = useCart();

  const effectivePhase = previewPhase ?? liveOfferStatus.phase;
  const isExpired = effectivePhase === 'EXPIRED';
  const a4Variant = product.variants?.find((v) => v.size?.name === 'A4');
  const a6Variant = product.variants?.find((v) => v.size?.name === 'A6');
  const a4Pricing = getVariantPricing(
    a4Variant,
    product.price,
    new Date(DIWALI_OFFER_START_MS),
    isExpired ? 'EXPIRED' : 'ACTIVE',
    product.MRP,
    product.diwaliPrice
  );
  const a6Pricing = getVariantPricing(
    a6Variant,
    ORIGINAL_SIZE_PRICES.A6,
    new Date(DIWALI_OFFER_START_MS),
    isExpired ? 'EXPIRED' : 'ACTIVE'
  );

  const images = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return [{
        id: 'default',
        url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
        sortOrder: 0
      }];
    }
    return [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [product.images]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, { threshold: 0.1 });

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasMultipleImages || !isIntersecting) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [hasMultipleImages, isIntersecting, images.length]);

  const stock = product.inventory?.quantity ?? 0;

  const ratingData = useMemo(() => {
    const reviewsList = product.reviews || [];
    if (reviewsList.length === 0) {
      return { average: 0, total: 0 };
    }
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: parseFloat((sum / reviewsList.length).toFixed(1)),
      total: reviewsList.length
    };
  }, [product.reviews]);

  const renderCardStars = (rating: number) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-2.5 h-2.5 ${i <= roundedRating ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`}
        />
      );
    }
    return <div className="flex gap-0.5 items-center">{stars}</div>;
  };

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col bg-[#0F0A0C] border border-amber-500/20 rounded-3xl overflow-hidden hover:-translate-y-2 hover:border-[#FFD700]/75 transition-all duration-500 hover:shadow-[0_20px_45px_rgba(255,183,3,0.18)]"
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950 border-b border-neutral-950">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              activeImageIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={img.url}
              alt={`${product.title} - View ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-108 transition-transform duration-700"
              priority={idx === 0}
              loading={idx === 0 ? 'eager' : undefined}
            />
          </div>
        ))}

        {/* Cinematic Gradient Overlay on Card Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-0 group-hover:opacity-75 transition-opacity duration-500 z-10 pointer-events-none" />

        {/* Diwali Festive Badge */}
        {!isExpired ? (
          <div className="absolute top-3.5 left-3.5 z-20 flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shadow-lg shadow-black/50">
              <Sparkles className="w-2.5 h-2.5" />
              DIWALI SPECIAL OFFER • {a4Pricing.discountPercentage}% OFF
            </span>
            <span className="w-fit bg-black/80 backdrop-blur-md border border-[#FFD700]/40 text-[#FFD700] text-[8.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-md">
              A6 FROM ₹{a6Pricing.diwaliSellingPrice} (MRP ~~₹{a6Pricing.retailMrp}~~ • Base ~~₹{a6Pricing.baseSellingPrice}~~)
            </span>
          </div>
        ) : (
          product.discount > 0 && (
            <span className="absolute top-4 left-4 bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shadow-lg shadow-black/40 z-20">
              {product.discount}% OFF
            </span>
          )
        )}

        {/* Stock Status Badge Overlay */}
        <span className={`absolute bottom-4 right-4 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg z-20 backdrop-blur-md shadow-md ${
          stock > 0
            ? 'bg-neutral-950/80 border border-neutral-850 text-emerald-400'
            : 'bg-red-950/80 border border-red-900/60 text-red-400'
        }`}>
          {stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>

        {/* Slide Controls (Fade-in on hover) */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-neutral-950/80 hover:bg-[#C1121F] p-2 rounded-full text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 border border-neutral-850 hover:border-transparent cursor-pointer shadow-lg hover:scale-110 active:scale-95"
              aria-label="Previous product image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveImageIndex((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-neutral-950/80 hover:bg-[#C1121F] p-2 rounded-full text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 border border-neutral-850 hover:border-transparent cursor-pointer shadow-lg hover:scale-110 active:scale-95"
              aria-label="Next product image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Page Dots Indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActiveImageIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  activeImageIndex === idx ? 'bg-[#FFD700] scale-125 w-3.5 shadow-md shadow-amber-950/50' : 'bg-white/30 hover:bg-white/70'
                }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content details block */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 relative">
        <div className="space-y-2">
          {/* Category & Ratings stars */}
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest">
            <span className="text-[#FFD700] block tracking-widest font-black">
              {product.category?.name || 'Catalog'}
            </span>
            {ratingData.total > 0 && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-neutral-400 font-bold bg-neutral-900/60 px-2 py-0.5 rounded-md border border-neutral-850/30">
                {renderCardStars(ratingData.average)}
                <span>{ratingData.average}</span>
              </div>
            )}
          </div>
          {/* Title */}
          <h3 className="font-extrabold text-white text-base leading-tight group-hover:text-[#FFD700] transition-colors duration-300 line-clamp-1">
            <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:z-0">
              {product.title}
            </Link>
          </h3>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-neutral-900/80">
          {/* Prices (A4 Three-Tier Showcase during Diwali, Two-Tier when Expired) */}
          {!isExpired ? (
            <div className="flex flex-col animate-price-pop">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-neutral-500">
                  MRP{' '}
                  <span className="line-through decoration-neutral-500 font-bold text-neutral-400">
                    ₹{a4Pricing.retailMrp}
                  </span>
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-400">
                  Base{' '}
                  <span className="line-through decoration-[#FF4D4D] decoration-2 font-bold text-amber-200/80">
                    ₹{a4Pricing.baseSellingPrice}
                  </span>
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-mono font-black text-[#FFD700] leading-none">
                  ₹{a4Pricing.diwaliSellingPrice}
                </span>
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                  (A4)
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  SAVE ₹{a4Pricing.savings}
                </span>
                <span className="text-[9px] text-amber-300/80 font-bold uppercase tracking-wider">
                  Diwali Offer
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-neutral-500">
                MRP{' '}
                <span className="line-through decoration-neutral-500 font-bold text-neutral-400">
                  ₹{a4Pricing.retailMrp}
                </span>
              </span>
              <span className="text-lg font-mono font-black text-white leading-none mt-0.5">
                ₹{a4Pricing.baseSellingPrice}
              </span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase mt-1">
                Standard A4 Print
              </span>
            </div>
          )}

          {/* CTA view button */}
          <Link 
            href={`/product/${product.slug}`} 
            className="relative z-10 bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer"
          >
            View Offer
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductCatalog({ products }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const categories = useMemo(() => {
    const list = new Set(products.map((p) => p.category?.name).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category?.name === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.SKU.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-6 py-14 space-y-10 scroll-mt-10">
      {/* Title */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-amber-500/20 pb-6 gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFD700]">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>DIWALI FESTIVAL SALE 2026 • ALL POSTERS DISCOUNTED</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              EXPLORE THE <span className="text-[#FFD700] diwali-gold-text-glow font-black">FESTIVE COLLECTION</span>
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-semibold tracking-wide">
              A3 <span className="line-through text-neutral-500">₹{ORIGINAL_SIZE_PRICES.A3}</span> <span className="text-[#FFD700] font-bold">₹{DIWALI_SIZE_PRICES.A3}</span> • A4 <span className="line-through text-neutral-500">₹{ORIGINAL_SIZE_PRICES.A4}</span> <span className="text-[#FFD700] font-bold">₹{DIWALI_SIZE_PRICES.A4}</span> • A5 <span className="line-through text-neutral-500">₹{ORIGINAL_SIZE_PRICES.A5}</span> <span className="text-[#FFD700] font-bold">₹{DIWALI_SIZE_PRICES.A5}</span> • A6 <span className="line-through text-neutral-500">₹{ORIGINAL_SIZE_PRICES.A6}</span> <span className="text-[#FFD700] font-bold">₹{DIWALI_SIZE_PRICES.A6}</span>
            </p>
          </div>

          {/* Counter badge */}
          <span className="self-start md:self-auto text-[10px] font-extrabold uppercase bg-neutral-950 border border-amber-500/30 text-[#FFD700] px-4 py-2 rounded-full tracking-widest shadow-md">
            {filteredProducts.length} Prints Available
          </span>
        </div>
      </ScrollReveal>

      {/* Controls: Search, Sort, Filter */}
      <ScrollReveal fiery={false}>
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search poster name, details, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#0F0A0C] border border-amber-500/20 text-white rounded-xl placeholder-neutral-500 text-xs focus:outline-none focus:border-[#FFD700] transition-all duration-300"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-11 pr-10 py-3.5 bg-[#0F0A0C] border border-amber-500/20 text-white rounded-xl text-xs uppercase tracking-wider font-extrabold focus:outline-none focus:border-[#FFD700] appearance-none cursor-pointer transition-colors"
              >
                <option value="default">Featured Releases</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Alphabetical: A-Z</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-neutral-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Category Pills */}
      <ScrollReveal fiery={false}>
        <div className="flex items-center gap-2 overflow-x-auto pb-3.5 scrollbar-none border-b border-neutral-900/60">
          <SlidersHorizontal className="w-4.5 h-4.5 text-[#FFD700] mr-2 flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-4.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all duration-350 cursor-pointer flex-shrink-0 active:scale-95 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-[#C1121F] via-[#FF7B00] to-[#FFD700] border-transparent text-black shadow-lg shadow-amber-950/30'
                  : 'bg-[#0F0A0C] border-amber-500/20 text-neutral-400 hover:border-amber-500/50 hover:text-white hover:bg-neutral-900/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, idx) => (
            <ScrollReveal key={product.id} staggerDelay={(idx % 4) * 60} fiery={false}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-neutral-950/20 border border-neutral-900 rounded-3xl max-w-lg mx-auto space-y-4">
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No posters match your query.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="text-xs font-black text-[#FFD700] hover:text-amber-300 uppercase tracking-widest border border-neutral-900 px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
