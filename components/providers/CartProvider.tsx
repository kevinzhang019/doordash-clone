'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem } from '@/lib/types';
import { useAuth } from './AuthProvider';

interface SelectionDraft {
  option_id?: number | null;
  name: string;
  price_modifier?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isSidebarOpen: boolean;
  loading: boolean;
  lastAddedItem: CartItem | null;
  clearLastAdded: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  addItem: (menuItemId: number, selections?: SelectionDraft[]) => Promise<{ error?: string; conflictingRestaurant?: string }>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearCartAndAdd: (menuItemId: number, selections?: SelectionDraft[]) => Promise<{ error?: string }>;
  refreshCart: () => Promise<CartItem[]>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);

  const refreshCart = useCallback(async (): Promise<CartItem[]> => {
    if (!user) {
      setCartItems([]);
      return [];
    }
    try {
      setLoading(true);
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        const items: CartItem[] = data.cartItems || [];
        setCartItems(items);
        return items;
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
    return [];
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.effective_price ?? item.price ?? 0) * item.quantity, 0);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const clearLastAdded = () => setLastAddedItem(null);

  const addItem = async (menuItemId: number, selections: SelectionDraft[] = []): Promise<{ error?: string; conflictingRestaurant?: string }> => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, selections }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error, conflictingRestaurant: data.conflictingRestaurant };
      }
      const updatedItems = await refreshCart();
      // Find the most recently added item with this menu item id
      const added = [...updatedItems].reverse().find(item => item.menu_item_id === menuItemId);
      if (added) setLastAddedItem(added);
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

  const clearCart = async () => {
    try {
      await fetch('/api/cart', { method: 'DELETE' });
      setCartItems([]);
    } catch {
      // silent fail
    }
  };

  const clearCartAndAdd = async (menuItemId: number, selections: SelectionDraft[] = []): Promise<{ error?: string }> => {
    await clearCart();
    return addItem(menuItemId, selections);
  };

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      isSidebarOpen, loading,
      lastAddedItem, clearLastAdded,
      openSidebar, closeSidebar,
      addItem, removeItem, updateQuantity, clearCart, clearCartAndAdd,
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
