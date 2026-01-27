import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { generateSlug, type NewsArticle } from "@/lib/mongodb-types";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/cms/news/[id] - Get single news article
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const collection = db.collection<NewsArticle>("news");
    const article = await collection.findOne({ _id: new ObjectId(id) });

    if (!article) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/cms/news/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}

// PATCH /api/cms/news/[id] - Update news article
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();
    const collection = db.collection<NewsArticle>("news");

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 });
    }

    // If title changed, regenerate slug and check uniqueness
    let slug = existing.slug;
    if (body.title && body.title !== existing.title) {
      slug = generateSlug(body.title);
      const duplicateSlug = await collection.findOne({
        slug,
        _id: { $ne: new ObjectId(id) },
      });
      if (duplicateSlug) {
        return NextResponse.json(
          { error: "A news article with this title already exists" },
          { status: 409 }
        );
      }
    }

    const wasPublished = existing.published;
    const isNowPublished = body.published ?? existing.published;

    const update = {
      ...body,
      slug,
      updatedAt: new Date(),
      // Set publishedAt if transitioning to published state
      ...(isNowPublished && !wasPublished && { publishedAt: new Date() }),
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/cms/news/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update news" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}

// DELETE /api/cms/news/[id] - Delete news article
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const collection = db.collection<NewsArticle>("news");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/cms/news/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete news" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
