'use client';

import { useState } from 'react';
import type { Restaurant } from '@/lib/types';

const CUISINE_OPTIONS = [
  'American', 'Chinese', 'French', 'Indian', 'Italian',
  'Japanese', 'Korean', 'Mediterranean', 'Mexican', 'Thai',
  'Vietnamese', 'Greek', 'Middle Eastern', 'Caribbean', 'Other',
];

interface RestaurantInfoFormProps {
  restaurant: Restaurant;
  onSaved: (updated: Restaurant) => void;
}

export default function RestaurantInfoForm({ restaurant, onSaved }: RestaurantInfoFormProps) {
  const [name, setName] = useState(restaurant.name);
  const [cuisine, setCuisine] = useState(restaurant.cuisine);
  const [description, setDescription] = useState(restaurant.description);
  const [imageUrl, setImageUrl] = useState(restaurant.image_url);
  const [deliveryFee, setDeliveryFee] = useState(restaurant.delivery_fee.toString());
  const [deliveryMin, setDeliveryMin] = useState(restaurant.delivery_min.toString());
  const [deliveryMax, setDeliveryMax] = useState(restaurant.delivery_max.toString());
  const [address, setAddress] = useState(restaurant.address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);

    try {
      const res = await fetch('/api/restaurant-dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          cuisine,
          description: description.trim(),
          image_url: imageUrl.trim(),
          delivery_fee: parseFloat(deliveryFee),
          delivery_min: parseInt(deliveryMin),
          delivery_max: parseInt(deliveryMax),
          address: address.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      const data = await res.json();
      onSaved(data.restaurant);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Changes saved successfully!</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuisine</label>
          <select
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          >
            {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery fee ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={deliveryFee}
            onChange={e => setDeliveryFee(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery time (min)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="5"
              value={deliveryMin}
              onChange={e => setDeliveryMin(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min="10"
              value={deliveryMax}
              onChange={e => setDeliveryMax(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
            <span className="text-gray-500 text-sm">min</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          />
        </div>

        {imageUrl && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Image preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="preview"
              className="w-full h-40 object-cover rounded-xl border border-gray-200"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[#FF3008] text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
