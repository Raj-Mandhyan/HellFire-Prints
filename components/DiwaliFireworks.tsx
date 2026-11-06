'use client';

import React, { useEffect, useRef } from 'react';

interface FireworkRocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  secondaryColor: string;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  twinklePhase: number;
  trail: Array<{ x: number; y: number }>;
  layer: 'core' | 'outer' | 'glitter';
}

const FESTIVE_PALETTES: Array<[string, string]> = [
  ['#FFD700', '#FFF3B0'], // Electric Gold & White Heat
  ['#FCBF49', '#FF7B00'], // Warm Amber & Rich Saffron
  ['#FF4D4D', '#FFD700'], // Fiery Crimson & Gold
  ['#00E5FF', '#FFD700'], // Cyber Cyan & Gold
  ['#A855F7', '#FCBF49'], // Royal Violet & Amber
  ['#FF9E00', '#FFE3A8'], // Festival Marigold & Champagne Gold
];

interface DiwaliFireworksProps {
  className?: string;
  intensity?: 'subtle' | 'hero' | 'celebration';
  burstTrigger?: number;
}

export default function DiwaliFireworks({
  className = '',
  intensity = 'subtle',
  burstTrigger = 0,
}: DiwaliFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const triggerExplosionRef = useRef<((customX?: number, customY?: number) => void) | null>(null);

  useEffect(() => {
    if (burstTrigger > 0 && triggerExplosionRef.current) {
      triggerExplosionRef.current();
    }
  }, [burstTrigger]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rockets: FireworkRocket[] = [];
    let particles: FireworkParticle[] = [];
    let isDocumentVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resize = () => {
      const parent = canvas.parentElement;
      if (intensity === 'hero' && parent) {
        canvas.width = parent.clientWidth || window.innerWidth;
        canvas.height = parent.clientHeight || 650;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const explodeAt = (x: number, y: number, primaryColor: string, secondaryColor: string) => {
      const isMobile = window.innerWidth < 768;
      const baseCount =
        intensity === 'celebration'
          ? isMobile ? 48 : 76
          : intensity === 'hero'
          ? isMobile ? 36 : 58
          : isMobile ? 26 : 42;

      // 1. Outer Ring Burst
      for (let i = 0; i < baseCount; i++) {
        const angle = (Math.PI * 2 * i) / baseCount + (Math.random() - 0.5) * 0.15;
        const speed = 2.2 + Math.random() * 4.8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: i % 3 === 0 ? secondaryColor : primaryColor,
          size: 1.6 + Math.random() * 1.8,
          alpha: 1,
          decay: 0.011 + Math.random() * 0.01,
          gravity: 0.045,
          drag: 0.968,
          twinklePhase: Math.random() * Math.PI * 2,
          trail: [],
          layer: 'outer',
        });
      }

      // 2. Inner Golden Core Chrysanthemum Ring
      const innerCount = Math.floor(baseCount * 0.45);
      for (let i = 0; i < innerCount; i++) {
        const angle = (Math.PI * 2 * i) / innerCount;
        const speed = 1.0 + Math.random() * 2.1;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: '#FFF3B0',
          size: 1.3 + Math.random() * 1.2,
          alpha: 1,
          decay: 0.016 + Math.random() * 0.012,
          gravity: 0.03,
          drag: 0.96,
          twinklePhase: Math.random() * Math.PI * 2,
          trail: [],
          layer: 'core',
        });
      }

      // 3. Sparkling Micro-Glitter Crackle
      const glitterCount = Math.floor(baseCount * 0.35);
      for (let i = 0; i < glitterCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 5.6;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: '#FFD700',
          size: 1.1,
          alpha: 0.95,
          decay: 0.014 + Math.random() * 0.014,
          gravity: 0.06,
          drag: 0.95,
          twinklePhase: Math.random() * Math.PI * 2,
          trail: [],
          layer: 'glitter',
        });
      }
    };

    const launchRocket = (customX?: number, customTargetY?: number) => {
      if (!isDocumentVisible || canvas.width === 0) return;
      const palette = FESTIVE_PALETTES[Math.floor(Math.random() * FESTIVE_PALETTES.length)];
      const startX = customX ?? canvas.width * (0.12 + Math.random() * 0.76);
      const startY = canvas.height + 10;
      const targetY = customTargetY ?? canvas.height * (0.14 + Math.random() * 0.38);
      const distanceY = startY - targetY;
      const vy = -Math.sqrt(2 * 0.14 * distanceY) * (0.92 + Math.random() * 0.12);

      rockets.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.4,
        vy: Math.min(-7.5, vy),
        targetY,
        color: palette[0],
        secondaryColor: palette[1],
        trail: [],
      });
    };

    triggerExplosionRef.current = (customX?: number, customY?: number) => {
      const palette = FESTIVE_PALETTES[Math.floor(Math.random() * FESTIVE_PALETTES.length)];
      const bx = customX ?? canvas.width * (0.2 + Math.random() * 0.6);
      const by = customY ?? canvas.height * (0.18 + Math.random() * 0.35);
      explodeAt(bx, by, palette[0], palette[1]);
    };

    // Initial celebratory bursts
    const initTimeout1 = setTimeout(() => {
      launchRocket(canvas.width * 0.25, canvas.height * 0.28);
    }, 250);
    const initTimeout2 = setTimeout(() => {
      launchRocket(canvas.width * 0.75, canvas.height * 0.24);
    }, 750);

    const intervalMs =
      intensity === 'celebration' ? 950 : intensity === 'hero' ? 1850 : 3200;

    const launchInterval = setInterval(() => {
      if (isDocumentVisible && particles.length < 320) {
        launchRocket();
      }
    }, intervalMs);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & draw ascending rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y, alpha: 0.85 });
        if (r.trail.length > 10) r.trail.shift();

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.13; // gravity slowing ascent

        // Draw rocket comet trail
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          const ratio = (t + 1) / r.trail.length;
          ctx.save();
          ctx.globalAlpha = ratio * 0.55;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5 * ratio, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw rocket head
        ctx.save();
        ctx.fillStyle = '#FFF3B0';
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.y <= r.targetY || r.vy >= -1.2) {
          explodeAt(r.x, r.y, r.color, r.secondaryColor);
          rockets.splice(i, 1);
        }
      }

      // Update & draw explosion particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.alpha -= p.decay;
        p.twinklePhase += 0.28;

        if (p.alpha <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        const twinkleMultiplier =
          p.layer === 'glitter' ? 0.45 + 0.55 * Math.sin(p.twinklePhase) : 0.8 + 0.2 * Math.sin(p.twinklePhase);

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha * twinkleMultiplier);

        // Draw sparkling trail line
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y);
          }
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.65;
          ctx.stroke();
        }

        // Draw glowing particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.layer === 'core' ? 10 : 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(initTimeout1);
      clearTimeout(initTimeout2);
      clearInterval(launchInterval);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      rockets = [];
      particles = [];
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

