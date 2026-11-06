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
  return `${dateStr} From ${startTime} to ${endTime}`;
}

export default function RestaurantDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stripe Onboarding State
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Listing Creation State
  const [title, setTitle] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [pickupDate, setPickupDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pickup Code Verification State
  const [verifyCode, setVerifyCode] = useState('');

  const router = useRouter();

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const uid = user.id;
      setUserId(uid);

      const todayStr = new Date().toISOString().split('T')[0];
      setPickupDate(todayStr);

      // 1. Fetch restaurant profile and strictly verify role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (profileError || !profileData || profileData.role !== 'restaurant') {
        router.push('/restaurant/apply');
        return;
      }

      setProfile(profileData);
      setBusinessName(profileData.business_name || '');
      setAddress(profileData.address || '');
      setPhone(profileData.phone || '');

      // 2. Fetch true Stripe status from backend API
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const stripeRes = await fetch('/api/stripe/status', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          const stripeData = await stripeRes.json();
          setIsStripeConnected(Boolean(stripeData.connected));
        }
      } catch (err) {
        console.error('Failed to check Stripe status:', err);
      } finally {
        setCheckingStripe(false);
      }

      // 3. Fetch restaurant's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('food_listings')
        .select('*')
        .eq('restaurant_id', uid)
        .order('id', { ascending: false });

      if (listingsError) {
        console.error('Error fetching restaurant listings:', listingsError.message);
      }

      const safeListings = listingsData || [];
      setListings(safeListings);

      // 4. Fetch orders without fragile relational joins and map in JS
      if (safeListings.length > 0) {
        const listingIds = safeListings.map((l) => l.id);
        const listingsMap: { [key: string]: any } = {};
        safeListings.forEach((l) => {
          listingsMap[l.id] = l;
        });

        const { data: rawOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('listing_id', listingIds)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching restaurant orders:', ordersError.message);
        } else {
          const enrichedOrders = (rawOrders || []).map((o) => ({
            ...o,
            food_listings: listingsMap[o.listing_id] || null,
          }));
          setOrders(enrichedOrders);
        }
      } else {
        setOrders([]);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: businessName,
        address,
        phone,
      })
      .eq('id', userId);

    setSavingProfile(false);

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      setProfile((prev: any) => ({ ...prev, business_name: businessName, address, phone }));
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const orig = parseFloat(originalPrice);
    const disc = parseFloat(discountedPrice);
    const qty = parseInt(quantity, 10);

    if (isNaN(orig) || isNaN(disc) || orig <= 0 || disc <= 0) {
      alert('Please enter valid prices.');
      return;
    }

    if (disc > orig * 0.5) {
      alert('Discounted price must be at least 50% off the original price.');
      return;
    }

    const pickupStartDate = new Date(`${pickupDate}T${startTime}`);
    const pickupEndDate = new Date(`${pickupDate}T${endTime}`);

    if (isNaN(pickupStartDate.getTime()) || isNaN(pickupEndDate.getTime())) {
      alert('Please select a valid pickup date and time window.');
      return;
    }

    if (pickupEndDate <= pickupStartDate) {
      alert('End time must be after start time.');
      return;
    }

    if (pickupEndDate <= new Date()) {
      alert('Pickup end time must be in the future.');
      return;
    }

    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSubmitting(false);
      alert('Your session has expired. Please log in again.');
      return;
    }

    const res = await fetch('/api/listings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        originalPrice: orig,
        discountedPrice: disc,
        quantity: qty,
        pickupStart: pickupStartDate.toISOString(),
        pickupEnd: pickupEndDate.toISOString(),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      alert('Error creating listing: ' + (data.error || 'Unknown error'));
    } else if (data.listing) {
      setListings((prev) => [data.listing, ...prev]);
      setTitle('');
      setOriginalPrice('');
      setDiscountedPrice('');
      setQuantity('1');
      setStartTime('');
      setEndTime('');
      alert('Offer published and instant alerts dispatched!');
    }
  };

  const handleDeleteListing = async (id: string) => {
    const { error } = await supabase.from('food_listings').delete().eq('id', id);
    if (!error) {
      setListings((prev) => prev.filter((item) => item.id !== id));
      setOrders((prev) => prev.filter((o) => o.listing_id !== id));
    }
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCode.trim().toUpperCase();
    if (!cleanCode) return;

    const matchingOrder = orders.find((o) => o.pickup_code === cleanCode);
    if (!matchingOrder) {
      alert('Invalid pickup code for this restaurant.');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', matchingOrder.id);

    if (error) {
      alert('Failed to update order status: ' + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === matchingOrder.id ? { ...o, status: 'completed' } : o))
      );
      setVerifyCode('');
      alert(`Order ${cleanCode} verified and marked as completed!`);
    }
  };

  const handleConnectStripe = async () => {
    if (!userId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      alert('Your session has expired. Please log in again.');
      return;
    }

    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Stripe Connect error: ' + (data.error || 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading restaurant dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold text-emerald-600 tracking-tight">🌱 LetzSave Partner</span>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <a href="/" className="text-gray-600 hover:text-emerald-600">Feed</a>
            <a href="/orders" className="text-gray-600 hover:text-gray-900">My Orders</a>
            <a href="/restaurant/dashboard" className="text-emerald-600 font-bold">Dashboard</a>
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

      <main className="max-w-5xl mx-auto px-6 py-10 flex-grow w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.business_name || 'Restaurant Dashboard'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {profile?.address || 'Manage your surplus listings and customer pickups.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {checkingStripe ? (
              <span className="text-xs text-gray-400">Checking payout status...</span>
            ) : isStripeConnected ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
                ✓ Payouts Connected
              </span>
            ) : (
              <button
                onClick={handleConnectStripe}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
              >
                Connect Stripe for Payouts (85%)
              </button>
            )}

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
            >
              {isEditingProfile ? 'Cancel' : '⚙️ Edit Your Info'}
            </button>
          </div>
        </div>

        {/* Edit Profile Form Modal / Box */}
        {isEditingProfile && (
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Restaurant Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address (for Google Maps & Pickup)</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Publish Surplus Listing Form */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Publish Surplus Food Offer</h2>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Item / Bag Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surprise Pastry Box or Margherita Pizza"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Original Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.00"
                    value={originalPrice}
                    onChange={(e) => {
                      setOriginalPrice(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && !discountedPrice) {
                        setDiscountedPrice((val * 0.5).toFixed(2));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discounted Price (€, min 50% off)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="6.00"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Available</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Pickup Date & Time Window */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">From (Start Time)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">To (Expiration Time)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                {submitting ? 'Publishing...' : 'Publish Offer'}
              </button>
            </form>
          </div>

          {/* Verify Customer Pickup Code */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Verify Pickup Code</h2>
              <p className="text-xs text-gray-500 mb-4">
                Enter the 6-character code presented by the customer to mark their order as collected.
              </p>
              <form onSubmit={handleVerifyPickup} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 7K9X2M"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center font-mono text-xl font-bold uppercase tracking-widest"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
                >
                  Verify & Complete
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Active Listings Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Food Listings</h2>
          {listings.length === 0 ? (
            <p className="text-sm text-gray-500">You have not published any listings yet.</p>
          ) : (
            <div className="space-y-3">
              {listings.map((item) => {
                const isExpired = item.pickup_end && new Date(item.pickup_end) <= new Date();
                const windowStr = formatPickupWindow(item.pickup_start, item.pickup_end);
                const discountPercent = item.original_price > 0
                  ? Math.round(((item.original_price - item.discounted_price) / item.original_price) * 100)
                  : 50;

                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.title}</span>
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                        {isExpired && (
                          <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Expired
                          </span>
                        )}
                      </div>
                      {windowStr && (
                        <p className="text-xs text-amber-700 font-medium">🕒 {windowStr}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Price: <strong className="text-emerald-600">€{Number(item.discounted_price).toFixed(2)}</strong>{' '}
                        <span className="line-through text-gray-400">€{Number(item.original_price).toFixed(2)}</span> | Stock left: <strong>{item.quantity}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Orders Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Reservations</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders reserved yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const windowStr = formatPickupWindow(o.food_listings?.pickup_start, o.food_listings?.pickup_end);
                return (
                  <div
                    key={o.id}
                    className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          o.status === 'completed'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {o.status}
                      </span>
                      <p className="font-bold text-gray-900 mt-1">
                        {o.food_listings?.title || 'Order'} (x{o.quantity})
                      </p>
                      <p className="text-xs text-gray-500">Customer: {o.customer_email}</p>
                      {windowStr && <p className="text-xs text-amber-700 mt-0.5">🕒 {windowStr}</p>}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-center">
                      <p className="text-[10px] uppercase text-gray-500 font-semibold">Code</p>
                      <p className="font-mono font-bold text-lg text-gray-900">{o.pickup_code}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>© 2026 LetzSave Luxembourg. Rescuing food sustainably.</p>
        </div>
      </footer>
    </div>
  );
}