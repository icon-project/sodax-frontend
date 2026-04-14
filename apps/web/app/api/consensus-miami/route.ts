import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validate-email';

const NOTION_API_KEY = process.env.NOTION_CONSENSUS_MIAMI_TOKEN;
const NOTION_CONTACTS_DB_ID = process.env.NOTION_CONSENSUS_MIAMI_DB_ID;
const NOTION_COMPANIES_DB_ID = process.env.NOTION_BD_CRM_COMPANIES_DB_ID;

const NOTION_HEADERS = {
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
};

function notionHeaders(): Record<string, string> {
  return { ...NOTION_HEADERS, Authorization: `Bearer ${NOTION_API_KEY}` };
}

/** Create a company in the BD CRM Companies DB. Returns the new page ID. */
async function createCompany(name: string): Promise<string | null> {
  if (!NOTION_API_KEY || !NOTION_COMPANIES_DB_ID) return null;

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: NOTION_COMPANIES_DB_ID },
      properties: {
        'Company Name': { title: [{ text: { content: name } }] },
        'Lead Source': { select: { name: 'Conference' } },
        Status: { select: { name: 'Newly Added' } },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[consensus-miami] Notion Companies API error: ${res.status} ${body}`);
    return null;
  }

  const data = await res.json();
  return data.id;
}

async function createContact(data: {
  email: string;
  type: 'project' | 'retail';
  projectName?: string;
  role?: string;
}): Promise<void> {
  if (!NOTION_API_KEY || !NOTION_CONTACTS_DB_ID) {
    console.warn('[consensus-miami] Notion keys not configured — skipping CRM push');
    return;
  }

  // If a project name is provided, create the company first to get a linkable ID
  let companyPageId: string | null = null;
  if (data.projectName) {
    companyPageId = await createCompany(data.projectName);
  }

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: data.email } }] },
    Email: { email: data.email },
    Source: { select: { name: 'Consensus Miami 2026' } },
    'Relationship Strength': { select: { name: 'Cold' } },
    Notes: { rich_text: [{ text: { content: `Type: ${data.type}` } }] },
  };

  if (data.role) {
    properties['Title/Role'] = { rich_text: [{ text: { content: data.role } }] };
  }

  if (companyPageId) {
    properties['Company (linked)'] = { relation: [{ id: companyPageId }] };
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: NOTION_CONTACTS_DB_ID },
      properties,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[consensus-miami] Notion Contacts API error: ${res.status} ${body}`);
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

    await createContact({ email, type, projectName, role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[consensus-miami] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 });
  }
}
