import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Use Service Role Key if available to bypass RLS, otherwise fallback to standard client
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase;

    // 1. Check if this order was already created (prevents duplicate stock reduction on page refresh)
    const { data: existingOrders } = await db
      .from('orders')
      .select('pickup_code')
      .eq('stripe_session_id', sessionId)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json({ pickupCode: existingOrders[0].pickup_code });
    }

    // 2. Fetch the checkout session directly from Stripe using the same secret key that created it
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { listingId, quantity, customerEmail } = session.metadata || {};
    const parsedQty = parseInt(quantity || '1', 10);
    const email = session.customer_details?.email || customerEmail || 'guest@letzsave.lu';
    const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Insert the order into Supabase (fallback if stripe_session_id column doesn't exist)
    const { error: insertError } = await db.from('orders').insert({
      listing_id: listingId,
      customer_email: email,
      quantity: parsedQty,
      pickup_code: pickupCode,
      stripe_session_id: sessionId,
      status: 'pending',
    });

    if (insertError) {
      const { error: fallbackError } = await db.from('orders').insert({
        listing_id: listingId,
        customer_email: email,
        quantity: parsedQty,
        pickup_code: pickupCode,
        status: 'pending',
      });

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
    }

    // 4. Decrease the listing stock in food_listings
    if (listingId) {
      const { data: listing } = await db
        .from('food_listings')
        .select('quantity')
        .eq('id', listingId)
        .maybeSingle();

      if (listing && typeof listing.quantity === 'number') {
        const newStock = Math.max(0, listing.quantity - parsedQty);
        await db
          .from('food_listings')
          .update({ quantity: newStock })
          .eq('id', listingId);
      }
    }

    return NextResponse.json({ pickupCode });
  } catch (err: any) {
    console.error('Order verification error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
