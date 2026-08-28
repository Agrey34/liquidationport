import { createClient as createBrowserClient } from './supabase/client';

/**
 * Interface for API response data following the NestJS TransformInterceptor format.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface ExtendedRequestInit extends RequestInit {
  _isRetry?: boolean;
}

/**
 * A centralized fetch wrapper for making calls to the NestJS Backend.
 * It automatically grabs and refreshes the Supabase JWT token before sending,
 * and automatically retries requests on 401 Unauthorized using a fresh token.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ExtendedRequestInit = {}
): Promise<ApiResponse<T>> {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const baseUrl = envUrl && envUrl.trim() !== '' ? envUrl.trim() : 'http://localhost:4000/api/v1';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = baseUrl.endsWith('/api/v1') ? `${baseUrl}${cleanEndpoint}` : `${baseUrl}/api/v1${cleanEndpoint}`;

  if (url.endsWith('?')) {
    url = url.slice(0, -1);
  }

  const headers = new Headers(options.headers);

  // Default content type to JSON if not explicitly passed
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Extract Auth Token from the active Supabase session (client-side only)
  let token: string | null = null;

  if (typeof window !== 'undefined') {
    const supabase = createBrowserClient();
    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      // Proactively refresh if token has expired or is expiring within the next 60 seconds
      const isExpiredOrExpiringSoon = session?.expires_at
        ? session.expires_at * 1000 < Date.now() + 60000
        : false;

      if (session && isExpiredOrExpiringSoon) {
        const refreshResult = await supabase.auth.refreshSession();
        if (refreshResult.data.session) {
          session = refreshResult.data.session;
        }
      }

      token = session?.access_token ?? null;
    } catch (sessionErr) {
      console.warn('[apiFetch] Error getting/refreshing Supabase session:', sessionErr);
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    if (
      options.signal?.aborted ||
      (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('abort')))
    ) {
      throw err;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to connect to API at ${url} (${errorMsg}). Please check if the backend server is running.`);
  }

  // Handle 401 Unauthorized by attempting a token refresh and a single retry
  if (response.status === 401 && typeof window !== 'undefined' && !options._isRetry) {
    console.warn('[apiFetch] Received 401 Unauthorized. Attempting to refresh Supabase session and retry...');
    try {
      const supabase = createBrowserClient();
      const refreshResult = await supabase.auth.refreshSession();
      const freshToken = refreshResult.data.session?.access_token;

      if (freshToken) {
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${freshToken}`);
        if (!retryHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
          retryHeaders.set('Content-Type', 'application/json');
        }

        return apiFetch<T>(endpoint, {
          ...options,
          headers: retryHeaders,
          _isRetry: true,
        });
      }
    } catch (refreshErr) {
      console.error('[apiFetch] Token refresh retry failed:', refreshErr);
    }
  }

  if (!response.ok) {
    let errorData: { message?: string | string[] } | null = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message = Array.isArray(errorData?.message)
      ? errorData.message.join(', ')
      : errorData?.message || `API Error: ${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  // All success responses from NestJS are wrapped in { data: T }
  return response.json();
}

const api = {
  get: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await apiFetch<T>(url, { ...options, method: 'GET' });
    return res.data;
  },
  post: async <T>(url: string, body?: unknown, options?: RequestInit): Promise<T> => {
    const res = await apiFetch<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.data;
  },
  put: async <T>(url: string, body?: unknown, options?: RequestInit): Promise<T> => {
    const res = await apiFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.data;
  },
  patch: async <T>(url: string, body?: unknown, options?: RequestInit): Promise<T> => {
    const res = await apiFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.data;
  },
  delete: async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await apiFetch<T>(url, { ...options, method: 'DELETE' });
    return res.data;
  },
};

export default api;
