'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'libphonenumber-js';

// Build sorted country list once at module level
const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

const COUNTRIES: { code: CountryCode; name: string; dialCode: string }[] = getCountries()
  .map(code => {
    const name = displayNames.of(code);
    if (!name || name === code) return null;
    return { code, name, dialCode: `+${getCountryCallingCode(code)}` };
  })
  .filter(Boolean)
  .sort((a, b) => a!.name.localeCompare(b!.name)) as {
    code: CountryCode;
    name: string;
    dialCode: string;
  }[];

function flagEmoji(code: string) {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export interface PhoneInputProps {
  value: string; // E.164 or ''
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  dark?: boolean;
  placeholder?: string;
  required?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  onValidChange,
  dark = false,
  placeholder = 'Phone number',
  required = false,
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>('US');
  const [localNumber, setLocalNumber] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Parse initial E.164 value
  useEffect(() => {
    if (!value) return;
    try {
      const parsed = parsePhoneNumber(value);
      if (parsed?.country) {
        setCountry(parsed.country);
        setLocalNumber(parsed.formatNational());
      }
    } catch {
      setLocalNumber(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dropdownOpen]);

  const dialCode = `+${getCountryCallingCode(country)}`;

  const validate = (number: string, countryCode: CountryCode): boolean => {
    if (!number) return true; // empty is valid (field is optional)
    try {
      return isValidPhoneNumber(number, countryCode);
    } catch {
      return false;
    }
  };

  const emitChange = (number: string, countryCode: CountryCode) => {
    if (!number) {
      onChange('');
      onValidChange?.(true);
      return;
    }
    const valid = validate(number, countryCode);
    if (valid) {
      try {
        const parsed = parsePhoneNumber(number, countryCode);
        onChange(parsed.format('E.164'));
      } catch {
        onChange(number);
      }
    } else {
      // Emit raw so parent knows something was typed
      onChange(`${dialCode}${number}`);
    }
    onValidChange?.(valid);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalNumber(raw);
    emitChange(raw, country);
  };

  const handleCountrySelect = (code: CountryCode) => {
    setCountry(code);
    setDropdownOpen(false);
    setSearch('');
    emitChange(localNumber, code);
  };

  const handleBlur = () => {
    setTouched(true);
    // Auto-format on blur if valid
    if (localNumber) {
      try {
        const parsed = parsePhoneNumber(localNumber, country);
        if (parsed.isValid()) setLocalNumber(parsed.formatNational());
      } catch {
        /* leave as typed */
      }
    }
  };

  const isInvalid = touched && !!localNumber && !validate(localNumber, country);

  const filtered = COUNTRIES.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().startsWith(search.toLowerCase()),
  );

  // Styling
  const borderColor = isInvalid ? 'border-red-400 focus:ring-red-400' : dark ? 'border-[#2a2a2a] focus:ring-[#FF3008]' : 'border-gray-200 focus:ring-[#FF3008]';
  const bg = dark ? 'bg-[#111]' : 'bg-white';
  const text = dark ? 'text-white placeholder-gray-600' : 'text-gray-900';
  const btnBg = dark ? 'bg-[#111] border-[#2a2a2a] hover:bg-[#1a1a1a]' : 'bg-white border-gray-200 hover:bg-gray-50';
  const btnText = dark ? 'text-gray-300' : 'text-gray-600';

  return (
    <div>
      <div className="flex gap-2">
        {/* Country dropdown trigger */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-3 border rounded-xl transition-colors text-sm ${btnBg} ${btnText} ${isInvalid ? 'border-red-400' : dark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
          >
            <span className="text-base leading-none">{flagEmoji(country)}</span>
            <span className="min-w-[36px]">{dialCode}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${dark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search countries..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                      c.code === country ? 'bg-red-50 text-[#FF3008]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base leading-none">{flagEmoji(c.code)}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-gray-400 flex-shrink-0 text-xs">{c.dialCode}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">No countries found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className={`flex-1 px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent ${bg} ${text} ${borderColor}`}
        />
      </div>

      {isInvalid && (
        <p className="mt-1.5 text-xs text-red-500">Please enter a valid phone number for the selected country.</p>
      )}
    </div>
  );
}
