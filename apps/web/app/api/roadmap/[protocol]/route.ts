//the API route that reads from that Notion field and returns structured JSON to your frontend. Blocked right now by the missing token, but the code is correct.
import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = '2cd8c1d2979c808180a3cd4bee55dbb1';

export async function GET(_req: Request, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;

  if (!NOTION_TOKEN) {
    return NextResponse.json({ error: 'missing NOTION_TOKEN' }, { status: 500 });
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
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
    return NextResponse.json({ error: 'protocol not found', searched: protocol });
  }

  const raw = page.properties['Roadmap JSON']?.rich_text?.[0]?.plain_text;

  if (!raw) {
    return NextResponse.json({ error: 'Roadmap JSON field is empty on this card' });
  }

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: 'invalid JSON in Roadmap JSON field', raw });
  }
}
