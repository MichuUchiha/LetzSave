'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [pickupCode, setPickupCode] = useState('Processing...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 15; // Poll for ~30 seconds max

    async function pollOrderCode() {
      // 1. Try finding order by Stripe session ID first (most reliable)
      let query = supabase.from('orders').select('pickup_code');

      if (sessionId) {
        query = query.eq('stripe_session_id', sessionId);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email?.trim();
        if (!userEmail) {
          setPickupCode('Check My Orders');
          setLoading(false);
          return;
        }
        query = query.ilike('customer_email', userEmail).order('created_at', { ascending: false }).limit(1);
      }

      // Use maybeSingle() to avoid throwing 406 error when record is not yet inserted
      const { data, error } = await query.maybeSingle();

      if (data?.pickup_code) {
        setPickupCode(data.pickup_code);
        setLoading(false);
        clearInterval(interval);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          setPickupCode('Check My Orders');
          setLoading(false);
          clearInterval(interval);
        }
      }
    }

    // Run immediately, then poll every 2 seconds until the webhook inserts the order
    pollOrderCode();
    interval = setInterval(pollOrderCode, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

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

      <main className="max-w-md mx-auto p-8 text-center my-auto bg-white border border-gray-200 rounded-2xl shadow-sm w-full">
        <h1 className="text-2xl font-bold text-emerald-600 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">Your surplus meal has been reserved.</p>

        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl mb-6">
          <p className="text-xs uppercase tracking-wider text-emerald-800 font-semibold">Your Pickup Code</p>
          <p className="text-4xl font-mono tracking-widest text-emerald-900 mt-2 font-extrabold">
            {loading && pickupCode === 'Processing...' ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              pickupCode
            )}
          </p>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          Show this code at the restaurant counter during the pickup window.
        </p>

        <a
          href="/orders"
          className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition shadow-sm w-full"
        >
          View All My Orders
        </a>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500 text-center">
        <p>© 2026 LetzSave Luxembourg. Rescuing food sustainably.</p>
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
