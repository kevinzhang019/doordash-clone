'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem } from '@/lib/types';
import { useAuth } from './AuthProvider';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isSidebarOpen: boolean;
  loading: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  addItem: (menuItemId: number) => Promise<{ error?: string; conflictingRestaurant?: string }>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cartItems || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const addItem = async (menuItemId: number): Promise<{ error?: string; conflictingRestaurant?: string }> => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error, conflictingRestaurant: data.conflictingRestaurant };
      }
      await refreshCart();
      return {};
    } catch {
      return { error: 'Failed to add item' };
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      await fetch(`/api/cart/items/${cartItemId}`, { method: 'DELETE' });
      await refreshCart();
    } catch {
      // silent fail
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeItem(cartItemId);
        return;
      }
      await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } catch {
      // silent fail
    }
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      isSidebarOpen, loading,
      openSidebar, closeSidebar,
      addItem, removeItem, updateQuantity, clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
