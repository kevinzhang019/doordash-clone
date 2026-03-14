'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type ActiveOrder = {
  id: number;
  status: string;
  placed_at: string;
  total: number;
  restaurant_name: string;
  delivery_min: number;
  delivery_max: number;
  estimated_delivery_at?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  preparing: 'Preparing Your Order',
  ready: 'Ready for Pickup',
  picked_up: 'On the Way',
  delivered: 'Delivered',
};

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-orange-100 text-orange-700',
  picked_up: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
};

function calcEtaMinutes(order: ActiveOrder): number {
  // Prefer driver's real-time map-based ETA when available
  if (order.estimated_delivery_at) {
    return Math.max(0, Math.round((new Date(order.estimated_delivery_at).getTime() - Date.now()) / 60000));
  }

  // Fallback: estimate from placed_at + restaurant delivery window
  const placedMs = new Date(order.placed_at).getTime();
  const { status, delivery_min, delivery_max } = order;
  if (status === 'placed' || status === 'preparing') {
    return Math.max(0, Math.round((placedMs + delivery_max * 60000 - Date.now()) / 60000));
  }
  if (status === 'ready') return Math.round(delivery_min / 2);
  if (status === 'picked_up') return 10;
  return 0;
}

export default function ActiveOrderCarousel() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/active');
      if (res.status === 401) { setLoaded(true); return; }
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoaded(true);
    }
  };

  const poll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = setTimeout(async () => {
      await fetchOrders();
      poll();
    }, 8000);
  };

  useEffect(() => {
    fetchOrders();
    poll();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || orders.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Active Orders</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {orders.map(order => {
          const etaMins = calcEtaMinutes(order);
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex-shrink-0 snap-start bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-72 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="font-semibold text-gray-900 truncate">{order.restaurant_name}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Order #{order.id} · ${order.total.toFixed(2)}</p>
              {order.status !== 'delivered' && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF3008]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {etaMins <= 1 ? 'Arriving soon' : `~${etaMins} min`}
                  </span>
                </div>
              )}
              <p className="text-xs text-[#FF3008] font-medium mt-3">Track Order →</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
