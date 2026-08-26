'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  fiery?: boolean;
  staggerDelay?: number; // delay in ms
  threshold?: number;
  rootMargin?: string;
}

export default function ScrollReveal({
  children,
  className = '',
  fiery = true,
  staggerDelay = 0,
  threshold = 0.05,
  rootMargin = '0px 0px -10% 0px',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const animFrame = requestAnimationFrame(() => {
      setMounted(true);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setRevealed(true);
      }
    });
    
    // Respect system prefers-reduced-motion preferences immediately
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return () => cancelAnimationFrame(animFrame);
    }

    const element = ref.current;
    if (!element) return () => cancelAnimationFrame(animFrame);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);
    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // Support SSR/no-JS: render normally on the server to preserve SEO and screen reader accessibility.
  // Once hydrated on client, we attach the scroll reveal hidden state.
  const revealClass = mounted
    ? `scroll-reveal ${revealed ? 'revealed' : ''} ${fiery && revealed ? 'fiery-reveal' : ''}`
    : '';

  const style: React.CSSProperties = staggerDelay > 0 && revealed
    ? { transitionDelay: `${staggerDelay}ms`, animationDelay: `${staggerDelay}ms` }
    : {};

  return (
    <div
      ref={ref}
      className={`${revealClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
