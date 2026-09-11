'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';
import type { CountryCode } from 'libphonenumber-js';
import {
  COUNTRY_PHONE_CONFIGS,
  DEFAULT_COUNTRY_CONFIG,
  cleanPhoneDigits,
  validateAndFormatPhone,
  parseE164ToCountryAndDigits,
  type CountryPhoneConfig,
  type PhoneValidationResult,
} from '@/lib/validation/phone';

export interface InternationalPhoneInputProps {
  id?: string;
  name?: string;
  value?: string; // Can be raw digits or existing E.164 (+12025550143)
  onChange?: (e164Value: string, result: PhoneValidationResult) => void;
  defaultCountry?: CountryCode;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  error?: string | null;
  className?: string;
}

export default function InternationalPhoneInput({
  id = 'phone-input',
  name = 'phone',
  value = '',
  onChange,
  defaultCountry = 'US',
  required = false,
  disabled = false,
  placeholder,
  label,
  error: externalError,
  className = '',
}: InternationalPhoneInputProps) {
  // Parse initial value if provided as an E.164 string
  const initialParsed = useMemo(() => {
    return parseE164ToCountryAndDigits(value);
  }, []); // only calculate once on mount

  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneConfig>(() => {
    const found = COUNTRY_PHONE_CONFIGS.find(
      (c) => c.code === (initialParsed.countryCode || defaultCountry)
    );
    return found || DEFAULT_COUNTRY_CONFIG;
  });

  const [digits, setDigits] = useState<string>(initialParsed.nationalDigits || cleanPhoneDigits(value));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external value changes from parent (e.g. API profile load)
  useEffect(() => {
    if (value) {
      const parsed = parseE164ToCountryAndDigits(value);
      if (parsed.nationalDigits !== digits) {
        setDigits(parsed.nationalDigits);
        const country = COUNTRY_PHONE_CONFIGS.find((c) => c.code === parsed.countryCode);
        if (country) setSelectedCountry(country);
      }
    }
  }, [value]);

  // Execute validation whenever digits or selected country changes
  const validationResult: PhoneValidationResult = useMemo(() => {
    return validateAndFormatPhone(digits, selectedCountry.code, { required });
  }, [digits, selectedCountry, required]);

  // Handle outside click & escape key to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen]);

  // STEP 1: INPUT CLEANING (Continuous Regex Sanitization)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apply continuous Regex filter /[^\d]/g to immediately strip out
    // spaces, dashes, brackets, dots, or alphabetic characters
    const sanitizedDigits = cleanPhoneDigits(e.target.value);
    setDigits(sanitizedDigits);

    const result = validateAndFormatPhone(sanitizedDigits, selectedCountry.code, { required });
    if (isTouched && result.error) {
      setInternalError(result.error);
    } else {
      setInternalError(null);
    }

    if (onChange) {
      onChange(result.e164, result);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    if (!validationResult.isValid && (digits.length > 0 || required)) {
      setInternalError(validationResult.error || 'Invalid phone number.');
    } else {
      setInternalError(null);
    }
  };

  const handleCountrySelect = (country: CountryPhoneConfig) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    
    // Re-validate existing digits under new country rules
    const result = validateAndFormatPhone(digits, country.code, { required });
    if (isTouched && result.error) {
      setInternalError(result.error);
    } else {
      setInternalError(null);
    }

    if (onChange) {
      onChange(result.e164, result);
    }

    // Restore focus to number input for seamless typing
    numberInputRef.current?.focus();
  };

  // Filtered countries for searchable dropdown
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_PHONE_CONFIGS;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRY_PHONE_CONFIGS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [searchQuery]);

  const activeError = externalError || (isTouched ? internalError : null);
  const isValidNumber = validationResult.isValid && digits.length > 0;

  return (
    <div className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input container */}
      <div
        ref={dropdownRef}
        className={`relative flex items-center bg-white border rounded-xl transition-all ${
          activeError
            ? 'border-rose-500 ring-2 ring-rose-500/10'
            : isValidNumber
            ? 'border-neutral-300 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10'
            : 'border-neutral-300 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10'
        } ${disabled ? 'bg-neutral-100/60 opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Country Code Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3.5 py-3.5 border-r border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 rounded-l-xl text-sm font-semibold text-neutral-800 transition-colors shrink-0 cursor-pointer select-none"
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          aria-label={`Select country code. Current: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span className="text-lg leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-xs font-mono font-bold text-neutral-900">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180 text-neutral-900' : ''
            }`}
          />
        </button>

        {/* STEP 1: Phone Digit Input */}
        <input
          ref={numberInputRef}
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
          value={digits}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder || selectedCountry.placeholder}
          className="flex-1 px-3.5 py-3.5 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 font-mono font-medium focus:outline-none w-full"
          aria-invalid={!!activeError}
        />

        {/* Real-time Validation Icon indicator */}
        <div className="pr-3.5 flex items-center shrink-0">
          {isValidNumber ? (
            <span
              title="Verified valid telecom number"
              className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-in zoom-in-75 duration-150"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          ) : activeError ? (
            <span
              title={activeError}
              className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center animate-in zoom-in-75 duration-150"
            >
              <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          ) : null}
        </div>

        {/* STEP 2: Searchable Country Dropdown */}
        {isDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-95 slide-in-from-top-2 duration-150"
            role="listbox"
          >
            {/* Search filter input */}
            <div className="p-2.5 border-b border-neutral-100 bg-neutral-50/70">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Country options list */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-50 p-1">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400 font-medium">
                  No matching country found
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-bold'
                          : 'hover:bg-neutral-100 text-neutral-800'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base leading-none shrink-0">{c.flag}</span>
                        <span className="text-xs truncate">{c.name}</span>
                        <span
                          className={`text-[11px] font-mono shrink-0 ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-400'
                          }`}
                        >
                          ({c.code})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-xs font-mono font-semibold ${
                            isSelected ? 'text-white' : 'text-neutral-500'
                          }`}
                        >
                          {c.dialCode}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Hint footer */}
            <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400 flex items-center justify-between">
              <span>Standard E.164 Format</span>
              <span className="font-mono">{selectedCountry.dialCode}</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {activeError && (
        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{activeError}</span>
        </p>
      )}

      {/* Dynamic Placeholder Guide Hint */}
      {!activeError && (
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
          <span>{selectedCountry.formatExample}</span>
          {isValidNumber && (
            <span className="font-mono text-emerald-600 font-bold">
              E.164: {validationResult.e164}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
