import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'LU',
        email: email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'company',
      });

      accountId = account.id;

      // Update Supabase and verify the result
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to save stripe_account_id to Supabase:', updateError.message);
      } else {
        console.log('✅ stripe_account_id saved to Supabase:', accountId);
      }
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/restaurant/dashboard`,
      return_url: `${origin}/restaurant/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect onboarding error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}