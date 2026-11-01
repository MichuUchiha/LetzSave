'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let channel: any = null;

    async function fetchUserOrders() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const cleanEmail = (user.email || '').trim().toLowerCase();
      setCurrentUserEmail(cleanEmail);

      // 1. Fetch orders
      const { data: rawOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError || !rawOrders) {
        setLoading(false);
        return;
      }

      const myOrders = rawOrders.filter((o) => {
        if (o.user_id && o.user_id === user.id) return true;
        if (o.customer_email && o.customer_email.trim().toLowerCase() === cleanEmail) return true;
        return false;
      });

      if (myOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        setupRealtimeSubscription(user.id, cleanEmail);
        return;
      }

      // 2. Fetch associated listings & profiles
      const listingIds = Array.from(new Set(myOrders.map((o) => o.listing_id).filter(Boolean)));
      const { data: listingsData } = await supabase
        .from('food_listings')
        .select('*')
        .in('id', listingIds);

      const listingsMap: { [key: string]: any } = {};
      listingsData?.forEach((l) => {
        listingsMap[l.id] = l;
      });

      const restaurantIds = Array.from(
        new Set((listingsData || []).map((l) => l.restaurant_id).filter(Boolean))
      );
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', restaurantIds);

      const profilesMap: { [key: string]: any } = {};
      profilesData?.forEach((p) => {
        profilesMap[p.id] = p;
      });

      const enrichedOrders = myOrders.map((o) => {
        const listing = listingsMap[o.listing_id] || null;
        const profile = listing ? profilesMap[listing.restaurant_id] || null : null;
        return { ...o, listing, profile };
      });

      setOrders(enrichedOrders);
      setLoading(false);

      // 3. Initialize real-time updates listener
      setupRealtimeSubscription(user.id, cleanEmail, listingsMap, profilesMap);
    }

    function setupRealtimeSubscription(userId: string, userEmail: string, listingsMap: any = {}, profilesMap: any = {}) {
      const channelName = `orders-channel-${userId}`;

      // Clean up any previously cached channel instance to prevent React Strict Mode conflicts
      supabase.getChannels().forEach((c) => {
        if (c.topic?.includes(userId)) {
          supabase.removeChannel(c);
        }
      });

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new;
            if (updatedOrder.user_id === userId || (updatedOrder.customer_email && updatedOrder.customer_email.trim().toLowerCase() === userEmail)) {
              setOrders((prevOrders) =>
                prevOrders.map((ord) => {
                  if (ord.id === updatedOrder.id) {
                    return {
                      ...ord,
                      status: updatedOrder.status,
                      listing: ord.listing || listingsMap[updatedOrder.listing_id] || null,
                      profile: ord.profile || profilesMap[ord.listing?.restaurant_id] || null,
                    };
                  }
                  return ord;
                })
              );
            }
          }
        )
        .subscribe();
    }

    fetchUserOrders();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold text-emerald-600 tracking-tight">🌱 LetzSave</span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a href="/" className="text-gray-600 hover:text-emerald-600">Feed</a>
            <a href="/orders" className="text-emerald-600 font-bold">My Orders</a>
            <a href="/restaurant/dashboard" className="text-gray-600 hover:text-gray-900">Restaurant Dashboard</a>
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

      <main className="max-w-4xl mx-auto px-6 py-10 flex-grow w-full">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">My Reserved Orders</h1>
        <p className="text-gray-500 mb-8">Present your pickup code at the restaurant counter to collect your meal.</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 font-medium">You have no active orders yet.</p>
            <a href="/" className="inline-block mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
              Browse Surplus Food
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const listing = order.listing;
              const profile = order.profile;
              const address = profile?.address;
              const totalPaid = listing?.discounted_price
                ? (listing.discounted_price * order.quantity).toFixed(2)
                : null;
              const pickupWindow = formatPickupWindow(listing?.pickup_start, listing?.pickup_end);
              const isCompleted = order.status === 'completed';

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isCompleted ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {order.status}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 pt-1">{listing?.title || 'Surplus Meal Package'}</h2>
                    <p className="text-sm font-medium text-emerald-700">{profile?.business_name || 'Restaurant Partner'}</p>

                    {pickupWindow && (
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block my-1">
                        🕒 Collect: {pickupWindow}
                      </p>
                    )}

                    {address && (
                      <div className="pt-0.5">
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

                    {profile?.phone && (
                      <p className="text-xs text-gray-400">Phone: {profile.phone}</p>
                    )}

                    <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Quantity: <strong className="text-gray-800">{order.quantity}</strong></span>
                      {totalPaid && <span>Total Paid: <strong className="text-emerald-600">€{totalPaid}</strong></span>}
                      <span>Reserved on: {new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={`border px-6 py-4 rounded-xl text-center w-full md:w-auto ${
                    isCompleted ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold ${isCompleted ? 'text-gray-500' : 'text-emerald-800'}`}>
                      {isCompleted ? 'Order Collected' : 'Pickup Code'}
                    </p>
                    <p className={`text-2xl font-mono tracking-widest font-extrabold mt-0.5 ${isCompleted ? 'text-gray-700 line-through' : 'text-emerald-900'}`}>
                      {order.pickup_code}
                    </p>
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