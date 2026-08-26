'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import OrderCelebration from '@/components/OrderCelebration';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  variantId: string;
  customPosterId?: string | null;
  configuration?: unknown;
  orientation?: string | null;
  sizeName: string;
  frameName: string;
  paperType: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stock: number;
  SKU: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  quantityDiscount?: number;
  couponDiscount?: number;
  totalDiscount?: number;
  shippingFee?: number;
  total: number;
  appliedCoupon?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  couponError?: string;
}

interface CartContextType {
  cart: Cart;
  cartCount: number;
  isLoading: boolean;
  addToCart: (
    productId: string, 
    variantId: string | null, 
    quantity: number, 
    customPoster?: unknown, 
    customPosterId?: string,
    productTitle?: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (cartItemId: string) => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
  triggerOrderConfirmed: (orderId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function playTingSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
    osc.frequency.setValueAtTime(1975.53, ctx.currentTime + 0.08); // B6
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.warn('Audio playback blocked or unsupported:', error);
  }
}

function playOrderConfirmedSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const notes = [1046.50, 1318.51, 2093.00]; // C6, E6, C7 warm triumphant arpeggio
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
      
      const startTime = ctx.currentTime + index * 0.08;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);
      
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (error) {
    console.warn('Audio playback blocked or unsupported:', error);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [activeNotification, setActiveNotification] = useState<{
    id: number;
    title: string;
    type: 'cart' | 'order';
    stage: 'below' | 'middle' | 'fading';
  } | null>(null);

  const timeoutIdsRef = React.useRef<NodeJS.Timeout[]>([]);

  const triggerNotification = useCallback((title: string, type: 'cart' | 'order' = 'cart') => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];

    if (type === 'cart') {
      playTingSound();
    } else {
      playOrderConfirmedSound();
    }

    const id = Date.now();
    setActiveNotification({ id, title, type, stage: 'below' });

    const t1 = setTimeout(() => {
      setActiveNotification(prev => prev && prev.id === id ? { ...prev, stage: 'middle' } : prev);
    }, 50);

    const t2 = setTimeout(() => {
      setActiveNotification(prev => prev && prev.id === id ? { ...prev, stage: 'fading' } : prev);
    }, 1600);

    const t3 = setTimeout(() => {
      setActiveNotification(prev => prev && prev.id === id ? null : prev);
    }, 2200);

    timeoutIdsRef.current = [t1, t2, t3];
  }, []);

  const triggerOrderConfirmed = useCallback((orderId: string) => {
    const formattedId = orderId.substring(orderId.length - 6).toUpperCase();
    triggerNotification(`Order #${formattedId}`, 'order');
  }, [triggerNotification]);

  // Fetch the current cart state from the API
  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to fetch shopping cart state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCart();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshCart]);

  // Compute total item count from cart items
  const cartCount = useMemo(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  // Add item to cart
  const addToCart = useCallback(async (
    productId: string, 
    variantId: string | null, 
    quantity: number, 
    customPoster?: unknown, 
    customPosterId?: string,
    productTitle?: string
  ) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity, customPoster, customPosterId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
        const displayTitle = productTitle || (customPoster ? "Custom Poster" : "Poster");
        triggerNotification(displayTitle);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to add item to cart.' };
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [refreshCart, triggerNotification]);

  // Update quantity
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update item quantity.' };
    } catch (error) {
      console.error('Error updating item quantity:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [refreshCart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to remove item from cart.' };
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [refreshCart]);

  const contextValue = React.useMemo(() => ({
    cart,
    cartCount,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
    triggerOrderConfirmed
  }), [cart, cartCount, isLoading, refreshCart, addToCart, updateQuantity, removeFromCart, triggerOrderConfirmed]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
      {activeNotification && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 bg-[#0A0A0A] border rounded-2xl shadow-2xl transition-all duration-500 ease-out pointer-events-none ${
            activeNotification.type === 'order'
              ? 'border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.25)] px-7 py-4.5'
              : 'border-[#C1121F]/40 shadow-[0_0_30px_rgba(193,18,31,0.25)] px-6 py-4'
          } ${
            activeNotification.stage === 'below'
              ? 'bottom-0 opacity-0 translate-y-12 scale-90'
              : activeNotification.stage === 'middle'
              ? 'bottom-[45%] opacity-100 translate-y-0 scale-100'
              : 'bottom-[45%] opacity-0 -translate-y-8 scale-95'
          }`}
          style={{ transitionProperty: 'opacity, transform, bottom' }}
        >
          {activeNotification.type === 'order' ? (
            <>
              <div className="bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 flex-shrink-0 animate-pulse">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Order Confirmed</h4>
                <p className="text-[10px] text-neutral-455 font-bold uppercase tracking-widest mt-0.5 line-clamp-1">
                  Payment successful. {activeNotification.title} has been placed.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#C1121F]/15 border border-[#C1121F]/30 p-2 rounded-xl text-[#FF4D4D] flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Added to Cart</h4>
                <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[200px] sm:max-w-xs">
                  {activeNotification.title} added successfully
                </p>
              </div>
            </>
          )}
        </div>
      )}
      {activeNotification && activeNotification.type === 'order' && (
        <OrderCelebration />
      )}
    </CartContext.Provider>
  );
}



export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
