import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_account_id) {
      return NextResponse.json({ connected: false });
    }

    // Query Stripe API directly to check actual onboarding completeness
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const isFullyConnected = Boolean(account.details_submitted && account.charges_enabled);

    return NextResponse.json({ connected: isFullyConnected });
  } catch (err: any) {
    console.error('Error checking Stripe status:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}