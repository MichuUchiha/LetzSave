'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [pickupCode, setPickupCode] = useState('Loading...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setPickupCode('No Session');
      return;
    }

    async function verifyAndFulfillOrder() {
      try {
        const res = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (res.ok && data.pickupCode) {
          setPickupCode(data.pickupCode);
        } else {
          setPickupCode('Error');
          setErrorMsg(data.error || 'Could not verify order');
        }
      } catch (err: any) {
        setPickupCode('Error');
        setErrorMsg(err.message);
      }
    }

    verifyAndFulfillOrder();
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
            {pickupCode}
          </p>
          {errorMsg && (
            <p className="text-xs text-red-600 mt-2 font-medium">{errorMsg}</p>
          )}
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
