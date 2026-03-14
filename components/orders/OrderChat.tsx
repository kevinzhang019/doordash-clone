'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';

interface OrderChatProps {
  orderId: number;
  currentUserId: number;
  isActive: boolean;
}

export default function OrderChat({ orderId, currentUserId, isActive }: OrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${orderId}`);
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
    if (open) {
      fetchMessages();
      pollMessages();
    } else {
      if (pollRef.current) clearTimeout(pollRef.current);
    }
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [open, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
      await fetchMessages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF3008]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-semibold text-gray-900">Message Driver</span>
          {messages.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{messages.length}</span>
          )}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="h-56 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hi to your driver!</p>
            )}
            {messages.map(msg => {
              const isOwn = msg.sender_user_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isOwn ? 'bg-[#FF3008] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    {!isOwn && <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender_name}</p>}
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="border-t border-gray-100 px-4 py-3 flex gap-2">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="bg-[#FF3008] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
