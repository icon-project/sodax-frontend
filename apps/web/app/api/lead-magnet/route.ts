import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_LEAD_MAGNET_DB_ID;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true; // Skip verification if key not configured

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const data = await res.json();
  return data.success === true;
}

async function sendResendEmail(email: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[lead-magnet] RESEND_API_KEY not configured — skipping email send');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SODAX <hello@sodax.com>',
      to: [email],
      subject: "The Builder's Guide to Cross-Network DeFi",
      html: `<p>Thanks for your interest in SODAX!</p>
<p>Here's your copy of <strong>The Builder's Guide to Cross-Network DeFi</strong>.</p>
<p><a href="https://sodax.com/lead-magnet/sodax-quickstart.pdf">Download the guide</a></p>
<p>— The SODAX Team</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error: ${res.status} ${body}`);
  }
}

async function pushToNotion(email: string): Promise<void> {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.warn('[lead-magnet] Notion keys not configured — skipping CRM push');
    return;
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Email: { email },
        Source: { select: { name: 'Homepage Lead Magnet' } },
        Date: { date: { start: new Date().toISOString() } },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[lead-magnet] Notion API error: ${res.status} ${body}`);
    // Don't throw — CRM failure shouldn't block the user
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, turnstileToken } = body as { email?: string; turnstileToken?: string };

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Verify Turnstile if token provided and secret configured
    if (turnstileToken && TURNSTILE_SECRET_KEY) {
      const valid = await verifyTurnstile(turnstileToken);
      if (!valid) {
        return NextResponse.json({ error: 'Bot verification failed' }, { status: 403 });
      }
    }

    // Send email and push to CRM in parallel
    await Promise.all([sendResendEmail(email), pushToNotion(email)]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[lead-magnet] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
