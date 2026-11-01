'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function formatPickupWindow(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateStr = start.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} • From ${startTime} to ${endTime}`;
}

export default function FeedPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initFeed() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserEmail(user?.email || null);

      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('food_listings')
        .select('*, profiles(business_name, address, phone)')
        .gt('quantity', 0)
        .gt('pickup_end', nowIso)
        .order('pickup_end', { ascending: true });

      if (error) {
        console.error('Error fetching listings:', error.message);
      } else {
        setListings(data || []);
        const initialQtys: { [key: string]: number } = {};
        data?.forEach((item) => {
          initialQtys[item.id] = 1;
        });
        setQuantities(initialQtys);
      }
      setLoading(false);
    }

    initFeed();

    const interval = setInterval(() => {
      const now = new Date();
      setListings((prev) =>
        prev.filter((item) => !item.pickup_end || new Date(item.pickup_end) > now)
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleQuantityChange = (id: string, qty: number, max: number) => {
    const val = Math.max(1, Math.min(qty, max));
    setQuantities((prev) => ({ ...prev, [id]: val }));
  };

  const handleCheckout = async (listingId: string, maxQty: number, pickupEnd?: string) => {
    if (pickupEnd && new Date(pickupEnd) <= new Date()) {
      alert('This offer has expired and is no longer available.');
      setListings((prev) => prev.filter((item) => item.id !== listingId));
      return;
    }

    const selectedQty = quantities[listingId] || 1;
    if (selectedQty > maxQty) {
      alert('Selected quantity exceeds available stock.');
      return;
    }

    // Force server verification of the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to reserve food.');
      window.location.href = '/login';
      return;
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        quantity: selectedQty,
        userId: user.id,
        customerEmail: user.email || '',
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Checkout error: ' + (data.error || 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading marketplace...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold text-emerald-600 tracking-tight">🌱 LetzSave</span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a href="/" className="text-emerald-600 font-bold">Feed</a>
            <a href="/orders" className="text-gray-600 hover:text-gray-900">My Orders</a>
            <a href="/restaurant/apply" className="text-gray-600 hover:text-gray-900">Restaurant Partner</a>
            {currentUserEmail && (
              <span className="text-xs text-gray-400 hidden sm:inline">({currentUserEmail})</span>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition text-xs"
            >
              Log Out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex-grow w-full space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Available Surplus Food</h1>

        {listings.length === 0 ? (
          <p className="text-sm text-gray-500">No surplus items available right now.</p>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const maxQty = listing.quantity;
              const currentQty = quantities[listing.id] || 1;
              const address = listing.profiles?.address;
              const discountPercent = listing.original_price > 0
                ? Math.round(((listing.original_price - listing.discounted_price) / listing.original_price) * 100)
                : 50;
              const pickupWindow = formatPickupWindow(listing.pickup_start, listing.pickup_end);

              return (
                <div key={listing.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{listing.title}</h3>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {discountPercent}% OFF
                      </span>
                    </div>

                    <p className="text-sm font-medium text-emerald-700">{listing.profiles?.business_name || 'Restaurant Partner'}</p>

                    {pickupWindow && (
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block my-1">
                        🕒 Pickup: {pickupWindow}
                      </p>
                    )}

                    {address && (
                      <div>
                        <p className="text-xs text-gray-500">{address}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 font-semibold hover:underline inline-block mt-0.5"
                        >
                          📍 View on Google Maps
                        </a>
                      </div>
                    )}

                    {listing.profiles?.phone && (
                      <p className="text-xs text-gray-400">Phone: {listing.profiles.phone}</p>
                    )}

                    <p className="text-xs text-gray-400 pt-1">Stock available: {maxQty}</p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 line-through">€{(listing.original_price * currentQty).toFixed(2)}</span>
                      <span className="text-xl font-bold text-emerald-600">€{(listing.discounted_price * currentQty).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(listing.id, currentQty - 1, maxQty)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700"
                        >
                          -
                        </button>
                        <span className="px-4 text-sm font-semibold">{currentQty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(listing.id, currentQty + 1, maxQty)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleCheckout(listing.id, maxQty, listing.pickup_end)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
                      >
                        Reserve & Pay
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>© 2026 LetzSave Luxembourg. Rescuing food sustainably.</p>
        </div>
      </footer>
    </div>
  );
}