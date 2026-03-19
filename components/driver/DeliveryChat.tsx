'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';

interface DeliveryChatProps {
  orderId: number;
  currentUserId: number;
  isActive: boolean;
}

export default function DeliveryChat({ orderId, currentUserId, isActive }: DeliveryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenCount = useRef(0);
  const unread = Math.max(0, messages.length - seenCount.current);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${orderId}`, {
        headers: { 'X-Session-Role': 'driver' },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch { /* ignore */ }
  };

  const pollMessages = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (!isActive) return;
    pollRef.current = setTimeout(async () => {
      await fetchMessages();
      pollMessages();
    }, 3000);
  };

  useEffect(() => {
    const initialFetch = async () => {
      try {
        const res = await fetch(`/api/messages/${orderId}`, {
          headers: { 'X-Session-Role': 'driver' },
        });
        if (res.ok) {
          const data = await res.json();
          const msgs = data.messages ?? [];
          setMessages(msgs);
          // Treat messages already in DB at mount as seen so phase transitions don't reset unread count
          seenCount.current = msgs.length;
        }
      } catch { /* ignore */ }
    };
    initialFetch();
    pollMessages();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      seenCount.current = messages.length;
    }
  }, [open, messages]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/messages/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Role': 'driver' },
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
      await fetchMessages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  if (!isActive || !orderId) return null;

  return (
    <>
      {/* Inline chat toggle */}
      <div className="mt-3">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
            open ? 'bg-[#2a2a2a] text-white' : 'border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message Customer
            {unread > 0 && (
              <span className="text-xs bg-[#FF3008] text-white px-1.5 py-0.5 rounded-full font-medium">{unread}</span>
            )}
            {unread === 0 && messages.length > 0 && (
              <span className="text-xs bg-[#3a3a3a] px-1.5 py-0.5 rounded-full">{messages.length}</span>
            )}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="mt-2 bg-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="h-44 overflow-y-auto px-3 py-2 space-y-2">
              {messages.length === 0 && (
                <p className="text-center text-gray-500 text-xs mt-8">No messages yet.</p>
              )}
              {messages.map(msg => {
                const isOwn = msg.sender_user_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${
                      isOwn ? 'bg-[#FF3008] text-white rounded-br-sm' : 'bg-[#3a3a3a] text-gray-200 rounded-bl-sm'
                    }`}>
                      {!isOwn && <p className="text-xs font-medium mb-0.5 opacity-60">{msg.sender_name}</p>}
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-[#3a3a3a] px-3 py-2 flex gap-2">
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm px-3 py-1.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF3008]"
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="bg-[#FF3008] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
