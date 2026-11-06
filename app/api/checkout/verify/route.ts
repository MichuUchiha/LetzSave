import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid sessionId' }, { status: 400 });
    }

    // 1. Check if this order was already created (by webhook or previous verify call)
    const { data: existingOrders } = await supabaseAdmin
      .from('orders')
      .select('pickup_code')
      .eq('stripe_session_id', sessionId)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json({ pickupCode: existingOrders[0].pickup_code });
    }

    // 2. Fetch the checkout session directly from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { listingId, quantity, customerEmail } = session.metadata || {};
    const parsedQty = parseInt(quantity || '1', 10);
    const email = session.customer_details?.email || customerEmail || 'guest@letzsave.lu';
    const pickupCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // 3. Insert the order with stripe_session_id (NO fallback without stripe_session_id!)
    const { error: insertError } = await supabaseAdmin.from('orders').insert({
      listing_id: listingId,
      customer_email: email,
      quantity: parsedQty,
      pickup_code: pickupCode,
      stripe_session_id: sessionId,
      status: 'pending',
    });

    if (insertError) {
      // If a concurrent request or webhook just inserted it, fetch and return that pickup_code
      const { data: retryOrder } = await supabaseAdmin
        .from('orders')
        .select('pickup_code')
        .eq('stripe_session_id', sessionId)
        .limit(1);

      if (retryOrder && retryOrder.length > 0) {
        return NextResponse.json({ pickupCode: retryOrder[0].pickup_code });
      }
      return NextResponse.json({ error: 'Could not record order' }, { status: 500 });
    }

    // 4. Decrease the listing stock only once when the insert above succeeds
    if (listingId) {
      const { data: listing } = await supabaseAdmin
        .from('food_listings')
        .select('quantity')
        .eq('id', listingId)
        .maybeSingle();

      if (listing && typeof listing.quantity === 'number') {
        const newStock = Math.max(0, listing.quantity - parsedQty);
        await supabaseAdmin
          .from('food_listings')
          .update({ quantity: newStock })
          .eq('id', listingId);
      }
    }

    return NextResponse.json({ pickupCode });
  } catch (err: any) {
    console.error('Order verification error:', err.message);
    return NextResponse.json({ error: 'Order verification failed' }, { status: 500 });
  }
}