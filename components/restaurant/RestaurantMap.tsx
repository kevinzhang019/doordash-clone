'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface RestaurantMapProps {
  lat: number;
  lng: number;
  name: string;
}

let mapsInitialized = false;

function initMaps() {
  if (!mapsInitialized) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' });
    mapsInitialized = true;
  }
}

function MapCanvas({ lat, lng, name, className }: RestaurantMapProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    initMaps();
    importLibrary('maps').then(async () => {
      if (!active || !ref.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      const { Map } = await google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
      const map = new Map(ref.current, {
        center: { lat, lng },
        zoom: 16,
        mapId: 'doordash_map',
        disableDefaultUI: false,
        gestureHandling: 'cooperative',
      });
      new AdvancedMarkerElement({ map, position: { lat, lng }, title: name });
    });
    return () => { active = false; };
  }, [lat, lng, name]);

  return <div ref={ref} className={className} />;
}

export default function RestaurantMap({ lat, lng, name }: RestaurantMapProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      {/* Inline map */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group"
        onClick={() => setFullscreen(true)}
      >
        <MapCanvas lat={lat} lng={lng} name={name} className="w-full h-56" />
        {/* Overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Full screen</span>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFullscreen(false)}>
          <div className="relative w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <MapCanvas lat={lat} lng={lng} name={name} className="w-full h-full" />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 bg-white rounded-full p-2.5 shadow-lg hover:bg-gray-100 transition-colors cursor-pointer z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md">
              <p className="font-semibold text-gray-900 text-sm">{name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
