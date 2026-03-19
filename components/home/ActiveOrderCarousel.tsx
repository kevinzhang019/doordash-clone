'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearch } from '@/components/providers/SearchProvider';
import { useCuisine } from '@/components/providers/CuisineProvider';

type ActiveOrder = {
  id: number;
  status: string;
  placed_at: string;
  total: number;
  restaurant_name: string;
  delivery_min: number;
  delivery_max: number;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  driver_user_id?: number | null;
  item_count?: number;
};

function displayStatus(status: string, driverUserId: number | null | undefined): string {
  if (!driverUserId && (status === 'ready' || status === 'preparing' || status === 'picked_up')) return 'preparing';
  return status;
}

const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  preparing: 'Preparing Your Order',
  ready: 'Ready for Pickup',
  picked_up: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-orange-100 text-orange-700',
  picked_up: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function calcEtaMinutes(order: ActiveOrder): number {
  // Prefer driver's real-time map-based ETA when available
  if (order.estimated_delivery_at) {
    return Math.max(0, Math.round((new Date(order.estimated_delivery_at).getTime() - Date.now()) / 60000));
  }

  // Fallback: estimate from placed_at + restaurant delivery window
  const placedMs = new Date(order.placed_at).getTime();
  const { delivery_min, delivery_max } = order;
  const effective = displayStatus(order.status, order.driver_user_id);
  if (effective === 'preparing') {
    return Math.max(0, Math.round((placedMs + delivery_max * 60000 - Date.now()) / 60000)) + 5;
  }
  if (effective === 'ready') return Math.round(delivery_min / 2) + 5;
  if (effective === 'picked_up') return 15;
  return 0;
}

export default function ActiveOrderCarousel() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const totalPagesRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { search } = useSearch();
  const { selectedCuisine } = useCuisine();

  const goTo = useCallback((delta: number, totalPgs: number) => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const pageWidth = track.clientWidth;
    const currentPage = Math.round(track.scrollLeft / pageWidth);
    const newPage = Math.max(0, Math.min(totalPgs - 1, currentPage + delta));
    setPage(newPage);
    track.scrollTo({ left: newPage * pageWidth, behavior: 'smooth' });
  }, []);

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

  useEffect(() => {
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setMounted(true)); });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const { scrollLeft, clientWidth, scrollWidth } = track;
      if (clientWidth <= 0) return;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;
      setPage(atEnd ? totalPagesRef.current - 1 : Math.round(scrollLeft / clientWidth));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [loaded, orders.length]);

  const hasContent = loaded && orders.length > 0;
  const isVisible = mounted && hasContent && !search && selectedCuisine === 'All';

  // Chunk orders into pages of 4
  const pages: ActiveOrder[][] = [];
  for (let i = 0; i < orders.length; i += 4) pages.push(orders.slice(i, i + 4));
  const totalPages = pages.length;
  totalPagesRef.current = totalPages;

  if (!hasContent) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: isVisible ? '1fr' : '0fr',
        opacity: isVisible ? 1 : 0,
        transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease',
        willChange: 'grid-template-rows, opacity',
      }}
    >
    <div style={{ overflow: 'hidden' }}>
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Your Orders</h2>
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            View all
          </Link>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => goTo(-1, totalPages)}
                disabled={page === 0}
                className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => goTo(1, totalPages)}
                disabled={page === totalPages - 1}
                className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-scroll carousel-track"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {pages.map((pageOrders, pageIdx) => (
          <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-4 gap-3">
            {pageOrders.map(order => {
              const etaMins = calcEtaMinutes(order);
              const effective = displayStatus(order.status, order.driver_user_id);
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-[#FF3008] transition-colors">{order.restaurant_name}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[effective] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[effective] ?? effective}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{order.item_count} item{order.item_count !== 1 ? 's' : ''} · ${order.total.toFixed(2)}</p>
                  {order.status === 'cancelled' ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancelled by Restaurant</span>
                    </div>
                  ) : order.status === 'delivered' ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {order.delivered_at
                          ? (() => {
                              const diffMin = Math.round((Date.now() - new Date(order.delivered_at).getTime()) / 60000);
                              if (diffMin < 1) return 'Delivered just now';
                              if (diffMin < 60) return `Delivered ${diffMin} min ago`;
                              if (diffMin < 1440) return `Delivered ${Math.round(diffMin / 60)}h ago`;
                              return `Delivered ${new Date(order.delivered_at).toLocaleDateString()}`;
                            })()
                          : 'Delivered'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF3008]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {(effective === 'placed' || effective === 'preparing') ? 'Estimating...' : etaMins <= 1 ? 'Arriving soon' : `~${etaMins} min`}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-[#FF3008] font-medium mt-3">Track Order →</p>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
    </div>
    </div>
  );
}
