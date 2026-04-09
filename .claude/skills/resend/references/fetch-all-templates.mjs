// Utility script to fetch and list all email templates from your Resend account.
// Paginates through the Resend API to retrieve every template. Run with:
//   RESEND_API_KEY=re_xxx node fetch-all-templates.mjs
// Requires: npm install resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function fetchAllTemplates() {
  const allTemplates = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const listParams = { limit: 100 };
    if (cursor) {
      listParams.after = cursor;
    }

    const { data, error } = await resend.templates.list(listParams);

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    allTemplates.push(...data.data);

    hasMore = data.has_more;
    if (hasMore && data.data.length > 0) {
      cursor = data.data[data.data.length - 1].id;
    }
  }

  return allTemplates;
}

const templates = await fetchAllTemplates();
console.log(`Fetched ${templates.length} templates`);
console.log(templates);
