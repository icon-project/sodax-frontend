import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { generateSlug, type GlossaryTerm } from "@/lib/mongodb-types";
import { triggerDeployIfPublished } from "@/lib/trigger-deploy";

// GET /api/cms/glossary - List all glossary terms
export async function GET(request: NextRequest) {
  try {
    await requirePermission("glossary");

    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

    const filter: Record<string, unknown> = {};
    if (published !== null) {
      filter.published = published === "true";
    }

    const collection = db.collection<GlossaryTerm>("glossary");

    const [terms, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ term: 1 }) // Alphabetical sort for glossary
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: terms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/cms/glossary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch glossary" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}

// POST /api/cms/glossary - Create new glossary term
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("glossary");

    const body = await request.json();
    const {
      term,
      definition,
      excerpt,
      image,
      metaTitle,
      metaDescription,
      published = false,
      tags = [],
      category,
      relatedTerms = [],
    } = body;

    if (!term || !definition) {
      return NextResponse.json(
        { error: "Term and definition are required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(term);
    const collection = db.collection<GlossaryTerm>("glossary");

    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "A glossary term with this name already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const glossaryTerm: GlossaryTerm = {
      term,
      slug,
      definition,
      excerpt: excerpt || definition.substring(0, 200).replace(/<[^>]*>/g, ""),
      image,
      metaTitle: metaTitle || term,
      metaDescription: metaDescription || excerpt,
      published,
      publishedAt: published ? now : undefined,
      authorId: session.user.id,
      authorName: session.user.name,
      tags,
      category,
      relatedTerms,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(glossaryTerm);

    // Trigger deploy if term is published
    await triggerDeployIfPublished(glossaryTerm.published, `Glossary term created: ${glossaryTerm.term}`);

    return NextResponse.json(
      { ...glossaryTerm, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cms/glossary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create glossary term" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
