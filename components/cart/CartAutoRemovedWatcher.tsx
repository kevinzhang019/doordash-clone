'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CartAutoRemovedWatcher() {
  const { autoRemovedItems, clearAutoRemovedItems } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (autoRemovedItems.length === 0) return;
    if (user?.role !== 'customer') {
      clearAutoRemovedItems();
      return;
    }

    const restaurantId = autoRemovedItems[0].restaurant_id;
    const params = new URLSearchParams();
    autoRemovedItems.forEach(item => params.append('removedItem', item.item_name));

    clearAutoRemovedItems();
    router.push(`/restaurants/${restaurantId}?${params.toString()}`);
  }, [autoRemovedItems, clearAutoRemovedItems, user, router]);

  return null;
}
