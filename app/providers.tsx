'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import HellfireBackground from '@/components/HellfireBackground';
import CursorTrail from '@/components/CursorTrail';
import LoadingScreen from '@/components/LoadingScreen';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <HellfireBackground />
      <CursorTrail />
      <LoadingScreen />
      {children}
    </CartProvider>
  );
}

export default Providers;

