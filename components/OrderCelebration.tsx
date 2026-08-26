'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  decay: number;
  gravity: number;
  drag: number;
  rotation?: number;
  rotationSpeed?: number;
  type: 'confetti' | 'ember' | 'spark';
}

const FIERY_COLORS = [
  '#C1121F', // Fire Red
  '#FF4D4D', // Crimson
  '#FF8C00', // Dark Orange
  '#FCBF49', // Amber Gold
  '#FFD700', // Bright Gold
  '#FFE3A8', // White Heat Gold
];

export default function OrderCelebration() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Accessibility check - check for reduced motion settings
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const timeouts: NodeJS.Timeout[] = [];

    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle factory helper
    const createExplosion = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 3 + Math.random() * 9;
        const color = FIERY_COLORS[Math.floor(Math.random() * FIERY_COLORS.length)];
        const size = 3 + Math.random() * 5;
        const typeRand = Math.random();
        const type = typeRand < 0.35 ? 'confetti' : typeRand < 0.7 ? 'spark' : 'ember';

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color,
          size,
          opacity: 1,
          decay: 0.012 + Math.random() * 0.015,
          gravity: 0.12 + Math.random() * 0.08,
          drag: 0.95,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          type,
        });
      }
    };

    const createSprinkler = (x: number, y: number, angleRange: [number, number], count: number) => {
      for (let i = 0; i < count; i++) {
        // Map angle between ranges
        const angle = angleRange[0] + Math.random() * (angleRange[1] - angleRange[0]);
        const velocity = 10 + Math.random() * 10;
        const color = FIERY_COLORS[Math.floor(Math.random() * FIERY_COLORS.length)];
        const size = 3.5 + Math.random() * 4.5;
        const typeRand = Math.random();
        const type = typeRand < 0.4 ? 'confetti' : typeRand < 0.75 ? 'spark' : 'ember';

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color,
          size,
          opacity: 1,
          decay: 0.01 + Math.random() * 0.012,
          gravity: 0.26 + Math.random() * 0.06, // Higher gravity for sprinkler parabolic arcing
          drag: 0.975,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          type,
        });
      }
    };

    const createDriftingEmbers = (width: number, count: number) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: -10 - Math.random() * 30,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1 + Math.random() * 2,
          color: FIERY_COLORS[Math.floor(Math.random() * FIERY_COLORS.length)],
          size: 1.5 + Math.random() * 2.5,
          opacity: 0.8,
          decay: 0.004 + Math.random() * 0.005,
          gravity: 0.02,
          drag: 0.99,
          type: 'ember',
        });
      }
    };

    // Scheduled simulation stages
    // 150ms: central cracker burst (centered near the Order Confirmed overlay)
    const t1 = setTimeout(() => {
      createExplosion(canvas.width / 2, canvas.height * 0.45, 120);
    }, 150);

    // 350ms: secondary left/right sprinkler bursts arcing inwards
    const t2 = setTimeout(() => {
      // Left sprinkler shoots up and right: -40 to -65 deg
      createSprinkler(canvas.width * 0.15, canvas.height * 0.75, [-Math.PI * 0.36, -Math.PI * 0.22], 65);
      // Right sprinkler shoots up and left: -115 to -140 deg
      createSprinkler(canvas.width * 0.85, canvas.height * 0.75, [-Math.PI * 0.78, -Math.PI * 0.64], 65);
    }, 350);

    // 600ms-900ms: drift ambient falling embers from the top viewport
    const t3 = setTimeout(() => {
      createDriftingEmbers(canvas.width, 35);
    }, 600);
    const t4 = setTimeout(() => {
      createDriftingEmbers(canvas.width, 25);
    }, 950);

    timeouts.push(t1, t2, t3, t4);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Loop particles in reverse to safely delete inline
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.opacity -= p.decay;
        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }

        // Remove decayed particles
        if (p.opacity <= 0 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle based on type
        ctx.save();
        ctx.globalAlpha = p.opacity;

        if (p.type === 'confetti' && p.rotation !== undefined) {
          // Draw rotating confetti strips
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        } else {
          // Draw bright circular sparks/embers
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          
          if (p.type === 'ember') {
            ctx.shadowBlur = p.size * 2.5;
            ctx.shadowColor = p.color;
          }
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      timeouts.forEach(clearTimeout);
      particles = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-40"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
