'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
}

export interface AddressAutocompleteHandle {
  /** Imperatively set the input's displayed value and focus it (used after GPS resolve) */
  fill: (value: string) => void;
}

let initialized = false;

function initGoogleMaps() {
  if (!initialized) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' });
    initialized = true;
  }
}

const AddressAutocomplete = forwardRef<AddressAutocompleteHandle, AddressAutocompleteProps>(
  function AddressAutocomplete(
    {
      value,
      onChange,
      onKeyDown,
      placeholder = 'Start typing an address...',
      className = '',
      wrapperClassName = '',
      required = false,
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autocompleteRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useImperativeHandle(ref, () => ({
      fill: (v: string) => {
        if (inputRef.current) {
          inputRef.current.value = v;
          inputRef.current.focus();
          // Select all, but with 'backward' direction so the active end is at 0
          // — browser scrolls to show the start of the address while text is selected
          inputRef.current.setSelectionRange(0, v.length, 'backward');
        }
      },
    }));

    useEffect(() => {
      let active = true;
      initGoogleMaps();
      importLibrary('places').then(() => {
        if (!active || !inputRef.current || autocompleteRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as any).google;
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'geometry'],
        });
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.formatted_address) {
            const coords =
              place.geometry?.location
                ? {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  }
                : undefined;
            onChangeRef.current(place.formatted_address, coords);
          }
        });
      });
      return () => {
        active = false;
        if (autocompleteRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const google = (window as any).google;
          if (google?.maps?.event) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
        }
        // Hide any lingering Google suggestion dropdown injected into <body>
        document.querySelectorAll<HTMLElement>('.pac-container').forEach(el => {
          el.style.display = 'none';
        });
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div className={`relative ${wrapperClassName}`}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          onChange={(e) => onChange(e.target.value, undefined)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          className={`pl-9 ${className}`}
          autoComplete="off"
        />
      </div>
    );
  }
);

export default AddressAutocomplete;
