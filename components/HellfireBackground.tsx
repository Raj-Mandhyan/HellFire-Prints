'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function HellfireBackground() {
  const pathname = usePathname();

  // Determine intensity based on path (0.0 to 1.0)
  const intensity = useMemo(() => {
    if (pathname === '/') return 0.9;
    if (pathname.startsWith('/admin')) return 0.3;
    if (pathname.startsWith('/checkout')) return 0.4;
    if (pathname.startsWith('/custom-poster')) return 0.4;
    if (pathname.startsWith('/product/')) return 0.6;
    if (pathname.startsWith('/cart')) return 0.5;
    if (pathname.startsWith('/search')) return 0.7;
    if (pathname.startsWith('/account')) return 0.5;
    return 0.5; // default fallback
  }, [pathname]);

  const [particles, setParticles] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  // Generate sparse floating embers for cinematic dark background depth in side-effect block
  useEffect(() => {
    const list = Array.from({ length: 15 }).map((_, i) => {
      const left = `${Math.random() * 90 + 5}%`;
      const size = `${Math.random() * 3 + 2}px`;
      const delay = `${Math.random() * 8}s`;
      const duration = `${Math.random() * 6 + 7}s`;
      // Colors covering Crimson, Ember, Orange, Amber, and gold accents
      const colors = ['#A51C0A', '#C63D0A', '#E85D04', '#F26A1B', '#FF8C1A', '#FFB000'];
      const color = colors[i % colors.length];
      
      return {
        id: i,
        style: {
          left,
          width: size,
          height: size,
          animationDelay: delay,
          animationDuration: duration,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        } as React.CSSProperties,
      };
    });
    
    const frameId = requestAnimationFrame(() => {
      setParticles(list);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-[-50] select-none bg-[#080304]"
      style={{
        '--hellfire-intensity': intensity,
      } as React.CSSProperties}
    >
      {/* Layer 1: Base Black-Red Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#080304] via-[#100506] to-[#180607]"></div>

      {/* Layer 2 & 3: Large Blurred Crimson & Orange Radial Glows */}
      <div 
        className="absolute top-[10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-[#3A0709] blur-[150px] mix-blend-screen transition-all duration-1000 ease-in-out"
        style={{
          opacity: 'calc(var(--hellfire-intensity) * 0.25)',
          animation: 'float-glow-1 22s ease-in-out infinite',
        }}
      ></div>
      
      <div 
        className="absolute bottom-[5%] right-[-10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-[#5C0A0A] blur-[140px] mix-blend-screen transition-all duration-1000 ease-in-out"
        style={{
          opacity: 'calc(var(--hellfire-intensity) * 0.2)',
          animation: 'float-glow-2 26s ease-in-out infinite',
        }}
      ></div>

      <div 
        className="absolute top-[40%] left-[30%] w-[50vw] h-[35vh] max-w-[600px] rounded-full bg-[#E85D04] blur-[180px] mix-blend-screen transition-all duration-1000 ease-in-out"
        style={{
          opacity: 'calc(var(--hellfire-intensity) * 0.08)',
          animation: 'float-glow-1 30s ease-in-out infinite',
        }}
      ></div>

      {/* Layer 4: Cinematic Grid Overlay for structure depth */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(rgba(193,18,31,0.02)_1px,transparent_1px)] bg-[size:32px_32px] transition-all duration-1000"
        style={{
          opacity: 'var(--hellfire-intensity)',
        }}
      ></div>

      {/* Layer 5: Slow-moving light flow overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF8C1A]/2 to-transparent mix-blend-color-dodge transition-all duration-1000"
        style={{
          opacity: 'calc(var(--hellfire-intensity) * 0.4)',
          backgroundSize: '200% 100%',
          animation: 'slow-pan 25s linear infinite',
        }}
      ></div>

      {/* Layer 6: Sparse CSS floating embers */}
      <div 
        className="absolute inset-x-0 bottom-0 top-0 transition-opacity duration-1000 overflow-hidden hide-on-reduced-motion"
        style={{
          opacity: 'calc(var(--hellfire-intensity) * 0.85)',
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-[-10px] rounded-full animate-float-ember opacity-0"
            style={p.style}
          />
        ))}
      </div>
    </div>
  );
}
