'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface DeliveryDetail {
  number: number;
  estimatedMinutes: number;
  miles: number;
  pay: number;
  tip: number;
  total: number;
}

interface SessionDetail {
  id: number;
  started_at: string;
  ended_at: string;
  durationMinutes: number;
  total_earnings: number;
  deliveries_completed: number;
  earningsPerHour: number;
}

function formatTime(iso: string) {
  return new Date(iso + 'Z').toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso + 'Z').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/driver/history/${id}`)
      .then(r => r.json())
      .then(d => {
        setSession(d.session ?? null);
        setDeliveries(d.deliveries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-[#2a2a2a] h-14 flex items-center px-4 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mr-4 cursor-pointer transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-white font-semibold">Session Details</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#FF3008] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !session ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Session not found</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
            {/* Session summary card */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
              <p className="text-gray-400 text-xs mb-1">{formatDate(session.started_at)}</p>
              <p className="text-white font-medium text-sm mb-4">
                {formatTime(session.started_at)} – {formatTime(session.ended_at)} · {formatDuration(session.durationMinutes)}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-xs">Total Earned</p>
                  <p className="text-[#22c55e] font-bold text-lg">${session.total_earnings.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Per Hour</p>
                  <p className="text-white font-bold text-lg">${session.earningsPerHour.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Deliveries</p>
                  <p className="text-white font-bold text-lg">{session.deliveries_completed}</p>
                </div>
              </div>
            </div>

            {/* Deliveries */}
            {deliveries.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">No completed deliveries recorded</p>
            ) : (
              <div className="space-y-3">
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Deliveries</h2>
                {deliveries.map(d => (
                  <div key={d.number} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs font-medium">Delivery #{d.number}</span>
                      <span className="text-[#22c55e] font-bold">${d.total.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">Est. Time</p>
                        <p className="text-white">{d.estimatedMinutes} min</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">Miles</p>
                        <p className="text-white">{d.miles} mi</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">Tip</p>
                        <p className="text-white">${d.tip.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex justify-between text-xs text-gray-500">
                      <span>Base pay</span>
                      <span>${d.pay.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
