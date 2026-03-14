'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { AnalyticsData } from '@/lib/types';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Daily (7d)' },
  { value: 'week', label: 'Weekly (4w)' },
  { value: 'month', label: 'Monthly (12m)' },
  { value: 'year', label: 'Yearly (5y)' },
];

function formatLabel(label: string, period: Period): string {
  if (period === 'day') {
    const d = new Date(label + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (period === 'week') {
    return `Wk ${label.split('-')[1]}`;
  }
  if (period === 'month') {
    const [year, month] = label.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return label;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoActive, setDemoActive] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async (p: Period = period) => {
    try {
      const res = await fetch(`/api/restaurant-dashboard/analytics?period=${p}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const activateDemo = async () => {
    setDemoLoading(true);
    try {
      await fetch('/api/restaurant-dashboard/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      setDemoActive(true);
      await fetchAnalytics(period);

      // Start live order interval
      intervalRef.current = setInterval(async () => {
        await fetch('/api/restaurant-dashboard/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'live' }),
        });
        await fetchAnalytics(period);
      }, 7000);
    } finally {
      setDemoLoading(false);
    }
  };

  const deactivateDemo = async () => {
    setDemoLoading(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      await fetch('/api/restaurant-dashboard/demo', { method: 'DELETE' });
      setDemoActive(false);
      await fetchAnalytics(period);
    } finally {
      setDemoLoading(false);
    }
  };

  const chart = data?.revenue_chart || [];
  const maxRevenue = Math.max(...chart.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

        {/* Demo mode button */}
        <button
          onClick={demoActive ? deactivateDemo : activateDemo}
          disabled={demoLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            demoActive
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          {demoActive && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
          {demoLoading ? 'Loading...' : demoActive ? 'Demo Mode Active — Click to Stop' : 'Fill with Demo Data'}
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              period === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${(data?.total_revenue || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data?.order_count || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${(data?.avg_order_value || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue</h2>
            {chart.every(d => d.revenue === 0) ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                No revenue data for this period
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {chart.map((point, i) => {
                  const heightPct = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                      {/* Tooltip */}
                      {point.revenue > 0 && (
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          ${point.revenue.toFixed(2)} · {point.orders} order{point.orders !== 1 ? 's' : ''}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-sm transition-all ${point.revenue > 0 ? 'bg-[#FF3008]' : 'bg-gray-100'}`}
                        style={{ height: `${Math.max(heightPct, point.revenue > 0 ? 2 : 0)}%` }}
                      />
                      <span className="text-[10px] text-gray-400 truncate w-full text-center">
                        {formatLabel(point.label, period)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Best sellers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Items by Quantity</h2>
              {(data?.top_items_by_qty || []).length === 0 ? (
                <p className="text-sm text-gray-400">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {(data?.top_items_by_qty || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate flex-1 mr-2">{item.name}</span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">{item.total_qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Items by Revenue</h2>
              {(data?.top_items_by_revenue || []).length === 0 ? (
                <p className="text-sm text-gray-400">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {(data?.top_items_by_revenue || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate flex-1 mr-2">{item.name}</span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">${item.total_revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
