'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type OrderItem = { name: string; quantity: number; price: number };

type Order = {
  id: number;
  status: string;
  subtotal: number;
  discount_saved: number;
  placed_at: string;
  customer_name: string;
  items: OrderItem[];
};

export default function NewOrderNotification() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadOrders, setUnreadOrders] = useState<Order[]>([]);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnOrdersPageRef = useRef(false);

  const isOnOrdersPage =
    pathname === '/restaurant-dashboard/orders' ||
    pathname.startsWith('/restaurant-dashboard/orders/');

  // Keep ref in sync with latest value so async callbacks don't use stale closures
  useEffect(() => {
    isOnOrdersPageRef.current = isOnOrdersPage;
    if (isOnOrdersPage) {
      setUnreadOrders([]);
    }
  }, [isOnOrdersPage]);

  const fetchAndCheck = async (notifyNew: boolean) => {
    try {
      const res = await fetch('/api/restaurant-dashboard/orders');
      if (!res.ok) return;
      const data = await res.json();
      const orders: Order[] = data.orders ?? [];

      if (!notifyNew) {
        // Initial load — just populate seen IDs, no notification
        orders.forEach(o => seenIdsRef.current.add(o.id));
        return;
      }

      const newOrders: Order[] = [];
      for (const order of orders) {
        if (!seenIdsRef.current.has(order.id)) {
          seenIdsRef.current.add(order.id);
          if (order.status === 'placed') {
            newOrders.push(order);
          }
        }
      }

      if (newOrders.length > 0 && !isOnOrdersPageRef.current) {
        setUnreadOrders(prev => [...newOrders, ...prev]);
      }
    } catch { /* ignore */ }
  };

  const scheduleNextPoll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = setTimeout(async () => {
      await fetchAndCheck(true);
      scheduleNextPoll();
    }, 5000);
  };

  useEffect(() => {
    fetchAndCheck(false).finally(() => scheduleNextPoll());
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (unreadOrders.length === 0 || isOnOrdersPage) return null;

  const latest = unreadOrders[0];
  const extraCount = unreadOrders.length - 1;
  const paidTotal = Math.max(0, latest.subtotal - (latest.discount_saved ?? 0));

  const handleClick = () => {
    setUnreadOrders([]);
    router.push('/restaurant-dashboard/orders');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUnreadOrders([]);
  };

  return (
    <div className="fixed top-20 right-4 z-50 w-80 animate-slide-in-right">
      <div
        onClick={handleClick}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow"
      >
        {/* Header */}
        <div className="bg-[#FF3008] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-base">🔔</span>
            <span className="text-white font-semibold text-sm">New Order!</span>
          </div>
          <div className="flex items-center gap-2">
            {extraCount > 0 && (
              <span className="bg-white text-[#FF3008] text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                +{extraCount}
              </span>
            )}
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="font-semibold text-gray-900 text-sm">
            Order #{latest.id} — {latest.customer_name}
          </p>
          <div className="mt-1.5 space-y-0.5">
            {latest.items.slice(0, 3).map((item, i) => (
              <p key={i} className="text-xs text-gray-600">
                {item.quantity}× {item.name}
              </p>
            ))}
            {latest.items.length > 3 && (
              <p className="text-xs text-gray-400">
                +{latest.items.length - 3} more item{latest.items.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {new Date(latest.placed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-sm font-bold text-gray-900">${paidTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-[#FF3008] font-medium text-center">Tap to view orders →</p>
        </div>
      </div>
    </div>
  );
}
