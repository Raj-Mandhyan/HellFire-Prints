'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  isStreak?: boolean;
}

export default function CyberCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. Respect prefers-reduced-motion
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 2. Disable on touch-first devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Cyberpunk Blue & Cyan palette
    const colors = [
      '#00E5FF', // Neon Cyan
      '#287BFF', // Electric Blue
      '#70A5FF', // Soft Blue
      '#B9F4FF', // Ice Blue
      '#38BDF8', // Cyan 400
    ];

    const particles: Particle[] = [];
    const maxParticles = 35;

    // Smooth interpolated pointer position (lerp)
    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let lastX = -100;
    let lastY = -100;
    let isHoveringInteractive = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (currentX === -100) {
        currentX = mouseX;
        currentY = mouseY;
        lastX = mouseX;
        lastY = mouseY;
      }

      // Check if hovering interactive element for magnetic glow
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], .interactive-glow');
        isHoveringInteractive = Boolean(interactive);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp pointer position
      const dx = mouseX - currentX;
      const dy = mouseY - currentY;
      currentX += dx * 0.45;
      currentY += dy * 0.45;

      const speed = Math.sqrt((currentX - lastX) ** 2 + (currentY - lastY) ** 2);
      lastX = currentX;
      lastY = currentY;

      // Spawn particles when pointer is on screen
      if (mouseX > 0 && mouseY > 0 && particles.length < maxParticles) {
        // Regular trailing particle
        particles.push({
          x: currentX + (Math.random() - 0.5) * 6,
          y: currentY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          size: Math.random() * 3.5 + 1.5,
          alpha: isHoveringInteractive ? 0.95 : 0.8,
          decay: Math.random() * 0.035 + 0.02,
          color: colors[Math.floor(Math.random() * colors.length)],
        });

        // Fast movement streak particle
        if (speed > 8 && particles.length < maxParticles) {
          particles.push({
            x: currentX,
            y: currentY,
            vx: -dx * 0.15 + (Math.random() - 0.5) * 2,
            vy: -dy * 0.15 + (Math.random() - 0.5) * 2,
            size: Math.random() * 2 + 1,
            alpha: 0.9,
            decay: 0.05,
            color: '#B9F4FF',
            isStreak: true,
          });
        }
      }

      // Magnetic subtle glow beneath pointer
      if (mouseX > 0 && mouseY > 0) {
        ctx.save();
        const glowRadius = isHoveringInteractive ? 28 : 16;
        const glowGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, glowRadius);
        glowGradient.addColorStop(0, isHoveringInteractive ? 'rgba(0, 229, 255, 0.45)' : 'rgba(40, 123, 255, 0.25)');
        glowGradient.addColorStop(0.5, 'rgba(40, 123, 255, 0.1)');
        glowGradient.addColorStop(1, 'rgba(40, 123, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update and render particle pool
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size = Math.max(0.5, p.size * 0.97);

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.isStreak ? 8 : p.size * 3;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
