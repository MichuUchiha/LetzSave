import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, fullName } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userName = fullName || 'there';

    const emailResponse = await resend.emails.send({
      from: 'LetzSave <noreply@letzsave.lu>',
      to: [email],
      subject: '🌱 Welcome to LetzSave!',
      html: `
        <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #059669; margin-top: 0;">Welcome to LetzSave, ${userName}!</h2>
          <p>We are thrilled to have you on board. You're now part of a community fighting food waste in Luxembourg.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #065f46;">Whenever local restaurants publish surplus food packages at a 50% discount, you'll be the first to know so you can grab them before they sell out.</p>
          </div>

          <p style="margin-bottom: 24px;">Head over to the platform to check out active listings:</p>
          <a href="https://www.letzsave.lu/" style="display: inline-block; background: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Explore LetzSave Feed</a>
        </div>
      `,
    });

    return NextResponse.json({ success: true, emailResponse });
  } catch (err: any) {
    console.error('WELCOME EMAIL ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}