import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Use the Service Role Key for server-side admin operations (bypasses RLS safely in webhooks)
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
    const listingId = session.metadata?.listingId;
    const userId = session.metadata?.userId || null;
    const quantity = parseInt(session.metadata?.quantity || '1', 10);
    const emailToSave = (
      session.metadata?.customerEmail ||
      session.customer_details?.email ||
      session.customer_email ||
      ''
    ).trim().toLowerCase();

    if (listingId) {
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let pickupCode = '';
      for (let i = 0; i < 6; i++) {
        pickupCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Use supabaseAdmin here
      const { data: listing } = await supabaseAdmin
        .from('food_listings')
        .select('quantity')
        .eq('id', listingId)
        .single();

      if (listing) {
        const newStock = Math.max(0, listing.quantity - quantity);
        await supabaseAdmin
          .from('food_listings')
          .update({ quantity: newStock })
          .eq('id', listingId);
      }

      const orderPayload: any = {
        listing_id: listingId,
        customer_name: session.customer_details?.name || 'Customer',
        customer_email: emailToSave,
        quantity: quantity,
        pickup_code: pickupCode,
        status: 'reserved',
      };

      if (userId) {
        orderPayload.user_id = userId;
      }

      // Use supabaseAdmin here
      const { error: orderError } = await supabaseAdmin.from('orders').insert(orderPayload);

      if (orderError) {
        console.error('Primary order insert failed, retrying without user_id:', orderError.message);
        delete orderPayload.user_id;
        await supabaseAdmin.from('orders').insert(orderPayload);
      }
    }
  }

  return NextResponse.json({ received: true });
}