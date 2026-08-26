'use client';

import React, { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 2. Disable on mobile/touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Re-size listener
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      color: string;
    }

    const particles: Particle[] = [];
    const maxParticles = 20;

    // Color choices: fiery red, glowing orange, warm yellow
    const colors = [
      'rgba(193, 18, 31, 0.85)',  // #C1121F
      'rgba(255, 77, 77, 0.85)',  // #FF4D4D
      'rgba(247, 127, 0, 0.85)',  // Orange
      'rgba(252, 191, 73, 0.85)', // Yellow
    ];

    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Spawn a particle
      if (particles.length < maxParticles) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5, // slight float upwards
          size: Math.random() * 4 + 2, // 2px to 6px
          alpha: 1,
          decay: Math.random() * 0.03 + 0.015, // life duration: ~30-60 frames
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw glowing ember particle
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        // Add subtle radial glow filter
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
