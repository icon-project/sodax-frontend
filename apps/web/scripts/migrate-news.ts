#!/usr/bin/env tsx
/**
 * Migration Script: Payload CMS to Custom SODAX CMS
 *
 * This script migrates news posts from the old Payload CMS to the new custom CMS.
 *
 * Run: pnpm tsx scripts/migrate-news.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { MongoClient, type ObjectId } from 'mongodb';
import { list } from '@vercel/blob';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Database URIs
const OLD_DB_URI = process.env.DATABASE_URI_OLD!;
const NEW_DB_URI = process.env.DATABASE_URI!;

// Payload CMS Types (old structure)
interface PayloadPost {
  _id: ObjectId;
  title: string;
  slug: string;
  meta: {
    title: string;
    description: string;
    image?: ObjectId;
  };
  heroImage?: ObjectId;
  content: {
    root: {
      children: any[];
    };
  };
  publishedAt?: Date;
  _status: 'published' | 'draft';
  authors?: ObjectId[];
  categories?: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

interface PayloadMedia {
  _id: ObjectId;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  url?: string;
}

// New CMS Types
interface NewsArticle {
  title: string;
  slug: string;
  content: string; // HTML from Tiptap/Payload conversion
  excerpt: string;
  image?: string; // URL to the image
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  authorName: string;
  tags: string[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts Payload's Lexical Editor JSON to HTML
 * This is a simplified converter - adjust as needed based on your content
 */
function lexicalToHTML(lexicalJSON: any): string {
  if (!lexicalJSON?.root?.children) return '';

  const processNode = (node: any): string => {
    // Handle text nodes
    if (node.type === 'text') {
      let text = node.text || '';

      // Apply formatting
      if (node.format) {
        if (node.format === 1 || node.format === 'bold') text = `<strong>${text}</strong>`;
        if (node.format === 2 || node.format === 'italic') text = `<em>${text}</em>`;
        if (node.format === 8 || node.format === 'underline') text = `<u>${text}</u>`;
      }

      return text;
    }

    // Handle paragraph nodes
    if (node.type === 'paragraph') {
      const children = node.children?.map(processNode).join('') || '';
      return `<p>${children}</p>`;
    }

    // Handle heading nodes
    if (node.type === 'heading') {
      const tag = node.tag || 'h2';
      const children = node.children?.map(processNode).join('') || '';
      return `<${tag}>${children}</${tag}>`;
    }

    // Handle list nodes
    if (node.type === 'list') {
      const tag = node.listType === 'bullet' ? 'ul' : 'ol';
      const children = node.children?.map(processNode).join('') || '';
      return `<${tag}>${children}</${tag}>`;
    }

    // Handle list item nodes
    if (node.type === 'listitem') {
      const children = node.children?.map(processNode).join('') || '';
      return `<li>${children}</li>`;
    }

    // Handle link nodes
    if (node.type === 'link') {
      const children = node.children?.map(processNode).join('') || '';
      const url = node.fields?.url || '#';
      const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}"${target}>${children}</a>`;
    }

    // Handle horizontal rule
    if (node.type === 'horizontalrule') {
      return '<hr />';
    }

    // Handle line break
    if (node.type === 'linebreak') {
      return '<br />';
    }

    // Handle blockquote
    if (node.type === 'quote') {
      const children = node.children?.map(processNode).join('') || '';
      return `<blockquote>${children}</blockquote>`;
    }

    // Handle code block
    if (node.type === 'code' || node.fields?.blockType === 'code') {
      const children = node.children?.map(processNode).join('') || '';
      const code = node.fields?.code || children;
      const language = node.fields?.language || '';
      return `<pre><code class="language-${language}">${code}</code></pre>`;
    }

    // Default: process children if they exist
    if (node.children) {
      return node.children.map(processNode).join('');
    }

    return '';
  };

  try {
    return lexicalJSON.root.children.map(processNode).join('\n');
  } catch (error) {
    console.error('Error converting Lexical to HTML:', error);
    return '';
  }
}

/**
 * Create excerpt from HTML content
 */
