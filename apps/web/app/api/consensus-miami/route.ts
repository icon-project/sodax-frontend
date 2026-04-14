import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validate-email';

const NOTION_API_KEY = process.env.NOTION_CONSENSUS_MIAMI_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_CONSENSUS_MIAMI_DB_ID;

async function pushToNotion(data: {
  email: string;
  type: 'project' | 'retail';
  projectName?: string;
  role?: string;
}): Promise<void> {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.warn('[consensus-miami] Notion keys not configured — skipping CRM push');
    return;
  }

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: data.email } }] },
    Email: { email: data.email },
    Source: { select: { name: 'consensus-miami' } },
    Type: { select: { name: data.type } },
  };

  if (data.projectName) {
    properties['Project Name'] = { rich_text: [{ text: { content: data.projectName } }] };
  }

  if (data.role) {
    properties.Role = { select: { name: data.role } };
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
      properties,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[consensus-miami] Notion API error: ${res.status} ${body}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, type, projectName, role } = body as {
      email?: string;
      type?: string;
      projectName?: string;
      role?: string;
    };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (type !== 'project' && type !== 'retail') {
      return NextResponse.json({ error: 'Invalid type — must be "project" or "retail"' }, { status: 400 });
    }

    await pushToNotion({ email, type, projectName, role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[consensus-miami] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 });
  }
}
