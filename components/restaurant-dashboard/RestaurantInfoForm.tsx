'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Restaurant } from '@/lib/types';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

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
  const [imageUrl, setImageUrl] = useState(restaurant.image_url);
  const [address, setAddress] = useState(restaurant.address);
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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
    setSaved(false);

    const addressChanged = address.trim() !== restaurant.address.trim();
    if (addressChanged && !addressCoords) {
      setError('Please select the new address from the dropdown suggestions');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/restaurant-dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          cuisine,
          image_url: imageUrl.trim(),
          address: address.trim(),
          ...(addressCoords ? { lat: addressCoords.lat, lng: addressCoords.lng } : {}),
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

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuisine</label>
          <select
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          >
            {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <AddressAutocomplete
            value={address}
            onChange={(addr, coords) => {
              setAddress(addr);
              setAddressCoords(coords ?? null);
            }}
            placeholder="Start typing the restaurant address..."
            wrapperClassName="w-full"
            className="w-full py-3 pr-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant image <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="relative mt-1 mb-2 w-full h-40 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            {imageUrl && !uploadingImage ? (
              <Image
                src={imageUrl}
                alt="preview"
                fill
                className="object-cover"
                unoptimized
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">{uploadingImage ? 'Uploading...' : 'No image'}</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FF3008] file:text-white hover:file:bg-red-600 file:cursor-pointer border border-gray-200 rounded-xl px-3 py-2 focus:outline-none disabled:opacity-50"
          />
          {uploadingImage && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || uploadingImage}
        className="bg-[#FF3008] text-white font-semibold px-8 py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
