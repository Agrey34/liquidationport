'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export default function TestApiPage() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [publicData, setPublicData] = useState<unknown>(null);
  const [privateData, setPrivateData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async () => {
    try {
      // For testing, we can use a dummy signup or OAuth. 
      // Replace with your actual auth flow.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github', // Or google, etc.
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthStatus('Logged out');
    setPrivateData(null);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setAuthStatus(`Logged in as: ${session.user.email}`);
    } else {
      setAuthStatus('Not logged in');
    }
  };

  const fetchPublicData = async () => {
    try {
      setError(null);
      // Categories endpoint is public based on our RBAC
      const res = await apiFetch('/categories');
      setPublicData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const fetchPrivateData = async () => {
    try {
      setError(null);
      // Users profile endpoint is protected via SupabaseAuthGuard
      const res = await apiFetch('/users/profile');
      setPrivateData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <h1 className="text-3xl font-bold">API Connection Test</h1>

        {/* AUTHENTICATION SECTION */}
        <section className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">1. Authentication</h2>
          <div className="flex gap-4">
            <button 
              onClick={checkAuth}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Check Auth
            </button>
            <button 
              onClick={handleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Login (GitHub)
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
          <p className="text-sm font-mono bg-gray-100 p-2 rounded">{authStatus}</p>
        </section>

        {/* PUBLIC API SECTION */}
        <section className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">2. Public API Test (Categories)</h2>
          <button 
            onClick={fetchPublicData}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Fetch Public Data
          </button>
          <pre className="text-sm bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-60">
            {publicData ? JSON.stringify(publicData, null, 2) : 'No data yet.'}
          </pre>
        </section>

        {/* PRIVATE API SECTION */}
        <section className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">3. Private API Test (User Profile)</h2>
          <p className="text-sm text-gray-500">
            This will fail with 401 Unauthorized if you are not logged in. If you are logged in, the `apiFetch` wrapper should automatically attach your Bearer token.
          </p>
          <button 
            onClick={fetchPrivateData}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          >
            Fetch Private Data
          </button>
          <pre className="text-sm bg-gray-800 text-purple-400 p-4 rounded overflow-auto max-h-60">
            {privateData ? JSON.stringify(privateData, null, 2) : 'No data yet.'}
          </pre>
        </section>

        {/* ERRORS */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

      </div>
    </div>
  );
}
