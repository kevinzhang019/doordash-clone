'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Your order history will appear here</p>
        <Link href="/" className="bg-[#FF3008] text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors inline-block">
          Start Ordering
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSaved = orders.reduce((sum, o) => sum + (o.discount_saved ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        {totalSaved > 0 && (
          <div className="bg-[#FF3008]/5 rounded-2xl border border-[#FF3008]/20 p-5">
            <p className="text-xs font-medium text-[#FF3008] uppercase tracking-wide mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-[#FF3008]">${totalSaved.toFixed(2)}</p>
            <p className="text-xs text-[#FF3008]/60 mt-0.5">from deals</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.restaurant_name}</h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {new Date(order.placed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{order.delivery_address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : (order.status === 'placed' || (!order.driver_user_id && (order.status === 'ready' || order.status === 'preparing' || order.status === 'picked_up')))
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {!order.driver_user_id && (order.status === 'ready' || order.status === 'preparing' || order.status === 'picked_up') ? 'Preparing' : order.status === 'placed' ? 'Placed' : order.status}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
