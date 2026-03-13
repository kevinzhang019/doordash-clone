'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

const CUISINE_OPTIONS = [
  'American', 'Chinese', 'French', 'Indian', 'Italian',
  'Japanese', 'Korean', 'Mediterranean', 'Mexican', 'Thai',
  'Vietnamese', 'Greek', 'Middle Eastern', 'Caribbean', 'Other',
];

export default function RestaurantSetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('American');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('2.99');
  const [deliveryMin, setDeliveryMin] = useState('20');
  const [deliveryMax, setDeliveryMax] = useState('40');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    try {
      // Create restaurant
      const createRes = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          cuisine,
          description: description.trim(),
          image_url: imageUrl.trim() || undefined,
          delivery_fee: parseFloat(deliveryFee),
          delivery_min: parseInt(deliveryMin),
          delivery_max: parseInt(deliveryMax),
          address: address.trim(),
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error || 'Failed to create restaurant');
        setLoading(false);
        return;
      }

      const { restaurantId } = await createRes.json();

      // Claim restaurant for this owner
      const claimRes = await fetch('/api/restaurant-dashboard/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      if (!claimRes.ok) {
        const data = await claimRes.json();
        setError(data.error || 'Failed to link restaurant');
        setLoading(false);
        return;
      }

      router.push('/restaurant-dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF3008] rounded-full mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your restaurant</h1>
          <p className="text-gray-500 mt-1">Tell customers about your restaurant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Restaurant name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                  placeholder="e.g. Mama's Kitchen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cuisine type
                </label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm bg-white"
                >
                  {CUISINE_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm resize-none"
                  placeholder="Tell customers what makes your restaurant special..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={(addr) => setAddress(addr)}
                  placeholder="Start typing your restaurant's address..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Delivery fee ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Delivery time (min)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="5"
                    required
                    value={deliveryMin}
                    onChange={(e) => setDeliveryMin(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                    placeholder="Min"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="number"
                    min="10"
                    required
                    value={deliveryMax}
                    onChange={(e) => setDeliveryMax(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                    placeholder="Max"
                  />
                  <span className="text-gray-500 text-sm">min</span>
                </div>
              </div>
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Image preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Restaurant preview"
                  className="w-full h-40 object-cover rounded-xl border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating restaurant...' : 'Create Restaurant & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
