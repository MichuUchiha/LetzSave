import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { listingId, quantity, customerEmail } = await req.json();

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabase
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', listing.restaurant_id)
        .single();

      connectedAccountId = profile?.stripe_account_id;
    }

    // Safely determine base URL to prevent "Not a valid URL" errors
    const origin = req.headers.get('origin');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || origin || 'https://letzsave.lu';

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
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        listingId,
        quantity: parsedQuantity.toString(),
        customerEmail: customerEmail || '',
      },
    };

    if (customerEmail && typeof customerEmail === 'string' && customerEmail.trim() !== '') {
      sessionPayload.customer_email = customerEmail.trim();
    }

    if (connectedAccountId) {
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
    console.error('Checkout error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
