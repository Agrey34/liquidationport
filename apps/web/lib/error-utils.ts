/**
 * Centralized Error Sanitization & Security Masking Utility
 * 
 * SECURITY MANDATE:
 * Error messages displayed on the UI must NEVER expose raw database details,
 * SQLSTATE codes, table/column names, ORM stack traces, or internal server logic.
 * Exposing internal errors is an Information Disclosure vulnerability (CWE-209).
 */

// Patterns indicating database, ORM, SQL, or internal infrastructure leaks
const SENSITIVE_PATTERNS: RegExp[] = [
  /database/i,
  /postgres/i,
  /prisma/i,
  /relation\s+["']?[a-z0-9_]+["']?/i,
  /constraint/i,
  /check_phone_e164/i,
  /sqlstate/i,
  /granting\s+user/i,
  /saving\s+new\s+user/i,
  /violates\s+[a-z_]+/i,
  /foreign\s*key/i,
  /unique\s*constraint/i,
  /primary\s*key/i,
  /syntax\s*error/i,
  /column\s+["']?[a-z0-9_]+["']?/i,
  /table\s+["']?[a-z0-9_]+["']?/i,
  /null\s*value\s*in\s*column/i,
  /transaction\s*aborted/i,
  /deadlock/i,
  /pg_[a-z0-9_]+/i,
  /gotrue/i,
  /authapierror/i,
  /internal\s*server\s*error/i,
  /unhandled\s*server\s*error/i,
  /unexpected_failure/i,
  /\b500\b/,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IPv4 addresses
  /:\d{4,5}\b/, // Ports like :5432, :6543
  /[a-z]:\\[^"'\n\r]+/i, // Windows absolute paths
  /\/(?:home|usr|var|app|src|node_modules)\/[^"'\n\r]+/i, // Unix absolute paths
  /invocation\s+in/i,
  /findfirst|findunique|findmany/i,
  /at\s+[a-zA-Z0-9_.]+\s+\(/, // Stack traces
];

/**
 * Human-friendly translations for known authentication and validation events.
 */
const KNOWN_ERROR_MAPPINGS: Array<{ match: RegExp; friendly: string }> = [
  {
    match: /invalid\s*(login)?\s*credentials/i,
    friendly: 'Invalid email or password. Please verify your credentials and try again.',
  },
  {
    match: /email\s*not\s*confirmed/i,
    friendly: 'Please check your inbox to verify your email address before signing in.',
  },
  {
    match: /already\s*(associated|registered|exists)/i,
    friendly: 'This email or phone number is already associated with an account.',
  },
  {
    match: /passwords?\s*(do\s*not|don't)\s*match/i,
    friendly: 'Passwords do not match. Please verify and try again.',
  },
  {
    match: /password.*(?:least|short|characters)/i,
    friendly: 'Password must be at least 8 characters long.',
  },
  {
    match: /rate\s*limit|too\s*many\s*requests/i,
    friendly: 'Too many attempts. Please wait a few moments before trying again.',
  },
  {
    match: /token\s*(?:has\s*)?expired|otp_expired/i,
    friendly: 'This verification link or code has expired. Please request a new one.',
  },
  {
    match: /network\s*(?:error|connection)|failed\s*to\s*fetch/i,
    friendly: 'Unable to connect. Please check your internet connection.',
  },
  {
    match: /unauthorized|not\s*authenticated|jwt/i,
    friendly: 'Your session has expired. Please log in again.',
  },
  {
    match: /permission\s*denied|forbidden/i,
    friendly: 'You do not have permission to perform this action.',
  },
  {
    match: /not\s*found/i,
    friendly: 'The requested resource was not found.',
  },
];

/**
 * Tests whether a string contains sensitive technical, database, or backend leaks.
 */
export function containsSensitiveData(text: string): boolean {
  if (!text) return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Checks if the error corresponds to an account conflict (duplicate email or phone).
 */
export function isAccountConflictError(err: unknown): boolean {
  if (!err) return false;
  
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as Record<string, unknown>;
    if (errorObj.status === 409 || errorObj.status === 422) return true;
  }

  const raw = extractRawErrorMessage(err).toLowerCase();
  return (
    raw.includes('already associated') ||
    raw.includes('already registered') ||
    raw.includes('already exists') ||
    raw.includes('conflict')
  );
}

/**
 * Extracts a raw message string from various error shapes (Error, Supabase AuthError, ApiError, string, etc.).
 */
function extractRawErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error_description === 'string') return obj.error_description;
    if (typeof obj.error === 'string') return obj.error;
    if (Array.isArray(obj.message)) return obj.message.join(', ');
  }
  return String(err);
}

/**
 * Returns a clean, secure, user-friendly error message suitable for display in UI.
 * 
 * Guarantees:
 * 1. NO raw database error strings, SQLSTATE codes, or table names leak to the screen.
 * 2. Known user-actionable errors (wrong password, unverified email) receive clear guidance.
 * 3. Technical failures are gracefully masked with a safe, polite message.
 *
 * @param err The error object, string, or unknown value
 * @param fallback A safe default fallback message if the error is sensitive or unknown
 */
export function getCleanErrorMessage(
  err: unknown,
  fallback = 'Unable to complete this request right now. Please try again shortly.'
): string {
  if (!err) return fallback;

  const rawMessage = extractRawErrorMessage(err).trim();
  if (!rawMessage) return fallback;

  // 1. Check known friendly mappings first (e.g. wrong credentials, unverified email)
  for (const mapping of KNOWN_ERROR_MAPPINGS) {
    if (mapping.match.test(rawMessage)) {
      return mapping.friendly;
    }
  }

  // 2. If the message contains ANY sensitive/database/server leak, mask it with the fallback
  if (containsSensitiveData(rawMessage)) {
    return fallback;
  }

  // 3. If it looks like a clean, user-facing sentence without tech jargon, display it
  return rawMessage;
}
