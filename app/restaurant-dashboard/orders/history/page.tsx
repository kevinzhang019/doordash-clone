'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type OrderItem = { name: string; quantity: number; price: number };

type PastOrder = {
  id: number;
  status: string;
  subtotal: number;
  total: number;
  delivery_fee: number;
  discount_saved: number;
  promo_discount: number;
  placed_at: string;
  delivered_at: string | null;
  delivery_address: string;
  customer_name: string;
  items: OrderItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/restaurant-dashboard/orders/history?page=${page}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders ?? []);
        setTotalPages(data.pages ?? 1);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-48" />
        {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-16 border border-gray-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/restaurant-dashboard/orders" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} completed order{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">No completed orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id} — {order.customer_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(order.placed_at)} at {formatTime(order.placed_at)}
                      {order.delivered_at && (
                        <span className="ml-2 text-green-600">· Delivered {formatTime(order.delivered_at)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className="font-semibold text-gray-900">
                    ${Math.max(0, order.subtotal - (order.discount_saved ?? 0)).toFixed(2)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700`}>
                    Delivered
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-gray-100">
                  <div className="px-6 py-3 space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-700">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 space-y-1">
                    <p>{order.delivery_address}</p>
                    <div className="flex gap-4 pt-1">
                      <span>Subtotal: <span className="text-gray-700">${order.subtotal.toFixed(2)}</span></span>
                      {(order.discount_saved ?? 0) > 0 && (
                        <span>Deal savings: <span className="text-green-600">${(order.discount_saved).toFixed(2)}</span></span>
                      )}
                      <span className="font-medium text-gray-900">Total: ${Math.max(0, order.subtotal - (order.discount_saved ?? 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
