'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderItem, Review } from '@/lib/types';
import OrderChat from '@/components/orders/OrderChat';
import { useAuth } from '@/components/providers/AuthProvider';

// ── Status progress bar ───────────────────────────────────────────────────────

const STATUS_STEPS = ['placed', 'preparing', 'ready', 'picked_up', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'On the Way',
  delivered: 'Delivered',
};

function OrderStatusProgress({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => {
          const active = i <= currentIndex;
          const isLast = i === STATUS_STEPS.length - 1;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  active ? 'bg-[#FF3008] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < currentIndex ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <p className={`text-xs mt-1 text-center leading-tight max-w-[60px] ${active ? 'text-[#FF3008] font-medium' : 'text-gray-400'}`}>
                  {STATUS_LABELS[step]}
                </p>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-1 mb-5 transition-colors ${i < currentIndex ? 'bg-[#FF3008]' : 'bg-gray-100'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ETA calculation ────────────────────────────────────────────────────────────

function calcEtaMins(order: Order): number | null {
  const { status, placed_at, delivery_min, delivery_max } = order;
  if (!delivery_min || !delivery_max) return null;
  const placedMs = new Date(placed_at).getTime();
  const nowMs = Date.now();
  if (status === 'placed' || status === 'preparing') {
    return Math.max(0, Math.round((placedMs + delivery_max * 60000 - nowMs) / 60000));
  }
  if (status === 'ready') return Math.round(delivery_min / 2);
  if (status === 'picked_up') return 10;
  return null;
}

// ── Review section ────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-3xl transition-transform hover:scale-110 cursor-pointer leading-none"
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

function ReviewSection({ orderId, restaurantName, restaurantId }: { orderId: number; restaurantName: string; restaurantId: number }) {
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => { if (d.existingReview) setExistingReview(d.existingReview); });
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) { setError('Please write a comment'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit review'); return; }
      setSubmitted(true);
      setExistingReview({ id: data.reviewId, user_id: null, restaurant_id: 0, order_id: orderId, rating, comment, reviewer_name: 'You', created_at: new Date().toISOString() });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (existingReview) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <Link href={`/restaurants/${restaurantId}#reviews`} className="flex items-center gap-1 font-semibold text-gray-900 hover:text-[#FF3008] transition-colors mb-4 w-fit group">
          My Review
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-[#FF3008] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {submitted && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            Thanks for your review! It helps others discover great food.
          </div>
        )}
        <div className="flex gap-1 mb-2">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`text-xl ${existingReview.rating >= s ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
          ))}
        </div>
        <p className="text-gray-700 text-sm">{existingReview.comment}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <h3 className="font-semibold text-gray-900 mb-1">Rate your experience</h3>
      <p className="text-sm text-gray-500 mb-4">How was your order from {restaurantName}?</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <StarPicker value={rating} onChange={setRating} />

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your review</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="What did you think? Tell others about your experience..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setOrder(data.order);
        setOrderItems(data.orderItems);
      }
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const pollOrder = (currentStatus: string) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (currentStatus === 'delivered') return;
    pollRef.current = setTimeout(async () => {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (!data.error) {
          setOrder(data.order);
          setOrderItems(data.orderItems);
          pollOrder(data.order.status);
        }
      } catch { /* ignore */ }
    }, 5000);
  };

  useEffect(() => {
    fetchOrder();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start polling once we have the order
  useEffect(() => {
    if (order && order.status !== 'delivered') {
      pollOrder(order.status);
    }
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const etaMins = calcEtaMins(order);
  const isActive = order.status !== 'delivered';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Success Banner */}
      <div className={`rounded-2xl p-6 mb-6 flex gap-4 items-start ${
        order.status === 'delivered'
          ? 'bg-green-50 border border-green-200'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          order.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'
        }`}>
          {order.status === 'delivered' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {order.status === 'delivered' ? 'Order Delivered!' : 'Order Confirmed!'}
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Your order from <span className="font-semibold">{order.restaurant_name}</span>{' '}
            {order.status === 'delivered' ? 'has been delivered.' : 'is on its way.'}
          </p>
          {isActive && etaMins !== null && (
            <p className="text-sm font-medium text-blue-700 mt-1">
              {etaMins <= 1 ? 'Arriving any moment' : `Estimated arrival: ~${etaMins} min`}
            </p>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <OrderStatusProgress status={order.status} />

      {/* Driver card */}
      {order.driver_name && order.status !== 'delivered' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FF3008] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {order.driver_name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{order.driver_name}</p>
            <p className="text-sm text-gray-500">Your driver</p>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <Link href={`/restaurants/${order.restaurant_id}`} className="font-semibold text-gray-900 hover:text-[#FF3008] transition-colors">
              {order.restaurant_name}
            </Link>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date(order.placed_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
            order.status === 'delivered' ? 'bg-green-100 text-green-700'
            : order.status === 'placed' ? 'bg-blue-100 text-blue-700'
            : order.status === 'picked_up' ? 'bg-purple-100 text-purple-700'
            : 'bg-yellow-100 text-yellow-700'
          }`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

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

      {/* Chat — only when driver is assigned and not yet delivered */}
      {order.driver_user_id && user && order.status !== 'delivered' && (
        <OrderChat
          orderId={order.id}
          currentUserId={user.id}
          isActive={order.status !== 'delivered'}
        />
      )}

      {/* Review Section — only when delivered */}
      {order.status === 'delivered' && (
        <ReviewSection orderId={order.id} restaurantName={order.restaurant_name || ''} restaurantId={order.restaurant_id} />
      )}

      <div className="flex gap-3">
        <Link href="/" className="flex-1 bg-[#FF3008] text-white text-center font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors cursor-pointer">
          Order Again
        </Link>
        <Link href="/orders" className="flex-1 bg-gray-100 text-gray-700 text-center font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
          View All Orders
        </Link>
      </div>
    </div>
  );
}
