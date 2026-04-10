// Receives delivery status callbacks from Resend.
// When we send a lead-magnet email via Resend, Resend later tells us what happened to it
// (delivered, bounced, or complained) by POSTing an event to this endpoint.
// We verify the request is genuinely from Resend, then update the lead's Status in the Notion CRM.

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { WebhookEventPayload } from 'resend';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
const NOTION_API_KEY = process.env.NOTION_LEAD_MAGNET_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_LEAD_MAGNET_DB_ID;

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Verify that the incoming request is genuinely from Resend (not spoofed).
 * Resend signs every webhook with svix headers — we check the signature against our secret.
 * Returns the parsed event payload if valid, throws if the signature doesn't match.
 */
function verifyWebhook(payload: string, headers: Headers): WebhookEventPayload {
  if (!RESEND_WEBHOOK_SECRET) {
    throw new Error('RESEND_WEBHOOK_SECRET not configured');
  }

  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing svix headers');
  }

  return resend.webhooks.verify({
    payload,
    headers: {
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
    },
    webhookSecret: RESEND_WEBHOOK_SECRET,
  });
}

/**
 * Find the lead in Notion by email and update their Status select field.
 * This lets the BD team see at a glance which leads got the email vs. which bounced.
 */
async function updateNotionStatus(email: string, status: string): Promise<void> {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) return;

  // Step 1: Query the Notion database to find the row matching this email
  const searchRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: {
        property: 'Email',
        email: { equals: email },
      },
      page_size: 1,
    }),
  });

  if (!searchRes.ok) {
    console.error(`[resend-webhook] Notion query failed: ${searchRes.status}`);
    return;
  }

  const searchData = await searchRes.json();
  const page = searchData.results?.[0];
  if (!page) {
    console.warn(`[resend-webhook] No Notion page found for ${email}`);
    return;
  }

  // Step 2: Patch the Status field on that row (e.g. "Delivered", "Bounced", "Complained")
  const updateRes = await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      properties: {
        Status: { select: { name: status } },
      },
    }),
  });

  if (!updateRes.ok) {
    const body = await updateRes.text();
    console.error(`[resend-webhook] Notion update failed: ${updateRes.status} ${body}`);
  }
}

// POST /api/webhooks/resend — called by Resend whenever an email event fires
export async function POST(request: Request) {
  try {
    // Read the raw body (needed for signature verification — can't parse JSON first)
    const rawBody = await request.text();
    const event = verifyWebhook(rawBody, request.headers);

    const { type, data } = event;
    const email = 'to' in data ? data.to?.[0] : undefined;

    console.log(`[resend-webhook] ${type} for ${email ?? 'unknown'}`);

    // Update the Notion CRM based on what happened to the email
    switch (type) {
      case 'email.delivered':
        if (email) await updateNotionStatus(email, 'Delivered');
        break;
      case 'email.bounced':
        if (email) await updateNotionStatus(email, 'Bounced');
        break;
      case 'email.complained':
        if (email) await updateNotionStatus(email, 'Complained');
        break;
      default:
        console.log(`[resend-webhook] Unhandled event type: ${type}`);
    }

    // Always return 200 so Resend knows we received it (otherwise it retries)
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[resend-webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }
}
