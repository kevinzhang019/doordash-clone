'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useChatSeen } from '@/components/providers/ChatSeenProvider';
import type { Message } from '@/lib/types';

interface ActiveOrder {
  id: number;
  status: string;
  restaurant_name: string;
  driver_user_id: number | null;
  driver_name: string | null;
}

export default function FloatingDriverChat() {
  const { user } = useAuth();
  const { seenCountByOrder, markSeen } = useChatSeen();
  const pathname = usePathname();
  const hidden = pathname?.startsWith('/driver-dashboard') || pathname?.startsWith('/restaurant-dashboard');

  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [messagesByOrder, setMessagesByOrder] = useState<Record<number, Message[]>>({});

  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const [bubbleIn, setBubbleIn] = useState(false);
  const [bubbleBounce, setBubbleBounce] = useState(false);
  const prevTotalUnreadRef = useRef(0);

  const orderPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeOrdersRef = useRef<ActiveOrder[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync so msg poll always uses latest orders
  useEffect(() => {
    activeOrdersRef.current = activeOrders;
  }, [activeOrders]);

  // Compute unread counts
  const unreadByOrder: Record<number, number> = {};
  for (const order of activeOrders) {
    const msgs = messagesByOrder[order.id] ?? [];
    const seen = seenCountByOrder[order.id] ?? 0;
    unreadByOrder[order.id] = Math.max(0, msgs.length - seen);
  }
  const totalUnread = Object.values(unreadByOrder).reduce((a, b) => a + b, 0);
  const ordersWithUnread = activeOrders.filter(o => (unreadByOrder[o.id] ?? 0) > 0);

  // ── Poll active orders ───────────────────────────────────────────────────────
  const fetchActiveOrders = async () => {
    try {
      const res = await fetch('/api/orders/active');
      if (!res.ok) return;
      const data = await res.json();
      const withDriver = (data.orders as ActiveOrder[]).filter(o => o.driver_user_id && o.status !== 'delivered');
      setActiveOrders(withDriver);
    } catch { /* ignore */ }
  };

  const scheduleOrderPoll = () => {
    if (orderPollRef.current) clearTimeout(orderPollRef.current);
    orderPollRef.current = setTimeout(async () => {
      await fetchActiveOrders();
      scheduleOrderPoll();
    }, 10000);
  };

  useEffect(() => {
    if (!user || hidden) return;
    fetchActiveOrders();
    scheduleOrderPoll();
    return () => { if (orderPollRef.current) clearTimeout(orderPollRef.current); };
  }, [user, hidden]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll messages for all orders with drivers ────────────────────────────────
  const fetchAllMessages = async (orders: ActiveOrder[]) => {
    const results = await Promise.allSettled(
      orders.map(o =>
        fetch(`/api/messages/${o.id}`)
          .then(r => r.json())
          .then(d => ({ orderId: o.id, messages: (d.messages ?? []) as Message[] }))
      )
    );
    const updates: Record<number, Message[]> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') updates[r.value.orderId] = r.value.messages;
    }
    setMessagesByOrder(prev => ({ ...prev, ...updates }));
  };

  const scheduleMsgPoll = () => {
    if (msgPollRef.current) clearTimeout(msgPollRef.current);
    msgPollRef.current = setTimeout(async () => {
      const orders = activeOrdersRef.current;
      if (orders.length > 0) await fetchAllMessages(orders);
      scheduleMsgPoll();
    }, 3000);
  };

  const activeOrderIds = activeOrders.map(o => o.id).join(',');

  useEffect(() => {
    if (activeOrders.length === 0) {
      setMessagesByOrder({});
      if (msgPollRef.current) clearTimeout(msgPollRef.current);
      return;
    }
    fetchAllMessages(activeOrders);
    scheduleMsgPoll();
    return () => { if (msgPollRef.current) clearTimeout(msgPollRef.current); };
  }, [activeOrderIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark seen when viewing a specific chat ───────────────────────────────────
  useEffect(() => {
    if (open && selectedOrderId !== null) {
      const msgs = messagesByOrder[selectedOrderId] ?? [];
      markSeen(selectedOrderId, msgs.length);
    }
  }, [open, selectedOrderId, messagesByOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && selectedOrderId !== null) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesByOrder, open, selectedOrderId]);

  // ── Bubble pop-in logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open || activeOrders.length === 0) {
      setBubbleIn(false);
      return;
    }
    if (totalUnread > 0) {
      setBubbleIn(true);
      if (totalUnread > prevTotalUnreadRef.current) {
        setBubbleBounce(true);
        setTimeout(() => setBubbleBounce(false), 900);
      }
    } else {
      setBubbleIn(false);
    }
    prevTotalUnreadRef.current = totalUnread;
  }, [activeOrders, totalUnread, open]);

  // ── Bubble click: smart routing ──────────────────────────────────────────────
  const handleBubbleClick = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (ordersWithUnread.length === 1) {
      setSelectedOrderId(ordersWithUnread[0].id);
    } else {
      // Multiple (or zero) unread — show picker
      setSelectedOrderId(null);
    }
    setOpen(true);
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending || selectedOrderId === null) return;
    setSending(true);
    try {
      await fetch(`/api/messages/${selectedOrderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
      const res = await fetch(`/api/messages/${selectedOrderId}`);
      if (res.ok) {
        const data = await res.json();
        setMessagesByOrder(prev => ({ ...prev, [selectedOrderId]: data.messages ?? [] }));
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  if (!user || hidden || activeOrders.length === 0) return null;

  const selectedOrder = activeOrders.find(o => o.id === selectedOrderId);
  const selectedMessages = selectedOrderId !== null ? (messagesByOrder[selectedOrderId] ?? []) : [];

  return (
    <>
      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out origin-bottom-right
          ${open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-3 pointer-events-none'
          }`}
      >
        {/* ── PICKER VIEW ─────────────────────────────────────────────────── */}
        {selectedOrderId === null && (
          <>
            <div className="bg-[#FF3008] px-4 py-3 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">Your Drivers</p>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-1">
              {activeOrders.map(order => {
                const unread = unreadByOrder[order.id] ?? 0;
                const initial = order.driver_name?.[0]?.toUpperCase() ?? '?';
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FF3008] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-gray-900 text-sm">{order.driver_name}</p>
                      <p className="text-gray-500 text-xs truncate">{order.restaurant_name}</p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-[#FF3008] text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center flex-shrink-0">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── CHAT VIEW ───────────────────────────────────────────────────── */}
        {selectedOrderId !== null && selectedOrder && (
          <>
            {/* Header */}
            <div className="bg-[#FF3008] px-4 py-3 flex items-center gap-3">
              {activeOrders.length > 1 && (
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Back to driver list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedOrder.driver_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight truncate">{selectedOrder.driver_name}</p>
                <p className="text-red-100 text-xs truncate">{selectedOrder.restaurant_name}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-red-100 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
                  En route
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer ml-1"
                  aria-label="Close chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
              {selectedMessages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hi to your driver!</p>
              )}
              {selectedMessages.map((msg, i) => {
                const isOwn = msg.sender_user_id === user.id;
                const prevMsg = selectedMessages[i - 1];
                const showName = !isOwn && msg.sender_user_id !== prevMsg?.sender_user_id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    style={{
                      animation: 'msgIn 0.2s ease-out both',
                      animationDelay: `${Math.min(i * 20, 200)}ms`,
                    }}
                  >
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      isOwn
                        ? 'bg-[#FF3008] text-white rounded-br-sm'
                        : 'bg-white text-gray-900 rounded-bl-sm'
                    }`}>
                      {showName && <p className="text-xs font-semibold mb-0.5 opacity-60">{msg.sender_name}</p>}
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-gray-100 px-3 py-2.5 flex gap-2 bg-white">
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Message your driver..."
                className="flex-1 text-sm px-3 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="bg-[#FF3008] text-white w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-red-700 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Send"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Floating bubble ──────────────────────────────────────────────────── */}
      <button
        onClick={handleBubbleClick}
        aria-label={open ? 'Close chat' : 'Open chat with driver'}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FF3008] rounded-full shadow-xl
          flex items-center justify-center cursor-pointer hover:bg-red-700
          transition-all duration-300 ease-out
          ${bubbleIn
            ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
            : 'scale-0 opacity-0 translate-y-4 pointer-events-none'
          }
          ${bubbleBounce ? 'animate-bounce' : ''}
        `}
      >
        {bubbleBounce && (
          <span className="absolute inset-0 rounded-full bg-[#FF3008] animate-ping opacity-40" />
        )}

        <span className={`absolute transition-all duration-200 ${open ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <span className={`absolute transition-all duration-200 ${open ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>

        {totalUnread > 0 && !open && (
          <span className="absolute -top-1 -right-1 bg-white text-[#FF3008] text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-sm">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </>
  );
}
