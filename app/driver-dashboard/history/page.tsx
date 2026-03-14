'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SessionSummary {
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

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function groupByMonthDay(sessions: SessionSummary[]) {
  const months: { label: string; days: { label: string; sessions: SessionSummary[] }[] }[] = [];
  const monthMap = new Map<string, Map<string, SessionSummary[]>>();

  for (const s of sessions) {
    const d = new Date(s.started_at + 'Z');
    const monthKey = d.toLocaleDateString([], { year: 'numeric', month: 'long' });
    const dayKey = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, new Map());
    const dayMap = monthMap.get(monthKey)!;
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push(s);
  }

  for (const [monthLabel, dayMap] of monthMap) {
    const days = [];
    for (const [dayLabel, daySessions] of dayMap) {
      days.push({ label: dayLabel, sessions: daySessions });
    }
    months.push({ label: monthLabel, days });
  }

  return months;
}

export default function DriverHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/driver/history')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const grouped = groupByMonthDay(sessions);

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
        <h1 className="text-white font-semibold">Session History</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#FF3008] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-gray-400 text-lg">No completed sessions yet</p>
            <p className="text-gray-600 text-sm">Complete a drive session to see it here</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
            {grouped.map(month => (
              <div key={month.label}>
                <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
                  {month.label}
                </h2>
                <div className="space-y-6">
                  {month.days.map(day => (
                    <div key={day.label}>
                      <p className="text-gray-500 text-xs mb-2">{day.label}</p>
                      <div className="space-y-2">
                        {day.sessions.map(s => (
                          <Link
                            key={s.id}
                            href={`/driver-dashboard/history/${s.id}`}
                            className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-4 hover:border-[#3a3a3a] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-semibold">
                                  {formatTime(s.started_at)} – {formatTime(s.ended_at)}
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                  {formatDuration(s.durationMinutes)} · {s.deliveries_completed} deliver{s.deliveries_completed !== 1 ? 'ies' : 'y'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#22c55e] font-bold">${s.total_earnings.toFixed(2)}</p>
                                <p className="text-gray-500 text-xs mt-0.5">${s.earningsPerHour.toFixed(2)}/hr</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
