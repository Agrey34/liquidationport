import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export interface CountryPhoneConfig {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  formatExample: string;
  localRegex: RegExp;
  minDigits: number;
  maxDigits: number;
  description?: string;
}

/**
 * Curated list of high-traffic and global trading country configs
 * with localized placeholder masks and strict fallback Regexes.
 */
export const COUNTRY_PHONE_CONFIGS: CountryPhoneConfig[] = [
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '(555) 019-2834',
    formatExample: '10 digits (e.g., 2025550143)',
    // North American Numbering Plan: Exactly 10 digits (3-digit NPA + 7-digit subscriber)
    localRegex: /^\d{10}$/,
    minDigits: 10,
    maxDigits: 10,
    description: 'Exact 10-digit national number',
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '(416) 555-0199',
    formatExample: '10 digits (e.g., 4165550199)',
    localRegex: /^\d{10}$/,
    minDigits: 10,
    maxDigits: 10,
    description: 'Exact 10-digit national number',
  },
  {
    code: 'MX',
    name: 'Mexico',
    dialCode: '+52',
    flag: '🇲🇽',
    placeholder: '55 1234 5678',
    formatExample: '10 digits (e.g., 5512345678)',
    localRegex: /^\d{10}$/,
    minDigits: 10,
    maxDigits: 10,
    description: 'Exact 10-digit national number',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    formatExample: '10-11 digits (e.g., 7911123456)',
    localRegex: /^\d{10,11}$/,
    minDigits: 10,
    maxDigits: 11,
    description: '10 to 11 digits',
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '151 23456789',
    formatExample: '10-11 digits (e.g., 15123456789)',
    localRegex: /^\d{10,11}$/,
    minDigits: 10,
    maxDigits: 11,
    description: '10 to 11 digits',
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    formatExample: '9 digits without leading 0',
    localRegex: /^\d{9,10}$/,
    minDigits: 9,
    maxDigits: 10,
    description: '9 to 10 digits',
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    formatExample: '9 digits without leading 0',
    localRegex: /^\d{9}$/,
    minDigits: 9,
    maxDigits: 9,
    description: 'Exact 9-digit national number',
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '312 345 6789',
    formatExample: '9-10 digits',
    localRegex: /^\d{9,10}$/,
    minDigits: 9,
    maxDigits: 10,
    description: '9 to 10 digits',
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    formatExample: '9 digits',
    localRegex: /^\d{9}$/,
    minDigits: 9,
    maxDigits: 9,
    description: 'Exact 9-digit national number',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    dialCode: '+31',
    flag: '🇳🇱',
    placeholder: '6 12345678',
    formatExample: '9 digits without leading 0',
    localRegex: /^\d{9}$/,
    minDigits: 9,
    maxDigits: 9,
    description: 'Exact 9-digit national number',
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    flag: '🇯🇵',
    placeholder: '90 1234 5678',
    formatExample: '10 digits without leading 0',
    localRegex: /^\d{10}$/,
    minDigits: 10,
    maxDigits: 10,
    description: 'Exact 10-digit national number',
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    flag: '🇨🇳',
    placeholder: '138 0013 8000',
    formatExample: '11 digits',
    localRegex: /^\d{11}$/,
    minDigits: 11,
    maxDigits: 11,
    description: 'Exact 11-digit national number',
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    formatExample: '10 digits',
    localRegex: /^\d{10}$/,
    minDigits: 10,
    maxDigits: 10,
    description: 'Exact 10-digit national number',
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    flag: '🇧🇷',
    placeholder: '11 91234-5678',
    formatExample: '10-11 digits',
    localRegex: /^\d{10,11}$/,
    minDigits: 10,
    maxDigits: 11,
    description: '10 to 11 digits',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    formatExample: '9 digits without leading 0',
    localRegex: /^\d{9}$/,
    minDigits: 9,
    maxDigits: 9,
    description: 'Exact 9-digit national number',
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    placeholder: '8123 4567',
    formatExample: '8 digits',
    localRegex: /^\d{8}$/,
    minDigits: 8,
    maxDigits: 8,
    description: 'Exact 8-digit national number',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    dialCode: '+234',
    flag: '🇳🇬',
    placeholder: '802 123 4567',
    formatExample: '10 digits without leading 0',
    localRegex: /^\d{10}$/,
    minDigits: 10,
    maxDigits: 10,
    description: 'Exact 10-digit national number',
  },
];

/** Default fallback country config (United States) */
export const DEFAULT_COUNTRY_CONFIG: CountryPhoneConfig = COUNTRY_PHONE_CONFIGS[0];

/**
 * Standard ITU E.164 Global Telecom Regex.
 * Max 15 digits total preceded by a '+' and a non-zero country code digit.
 */
export const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * STEP 1: Continuous Input Cleaning Regex
 * Strips all non-digit characters: spaces, dashes, parentheses, dots, letters.
 */
export function cleanPhoneDigits(rawInput: string): string {
  if (!rawInput) return '';
  return rawInput.replace(/[^\d]/g, '');
}

/**
 * Helper to get country configuration by ISO code
 */
export function getCountryConfig(code: string): CountryPhoneConfig {
  const found = COUNTRY_PHONE_CONFIGS.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );
  return found || DEFAULT_COUNTRY_CONFIG;
}

