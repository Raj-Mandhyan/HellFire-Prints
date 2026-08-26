'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
}

export default function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }

  // Fallback Visual Component matching Hellfire Prints brand guidelines (Dark, Premium, Crimson brand colors)
  const renderFallback = () => {
    const isFillMode = !!props.fill;

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F0F0F] via-[#161616] to-[#0A0A0A] border border-neutral-900 text-neutral-500 rounded-3xl select-none p-4 relative overflow-hidden transition-all duration-300 hover:border-[#C1121F]/40 ${
          isFillMode ? 'absolute inset-0 w-full h-full' : 'w-full h-full min-h-[120px]'
        } ${className || ''}`}
      >
        {/* Brand accent atmospheric ambient glow */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-neutral-950/20 blur-3xl pointer-events-none"></div>

        {/* Blueprint-style layout mesh overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

        <div className="relative flex flex-col items-center justify-center z-10">
          <ImageIcon className="w-8 h-8 text-[#C1121F]/70 mb-2 animate-pulse" />
          <span className="text-[10px] uppercase font-black tracking-widest text-[#FF4D4D]/75 text-center leading-none">
            HELLFIRE PRINTS
          </span>
          <span className="text-[8px] uppercase tracking-wider text-neutral-600 font-bold text-center mt-1.5 leading-none">
            Artwork Unavailable
          </span>
        </div>
      </div>
    );
  };

  if (hasError || !src) {
    return renderFallback();
  }

  // Parse host to determine if Next.js image optimization can be applied
  let isOptimized = false;
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    isOptimized = host === 'res.cloudinary.com' || host === 'images.unsplash.com';
  } catch {
    // Malformed URL, immediately render the brand fallback
    return renderFallback();
  }

  // Next.js components require local paths to be absolute/relative, check if src is a protocol URL
  const srcString = String(src);
  const isRemote = srcString.startsWith('http://') || srcString.startsWith('https://');

  return (
    <Image
      src={src}
      alt={alt || 'Hellfire Prints artwork'}
      className={className}
      onError={() => setHasError(true)}
      unoptimized={isRemote ? !isOptimized : false}
      {...props}
    />
  );
}
