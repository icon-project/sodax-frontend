// API route: /api/roadmap/[protocol]
// Called by the BD page when you type a protocol name and hit Generate.
// Looks up the protocol in our Notion database and returns its Roadmap JSON field.

import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
// Set NOTION_ROADMAP_DB_ID in your .env file (staging and prod can use different databases).
const NOTION_ROADMAP_DB_ID = process.env.NOTION_ROADMAP_DB_ID;

export async function GET(_req: Request, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;

  if (!NOTION_TOKEN) {
    return NextResponse.json({ error: 'missing NOTION_TOKEN' }, { status: 500 });
  }

  if (!NOTION_ROADMAP_DB_ID) {
    return NextResponse.json({ error: 'missing NOTION_ROADMAP_DB_ID' }, { status: 500 });
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_ROADMAP_DB_ID}/query`, {
    method: 'POST',
    // cache: 'no-store' tells Next.js NOT to cache this request.
    // Without it, Next.js would cache the Notion response and you'd see stale data
    // even after updating the Roadmap JSON field in Notion.
    // This is important for a BD tool where you update Notion cards frequently.
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    // Search Notion for a card whose "Company Name" contains the protocol name.
    // page_size: 1 means we only take the first match.
    body: JSON.stringify({
      filter: {
        property: 'Company Name',
        title: { contains: protocol },
      },
      page_size: 1,
    }),
  });

  const data = await res.json();
  const page = data.results?.[0];

  if (!page) {
    // No Notion card found — the roadmap will fall back to category defaults.
    return NextResponse.json({ error: 'protocol not found', searched: protocol });
  }

  // Read the raw JSON string from the "Roadmap JSON" property on the Notion card.
  const raw = page.properties['Roadmap JSON']?.rich_text?.[0]?.plain_text;

  if (!raw) {
    // Card exists but the Roadmap JSON field is empty.
    return NextResponse.json({ error: 'Roadmap JSON field is empty on this card' });
  }

  try {
    // Parse and return the JSON — this is what the frontend receives as `data`.
    return NextResponse.json(JSON.parse(raw));
  } catch {
    // The field contains text that isn't valid JSON — surface the raw value to help debug.
    return NextResponse.json({ error: 'invalid JSON in Roadmap JSON field', raw });
  }
}
