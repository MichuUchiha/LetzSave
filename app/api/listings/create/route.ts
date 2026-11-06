import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
  try {
    // 1. Verify the caller's Bearer JWT token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
    }

   // 2. Verify the caller is an authorized AND verified restaurant in the database
 const { data: callerProfile, error: roleError } = await supabaseAdmin
   .from('profiles')
   .select('role, is_verified, business_name')
   .eq('id', user.id)
   .single();

 if (roleError || !callerProfile || callerProfile.role !== 'restaurant' || !callerProfile.is_verified) {
   return NextResponse.json(
     { error: 'Forbidden: Only verified restaurant partners can publish listings' },
     { status: 403 }
   );
 }

    // 3. Parse and validate request payload (ignore any client-supplied restaurantId)
    const body = await req.json();
    const { title, originalPrice, discountedPrice, quantity, pickupStart, pickupEnd } = body;

    const origPriceNum = Number(originalPrice);
    const discPriceNum = Number(discountedPrice);
    const qtyNum = Number(quantity);

    if (
      !title ||
      typeof title !== 'string' ||
      isNaN(origPriceNum) || origPriceNum <= 0 ||
      isNaN(discPriceNum) || discPriceNum <= 0 ||
      discPriceNum >= origPriceNum ||
      !Number.isInteger(qtyNum) || qtyNum <= 0
    ) {
      return NextResponse.json({ error: 'Invalid listing parameters' }, { status: 400 });
    }

    // 4. Insert the listing tied strictly to the authenticated user.id
    const { data: listing, error: insertError } = await supabaseAdmin
      .from('food_listings')
      .insert({
        restaurant_id: user.id,
        title: title.trim(),
        original_price: origPriceNum,
        discounted_price: discPriceNum,
        quantity: qtyNum,
        pickup_start: pickupStart,
        pickup_end: pickupEnd,
      })
      .select('*, profiles(business_name, address)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 5. Fetch customer emails
    const { data: customerProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('role', 'customer');

    if (profileError) {
      console.error('Error fetching customer profiles:', profileError.message);
    }

    const safeTitle = escapeHtml(title.trim());
    const safeRestaurantName = escapeHtml(listing.profiles?.business_name || callerProfile.business_name || 'A local partner');
    const recipientEmails = customerProfiles?.map((p) => p.email).filter(Boolean) || [];

    // 6. Send emails via Resend if recipients exist
    if (recipientEmails.length > 0) {
      try {
        await resend.emails.send({
          from: 'LetzSave <noreply@letzsave.lu>',
          to: ['noreply@letzsave.lu'],
          bcc: recipientEmails,
          subject: `🌱 New Surplus Deal: ${title.trim()} at ${listing.profiles?.business_name || 'LetzSave'}!`,
          html: `
            <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #059669; margin-top: 0;">New Surplus Food Available!</h2>
              <p><strong>${safeRestaurantName}</strong> just published a new surplus listing:</p>
              
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 18px;">${safeTitle}</h3>
                <p style="margin: 4px 0;">Price: <strong style="color: #059669;">€${discPriceNum.toFixed(2)}</strong> <span style="text-decoration: line-through; color: #6b7280;">€${origPriceNum.toFixed(2)}</span></p>
                <p style="margin: 4px 0;">Quantity available: <strong>${qtyNum} bag(s)</strong></p>
              </div>

              <p style="margin-bottom: 24px;">Click below to view and claim it on the platform:</p>
              <a href="https://www.letzsave.lu/" style="display: inline-block; background: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Visit LetzSave Feed</a>
            </div>
          `,
        });
      } catch (emailErr: any) {
        console.error('RESEND CRITICAL ERROR:', emailErr);
        return NextResponse.json({ error: 'Listing created, but email failed: ' + emailErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, listing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}