'use client';

import { useEffect, useState } from 'react';
import HoursEditor, { type HoursRow } from '@/components/restaurant-dashboard/HoursEditor';

export default function HoursPage() {
  const [hours, setHours] = useState<HoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/restaurant-dashboard/hours')
      .then(r => r.json())
      .then(d => { setHours(d.hours || []); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/restaurant-dashboard/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Business Hours</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">Hours saved successfully!</div>
        )}

        <HoursEditor hours={hours} onChange={setHours} />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 bg-[#FF3008] text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>
    </div>
  );
}