function createExcerpt(html: string, maxLength = 200): string {
  // Strip HTML tags
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Main migration function
 */
async function migrateNews() {
  console.log('🚀 Starting news migration from Payload CMS to SODAX CMS...\n');

  // Connect to old database
  console.log('📡 Connecting to old Payload CMS database...');
  const oldClient = new MongoClient(OLD_DB_URI);
  await oldClient.connect();
  const oldDb = oldClient.db('test');

  // Connect to new database
  console.log('📡 Connecting to new SODAX CMS database...');
  const newClient = new MongoClient(NEW_DB_URI);
  await newClient.connect();
  const newDb = newClient.db('sodax-cms');

  try {
    // Fetch Vercel Blob images
    console.log('\n🖼️  Fetching images from Vercel Blob...');
    const { blobs } = await list();
    console.log(`   Found ${blobs.length} files in Vercel Blob`);

    // Create a map of filename -> URL for quick lookup
    const blobUrlMap = new Map<string, string>();
    for (const blob of blobs) {
      // Extract filename from the blob pathname
      const filename = blob.pathname.split('/').pop() || blob.pathname;
      blobUrlMap.set(filename, blob.url);
    }
    console.log(`   Mapped ${blobUrlMap.size} image URLs\n`);
    // Fetch all posts from old database
    console.log('\n📥 Fetching posts from old database...');
    const posts = await oldDb.collection<PayloadPost>('posts').find({}).sort({ publishedAt: -1 }).toArray();

    console.log(`   Found ${posts.length} posts\n`);

    // Fetch media for image resolution
    console.log('📥 Fetching media from old database...');
    const media = await oldDb.collection<PayloadMedia>('media').find({}).toArray();

    const mediaMap = new Map(media.map(m => [m._id.toString(), m]));
    console.log(`   Found ${media.length} media files\n`);

    // Check existing news in new database
    const existingNews = await newDb
      .collection('news')
      .find({}, { projection: { slug: 1 } })
      .toArray();

    const existingSlugs = new Set(existingNews.map(n => n.slug));
    console.log(`   Found ${existingSlugs.size} existing articles in new database\n`);

    // Transform and insert
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Skip if already exists
        if (existingSlugs.has(post.slug)) {
          console.log(`   ⏭️  Skipping "${post.title}" (already exists)`);
          skippedCount++;
          continue;
        }

        // Note: Images will be manually uploaded through CMS after migration
        // Left as undefined for now

        // Get image URL from Vercel Blob
        let imageUrl: string | undefined;
        const imageId = post.heroImage || post.meta.image;
        if (imageId) {
          const mediaFile = mediaMap.get(imageId.toString());
          if (mediaFile) {
            // Try to find the image in Vercel Blob by filename
            imageUrl = blobUrlMap.get(mediaFile.filename);

            if (!imageUrl) {
              console.log(`   ⚠️  Image not found in Vercel Blob: ${mediaFile.filename}`);
            }
          }
        }

        // Convert content
        const htmlContent = lexicalToHTML(post.content);
        const excerpt = post.meta.description || createExcerpt(htmlContent);

        // Create new article
        const newArticle: NewsArticle = {
          title: post.title,
          slug: post.slug,
          content: htmlContent,
          excerpt,
          image: imageUrl, // From Vercel Blob
          metaTitle: post.meta.title || post.title,
          metaDescription: post.meta.description,
          published: post._status === 'published',
          publishedAt: post.publishedAt,
          authorId: 'migration-script',
          authorName: 'SODAX Team',
          tags: [],
          categories: [], // You can map categories if needed
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };

        // Insert into new database
        await newDb.collection('news').insertOne(newArticle);

        console.log(`   ✅ Migrated: "${post.title}"`);
        migratedCount++;
      } catch (error) {
        console.error(`   ❌ Error migrating "${post.title}":`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped:  ${skippedCount}`);
    console.log(`   ❌ Errors:   ${errorCount}`);
    console.log(`   📝 Total:    ${posts.length}`);
    console.log('='.repeat(60) + '\n');

    if (migratedCount > 0) {
      console.log('🎉 Migration completed successfully!\n');
      console.log('⚠️  NEXT STEPS:');
      console.log('   1. ✅ Review the migrated content in the CMS');
      console.log('   2. 🖼️  Check that images are displaying correctly');
      console.log('   3. 🏷️  Add categories and tags as needed');
      console.log('   4. 👤 Update author information if needed');
      console.log('   5. 📸 For any missing images, upload manually through /cms/news\n');
    }
  } finally {
    await oldClient.close();
    await newClient.close();
    console.log('🔌 Database connections closed\n');
  }
}

// Run migration
migrateNews().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
