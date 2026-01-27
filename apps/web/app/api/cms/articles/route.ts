import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { generateSlug, type Article } from "@/lib/mongodb-types";

// GET /api/cms/articles - List all articles
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);

    const filter: Record<string, unknown> = {};
    if (published !== null) {
      filter.published = published === "true";
    }

    const collection = db.collection<Article>("articles");

    const [articles, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/cms/articles error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch articles" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}

// POST /api/cms/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

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
    const collection = db.collection<Article>("articles");

    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "An article with this title already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const article: Article = {
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
    console.error("POST /api/cms/articles error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create article" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
