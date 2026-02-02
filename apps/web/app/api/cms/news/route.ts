import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-utils';
import { generateSlug, type NewsArticle } from '@/lib/mongodb-types';
import { NewsArticleSchema, formatZodError } from '@/lib/cms-schemas';
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize';
import { ZodError } from 'zod';

// GET /api/cms/news - List all news (with optional filters)
export async function GET(request: NextRequest) {
  try {
    await requirePermission('news');

    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10)));

    const filter: Record<string, unknown> = {};
    if (published !== null) {
      filter.published = published === 'true';
    }

    const collection = db.collection<NewsArticle>('news');

    // Parallel fetching for data and count
    const [news, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/cms/news error:', error);
    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Failed to fetch news' },
      { status: isForbidden ? 403 : 500 },
    );
  }
}

// POST /api/cms/news - Create new news article
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('news');

    const body = await request.json();

    // Validate input with Zod schema
    const validated = NewsArticleSchema.parse(body);

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeHtml(validated.content);
    const sanitizedExcerpt = validated.excerpt
      ? sanitizeText(validated.excerpt)
      : sanitizeText(validated.content.substring(0, 200).replace(/<[^>]*>/g, ''));

    const slug = generateSlug(validated.title);
    const collection = db.collection<NewsArticle>('news');

    // Check if slug already exists
    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'A news article with this title already exists' }, { status: 409 });
    }

    const now = new Date();
    const article: NewsArticle = {
      title: validated.title,
      slug,
      content: sanitizedContent,
      excerpt: sanitizedExcerpt,
      image: validated.image || undefined,
      metaTitle: validated.metaTitle || validated.title,
      metaDescription: validated.metaDescription || sanitizedExcerpt,
      published: validated.published,
      publishedAt: validated.published ? now : undefined,
      authorId: session.user.id,
      authorName: session.user.name,
      tags: validated.tags,
      categories: validated.categories,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(article);

    return NextResponse.json({ ...article, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cms/news error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
    }

    const isForbidden = error instanceof Error && error.message.includes('Forbidden');
    return NextResponse.json(
      { error: isForbidden ? 'Access denied' : 'Failed to create news article' },
      { status: isForbidden ? 403 : 500 },
    );
  }
}
