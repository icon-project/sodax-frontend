// Receives delivery status callbacks from Resend.
// When we send a lead-magnet email via Resend, Resend later tells us what happened to it
// (delivered, bounced, or complained) by POSTing an event to this endpoint.
// We verify the request is genuinely from Resend, then log the event.

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { WebhookEventPayload } from 'resend';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

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

  // Create Resend instance at call time (not module level) so the build doesn't fail
  // when RESEND_API_KEY isn't available during static page collection
  const resend = new Resend(process.env.RESEND_API_KEY);

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

// POST /api/webhooks/resend — called by Resend whenever an email event fires
export async function POST(request: Request) {
  try {
    // Read the raw body (needed for signature verification — can't parse JSON first)
    const rawBody = await request.text();

    // In development, skip signature verification so we can test with curl
    const event =
      process.env.NODE_ENV === 'development'
        ? (JSON.parse(rawBody) as WebhookEventPayload)
        : verifyWebhook(rawBody, request.headers);

    const { type, data } = event;
    const email = 'to' in data ? data.to?.[0] : undefined;

    console.log(`[resend-webhook] ${type} for ${email ?? 'unknown'}`);

    // Always return 200 so Resend knows we received it (otherwise it retries)
    return NextResponse.json({ received: true });
  } catch (error) {
    // Return 200 even on error — returning 4xx causes Resend to retry indefinitely.
    // A misconfigured secret or bad payload shouldn't trigger a retry storm.
    console.error('[resend-webhook] Error:', error);
    return NextResponse.json({ received: true });
  }
}
