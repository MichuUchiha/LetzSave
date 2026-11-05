import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, title, originalPrice, discountedPrice, quantity, pickupStart, pickupEnd } = body;

    // 1. Insert the listing into Supabase
    const { data: listing, error: insertError } = await supabaseAdmin
      .from('food_listings')
      .insert({
        restaurant_id: restaurantId,
        title,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        quantity,
        pickup_start: pickupStart,
        pickup_end: pickupEnd,
      })
      .select('*, profiles(business_name, address)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

   // 2. Fetch all customer profile emails from Supabase
    const { data: customerProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('role', 'customer'); // Assuming you store user roles ('customer' vs 'restaurant')
    // For a school project, you can fetch user emails from Supabase Auth admin API or a subscriber list.
    // Here we fetch user profiles or target test emails.
    const restaurantName = listing.profiles?.business_name || 'A local partner';
    const discountAmount = (originalPrice - discountedPrice).toFixed(2);
    const recipientEmails = customerProfiles?.map((p) => p.email).filter(Boolean) || ['michals7768@gmail.com'];
    // 3. Send emails asynchronously via Resend
    // Note: In test mode, Resend allows sending to your own verified email. For production domain verification is required.
  try {
      await resend.emails.send({
        from: 'LetzSave <onboarding@resend.dev>',
        to: recipientEmails,
        subject: `🌱 New Surplus Deal at ${restaurantName}!`,
        html: `
         <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #059669; margin-top: 0;">New Surplus Food Available!</h2>
            <p><strong>${restaurantName}</strong> just published a new surplus listing:</p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 18px;">${title}</h3>
              <p style="margin: 4px 0;">Price: <strong style="color: #059669;">€${discountedPrice.toFixed(2)}</strong> <span style="text-decoration: line-through; color: #6b7280;">€${originalPrice.toFixed(2)}</span></p>
              <p style="margin: 4px 0;">Quantity available: <strong>${quantity} bag(s)</strong></p>
            </div>

            <p style="margin-bottom: 24px;">Click below to view and claim it on the platform:</p>
            <a href="https://www.letzsave.lu/" style="display: inline-block; background: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Visit LetzSave Feed</a>
          </div>
        `,
      });
    } catch (emailErr: any) {
      console.error('Email dispatch error:', emailErr);
      // Return the error so your browser alert shows why it failed!
      return NextResponse.json({ error: 'Listing created, but email failed: ' + emailErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, listing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
