'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CartItem } from '@/lib/types';
import { useAuth } from './AuthProvider';

interface SelectionDraft {
  option_id?: number | null;
  name: string;
  price_modifier?: number;
}

interface GuestCartItem {
  id: number;
  menu_item_id: number;
  restaurant_id: number;
  restaurant_name: string;
  name: string;
  price: number;
  image_url?: string | null;
  quantity: number;
  selections: SelectionDraft[];
  special_requests: string;
}

const GUEST_CART_KEY = 'guest_cart';

function readGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]): void {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function guestToCartItems(items: GuestCartItem[]): CartItem[] {
  return items.map(item => ({
    id: item.id,
    user_id: 0,
    restaurant_id: item.restaurant_id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    name: item.name,
    price: item.price,
    image_url: item.image_url ?? undefined,
    restaurant_name: item.restaurant_name,
    selections: item.selections.map((s, i) => ({
      id: i,
      cart_item_id: item.id,
      option_id: s.option_id ?? null,
      name: s.name,
      price_modifier: s.price_modifier ?? 0,
    })),
    effective_price: item.price + item.selections.reduce((sum, s) => sum + (s.price_modifier ?? 0), 0),
    special_requests: item.special_requests || null,
  }));
}

function normalizeSels(sels: SelectionDraft[]) {
  return [...sels]
    .map(s => ({ option_id: s.option_id ?? null, name: s.name?.trim() ?? '', price_modifier: s.price_modifier ?? 0 }))
    .sort((a, b) => (a.option_id ?? 0) - (b.option_id ?? 0) || a.name.localeCompare(b.name));
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  isSidebarOpen: boolean;
  loading: boolean;
  lastAddedItem: CartItem | null;
  reorderSkipped: string[];
  clearLastAdded: () => void;
  setReorderSkipped: (items: string[]) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  addItem: (menuItemId: number, selections?: SelectionDraft[], specialRequests?: string) => Promise<{ error?: string; conflictingRestaurant?: string }>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearCartAndAdd: (menuItemId: number, selections?: SelectionDraft[], specialRequests?: string) => Promise<{ error?: string }>;
  refreshCart: () => Promise<CartItem[]>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [reorderSkipped, setReorderSkipped] = useState<string[]>([]);

  // Tracks whether auth resolved with no user (confirmed guest session)
  const wasGuestRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      wasGuestRef.current = true;
      setCartItems(guestToCartItems(readGuestCart()));
      setLoading(false);
      return;
    }

    const wasGuest = wasGuestRef.current;
    wasGuestRef.current = false;

    (async () => {
      // If transitioning from guest to logged-in, wipe server cart and replace with guest cart
      if (wasGuest) {
        const guestItems = readGuestCart();
        if (guestItems.length > 0) {
          setLoading(true);
          // Always wipe existing server cart first
          await fetch('/api/cart', { method: 'DELETE' });
          for (const item of guestItems) {
            await fetch('/api/cart/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                menuItemId: item.menu_item_id,
                selections: item.selections,
                specialRequests: item.special_requests,
                quantity: item.quantity,
              }),
            });
          }
          writeGuestCart([]);
        }
      }

      setLoading(true);
      try {
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
    })();
  }, [user, authLoading]);

  const refreshCart = useCallback(async (): Promise<CartItem[]> => {
    if (!user) {
      const items = guestToCartItems(readGuestCart());
      setCartItems(items);
      return items;
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

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.effective_price ?? item.price ?? 0) * item.quantity, 0);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => { setIsSidebarOpen(false); setReorderSkipped([]); };
  const clearLastAdded = () => setLastAddedItem(null);

  const addItem = async (menuItemId: number, selections: SelectionDraft[] = [], specialRequests = ''): Promise<{ error?: string; conflictingRestaurant?: string }> => {
    if (!user) {
      // Guest mode: store in localStorage
      try {
        const res = await fetch(`/api/menu-items/${menuItemId}`);
        if (!res.ok) return { error: 'Item not found' };
        const { item: menuItem } = await res.json();

        if (!menuItem.is_available) return { error: 'Item is not available' };

        const guestCart = readGuestCart();

        // Check restaurant conflict
        if (guestCart.length > 0 && guestCart[0].restaurant_id !== menuItem.restaurant_id) {
          return { conflictingRestaurant: guestCart[0].restaurant_name };
        }

        const newSels = normalizeSels(selections);
        const specialRequestsStr = specialRequests.trim();

        // Check for duplicate (same item + same selections + same special requests)
        const existingIdx = guestCart.findIndex(item => {
          if (item.menu_item_id !== menuItemId) return false;
          if ((item.special_requests || '') !== specialRequestsStr) return false;
          return JSON.stringify(normalizeSels(item.selections)) === JSON.stringify(newSels);
        });

        if (existingIdx >= 0) {
          guestCart[existingIdx].quantity += 1;
        } else {
          const nextId = guestCart.length === 0 ? 1 : Math.max(...guestCart.map(i => i.id)) + 1;
          guestCart.push({
            id: nextId,
            menu_item_id: menuItemId,
            restaurant_id: menuItem.restaurant_id,
            restaurant_name: menuItem.restaurant_name,
            name: menuItem.name,
            price: menuItem.price,
            image_url: menuItem.image_url,
            quantity: 1,
            selections: newSels,
            special_requests: specialRequestsStr,
          });
        }

        writeGuestCart(guestCart);
        const updatedItems = guestToCartItems(guestCart);
        setCartItems(updatedItems);
        const added = [...updatedItems].reverse().find(item => item.menu_item_id === menuItemId);
        if (added) setLastAddedItem(added);
        return {};
      } catch {
        return { error: 'Failed to add item' };
      }
    }

    // Authenticated mode
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, selections, specialRequests }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error, conflictingRestaurant: data.conflictingRestaurant };
      }
      const updatedItems = await refreshCart();
      const added = [...updatedItems].reverse().find(item => item.menu_item_id === menuItemId);
      if (added) setLastAddedItem(added);
      return {};
    } catch {
      return { error: 'Failed to add item' };
    }
  };

  const removeItem = async (cartItemId: number) => {
    if (!user) {
      const updated = readGuestCart().filter(item => item.id !== cartItemId);
      writeGuestCart(updated);
      setCartItems(guestToCartItems(updated));
      return;
    }
    try {
      await fetch(`/api/cart/items/${cartItemId}`, { method: 'DELETE' });
      await refreshCart();
    } catch {
      // silent fail
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    if (!user) {
      if (quantity < 1) {
        await removeItem(cartItemId);
        return;
      }
      const guestCart = readGuestCart();
      const idx = guestCart.findIndex(item => item.id === cartItemId);
      if (idx >= 0) {
        guestCart[idx].quantity = quantity;
        writeGuestCart(guestCart);
        setCartItems(guestToCartItems(guestCart));
      }
      return;
    }
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
    if (!user) {
      writeGuestCart([]);
      setCartItems([]);
      return;
    }
    try {
      await fetch('/api/cart', { method: 'DELETE' });
      setCartItems([]);
    } catch {
      // silent fail
    }
  };

  const clearCartAndAdd = async (menuItemId: number, selections: SelectionDraft[] = [], specialRequests = ''): Promise<{ error?: string }> => {
    await clearCart();
    return addItem(menuItemId, selections, specialRequests);
  };

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      isSidebarOpen, loading,
      lastAddedItem, reorderSkipped,
      clearLastAdded, setReorderSkipped,
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
