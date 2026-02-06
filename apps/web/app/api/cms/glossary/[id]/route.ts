import { type NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requirePermission } from '@/lib/auth-utils';
import { generateSlug, type GlossaryTerm } from '@/lib/mongodb-types';
import { triggerDeployIfPublished } from '@/lib/trigger-deploy';
import { ObjectId } from 'mongodb';

// CMS API routes require authentication - prevent build-time analysis
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/cms/glossary/[id] - Get single glossary term
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requirePermission('glossary');

    const { id } = await context.params;
    const collection = getDb().collection<GlossaryTerm>('glossary');
    const term = await collection.findOne({ _id: new ObjectId(id) });

    if (!term) {
      return NextResponse.json({ error: 'Glossary term not found' }, { status: 404 });
    }

    return NextResponse.json(term);
  } catch (error) {
    console.error('GET /api/cms/glossary/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch glossary term' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 },
    );
  }
}

// PATCH /api/cms/glossary/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requirePermission('glossary');

    const { id } = await context.params;
    const body = await request.json();
    const collection = getDb().collection<GlossaryTerm>('glossary');

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: 'Glossary term not found' }, { status: 404 });
    }

    let slug = existing.slug;
    if (body.term && body.term !== existing.term) {
      slug = generateSlug(body.term);
      const duplicateSlug = await collection.findOne({
        slug,
        _id: { $ne: new ObjectId(id) },
      });
      if (duplicateSlug) {
        return NextResponse.json({ error: 'A glossary term with this name already exists' }, { status: 409 });
      }
    }

    const wasPublished = existing.published;
    const isNowPublished = body.published ?? existing.published;

    const update = {
      ...body,
      slug,
      updatedAt: new Date(),
      ...(isNowPublished && !wasPublished && { publishedAt: new Date() }),
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' },
    );

    // Trigger deploy if term is or was published
    await triggerDeployIfPublished(
      isNowPublished || wasPublished,
      `Glossary term updated: ${result?.term || existing.term}`,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('PATCH /api/cms/glossary/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update glossary term' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 },
    );
  }
}

// DELETE /api/cms/glossary/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requirePermission('glossary');

    const { id } = await context.params;
    const collection = getDb().collection<GlossaryTerm>('glossary');

    // Check if term was published before deleting
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    const wasPublished = existing?.published ?? false;

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Glossary term not found' }, { status: 404 });
    }

    // Trigger deploy if deleted term was published
    await triggerDeployIfPublished(wasPublished, `Glossary term deleted: ${existing?.term}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cms/glossary/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete glossary term' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 },
    );
  }
}
