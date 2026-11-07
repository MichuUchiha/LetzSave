import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getTrustedBaseUrl(): string {
  let raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.letzsave.lu';

  raw = raw.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = raw.includes('localhost') ? `http://${raw}` : `https://${raw}`;
  }
  return raw;
}

export async function POST(req: Request) {
  try {
    const { listingId, quantity, customerEmail } = await req.json();

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('food_listings')
      .select('title, discounted_price, restaurant_id, quantity, pickup_end')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.pickup_end && new Date(listing.pickup_end) <= new Date()) {
      return NextResponse.json({ error: 'This offer has expired' }, { status: 400 });
    }

    if (parsedQuantity > listing.quantity) {
      return NextResponse.json({ error: 'Selected quantity exceeds available stock' }, { status: 400 });
    }

    let connectedAccountId = null;

    if (listing.restaurant_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', listing.restaurant_id)
        .single();

      connectedAccountId = profile?.stripe_account_id;
    }

    const baseUrl = getTrustedBaseUrl();
    const successUrl = `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/`;

    const unitAmount = Math.round(listing.discounted_price * 100);
    const totalAmount = unitAmount * parsedQuantity;
    const platformFee = Math.round(totalAmount * 0.15);

    const sessionPayload: any = {
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: listing.title },
            unit_amount: unitAmount,
          },
          quantity: parsedQuantity,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        listingId,
        quantity: parsedQuantity.toString(),
        customerEmail: customerEmail || '',
      },
    };

    if (customerEmail && typeof customerEmail === 'string' && customerEmail.trim() !== '') {
      sessionPayload.customer_email = customerEmail.trim();
    }

    if (connectedAccountId && connectedAccountId.startsWith('acct_')) {
      sessionPayload.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: connectedAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return NextResponse.json({ url: session.url });
 } catch (error: any) {
    console.error('Checkout error details:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}