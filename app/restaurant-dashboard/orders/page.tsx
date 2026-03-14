'use client';

import { useEffect, useRef, useState } from 'react';

type OrderItem = { name: string; quantity: number; price: number };

type ActiveOrder = {
  id: number;
  status: string;
  subtotal: number;
  total: number;
  delivery_fee: number;
  placed_at: string;
  delivery_address: string;
  customer_name: string;
  items: OrderItem[];
};

const STATUS_LABELS: Record<string, string> = {
  placed: 'New Order',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
};

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
};

function formatTime(placed_at: string) {
  return new Date(placed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/restaurant-dashboard/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const pollOrders = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = setTimeout(async () => {
      await fetchOrders();
      pollOrders();
    }, 5000);
  };

  useEffect(() => {
    fetchOrders();
    pollOrders();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (orderId: number, status: 'preparing' | 'ready') => {
    setUpdatingId(orderId);
    try {
      await fetch(`/api/restaurant-dashboard/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-48" />
        {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl h-40 border border-gray-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} pending</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-500">No active orders right now. New orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id} — {order.customer_name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Placed at {formatTime(order.placed_at)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="px-6 py-3 space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-700">
                    <span>{item.quantity}× {item.name}</span>
                    <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500 truncate max-w-xs">{order.delivery_address}</div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>

                  {order.status === 'placed' && (
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      disabled={updatingId === order.id}
                      className="bg-[#FF3008] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {updatingId === order.id ? 'Updating...' : 'Start Preparing'}
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      disabled={updatingId === order.id}
                      className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {updatingId === order.id ? 'Updating...' : 'Mark Ready'}
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <span className="text-sm text-green-600 font-medium">Waiting for driver</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
