'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

const CUISINES = ['American', 'Chinese', 'French', 'Indian', 'Italian', 'Japanese', 'Korean', 'Mediterranean', 'Mexican', 'Thai', 'Other'];

const DEFAULT_IMAGES: Record<string, string> = {
  Italian: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  Japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
  Mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  Chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
  French: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  Mediterranean: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  Korean: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
  Thai: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80',
  American: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
};

export default function NewRestaurantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    cuisine: 'American',
    description: '',
    address: '',
    image_url: '',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim()) { setError('Please select a valid address'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          cuisine: form.cuisine,
          description: form.description.trim(),
          address: form.address.trim(),
          delivery_fee: 0,
          delivery_min: 15,
          delivery_max: 30,
          image_url: form.image_url.trim() || DEFAULT_IMAGES[form.cuisine] || DEFAULT_IMAGES.Other,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create restaurant'); setLoading(false); return; }
      router.push(`/restaurants/${data.restaurantId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Add a Restaurant</h1>
        <p className="text-gray-500 text-sm mt-1">List your restaurant on DoorDash</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Tony's Pizza"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuisine</label>
            <select
              value={form.cuisine}
              onChange={e => set('cuisine', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm bg-white cursor-pointer"
            >
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              required
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Describe your restaurant in a few sentences..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm resize-none"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Location</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <AddressAutocomplete
              value={form.address}
              onChange={v => set('address', v)}
              placeholder="Search for your restaurant's address..."
              required
              className="w-full py-3 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">Start typing to see address suggestions from Google Maps</p>
          </div>
        </div>

        {/* Photo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Photo <span className="text-gray-400 font-normal">(optional)</span></h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
            <input
              type="url"
              value={form.image_url}
              onChange={e => set('image_url', e.target.value)}
              placeholder="https://... (leave blank to use a default based on cuisine)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
            />
          </div>
          {/* Preview */}
          <div className="rounded-xl overflow-hidden h-32 bg-gray-100 relative">
            <img
              src={form.image_url || DEFAULT_IMAGES[form.cuisine] || DEFAULT_IMAGES.Other}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGES.Other; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <p className="absolute bottom-2 left-3 text-white text-xs font-medium">Preview</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF3008] text-white font-semibold py-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-lg"
        >
          {loading ? 'Adding Restaurant...' : 'Add Restaurant'}
        </button>
      </form>
    </div>
  );
}
