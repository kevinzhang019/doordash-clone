'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { Review } from '@/lib/types';

const STARS = [1, 2, 3, 4, 5];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {STARS.map(s => (
        <span key={s} className={`text-base ${rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review, onReplyUpdated }: { review: Review; onReplyUpdated: (id: number, reply: string | null, at: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review.owner_reply ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/restaurant-dashboard/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: draft.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save reply');
        return;
      }
      onReplyUpdated(review.id, draft.trim(), new Date().toISOString());
      setEditing(false);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/restaurant-dashboard/reviews/${review.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete reply');
        return;
      }
      onReplyUpdated(review.id, null, null);
      setDraft('');
      setEditing(false);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const initials = review.reviewer_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'];
  const color = avatarColors[review.id % avatarColors.length];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Review header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {review.reviewer_avatar_url ? (
            <Image
              src={review.reviewer_avatar_url}
              alt={review.reviewer_name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
            <p className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <StarDisplay rating={review.rating} />
      </div>

      {/* Comment */}
      <p className="mt-3 text-gray-700 leading-relaxed">{review.comment}</p>

      {/* Owner reply */}
      {review.owner_reply && !editing && (
        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#FF3008] uppercase tracking-wide">Owner Reply</span>
            <span className="text-xs text-gray-400">
              {review.owner_reply_at
                ? new Date(review.owner_reply_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : ''}
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{review.owner_reply}</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => { setDraft(review.owner_reply ?? ''); setEditing(true); }}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Edit reply
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
            >
              Delete reply
            </button>
          </div>
        </div>
      )}

      {/* Reply form */}
      {editing ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            placeholder="Write your reply..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008]/20 focus:border-[#FF3008] resize-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              className="px-4 py-1.5 bg-[#FF3008] text-white text-sm font-medium rounded-lg hover:bg-[#e02b07] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save reply'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(''); }}
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : !review.owner_reply ? (
        <button
          onClick={() => { setDraft(''); setEditing(true); }}
          className="mt-3 text-sm text-[#FF3008] hover:text-[#e02b07] font-medium transition-colors"
        >
          + Reply to this review
        </button>
      ) : null}
    </div>
  );
}

export default function RestaurantReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/restaurant-dashboard/reviews')
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleReplyUpdated = useCallback((id: number, reply: string | null, at: string | null) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, owner_reply: reply, owner_reply_at: at } : r));
  }, []);

  const filtered = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({ rating: n, count: reviews.filter(r => r.rating === n).length }));
  const replied = reviews.filter(r => r.owner_reply).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 text-sm mt-1">Read customer feedback and respond to reviews.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          No reviews yet.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              <div className="flex justify-center mt-1 mb-1"><StarDisplay rating={Math.round(avgRating)} /></div>
              <p className="text-xs text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-2 font-medium">Rating breakdown</p>
              <div className="space-y-1">
                {ratingCounts.map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-2">{rating}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-gray-900">{replied}</p>
              <p className="text-xs text-gray-400 mt-1">of {reviews.length} replied</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {reviews.length > 0 ? Math.round((replied / reviews.length) * 100) : 0}% response rate
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">Filter:</span>
            <button
              onClick={() => setFilterRating(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterRating === null ? 'bg-[#FF3008] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map(n => (
              <button
                key={n}
                onClick={() => setFilterRating(filterRating === n ? null : n)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterRating === n ? 'bg-[#FF3008] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {n}★
              </button>
            ))}
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {filtered.map(review => (
              <ReviewCard key={review.id} review={review} onReplyUpdated={handleReplyUpdated} />
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-8 text-gray-400">No {filterRating}★ reviews.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
