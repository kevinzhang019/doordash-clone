'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { AnalyticsData } from '@/lib/types';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIODS: { value: Period; label: string; shortLabel: string }[] = [
  { value: 'day', label: 'Daily (7d)', shortLabel: '7D' },
  { value: 'week', label: 'Weekly (4w)', shortLabel: '4W' },
  { value: 'month', label: 'Monthly (12m)', shortLabel: '12M' },
  { value: 'year', label: 'Yearly (5y)', shortLabel: '5Y' },
];

function formatLabel(label: string, period: Period): string {
  if (period === 'day') {
    const d = new Date(label + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (period === 'week') {
    const [yearStr, weekStr] = label.split('-');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    // Find the Monday of the given ISO-ish week
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay() || 7; // Mon=1..Sun=7
    const mondayOfWeek1 = new Date(year, 0, 1 + (1 - jan1Day));
    const weekStart = new Date(mondayOfWeek1);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
  }
  if (period === 'month') {
    const [year, month] = label.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return label;
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

type ExpandedCard = 'revenue' | 'top-qty' | 'top-revenue' | 'summary' | null;

// ── Stat Card (clickable) ──────────────────────────────────────────
function StatCard({ label, value, sub, color, onClick }: {
  label: string; value: string; sub?: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-left w-full
                 hover:shadow-md hover:border-gray-200 hover:scale-[1.02] active:scale-[0.98]
                 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center
                        group-hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ── Revenue Bar Chart ──────────────────────────────────────────────
function RevenueChart({ chart, period, maxRevenue, expanded, selectedBar, onBarClick }: {
  chart: { label: string; revenue: number; orders: number }[];
  period: Period;
  maxRevenue: number;
  expanded: boolean;
  selectedBar: number | null;
  onBarClick: (i: number | null) => void;
}) {
  const height = expanded ? 'h-80' : 'h-40';
  const hasData = chart.some(d => d.revenue > 0);

  if (!hasData) {
    return (
      <div className={`${height} flex items-center justify-center text-gray-400 text-sm`}>
        No revenue data for this period
      </div>
    );
  }

  // Y-axis scale for expanded view
  const yTicks = expanded ? [0, 0.25, 0.5, 0.75, 1].map(p => maxRevenue * p) : [];

  return (
    <div className={`${height} flex gap-0 relative`}>
      {/* Y-axis labels (expanded only) */}
      {expanded && (
        <div className="flex flex-col justify-between py-0 pr-2 text-right w-16 flex-shrink-0">
          {yTicks.reverse().map((tick, i) => (
            <span key={i} className="text-[10px] text-gray-400 leading-none">
              {formatCurrency(tick)}
            </span>
          ))}
        </div>
      )}

      {/* Bars */}
      <div className="flex items-end gap-1 flex-1 relative">
        {/* Horizontal grid lines (expanded only) */}
        {expanded && [0.25, 0.5, 0.75, 1].map(p => (
          <div
            key={p}
            className="absolute left-0 right-0 border-t border-dashed border-gray-100"
            style={{ bottom: `${p * 100}%` }}
          />
        ))}

        {chart.map((point, i) => {
          const heightPct = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
          const isSelected = selectedBar === i;
          const isAnySelected = selectedBar !== null;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onBarClick(isSelected ? null : i);
              }}
            >
              {/* Tooltip on hover or selected */}
              {point.revenue > 0 && (
                <div className={`absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2
                                 whitespace-nowrap z-10 shadow-lg transition-all duration-200
                                 ${isSelected ? 'block' : 'hidden group-hover:block'}`}>
                  <p className="font-semibold">${point.revenue.toFixed(2)}</p>
                  <p className="text-gray-300">{point.orders} order{point.orders !== 1 ? 's' : ''}</p>
                  {point.orders > 0 && (
                    <p className="text-gray-400 text-[10px]">Avg: ${(point.revenue / point.orders).toFixed(2)}</p>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                </div>
              )}

              <div
                className={`w-full rounded-t transition-all duration-300 relative overflow-hidden
                  ${point.revenue > 0
                    ? isSelected
                      ? 'bg-[#FF3008] shadow-lg shadow-red-200'
                      : isAnySelected
                        ? 'bg-[#FF3008]/30'
                        : 'bg-[#FF3008] hover:bg-[#e62b07]'
                    : 'bg-gray-100'
                  }`}
                style={{
                  height: `${Math.max(heightPct, point.revenue > 0 ? 4 : 0)}%`,
                  borderRadius: expanded ? '6px 6px 0 0' : '4px 4px 0 0',
                }}
              >
                {/* Shimmer on hover */}
                {point.revenue > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <span className={`text-[10px] truncate w-full text-center transition-colors
                ${isSelected ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                {formatLabel(point.label, period)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Top Items List ─────────────────────────────────────────────────
function TopItemsList({ items, type, expanded }: {
  items: { name: string; value: number }[];
  type: 'qty' | 'revenue';
  expanded: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">No data yet</p>;
  }

  const maxVal = Math.max(...items.map(i => i.value), 1);
  const displayItems = expanded ? items : items.slice(0, 5);

  return (
    <div className="space-y-2">
      {displayItems.map((item, i) => {
        const pct = (item.value / maxVal) * 100;
        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                  ${i === 0 ? 'bg-[#FF3008] text-white' : i === 1 ? 'bg-orange-100 text-orange-600' : i === 2 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                  {i + 1}
                </span>
                <span className="text-gray-700 truncate">{item.name}</span>
              </div>
              <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">
                {type === 'revenue' ? `$${item.value.toFixed(2)}` : item.value}
              </span>
            </div>
            {/* Progress bar */}
            <div className="ml-7 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out
                  ${i === 0 ? 'bg-[#FF3008]' : i === 1 ? 'bg-orange-400' : i === 2 ? 'bg-yellow-400' : 'bg-gray-300'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {!expanded && items.length > 5 && (
        <p className="text-xs text-gray-400 text-center mt-2">Click to see all {items.length} items</p>
      )}
    </div>
  );
}

// ── Expanded Modal ─────────────────────────────────────────────────
function ExpandedModal({ children, title, onClose }: {
  children: React.ReactNode; title: string; onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-auto
                      animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

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
    setSelectedBar(null);
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const chart = data?.revenue_chart || [];
  const maxRevenue = Math.max(...chart.map(d => d.revenue), 1);

  const topQtyItems = (data?.top_items_by_qty || []).map(i => ({ name: i.name, value: i.total_qty }));
  const topRevItems = (data?.top_items_by_revenue || []).map(i => ({ name: i.name, value: i.total_revenue }));

  const closeExpanded = useCallback(() => {
    setExpanded(null);
    setSelectedBar(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {PERIODS.map(({ value, label, shortLabel }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              period === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Revenue"
              value={`$${(data?.total_revenue || 0).toFixed(2)}`}
              sub={`${data?.order_count || 0} total orders`}
              color="text-gray-900"
              onClick={() => setExpanded('summary')}
            />
            <StatCard
              label="Orders"
              value={String(data?.order_count || 0)}
              color="text-gray-900"
              onClick={() => setExpanded('summary')}
            />
            <StatCard
              label="Avg Order Value"
              value={`$${(data?.avg_order_value || 0).toFixed(2)}`}
              color="text-gray-900"
              onClick={() => setExpanded('summary')}
            />
          </div>

          {/* Revenue chart card */}
          <button
            onClick={() => setExpanded('revenue')}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm w-full text-left
                       hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Revenue</h2>
              <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                <span>Click to expand</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
            </div>
            <RevenueChart
              chart={chart}
              period={period}
              maxRevenue={maxRevenue}
              expanded={false}
              selectedBar={null}
              onBarClick={() => {}}
            />
          </button>

          {/* Best sellers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setExpanded('top-qty')}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-left
                         hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Top Items by Quantity</h2>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <TopItemsList items={topQtyItems} type="qty" expanded={false} />
            </button>

            <button
              onClick={() => setExpanded('top-revenue')}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-left
                         hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Top Items by Revenue</h2>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <TopItemsList items={topRevItems} type="revenue" expanded={false} />
            </button>
          </div>
        </>
      )}

      {/* ── Expanded modals ─────────────────────────────────────── */}
      {expanded === 'summary' && (
        <ExpandedModal title="Summary Overview" onClose={closeExpanded}>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-2xl">
                <p className="text-3xl font-bold text-[#FF3008]">${(data?.total_revenue || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <p className="text-3xl font-bold text-blue-600">{data?.order_count || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Orders</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-2xl">
                <p className="text-3xl font-bold text-green-600">${(data?.avg_order_value || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">Avg Order</p>
              </div>
            </div>

            {/* Mini revenue chart */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue Trend</h3>
              <RevenueChart
                chart={chart}
                period={period}
                maxRevenue={maxRevenue}
                expanded={true}
                selectedBar={selectedBar}
                onBarClick={setSelectedBar}
              />
            </div>

            {/* Quick breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Sellers</h3>
                <div className="space-y-1.5">
                  {topQtyItems.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{item.name}</span>
                      <span className="font-medium text-gray-900 ml-2">{item.value} sold</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Revenue Leaders</h3>
                <div className="space-y-1.5">
                  {topRevItems.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{item.name}</span>
                      <span className="font-medium text-gray-900 ml-2">${item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ExpandedModal>
      )}

      {expanded === 'revenue' && (
        <ExpandedModal title="Revenue Breakdown" onClose={closeExpanded}>
          <div className="space-y-6">
            {/* Period selector inside modal */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
              {PERIODS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setPeriod(value); setSelectedBar(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    period === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Large chart */}
            <RevenueChart
              chart={chart}
              period={period}
              maxRevenue={maxRevenue}
              expanded={true}
              selectedBar={selectedBar}
              onBarClick={setSelectedBar}
            />

            {/* Selected bar detail */}
            {selectedBar !== null && chart[selectedBar] && (
              <div className="bg-gray-50 rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF3008]" />
                  <span className="font-semibold text-gray-900">
                    {formatLabel(chart[selectedBar].label, period)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-lg font-bold text-gray-900">${chart[selectedBar].revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="text-lg font-bold text-gray-900">{chart[selectedBar].orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg per Order</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${chart[selectedBar].orders > 0 ? (chart[selectedBar].revenue / chart[selectedBar].orders).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Period totals */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Period Total</span>
                <span className="font-bold text-gray-900">${chart.reduce((s, d) => s + d.revenue, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Period Orders</span>
                <span className="font-bold text-gray-900">{chart.reduce((s, d) => s + d.orders, 0)}</span>
              </div>
            </div>
          </div>
        </ExpandedModal>
      )}

      {expanded === 'top-qty' && (
        <ExpandedModal title="Top Items by Quantity" onClose={closeExpanded}>
          <TopItemsList items={topQtyItems} type="qty" expanded={true} />
        </ExpandedModal>
      )}

      {expanded === 'top-revenue' && (
        <ExpandedModal title="Top Items by Revenue" onClose={closeExpanded}>
          <TopItemsList items={topRevItems} type="revenue" expanded={true} />
        </ExpandedModal>
      )}
    </div>
  );
}
