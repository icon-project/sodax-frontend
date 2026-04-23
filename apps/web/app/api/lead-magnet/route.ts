import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isValidEmail } from '@/lib/validate-email';

// apps/web/app/api/lead-magnet/route.ts — POST handler for lead magnet signup (email + optional Turnstile)
/** Resend template ID for the lead-magnet delivery email (contains PDF attachment + "Builder's Guide" copy). */
const RESEND_TEMPLATE_ID = process.env.RESEND_LEAD_MAGNET_TEMPLATE_ID;
/** Notion internal integration token — scoped to the lead-magnet CRM database. */
const NOTION_API_KEY = process.env.NOTION_LEAD_MAGNET_TOKEN;
/** Notion database where each signup is logged as a row (Name, Email, Source columns). */
const NOTION_DATABASE_ID = process.env.NOTION_LEAD_MAGNET_DB_ID;
/** Cloudflare Turnstile server-side secret — used to verify the invisible challenge token. */
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
// Cache the PDF buffer at module level — it never changes and avoids re-reading 2.4 MB on every request
const pdfContent = readFileSync(join(process.cwd(), 'public', 'lead-magnet', 'sodax-builders-guide-to-defi.pdf'));
/** When `true` in development, Turnstile verification is skipped (localhost / PAT issues). Never use in production. */
const SKIP_TURNSTILE_IN_DEV =
  process.env.NODE_ENV === 'development' && process.env.LEAD_MAGNET_SKIP_TURNSTILE === 'true';
const TURNSTILE_REQUIRED = Boolean(TURNSTILE_SECRET_KEY) && !SKIP_TURNSTILE_IN_DEV;

async function verifyTurnstile(token: string): Promise<boolean> {
  // TURNSTILE_SECRET_KEY is guaranteed to exist — this function is only called when TURNSTILE_REQUIRED is true
  if (!TURNSTILE_SECRET_KEY) throw new Error('TURNSTILE_SECRET_KEY not configured');

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
  if (!process.env.RESEND_API_KEY || !RESEND_TEMPLATE_ID) {
    console.warn('[lead-magnet] RESEND_API_KEY or RESEND_LEAD_MAGNET_TEMPLATE_ID not configured — skipping email send');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    to: [email],
    attachments: [
      {
        filename: 'SODAX-Builders-Guide-to-Cross-Network-DeFi.pdf',
        content: pdfContent,
      },
    ],
    // `from` is configured in https://resend.com/templates(partnerships@sodax.com)
    template: { id: RESEND_TEMPLATE_ID },
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
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
        Name: { title: [{ text: { content: email } }] },
        Email: { email },
        Source: { select: { name: 'Lead Magnet (homepage)' } },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[lead-magnet] Notion API error: ${res.status} ${body}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, turnstileToken } = body as { email?: string; turnstileToken?: string };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (TURNSTILE_REQUIRED) {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Bot verification token required' }, { status: 400 });
      }
      const valid = await verifyTurnstile(turnstileToken);
      if (!valid) {
        return NextResponse.json({ error: 'Bot verification failed' }, { status: 403 });
      }
    }

    // Email delivery is critical; CRM push is best-effort
    const [emailResult, notionResult] = await Promise.allSettled([sendResendEmail(email), pushToNotion(email)]);

    if (notionResult.status === 'rejected') {
      console.error('[lead-magnet] Notion push failed:', notionResult.reason);
    }

    if (emailResult.status === 'rejected') {
      throw emailResult.reason;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the full error server-side; return a generic message to the client
    console.error('[lead-magnet] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 });
  }
}
