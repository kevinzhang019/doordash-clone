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
  const driverMarkerRef = useRef<any>(null);
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
      (pos) => {
        setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (locationDenied || !mapRef.current) return;
    let active = true;
    initMaps();

    const center = restaurantCoords || customerCoords || { lat: 37.7749, lng: -122.4194 };

    importLibrary('maps').then(async () => {
      if (!active || !mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      const { Map } = await google.maps.importLibrary('maps');

      if (mapInstanceRef.current) return; // already initialized

      mapInstanceRef.current = new Map(mapRef.current, {
        center,
        zoom: 14,
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
    });

    return () => { active = false; };
  }, [locationDenied]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update driver marker
  useEffect(() => {
    if (!mapInstanceRef.current || !driverPos || locationDenied) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(driverPos);
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: driverPos,
        title: 'You',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FF3008',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        zIndex: 100,
      });
    }
  }, [driverPos, locationDenied]);

  // Draw directions based on phase
  useEffect(() => {
    if (!mapInstanceRef.current || !directionsRendererRef.current || phase === 'waiting') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps) return;

    const origin = phase === 'pickup' ? (driverPos || restaurantCoords) : restaurantCoords;
    const destination = phase === 'pickup' ? restaurantCoords : customerCoords;

    if (!origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg && onRouteReady) {
            onRouteReady(leg.distance?.text || '', leg.duration?.text || '');
          }
        }
      }
    );
  }, [phase, restaurantCoords, customerCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  if (locationDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#1a1a1a] text-center px-6">
        <span className="text-4xl">📍</span>
        <h3 className="text-white font-bold text-lg">Location access required</h3>
        <p className="text-gray-400 text-sm">Please enable location access in your browser to use Driver Mode.</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
