import { createClient as createBrowserClient } from './supabase/client';

/**
 * Interface for API response data following the NestJS TransformInterceptor format.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * A centralized fetch wrapper for making calls to the NestJS Backend.
 * It automatically grabs the Supabase JWT token and attaches it.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);

  // Default content type to JSON if not explicitly passed
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Extract Auth Token
  // If running on the client, fetch it automatically. 
  // For Server Components/Actions, either pass it in options.headers manually or use a server-only wrapper.
  let token: string | null = null;

  if (typeof window !== 'undefined') {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // You could customize this error handling based on your NestJS GlobalHttpExceptionFilter
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // All success responses from NestJS are wrapped in { data: T }
  return response.json();
}
