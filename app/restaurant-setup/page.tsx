'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user && user.role !== 'restaurant') {
      router.replace('/');
    }
  }, [user, router]);

  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('American');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [address, setAddress] = useState('');
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/restaurant-dashboard/image-upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      } else {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address.trim() || !addressCoords) {
      setError('Please select your restaurant address from the dropdown suggestions');
      return;
    }

    setLoading(true);
    try {
      const createRes = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          cuisine,
          image_url: imageUrl || undefined,
          address: address.trim(),
          lat: addressCoords.lat,
          lng: addressCoords.lng,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error || 'Failed to create restaurant');
        setLoading(false);
        return;
      }

      const { restaurantId } = await createRes.json();

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

            <div>
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
                Address
              </label>
              <AddressAutocomplete
                value={address}
                onChange={(addr, coords) => {
                  setAddress(addr);
                  setAddressCoords(coords ?? null);
                }}
                placeholder="Start typing your restaurant's address..."
                wrapperClassName="w-full"
                className="w-full py-3 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Restaurant image (optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FF3008] file:text-white hover:file:bg-red-600 file:cursor-pointer border border-gray-200 rounded-xl px-3 py-2 focus:outline-none disabled:opacity-50"
              />
              {uploadingImage && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
              {imageUrl && !uploadingImage && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Restaurant preview"
                    className="w-full h-40 object-cover rounded-xl border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
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
