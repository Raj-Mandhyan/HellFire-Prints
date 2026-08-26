'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from './SafeImage';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Prisma } from '@prisma/client';
import { ShieldCheck, Truck, RefreshCw, ShoppingBag, ArrowLeft, Star, ChevronLeft, ChevronRight, MessageSquare, Trash2, User, Calendar, CheckCircle, Heart, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ScrollReveal from './ScrollReveal';
import {
  getProductReviewsAction,
  getProductRatingSummaryAction,
  submitProductReviewAction,
  deleteProductReviewAction,
  checkReviewEligibilityAction
} from '@/app/actions/review';
import {
  toggleProductLikeAction
} from '@/app/actions/like';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    variants: {
      include: {
        size: true;
        frame: true;
      };
    };
  };
}>;

interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  title: string | null;
  verifiedPurchase: boolean;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  } | null;
}

interface RatingSummary {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface ProductDetailsProps {
  product: ProductWithRelations;
  initialSummary: RatingSummary;
  initialLikesCount: number;
  initialIsLiked: boolean;
}

export default function ProductDetails({ product, initialSummary, initialLikesCount, initialIsLiked }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  
  // Gallery active index state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews and Rating Aggregate State
  const [summary, setSummary] = useState<RatingSummary>(initialSummary);
  const [reviewsList, setReviewsList] = useState<ReviewWithUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review Submission State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; existingReview?: Omit<ReviewWithUser, 'user'> | null; reason?: string } | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Favourites / Wishlist and Buy Now State
  const [isBuying, setIsBuying] = useState(false);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLikeMutating, setIsLikeMutating] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  // Load reviews list
  const loadReviews = useCallback(async (pageNum: number, sort: 'recent' | 'highest' | 'lowest', verified: boolean, append = false) => {
    try {
      setLoadingReviews(true);
      const res = await getProductReviewsAction({
        productId: product.id,
        page: pageNum,
        sortBy: sort,
        verifiedOnly: verified,
      });
      if (res.success && res.reviews) {
        const typedReviews = res.reviews as unknown as ReviewWithUser[];
        if (append) {
          setReviewsList((prev) => [...prev, ...typedReviews]);
        } else {
          setReviewsList(typedReviews);
        }
        setTotalCount(res.totalCount || 0);
        setHasMore(!!res.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  }, [product.id]);

  // Check user review eligibility
  const checkEligibility = useCallback(async () => {
    try {
      const res = await checkReviewEligibilityAction(product.id);
      setEligibility(res);
      if (res.eligible && res.existingReview) {
        setRating(res.existingReview.rating);
        setReviewTitle(res.existingReview.title || '');
        setComment(res.existingReview.comment || '');
      }
    } catch (err) {
      console.error(err);
    }
  }, [product.id]);

  // Trigger query reload on filters change
  useEffect(() => {
    Promise.resolve().then(() => {
      setPage(1);
      loadReviews(1, sortBy, verifiedOnly, false);
    });
  }, [sortBy, verifiedOnly, loadReviews]);

  // Load user eligibility on mount
  useEffect(() => {
    Promise.resolve().then(() => {
      checkEligibility();
    });
  }, [checkEligibility]);



  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReview) return;
    setReviewSuccess(null);
    setReviewError(null);

    if (rating < 1 || rating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await submitProductReviewAction(product.id, rating, comment, reviewTitle);
      if (res.error) {
        setReviewError(res.error);
      } else {
        setReviewSuccess(eligibility?.existingReview ? 'Your review was updated successfully! 🎉' : 'Your review was posted successfully! 🎉');
        setShowReviewForm(false);
        
        // Refresh aggregate summary
        const summaryRes = await getProductRatingSummaryAction(product.id);
        if (summaryRes.success && summaryRes.summary) {
          setSummary(summaryRes.summary);
        }
        
        // Refresh reviews list and eligibility check
        setPage(1);
        loadReviews(1, sortBy, verifiedOnly, false);
        checkEligibility();
      }
    } catch (err) {
      console.error(err);
      setReviewError('An unexpected error occurred while saving your review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Review Deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      const res = await deleteProductReviewAction(reviewId);
      if (res.error) {
        alert(res.error);
      } else {
        alert('Review deleted successfully.');
        setRating(0);
        setReviewTitle('');
        setComment('');
        
        // Refresh aggregate summary
        const summaryRes = await getProductRatingSummaryAction(product.id);
        if (summaryRes.success && summaryRes.summary) {
          setSummary(summaryRes.summary);
        }
        
        // Refresh reviews list and eligibility check
        setPage(1);
        loadReviews(1, sortBy, verifiedOnly, false);
        checkEligibility();
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while deleting your review.');
    }
  };

  // Load more pages
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadReviews(nextPage, sortBy, verifiedOnly, true);
  };

  // Extract unique sizes, frames, and paper types dynamically from the database variants list
  const sizes = useMemo(() => {
    const map = new Map();
    product.variants.forEach((v) => {
      if (v.size) map.set(v.size.id, v.size);
    });
    return Array.from(map.values()).sort((a, b) => a.additionalPrice - b.additionalPrice);
  }, [product.variants]);

  const frames = useMemo(() => {
    const map = new Map();
    product.variants.forEach((v) => {
      if (v.frame) map.set(v.frame.id, v.frame);
    });
    return Array.from(map.values()).sort((a, b) => a.additionalPrice - b.additionalPrice);
  }, [product.variants]);

  const paperTypes = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.paperType) set.add(v.paperType);
    });
    return Array.from(set);
  }, [product.variants]);

  // Option selection states (defaulting to the first available options)
  const [selectedSizeId, setSelectedSizeId] = useState(sizes[0]?.id || '');
  const [selectedFrameId, setSelectedFrameId] = useState(frames[0]?.id || '');
  const [selectedPaperType, setSelectedPaperType] = useState(paperTypes[0] || '');
  const [quantity, setQuantity] = useState(1);

  // Actions/feedback states
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Find the exact matching variant based on user selection
  const selectedVariant = useMemo(() => {
    return product.variants.find(
      (v) =>
        v.sizeId === selectedSizeId &&
        v.frameId === selectedFrameId &&
        v.paperType === selectedPaperType
    );
  }, [product.variants, selectedSizeId, selectedFrameId, selectedPaperType]);

  // Recalculate dynamic prices server-rule style
  const prices = useMemo(() => {
    const basePrice = product.price;
    const variantAdd = selectedVariant?.additionalPrice || 0;
    const finalPrice = basePrice + variantAdd;
    // Calculate MRP discount snapshot
    const finalMRP = product.MRP + variantAdd;
    return {
      price: finalPrice,
      MRP: finalMRP,
      discount: product.discount,
    };
  }, [product.price, product.MRP, product.discount, selectedVariant]);

  // Trigger add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setFeedbackMsg({ type: 'error', text: 'Selected configuration is unavailable.' });
      return;
    }

    if (selectedVariant.stock <= 0) {
      setFeedbackMsg({ type: 'error', text: 'This item is out of stock.' });
      return;
    }

    if (quantity > selectedVariant.stock) {
      setFeedbackMsg({ type: 'error', text: `Only ${selectedVariant.stock} units left in stock.` });
      return;
    }

    try {
      setIsAdding(true);
      setFeedbackMsg(null);
      const res = await addToCart(product.id, selectedVariant.id, quantity, undefined, undefined, product.title);
      
      if (res.success) {
        setIsJustAdded(true);
        setQuantity(1);
        setTimeout(() => {
          setIsJustAdded(false);
        }, 3000);
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to add item.' });
      }
    } catch (error) {
      console.error(error);
      setFeedbackMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsAdding(false);
    }
  };

  // Trigger Buy Now
  const handleBuyNow = async () => {
    if (!selectedVariant) {
      setFeedbackMsg({ type: 'error', text: 'Selected configuration is unavailable.' });
      return;
    }

    if (selectedVariant.stock <= 0) {
      setFeedbackMsg({ type: 'error', text: 'This item is out of stock.' });
      return;
    }

    if (quantity > selectedVariant.stock) {
      setFeedbackMsg({ type: 'error', text: `Only ${selectedVariant.stock} units left in stock.` });
      return;
    }

    try {
      setIsBuying(true);
      setFeedbackMsg(null);
      const res = await addToCart(product.id, selectedVariant.id, quantity, undefined, undefined, product.title);
      if (res.success) {
        router.push('/checkout');
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to process checkout.' });
      }
    } catch (error) {
      console.error(error);
      setFeedbackMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsBuying(false);
    }
  };

  // Like / Unlike Toggle handler
  const handleLikeToggle = async () => {
    if (eligibility?.reason === 'unauthenticated') {
      if (confirm('You must be logged in to like products. Log in now?')) {
        router.push(`/login?callback=/product/${product.slug}`);
      }
      return;
    }

    if (isLikeMutating) return;

    // Optimistic UI updates
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikesCount((prev) => (nextIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    
    if (nextIsLiked) {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 500);
    }

    try {
      setIsLikeMutating(true);
      const res = await toggleProductLikeAction(product.id);
      if (res.success && res.totalLikes !== undefined && res.isLiked !== undefined) {
        // Sync actual state from server action response
        setIsLiked(res.isLiked);
        setLikesCount(res.totalLikes);
      } else {
        // Rollback optimistic update on failure
        setIsLiked(!nextIsLiked);
        setLikesCount((prev) => (nextIsLiked ? Math.max(0, prev - 1) : prev + 1));
        if (res.error === 'unauthenticated') {
          router.push(`/login?callback=/product/${product.slug}`);
        } else {
          alert(res.error || 'Failed to update like status.');
        }
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
      // Rollback optimistic update on error
      setIsLiked(!nextIsLiked);
      setLikesCount((prev) => (nextIsLiked ? Math.max(0, prev - 1) : prev + 1));
      alert('An unexpected error occurred.');
    } finally {
      setIsLikeMutating(false);
    }
  };

  const images = product.images.length > 0 ? product.images : [{
    id: 'default-image',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    alt: product.title,
    productId: product.id,
    publicId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }];
  const existingReview = eligibility?.existingReview;

  return (
    <div className="space-y-10">
      {/* Breadcrumbs / Back button */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-350" />
          Back to storefront
        </Link>
        <span className="text-[10px] font-mono uppercase bg-neutral-950 border border-neutral-900 text-neutral-400 px-3.5 py-1.5 rounded-full tracking-widest shadow-sm">
          SKU: {selectedVariant?.SKU || product.SKU}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Product Gallery */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-[3/4] w-full bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl shadow-black/90">
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
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}

            {/* Top Glowing atmospheric bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#C1121F] to-transparent z-20"></div>

            {/* Previous/Next Manual Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-neutral-950/90 hover:bg-[#C1121F] p-3 rounded-full text-white transition-all cursor-pointer shadow-xl hover:scale-110 border border-neutral-850 hover:border-transparent active:scale-95"
                  aria-label="Previous product image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-neutral-950/90 hover:bg-[#C1121F] p-3 rounded-full text-white transition-all cursor-pointer shadow-xl hover:scale-110 border border-neutral-850 hover:border-transparent active:scale-95"
                  aria-label="Next product image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      activeImageIndex === idx ? 'bg-[#C1121F] scale-125 w-3.5' : 'bg-white/40 hover:bg-white/80'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Strip with Semantic Labels */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none justify-start sm:justify-center lg:justify-start">
              {images.map((img, idx) => {
                const labels = ['Normal', 'On Wall', 'In Hand', 'Detail View'];
                const label = labels[idx] || `View ${idx + 1}`;
                return (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
                  >
                    <div className={`relative w-20 h-24 rounded-2xl border-2 overflow-hidden bg-neutral-950 transition-all duration-300 ${
                      activeImageIndex === idx ? 'border-[#C1121F] shadow-lg shadow-red-950/20' : 'border-neutral-900 group-hover:border-neutral-700'
                    }`}>
                      <Image src={img.url} alt={label} fill className="object-cover" />
                    </div>
                    <span className={`text-[9px] uppercase font-black tracking-widest transition-colors duration-300 ${
                      activeImageIndex === idx ? 'text-[#FF4D4D]' : 'text-neutral-500 group-hover:text-neutral-350'
                    }`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Product Customizer & Details */}
        <div className="lg:col-span-5 space-y-8 bg-[#0F0F0F] p-6 sm:p-8 rounded-3xl border border-neutral-900/60 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none" />

          {/* Header Info */}
          <div className="space-y-3.5">
            <span className="text-xs text-[#C1121F] font-black uppercase tracking-widest block">
              {product.category?.name || 'Catalog'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-none">
              {product.title}
            </h1>
            
            {/* Ratings summary indicator */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const fillValue = i + 1;
                  const isFilled = fillValue <= Math.round(summary.averageRating);
                  return (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${isFilled ? 'text-amber-500 fill-amber-500' : 'text-neutral-800'}`} 
                    />
                  );
                })}
              </div>
              <span className="text-xs text-neutral-450 font-bold uppercase tracking-wider text-[10px]">
                {summary.totalReviews > 0 ? (
                  `${summary.averageRating.toFixed(1)} rating | ${summary.totalReviews} review${summary.totalReviews > 1 ? 's' : ''}`
                ) : (
                  'No reviews yet'
                )}
              </span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="flex items-baseline gap-3.5 bg-neutral-950 p-4.5 border border-neutral-900 rounded-2xl shadow-inner">
            <span className="text-3xl font-black text-white">
              ₹{prices.price.toFixed(2)}
            </span>
            {prices.discount > 0 && (
              <>
                <span className="text-sm text-neutral-500 line-through">
                  ₹{prices.MRP.toFixed(2)}
                </span>
                <span className="bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest shadow">
                  {prices.discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <ScrollReveal fiery={false}>
            <div className="space-y-2 text-xs sm:text-sm text-neutral-400 leading-relaxed border-b border-neutral-900 pb-6">
              <h3 className="text-white text-[10px] font-black uppercase tracking-widest">Poster Blueprint</h3>
              <p className="font-medium">{product.description}</p>
            </div>
          </ScrollReveal>

          {/* Customizer Selections */}
          <div className="space-y-6">
            {/* 1. Size Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                Select Dimensions
              </label>
              <div className="grid grid-cols-2 gap-3">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSizeId(size.id)}
                    className={`px-4.5 py-3 rounded-2xl border text-left cursor-pointer transition-all duration-300 active:scale-98 ${
                      selectedSizeId === size.id
                        ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow-lg shadow-red-950/20'
                        : 'border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:border-neutral-750 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black uppercase tracking-wider">{size.name}</div>
                    <div className="text-[10px] text-neutral-500 font-bold mt-1">{size.dimensions}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Frame Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                Frame Finish
              </label>
              <div className="grid grid-cols-2 gap-3">
                {frames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrameId(frame.id)}
                    className={`px-4.5 py-3 rounded-2xl border text-left cursor-pointer transition-all duration-300 active:scale-98 ${
                      selectedFrameId === frame.id
                        ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow-lg shadow-red-950/20'
                        : 'border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:border-neutral-750 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black uppercase tracking-wider line-clamp-1">{frame.name}</div>
                    <div className="text-[10px] text-neutral-500 font-bold mt-1">
                      {frame.additionalPrice > 0 ? `+ ₹${frame.additionalPrice.toFixed(0)}` : 'Included'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Paper Type Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                Paper Finish
              </label>
              <div className="flex gap-3">
                {paperTypes.map((paper) => (
                  <button
                    key={paper}
                    onClick={() => setSelectedPaperType(paper)}
                    className={`flex-1 px-4.5 py-3.5 rounded-2xl border text-center text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 active:scale-98 ${
                      selectedPaperType === paper
                        ? 'border-[#C1121F] bg-[#C1121F]/10 text-white shadow-lg shadow-red-950/20'
                        : 'border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:border-neutral-750 hover:text-white'
                    }`}
                  >
                    {paper.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row: Quantity + Add button */}
          <div className="space-y-5 pt-6 border-t border-neutral-900">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-450 font-black uppercase tracking-widest">
                Quantity
              </span>
              <div className="flex items-center bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer text-sm font-bold"
                >
                  -
                </button>
                <span className="px-5 py-2 font-mono text-xs font-black text-white bg-neutral-950 border-x border-neutral-900 w-14 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Inventory Status Message */}
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest bg-neutral-950 p-3.5 border border-neutral-900 rounded-xl">
              <span className="text-neutral-500">Availability Status:</span>
              <span className={`${
                !selectedVariant || selectedVariant.stock <= 0
                  ? 'text-red-500'
                  : selectedVariant.stock < 5
                  ? 'text-[#FF4D4D] animate-pulse'
                  : 'text-emerald-500'
              }`}>
                {!selectedVariant
                  ? 'Unavailable Config'
                  : selectedVariant.stock <= 0
                  ? 'OUT OF STOCK'
                  : selectedVariant.stock < 5
                  ? `ONLY ${selectedVariant.stock} UNITS LEFT`
                  : 'IN STOCK'}
              </span>
            </div>

            {/* Feedback Notifications */}
            {feedbackMsg && (
              <div className={`p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-900 text-emerald-350'
                  : 'bg-red-950/40 border-red-900 text-red-350'
              }`}>
                {feedbackMsg.text}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isJustAdded || !selectedVariant || selectedVariant.stock <= 0}
                className={`flex-1 inline-flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-300 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-97 ${
                  isJustAdded
                    ? 'bg-emerald-600 text-white hover:scale-100 shadow-emerald-950/20'
                    : 'bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] text-white hover:scale-103 fiery-button-glow shadow-red-950/30'
                }`}
              >
                {isJustAdded ? <Check className="w-4.5 h-4.5 animate-pulse" /> : <ShoppingBag className="w-4.5 h-4.5" />}
                {isAdding ? 'ADDING TO CART...' : isJustAdded ? 'ADDED TO CART! 🔥' : selectedVariant && selectedVariant.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isBuying || !selectedVariant || selectedVariant.stock <= 0}
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-neutral-950 border border-[#C1121F]/60 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all duration-300 hover:bg-[#C1121F]/10 hover:border-[#C1121F] active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isBuying ? 'PROCESSING...' : 'BUY NOW'}
              </button>
            </div>


          </div>

          {/* Trust points */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-neutral-900 text-[9px] text-neutral-400 text-center font-black uppercase tracking-widest">
            <div className="flex flex-col items-center gap-1.5 py-2.5 bg-neutral-950/30 rounded-xl border border-neutral-900/60">
              <ShieldCheck className="w-5 h-5 text-[#C1121F]" />
              Secure Pay
            </div>
            <div className="flex flex-col items-center gap-1.5 py-2.5 bg-neutral-950/30 rounded-xl border border-neutral-900/60">
              <Truck className="w-5 h-5 text-[#C1121F]" />
              Fast Ship
            </div>
            <div className="flex flex-col items-center gap-1.5 py-2.5 bg-neutral-950/30 rounded-xl border border-neutral-900/60">
              <RefreshCw className="w-5 h-5 text-[#C1121F]" />
              Easy Return
            </div>
          </div>
        </div>
      </div>

      {/* Reviews and Ratings configurator section */}
      <section className="border-t border-neutral-900 pt-16 mt-16 max-w-4xl mx-auto space-y-12">
        <h2 className="text-lg font-black uppercase text-white tracking-widest border-b border-neutral-900 pb-4">
          Customer Reviews & Rating Analytics ({totalCount})
        </h2>

        {/* Aggregate statistics */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0F0F0F] p-6 sm:p-8 rounded-3xl border border-neutral-900">
            
            {/* Rating aggregate number */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-2 h-full py-4 border-r-0 md:border-r border-neutral-900">
              <span className="text-6xl font-black text-white leading-none font-mono">
                {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '0.0'}
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => {
                  const fillValue = i + 1;
                  const isFilled = fillValue <= Math.round(summary.averageRating);
                  return (
                    <Star 
                      key={i} 
                      className={`w-4.5 h-4.5 ${isFilled ? 'fill-amber-500 text-amber-500' : 'text-neutral-800'}`} 
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest pt-1">
                Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-5 space-y-3 px-0 md:px-6 border-r-0 md:border-r border-neutral-900">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star] || 0;
                const percent = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <span className="w-12 text-neutral-450 shrink-0 text-[10px]">{star} Star</span>
                    <div className="flex-1 h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
                      <div 
                        className="h-full bg-gradient-to-r from-[#C1121F] to-[#FF4D4D] rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-14 text-neutral-500 font-mono text-[10px] text-right shrink-0">
                      {percent}% ({count})
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Likes Component */}
            <div className="md:col-span-3 flex flex-col items-center justify-center text-center space-y-4 h-full py-4 px-0 md:px-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Heart 
                    className={`w-6 h-6 transition-all duration-300 ${
                      isLiked 
                        ? 'fill-[#C1121F] text-[#C1121F] filter drop-shadow-[0_0_8px_rgba(193,18,31,0.6)]' 
                        : 'text-neutral-500'
                    } ${pulseActive ? 'scale-125 animate-pulse' : ''}`} 
                  />
                  {pulseActive && (
                    <span className="absolute inset-0 w-6 h-6 bg-[#C1121F] rounded-full filter blur-[4px] animate-ping opacity-60 pointer-events-none"></span>
                  )}
                </div>
                <span className={`text-xs font-black uppercase tracking-widest ${isLiked ? 'text-[#FF4D4D] fiery-text-glow font-black' : 'text-neutral-400'}`}>
                  {likesCount} Like{likesCount !== 1 ? 's' : ''}
                </span>
              </div>

              <button
                onClick={handleLikeToggle}
                disabled={isLikeMutating}
                className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer active:scale-97 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isLiked
                    ? 'bg-[#C1121F]/15 border-[#C1121F] text-[#FF4D4D] shadow-lg shadow-red-950/20 hover:bg-[#C1121F]/25 hover:scale-103'
                    : 'bg-neutral-950 border-neutral-900 text-neutral-450 hover:text-white hover:border-neutral-750 hover:scale-103'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#C1121F] text-[#C1121F]' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Write Review Form Component Block */}
        {eligibility ? (
          eligibility.eligible ? (
            !showReviewForm ? (
              <div className="bg-[#0F0F0F] p-6 sm:p-8 rounded-3xl border border-neutral-900 text-center space-y-4 shadow-lg animate-fade-in">
                <Star className="w-8 h-8 text-[#C1121F] fill-[#C1121F] mx-auto animate-pulse-fire" />
                <h3 className="text-xs font-black uppercase text-white tracking-widest">Share Your Experience</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed font-semibold">
                  {existingReview
                    ? "You have already reviewed this product. You can update your existing review at any time."
                    : "You purchased this product! Share your feedback with other collectors."}
                </p>
                
                {reviewSuccess && (
                  <div className="p-4 max-w-md mx-auto bg-emerald-950/20 border border-emerald-900/60 text-emerald-400 text-xs rounded-xl font-bold uppercase tracking-wider">
                    {reviewSuccess}
                  </div>
                )}
                
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="inline-flex bg-[#C1121F] hover:bg-[#A00F19] text-white font-black uppercase text-[10px] tracking-widest px-7 py-3.5 rounded-xl transition-all cursor-pointer shadow-md hover:scale-103 active:scale-97"
                  >
                    {existingReview ? 'Edit Your Review' : 'Leave a Review'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#0F0F0F] p-6 sm:p-8 rounded-3xl border border-neutral-900 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#C1121F] animate-pulse-fire" />
                    {existingReview ? 'Update Your Review' : 'Write a Customer Review'}
                  </h3>
                  {existingReview && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(existingReview.id)}
                      className="text-neutral-500 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Review
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Star selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                      Select Rating
                    </label>
                    <div className="flex items-center gap-1 bg-neutral-950 p-2.5 rounded-xl border border-neutral-900 inline-flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i)}
                          onMouseEnter={() => setHoverRating(i)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
                          className="p-1 transition-all duration-200 hover:scale-125 focus:outline-none cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${(hoverRating || rating) >= i ? 'text-amber-500 fill-amber-500' : 'text-neutral-850'}`}
                          />
                        </button>
                      ))}
                      <span className="text-[10px] text-neutral-400 font-extrabold uppercase ml-3 tracking-widest">
                        {rating > 0 ? `${rating} Stars` : 'Select stars'}
                      </span>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-2">
                    <label htmlFor="reviewTitle" className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                      Review Headline (Optional)
                    </label>
                    <input
                      id="reviewTitle"
                      type="text"
                      maxLength={150}
                      placeholder="Summarize your experience (e.g. Stunning colors, thick paper)..."
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-2xl py-3.5 px-4 text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-colors"
                    />
                  </div>

                  {/* Comment text area */}
                  <div className="space-y-2">
                    <label htmlFor="comment" className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                      Detailed Comments
                    </label>
                    <textarea
                      id="comment"
                      rows={4}
                      maxLength={2000}
                      required
                      placeholder="Share details about the print quality, dynamic colors, alignment, or layout finish..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-2xl py-3.5 px-4 text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#C1121F] transition-colors resize-none leading-relaxed"
                    />
                    <div className="flex justify-end text-[9px] text-neutral-600 font-mono">
                      {comment.length}/2000 characters
                    </div>
                  </div>

                  {/* Status notifications */}
                  {reviewError && (
                    <div className="p-4 bg-red-950/20 border border-red-900/60 text-red-400 text-xs rounded-xl font-bold uppercase tracking-wider">
                      {reviewError}
                    </div>
                  )}

                  {/* Submit and Cancel CTAs */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="bg-[#C1121F] hover:bg-[#A00F19] disabled:bg-neutral-900 disabled:text-neutral-500 border border-transparent text-white font-black uppercase text-[10px] tracking-widest px-6 py-3.5 rounded-xl transition-all disabled:cursor-not-allowed cursor-pointer shadow-md"
                    >
                      {isSubmittingReview ? 'Saving review...' : existingReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewSuccess(null);
                        setReviewError(null);
                      }}
                      className="border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 hover:text-white text-neutral-400 font-black uppercase text-[10px] tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : eligibility.reason === 'unauthenticated' ? (
            <div className="bg-[#0F0F0F] p-8 rounded-3xl border border-neutral-900 text-center space-y-4 shadow-lg">
              <ShieldCheck className="w-9 h-9 text-[#C1121F] mx-auto animate-pulse-fire" />
              <h3 className="text-xs font-black uppercase text-white tracking-widest">Share Your Experience</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed font-semibold">
                You must be logged in to rate and review posters. Only verified buyers can leave a rating.
              </p>
              <div className="pt-2">
                <Link
                  href={`/login?callback=/product/${product.slug}`}
                  className="inline-flex bg-[#C1121F] hover:bg-[#A00F19] text-white font-black uppercase text-[10px] tracking-widest px-7 py-3.5 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(193,18,31,0.4)]"
                >
                  Sign In to Write a Review
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F0F0F] p-8 rounded-3xl border border-neutral-900 text-center space-y-4 shadow-lg">
              <ShieldCheck className="w-9 h-9 text-neutral-700 mx-auto" />
              <h3 className="text-xs font-black uppercase text-neutral-400 tracking-widest">Review Eligibility Check</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed font-semibold">
                Only customers who have purchased and received this product from Hellfire Prints can leave a review.
              </p>
            </div>
          )
        ) : (
          <div className="bg-[#0F0F0F] p-8 rounded-3xl border border-neutral-900 text-center text-xs text-neutral-500 tracking-wider">
            Loading eligibility data...
          </div>
        )}

        {/* Filter controls and reviews sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F0F0F] p-4.5 rounded-2xl border border-neutral-900">
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="text-neutral-450">Sort by:</span>
            <div className="flex gap-2">
              {(['recent', 'highest', 'lowest'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortBy(mode)}
                  className={`px-3 py-2 rounded-xl border text-[9px] uppercase font-black tracking-widest transition-all duration-300 cursor-pointer ${
                    sortBy === mode
                      ? 'bg-[#C1121F]/15 border-[#C1121F] text-[#FF4D4D]'
                      : 'bg-neutral-950 border-neutral-900 text-neutral-450 hover:border-neutral-750 hover:text-white'
                  }`}
                >
                  {mode === 'recent' ? 'Most Recent' : mode === 'highest' ? 'Highest' : 'Lowest'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-450 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-[#C1121F] w-4.5 h-4.5 rounded border-neutral-900 bg-neutral-950"
            />
            Verified Only
          </label>
        </div>

        {/* Reviews List */}
        <ScrollReveal fiery={false}>
          <div className="space-y-6">
            {reviewsList.length === 0 ? (
              <div className="bg-[#0F0F0F]/30 border border-neutral-900/60 p-12 rounded-3xl text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-neutral-700 mx-auto" />
                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">No customer reviews yet</p>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Be the first to review this product! Share your feedback with other collectors.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewsList.map((review) => (
                  <div 
                    key={review.id}
                    className="bg-[#0F0F0F] p-6 sm:p-7 rounded-3xl border border-neutral-900/80 space-y-4 relative shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* User Rating and Headline */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-3.5 h-3.5 ${idx + 1 <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-900'}`} 
                            />
                          ))}
                        </div>
                        {review.title && (
                          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                            &ldquo;{review.title}&rdquo;
                          </h4>
                        )}
                      </div>

                      {/* Date */}
                      <span className="text-[9px] text-neutral-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C1121F]" />
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-semibold">
                      {review.comment}
                    </p>

                    {/* Author metadata and verified indicator */}
                    <div className="flex items-center justify-between border-t border-neutral-900/80 pt-4 text-[10px] font-black">
                      <div className="flex items-center gap-2.5 text-neutral-400">
                        <div className="w-5.5 h-5.5 rounded-full bg-neutral-950 border border-neutral-900 flex items-center justify-center overflow-hidden">
                          {review.user?.image ? (
                            <Image src={review.user.image} alt={review.user?.name || 'User'} width={22} height={22} className="object-cover" />
                          ) : (
                            <User className="w-3 h-3 text-neutral-500" />
                          )}
                        </div>
                        <span className="uppercase tracking-widest text-[9px]">{review.user?.name || 'Anonymous Collector'}</span>
                      </div>

                      {review.verifiedPurchase && (
                        <span className="text-emerald-400 flex items-center gap-1 uppercase text-[8.5px] tracking-widest bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1 rounded-lg">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Load More */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingReviews}
                  className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-450 hover:text-white text-[9px] font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all cursor-pointer hover:scale-102 active:scale-98"
                >
                  {loadingReviews ? 'Loading next page...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>


    </div>
  );
}
