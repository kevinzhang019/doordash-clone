'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

// Inject pulse animation into document head once
let pulseStyleInjected = false;
function injectPulseStyle() {
  if (pulseStyleInjected || typeof document === 'undefined') return;
  pulseStyleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes driverPulse {
      0%   { transform: scale(1);   opacity: 0.55; }
      100% { transform: scale(3.2); opacity: 0; }
    }
    .driver-pulse-ring {
      position: absolute; inset: 0;
      border-radius: 50%;
      background: #FF3008;
      animation: driverPulse 2.8s ease-out infinite;
    }
    .driver-dot {
      position: absolute; inset: 5px;
      border-radius: 50%;
      background: #FF3008;
      border: 2px solid #fff;
      box-shadow: 0 0 8px rgba(255,48,8,0.6);
    }
  `;
  document.head.appendChild(style);
}

export type DriverMapPhase = 'waiting' | 'pickup' | 'deliver';

interface DriverMapProps {
  phase: DriverMapPhase;
  restaurantCoords?: { lat: number; lng: number };
  customerCoords?: { lat: number; lng: number };
  onRouteReady?: (distanceText: string, durationText: string) => void;
}

let mapsInitialized = false;
function initMaps() {
  if (!mapsInitialized) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' });
    mapsInitialized = true;
  }
}

export default function DriverMap({ phase, restaurantCoords, customerCoords, onRouteReady }: DriverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directionsRendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pulsingOverlayRef = useRef<any>(null);
  const mapInitializedRef = useRef(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Watch driver position
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Initialize map — waits for first real GPS fix
  useEffect(() => {
    if (locationDenied || !mapRef.current || !driverPos || mapInitializedRef.current) return;
    mapInitializedRef.current = true;
    injectPulseStyle();
    initMaps();

    const containerEl = mapRef.current;
    importLibrary('maps').then(async () => {
      // Guard against unmount only — do NOT use a cleanup `active` flag here,
      // because GPS position changes trigger effect cleanup mid-load, canceling init.
      if (!containerEl.isConnected) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      const { Map } = await google.maps.importLibrary('maps');

      mapInstanceRef.current = new Map(containerEl, {
        center: driverPos,
        zoom: 15,
        styles: DARK_MAP_STYLES,
        disableDefaultUI: false,
        gestureHandling: 'greedy',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const { DirectionsRenderer } = await google.maps.importLibrary('routes');
      directionsRendererRef.current = new DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: { strokeColor: '#FF3008', strokeWeight: 5 },
      });

      // Create pulsing overlay at initial position
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      class PulsingDot extends (google.maps.OverlayView as any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private _pos: any;
        private _el: HTMLDivElement | null = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(pos: any) {
          super();
          this._pos = pos;
        }

        onAdd() {
          this._el = document.createElement('div');
          this._el.style.cssText = 'position:absolute;pointer-events:none';
          this._el.innerHTML = `
            <div style="position:relative;width:24px;height:24px;transform:translate(-50%,-50%)">
              <div class="driver-pulse-ring"></div>
              <div class="driver-dot"></div>
            </div>
          `;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).getPanes().overlayLayer.appendChild(this._el);
        }

        draw() {
          if (!this._el) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const proj = (this as any).getProjection();
          const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(this._pos.lat, this._pos.lng));
          if (p) {
            this._el.style.left = `${p.x}px`;
            this._el.style.top = `${p.y}px`;
          }
        }

        updatePosition(pos: { lat: number; lng: number }) {
          this._pos = pos;
          this.draw();
        }

        onRemove() {
          this._el?.parentNode?.removeChild(this._el);
          this._el = null;
        }
      }

      const overlay = new PulsingDot(driverPos);
      overlay.setMap(mapInstanceRef.current);
      pulsingOverlayRef.current = overlay;
    });
  }, [locationDenied, driverPos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update pulsing dot position as driver moves
  useEffect(() => {
    if (!pulsingOverlayRef.current || !driverPos) return;
    pulsingOverlayRef.current.updatePosition(driverPos);
  }, [driverPos]);

  // Draw or clear directions based on phase
  useEffect(() => {
    if (!mapInstanceRef.current || !directionsRendererRef.current) return;

    if (phase === 'waiting') {
      // Clear any existing route and return to driver's location
      directionsRendererRef.current.set('directions', null);
      if (driverPos) {
        mapInstanceRef.current.panTo(driverPos);
        mapInstanceRef.current.setZoom(15);
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps) return;

    const origin = phase === 'pickup' ? (driverPos || restaurantCoords) : restaurantCoords;
    const destination = phase === 'pickup' ? restaurantCoords : customerCoords;

    if (!origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg && onRouteReady) onRouteReady(leg.distance?.text || '', leg.duration?.text || '');
        }
      }
    );
  }, [phase, restaurantCoords, customerCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !driverPos) return;
    mapInstanceRef.current.panTo(driverPos);
    mapInstanceRef.current.setZoom(15);
  };

  if (locationDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#1a1a1a] text-center px-6">
        <span className="text-4xl">📍</span>
        <h3 className="text-white font-bold text-lg">Location access required</h3>
        <p className="text-gray-400 text-sm">Please enable location access in your browser to use Driver Mode.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {driverPos && (
        <button
          onClick={handleRecenter}
          title="Re-center on my location"
          className="absolute bottom-6 right-14 z-30 w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="9" strokeDasharray="2 4" />
          </svg>
        </button>
      )}
    </div>
  );
}
