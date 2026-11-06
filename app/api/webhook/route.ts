import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const sessionId = session.id;
    const listingId = session.metadata?.listingId;
    const userId = session.metadata?.userId || null;
    const quantity = parseInt(session.metadata?.quantity || '1', 10);
    const emailToSave = (
      session.metadata?.customerEmail ||
      session.customer_details?.email ||
      session.customer_email ||
      'guest@letzsave.lu'
    ).trim().toLowerCase();

    if (listingId && sessionId) {
      // 1. Idempotency check: exit immediately if /api/checkout/verify or a prior webhook already processed this session
      const { data: existingOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        return NextResponse.json({ received: true, status: 'already_processed' });
      }

      const pickupCode = crypto.randomBytes(3).toString('hex').toUpperCase();

      const orderPayload: any = {
        listing_id: listingId,
        customer_email: emailToSave,
        quantity: quantity,
        pickup_code: pickupCode,
        stripe_session_id: sessionId,
        status: 'pending',
      };

      if (userId) {
        orderPayload.user_id = userId;
      }

      // 2. Insert order FIRST before reducing stock
      let { error: orderError } = await supabaseAdmin.from('orders').insert(orderPayload);

      if (orderError && userId) {
        delete orderPayload.user_id;
        const retry = await supabaseAdmin.from('orders').insert(orderPayload);
        orderError = retry.error;
      }

      // If insert failed because a concurrent request just inserted this stripe_session_id, stop here so stock isn't double-reduced
      if (orderError) {
        console.error('Order insert skipped/failed:', orderError.message);
        return NextResponse.json({ received: true });
      }

      // 3. Subtract stock ONLY once when the order insert succeeds
      const { data: listing } = await supabaseAdmin
        .from('food_listings')
        .select('quantity')
        .eq('id', listingId)
        .maybeSingle();

      if (listing && typeof listing.quantity === 'number') {
        const newStock = Math.max(0, listing.quantity - quantity);
        await supabaseAdmin
          .from('food_listings')
          .update({ quantity: newStock })
          .eq('id', listingId);
      }
    }
  }

  return NextResponse.json({ received: true });
}