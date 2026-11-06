import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

// Must use the Service Role key here because the new SQL trigger blocks the anon/user client from updating stripe_account_id
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Extract the Bearer token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
    }

    // 2. Verify the JWT against Supabase Auth and get the real user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
    }

    // 3. Verify the caller is a verified restaurant (prevents customers or unapproved applicants from creating Stripe accounts)
    const { data: profile, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, role, is_verified')
      .eq('id', user.id)
      .single();

    if (selectError || !profile) {
      console.error('❌ Failed to fetch profile:', selectError?.message);
      return NextResponse.json({ error: 'Failed to read user profile' }, { status: 500 });
    }

    if (profile.role !== 'restaurant' || !profile.is_verified) {
      return NextResponse.json(
        { error: 'Forbidden: Only verified restaurant partners can connect Stripe' },
        { status: 403 }
      );
    }

    let accountId = profile.stripe_account_id;

    // 4. Create the Stripe Express account if not already linked
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'LU',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'company',
      });

      accountId = account.id;

      // 5. Save the new Stripe account ID using supabaseAdmin
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Failed to save stripe_account_id to Supabase:', updateError.message);
        return NextResponse.json({ error: 'Failed to link Stripe account to profile' }, { status: 500 });
      }
      console.log('✅ stripe_account_id saved to Supabase:', accountId);
    }

    // 6. Generate onboarding link using trusted base URL
    const allowedOrigin = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.letzsave.lu')
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\/+$/, '');

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${allowedOrigin}/restaurant/dashboard`,
      return_url: `${allowedOrigin}/restaurant/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect onboarding error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}