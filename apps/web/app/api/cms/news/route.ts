import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { generateSlug, type NewsArticle } from "@/lib/mongodb-types";

// GET /api/cms/news - List all news (with optional filters)
export async function GET(request: NextRequest) {
  try {
    await requirePermission("news");

    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);

    const filter: Record<string, unknown> = {};
    if (published !== null) {
      filter.published = published === "true";
    }

    const collection = db.collection<NewsArticle>("news");

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
    console.error("GET /api/cms/news error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}

// POST /api/cms/news - Create new news article
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("news");

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      image,
      metaTitle,
      metaDescription,
      published = false,
      tags = [],
      category,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);
    const collection = db.collection<NewsArticle>("news");

    // Check if slug already exists
    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "A news article with this title already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const article: NewsArticle = {
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200).replace(/<[^>]*>/g, ""),
      image,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt,
      published,
      publishedAt: published ? now : undefined,
      authorId: session.user.id,
      authorName: session.user.name,
      tags,
      category,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(article);

    return NextResponse.json(
      { ...article, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cms/news error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create news" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
