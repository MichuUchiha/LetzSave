'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RestaurantApplyPage() {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string>('none');
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      // Check if they already applied or are a restaurant
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, application_status, business_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.role === 'restaurant') {
          router.push('/restaurant/dashboard');
          return;
        }
        setStatus(profile.application_status || 'none');
        if (profile.business_name) setBusinessName(profile.business_name);
      }
    }
    checkUser();
  }, [router]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'restaurant',
        business_name: businessName,
        application_status: 'pending',
        is_verified: false,
      })
      .eq('id', user.id);

    if (error) {
      alert('Error submitting application: ' + error.message);
      setLoading(false);
      return;
    }

    setStatus('pending');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold text-emerald-600 tracking-tight">🌱 LetzSave</span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a href="/" className="text-gray-600 hover:text-emerald-600">Feed</a>
            <a href="/orders" className="text-gray-600 hover:text-gray-900">My Orders</a>
          </nav>
        </div>
      </header>

      <main className="max-w-md mx-auto p-8 my-auto bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Become a Restaurant Partner</h1>
        <p className="text-gray-500 text-sm mb-6">
          Sell your surplus food at the end of the day, reduce waste, and reach new local customers.
        </p>

        {status === 'pending' ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center">
            <h2 className="font-bold text-amber-800 mb-1">Application Submitted!</h2>
            <p className="text-xs text-amber-700">
              Your application for <span className="font-semibold">{businessName}</span> is currently under review by our admin team. You will gain access to the dashboard once verified.
            </p>
            <a href="/" className="inline-block mt-4 text-xs text-emerald-600 font-semibold underline">Return to feed</a>
          </div>
        ) : (
          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="e.g. Pizza Hat Luxembourg"
                className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white p-3 rounded-xl font-medium hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Partnership Application'}
            </button>
          </form>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500 text-center">
        <p>© 2026 LetzSave Luxembourg. Rescuing food sustainably.</p>
      </footer>
    </div>
  );
}