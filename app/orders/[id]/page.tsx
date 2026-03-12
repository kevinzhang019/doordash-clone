'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderItem } from '@/lib/types';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data.order);
          setOrderItems(data.orderItems);
        }
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-2xl h-48 border border-gray-100" />
          <div className="bg-white rounded-2xl h-32 border border-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
        <p className="text-gray-500 mb-6">{error || 'This order does not exist or you do not have access to it.'}</p>
        <Link href="/orders" className="text-[#FF3008] hover:underline">View all orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex gap-4 items-start">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Your order from <span className="font-semibold">{order.restaurant_name}</span> has been placed successfully.
          </p>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">Order #{order.id}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date(order.placed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
            order.status === 'delivered'
              ? 'bg-green-100 text-green-700'
              : order.status === 'placed'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {order.status}
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100">
          {orderItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center px-6 py-3">
              <div>
                <span className="text-gray-900">{item.name}</span>
                <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
              </div>
              <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Delivery fee</span>
            <span>${order.delivery_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
        <p className="text-gray-600">{order.delivery_address}</p>
      </div>

      <div className="flex gap-3">
        <Link href="/" className="flex-1 bg-[#FF3008] text-white text-center font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors">
          Order Again
        </Link>
        <Link href="/orders" className="flex-1 bg-gray-100 text-gray-700 text-center font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors">
          View All Orders
        </Link>
      </div>
    </div>
  );
}