export interface PhoneValidationResult {
  isValid: boolean;
  digits: string;              // Pure numeric digits of the national number
  e164: string;                // Full standardized E.164 string (e.g. +12025550143)
  countryCode: CountryCode;    // ISO 3166-1 alpha-2 (e.g. US)
  dialCode: string;            // Calling code with leading plus (e.g. +1)
  formattedNational: string;   // Clean national presentation
  formattedInternational: string; // Clean international presentation
  error?: string;              // Descriptive error if invalid
}

/**
 * STEP 3 & STEP 4: Phone Validation Layer + E.164 Database Formatter
 * 
 * Implements a dual-engine architecture:
 * 1. High-traffic localized fallback regex check (e.g. US/CA 10 digits).
 * 2. Primary telecom parsing via `libphonenumber-js`.
 * 3. E.164 compliance guarantee.
 */
export function validateAndFormatPhone(
  rawInput: string,
  countryInput: CountryCode = 'US',
  options: { required?: boolean } = { required: false }
): PhoneValidationResult {
  const digits = cleanPhoneDigits(rawInput);
  const country = getCountryConfig(countryInput);
  const dialCodeDigits = country.dialCode.replace(/[^\d]/g, '');

  // If input is empty
  if (!digits) {
    if (options.required) {
      return {
        isValid: false,
        digits: '',
        e164: '',
        countryCode: country.code,
        dialCode: country.dialCode,
        formattedNational: '',
        formattedInternational: '',
        error: 'Phone number is required.',
      };
    }
    return {
      isValid: true,
      digits: '',
      e164: '',
      countryCode: country.code,
      dialCode: country.dialCode,
      formattedNational: '',
      formattedInternational: '',
    };
  }

  // Handle cases where user pastes number already starting with the dial code
  let nationalDigits = digits;
  if (digits.startsWith(dialCodeDigits) && digits.length > dialCodeDigits.length + 5) {
    nationalDigits = digits.slice(dialCodeDigits.length);
  }

  // 1. High-Traffic Local Regex Switch
  // Validates exact length constraints before telecom parsing
  const passesLocalRegex = country.localRegex.test(nationalDigits);

  if (nationalDigits.length < country.minDigits) {
    return {
      isValid: false,
      digits: nationalDigits,
      e164: `${country.dialCode}${nationalDigits}`,
      countryCode: country.code,
      dialCode: country.dialCode,
      formattedNational: nationalDigits,
      formattedInternational: `${country.dialCode} ${nationalDigits}`,
      error: `Phone number is too short for ${country.name} (${country.formatExample}).`,
    };
  }

  if (nationalDigits.length > country.maxDigits) {
    return {
      isValid: false,
      digits: nationalDigits,
      e164: `${country.dialCode}${nationalDigits}`,
      countryCode: country.code,
      dialCode: country.dialCode,
      formattedNational: nationalDigits,
      formattedInternational: `${country.dialCode} ${nationalDigits}`,
      error: `Phone number is too long for ${country.name} (Max ${country.maxDigits} digits).`,
    };
  }

  // 2. Primary Validation Engine: libphonenumber-js
  const parsed = parsePhoneNumberFromString(nationalDigits, country.code);
  const isLibraryValid = parsed?.isValid() ?? false;
  const isLibraryPossible = parsed?.isPossible() ?? false;

  // An entry is considered valid if:
  // (a) libphonenumber-js considers it fully valid, OR
  // (b) libphonenumber-js considers it possible AND it satisfies our strict local regex
  const isValid = isLibraryValid || (isLibraryPossible && passesLocalRegex);

  // Compute final standardized E.164 string
  let e164 = '';
  if (parsed && (isLibraryValid || isLibraryPossible)) {
    e164 = parsed.format('E.164');
  } else {
    e164 = `${country.dialCode}${nationalDigits}`;
  }

  // Verify final E.164 format strictly adheres to ITU-T standards
  const isE164Compliant = E164_REGEX.test(e164);

  const formattedNational = parsed?.formatNational() || nationalDigits;
  const formattedInternational = parsed?.formatInternational() || `${country.dialCode} ${nationalDigits}`;

  if (!isValid || !isE164Compliant) {
    return {
      isValid: false,
      digits: nationalDigits,
      e164,
      countryCode: country.code,
      dialCode: country.dialCode,
      formattedNational,
      formattedInternational,
      error: `Please enter a valid ${country.name} phone number (${country.formatExample}).`,
    };
  }

  return {
    isValid: true,
    digits: nationalDigits,
    e164,
    countryCode: country.code,
    dialCode: country.dialCode,
    formattedNational,
    formattedInternational,
  };
}

/**
 * Parses an existing database E.164 string (e.g. "+12025550143")
 * back into the matched Country Code and national digits.
 */
export function parseE164ToCountryAndDigits(e164String: string | null | undefined): {
  countryCode: CountryCode;
  nationalDigits: string;
} {
  if (!e164String) {
    return { countryCode: 'US', nationalDigits: '' };
  }

  const cleaned = e164String.trim();
  const parsed = parsePhoneNumberFromString(cleaned);
  if (parsed && parsed.country) {
    return {
      countryCode: parsed.country,
      nationalDigits: parsed.nationalNumber,
    };
  }

  // Manual fallback prefix matching
  for (const c of COUNTRY_PHONE_CONFIGS) {
    if (cleaned.startsWith(c.dialCode)) {
      const remaining = cleaned.slice(c.dialCode.length);
      return {
        countryCode: c.code,
        nationalDigits: cleanPhoneDigits(remaining),
      };
    }
  }

  return {
    countryCode: 'US',
    nationalDigits: cleanPhoneDigits(cleaned),
  };
}
