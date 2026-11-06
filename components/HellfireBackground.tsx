'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function HellfireBackground() {
  const pathname = usePathname() || '/';
  const isAdminRoute = pathname.startsWith('/admin');

  // Determine intensity based on path (0.0 to 1.0) — matches original pre-Diwali design
  const intensity = useMemo(() => {
    if (pathname === '/') return 0.9;
    if (pathname.startsWith('/admin')) return 0.3;
    if (pathname.startsWith('/checkout')) return 0.4;
    if (pathname.startsWith('/custom-poster')) return 0.4;
    if (pathname.startsWith('/product/')) return 0.6;
    if (pathname.startsWith('/cart')) return 0.5;
    if (pathname.startsWith('/search')) return 0.7;
    if (pathname.startsWith('/account')) return 0.5;
    return 0.5;
  }, [pathname]);

  const [particles, setParticles] = useState<{ id: number; style: React.CSSProperties }[]>([]);

  // Generate sparse floating embers for original background depth
  useEffect(() => {
    const list = Array.from({ length: 15 }).map((_, i) => {
      const left = `${Math.random() * 90 + 5}%`;
      const size = `${Math.random() * 3 + 2}px`;
      const delay = `${Math.random() * 8}s`;
      const duration = `${Math.random() * 6 + 7}s`;
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

  // =========================================================================
  // ADMIN ROUTES: Original Pre-Diwali Background (z-[-50], no Diwali overlays)
  // =========================================================================
  if (isAdminRoute) {
    return (
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none z-[-50] select-none bg-[#080304]"
        style={
          {
            '--hellfire-intensity': intensity,
          } as React.CSSProperties
        }
        aria-hidden="true"
      >
        {/* Layer 1: Base Black-Red Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#080304] via-[#100506] to-[#180607]" />

        {/* Layer 2 & 3: Large Blurred Crimson & Orange Radial Glows */}
        <div
          className="absolute top-[10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-[#3A0709] blur-[150px] mix-blend-screen transition-all duration-1000 ease-in-out"
          style={{
            opacity: 'calc(var(--hellfire-intensity) * 0.25)',
            animation: 'float-glow-1 22s ease-in-out infinite',
          }}
        />

        <div
          className="absolute bottom-[5%] right-[-10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-[#5C0A0A] blur-[140px] mix-blend-screen transition-all duration-1000 ease-in-out"
          style={{
            opacity: 'calc(var(--hellfire-intensity) * 0.2)',
            animation: 'float-glow-2 26s ease-in-out infinite',
          }}
        />

        <div
          className="absolute top-[40%] left-[30%] w-[50vw] h-[35vh] max-w-[600px] rounded-full bg-[#E85D04] blur-[180px] mix-blend-screen transition-all duration-1000 ease-in-out"
          style={{
            opacity: 'calc(var(--hellfire-intensity) * 0.08)',
            animation: 'float-glow-1 30s ease-in-out infinite',
          }}
        />

        {/* Layer 4: Cinematic Grid Overlay for structure depth */}
        <div
          className="absolute inset-0 bg-[radial-gradient(rgba(193,18,31,0.02)_1px,transparent_1px)] bg-[size:32px_32px] transition-all duration-1000"
          style={{
            opacity: 'var(--hellfire-intensity)',
          }}
        />

        {/* Layer 5: Slow-moving light flow overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF8C1A]/2 to-transparent mix-blend-color-dodge transition-all duration-1000"
          style={{
            opacity: 'calc(var(--hellfire-intensity) * 0.4)',
            backgroundSize: '200% 100%',
            animation: 'slow-pan 25s linear infinite',
          }}
        />

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

  // =========================================================================
  // CUSTOMER-FACING ROUTES: Festive Diwali 2026 Ambient Background (z-[-50])
  // =========================================================================
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-[-50]"
      aria-hidden="true"
    >
      {/* 1. Deep Obsidian Base (Preserved Original) */}
      <div className="absolute inset-0 bg-[#080304]" />

      {/* 2. Atmospheric Radial Glows (Preserved Original Crimson & Fiery Orange) */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(circle at 50% 0%, rgba(193, 18, 31, 0.28) 0%, rgba(120, 10, 18, 0.12) 40%, transparent 75%),
            radial-gradient(circle at 12% 38%, rgba(247, 127, 0, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 88% 62%, rgba(193, 18, 31, 0.24) 0%, transparent 60%),
            radial-gradient(circle at 50% 100%, rgba(252, 191, 73, 0.14) 0%, rgba(193, 18, 31, 0.16) 35%, transparent 70%)
          `,
        }}
      />

      {/* 2B. Festive Diwali 2026 Ambient Colour Layers (Electric Gold, Rich Saffron, Deep Purple & Cyber Blue) */}
      <div
        className="absolute inset-0 opacity-75 animate-diwali-aura"
        style={{
          background: `
            radial-gradient(circle at 22% 18%, rgba(255, 215, 0, 0.11) 0%, rgba(255, 140, 0, 0.05) 35%, transparent 65%),
            radial-gradient(circle at 78% 22%, rgba(124, 58, 237, 0.12) 0%, rgba(0, 229, 255, 0.05) 40%, transparent 65%),
            radial-gradient(circle at 50% 48%, rgba(252, 191, 73, 0.07) 0%, transparent 60%),
            radial-gradient(circle at 18% 82%, rgba(109, 40, 217, 0.10) 0%, transparent 55%),
            radial-gradient(circle at 84% 85%, rgba(255, 183, 3, 0.12) 0%, rgba(247, 127, 0, 0.06) 35%, transparent 65%)
          `,
        }}
      />

      {/* 3. Subtle Tech/Grid Overlay (Preserved Original) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 4. Animated Ambient Heat Blobs (Preserved Original) */}
      <div className="absolute -top-32 left-1/3 w-[550px] h-[550px] rounded-full bg-[#C1121F]/20 blur-[140px] animate-hellfire-pulse" />
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-[#f77f00]/15 blur-[130px] animate-hellfire-pulse-slow" />
      <div className="absolute -bottom-40 left-1/4 w-[650px] h-[450px] rounded-full bg-[#C1121F]/22 blur-[150px] animate-hellfire-pulse" />

      {/* 4B. Festive Golden & Royal Violet Light Reflections */}
      <div className="absolute top-16 right-1/4 w-[420px] h-[420px] rounded-full bg-[#FFD700]/10 blur-[150px] animate-hellfire-pulse-slow" />
      <div className="absolute bottom-1/4 left-12 w-[380px] h-[380px] rounded-full bg-purple-600/10 blur-[140px] animate-hellfire-pulse" />

      {/* 5. Floating Embers & Golden Diwali Sparks */}
      <div className="absolute inset-0 overflow-hidden">
        <span className="hellfire-ember left-[8%] w-1.5 h-1.5 bg-[#fcbf49] rounded-full shadow-[0_0_10px_#f77f00]" style={{ animationDuration: '9s', animationDelay: '0s' }} />
        <span className="hellfire-ember left-[18%] w-2 h-2 bg-[#C1121F] rounded-full shadow-[0_0_12px_#C1121F]" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <span className="hellfire-ember left-[29%] w-1 h-1 bg-[#f77f00] rounded-full shadow-[0_0_8px_#f77f00]" style={{ animationDuration: '8s', animationDelay: '4s' }} />
        <span className="hellfire-ember left-[42%] w-2 h-2 bg-[#fcbf49] rounded-full shadow-[0_0_14px_#fcbf49]" style={{ animationDuration: '11s', animationDelay: '1s' }} />
        <span className="hellfire-ember left-[55%] w-1.5 h-1.5 bg-[#C1121F] rounded-full shadow-[0_0_10px_#C1121F]" style={{ animationDuration: '10s', animationDelay: '3.5s' }} />
        <span className="hellfire-ember left-[68%] w-1 h-1 bg-[#fcbf49] rounded-full shadow-[0_0_8px_#f77f00]" style={{ animationDuration: '7.5s', animationDelay: '5s' }} />
        <span className="hellfire-ember left-[77%] w-2 h-2 bg-[#f77f00] rounded-full shadow-[0_0_12px_#f77f00]" style={{ animationDuration: '13s', animationDelay: '0.5s' }} />
        <span className="hellfire-ember left-[88%] w-1.5 h-1.5 bg-[#C1121F] rounded-full shadow-[0_0_10px_#C1121F]" style={{ animationDuration: '9.5s', animationDelay: '2.5s' }} />
        <span className="hellfire-ember left-[94%] w-1 h-1 bg-[#fcbf49] rounded-full shadow-[0_0_8px_#fcbf49]" style={{ animationDuration: '8.5s', animationDelay: '6s' }} />
        {/* Additional Golden & Cyber-Saffron Festive Sparks */}
        <span className="hellfire-ember left-[14%] w-1.5 h-1.5 bg-[#FFD700] rounded-full shadow-[0_0_14px_#FFD700]" style={{ animationDuration: '10.5s', animationDelay: '1.5s' }} />
        <span className="hellfire-ember left-[36%] w-1 h-1 bg-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]" style={{ animationDuration: '11.5s', animationDelay: '3s' }} />
        <span className="hellfire-ember left-[62%] w-1.5 h-1.5 bg-[#FFD700] rounded-full shadow-[0_0_14px_#FFD700]" style={{ animationDuration: '9s', animationDelay: '4.5s' }} />
        <span className="hellfire-ember left-[83%] w-1.5 h-1.5 bg-[#FF9E00] rounded-full shadow-[0_0_12px_#FF9E00]" style={{ animationDuration: '10s', animationDelay: '1.2s' }} />
      </div>
    </div>
  );
}
