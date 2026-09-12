'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Maximize2, X, Sparkles } from 'lucide-react';

export const POSTER_SIZE_REFERENCE_IMAGE_URL =
  'https://res.cloudinary.com/qp4fqng8/image/upload/v1788629250/6b551639-3723-4091-8db8-1a66de097cf2.png';

export const POSTER_SIZE_REFERENCE_ALT =
  'Poster size reference showing the relative physical dimensions of A6, A5, A4 and A3 posters.';

interface PosterSizeReferenceProps {
  className?: string;
  compact?: boolean;
  showTitle?: boolean;
}

export default function PosterSizeReference({
  className = '',
  compact = false,
  showTitle = true,
}: PosterSizeReferenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Close lightbox on Esc key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <div className={`w-full ${className}`}>
      {showTitle && (
        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#C1121F] shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-350">
              Understand Poster Sizes
            </span>
          </div>
          <span className="text-[9px] text-neutral-500 font-semibold truncate">
            Click image to enlarge
          </span>
        </div>
      )}

      {/* Interactive Size Card Container */}
      <div
        onClick={() => setIsExpanded(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}
        aria-label="Enlarge poster size comparison chart"
        className={`group relative w-full overflow-hidden rounded-2xl border border-neutral-900 bg-gradient-to-b from-[#121212] to-[#0A0A0A] transition-all duration-300 hover:border-[#C1121F]/50 hover:shadow-lg hover:shadow-red-950/20 cursor-pointer ${
          compact ? 'p-2' : 'p-3'
        }`}
      >
        {/* Aspect-ratio preserving container (1:1 square source) */}
        <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-black/40 flex items-center justify-center">
          <Image
            src={POSTER_SIZE_REFERENCE_IMAGE_URL}
            alt={POSTER_SIZE_REFERENCE_ALT}
            width={1254}
            height={1254}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            priority={false}
          />

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 backdrop-blur-[2px]">
            <div className="p-2.5 rounded-full bg-[#C1121F] text-white shadow-xl shadow-red-950/40 transform -translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
              <Maximize2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
              Tap to Expand
            </span>
          </div>
        </div>

        {/* Supporting Caption */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          <p className="text-[10px] font-medium text-neutral-450 leading-tight">
            See how each poster size compares in real life.
          </p>
          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-neutral-500 shrink-0 ml-2">
            A6 • A5 • A4 • A3
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Poster Size Reference Full View"
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-fadeIn"
        >
          {/* Modal Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#0F0F0F] border border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-900 shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C1121F]" />
                  Understand Poster Sizes
                </h3>
                <p className="text-[11px] text-neutral-400 font-medium">
                  See how each poster size compares in real life.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-[#C1121F] text-neutral-400 hover:text-white transition-all cursor-pointer border border-neutral-800"
                aria-label="Close size reference modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High Resolution Image Container */}
            <div className="relative flex-1 min-h-0 w-full overflow-auto rounded-2xl bg-black/60 flex items-center justify-center p-2">
              <Image
                src={POSTER_SIZE_REFERENCE_IMAGE_URL}
                alt={POSTER_SIZE_REFERENCE_ALT}
                width={1254}
                height={1254}
                sizes="(max-width: 768px) 100vw, 800px"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
                priority
                loading="eager"
              />
            </div>

            {/* Modal Footer Dimension Guide */}
            <div className="mt-3 pt-3 border-t border-neutral-900/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400 font-mono shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 font-bold uppercase">Dimensions:</span>
                <span>A6 (105×148mm)</span>
                <span className="text-neutral-700">•</span>
                <span>A5 (148×210mm)</span>
                <span className="text-neutral-700">•</span>
                <span>A4 (210×297mm)</span>
                <span className="text-neutral-700">•</span>
                <span>A3 (297×420mm)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
