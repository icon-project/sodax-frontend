import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth-utils';
import { NewsForm } from '@/components/cms/news-form';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import type { NewsArticle } from '@/lib/mongodb-types';

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: PageProps) {
  try {
    await requirePermission('news');
    const { id } = await params;

    const collection = getDb().collection<NewsArticle>('news');
    const article = await collection.findOne({ _id: new ObjectId(id) });

    if (!article) {
      redirect('/cms/news');
    }

    // Serialize the article to plain object for Client Component
    const serializedArticle = {
      ...article,
      _id: article._id.toString(),
      publishedAt: article.publishedAt?.toISOString() || undefined,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };

    return <NewsForm article={serializedArticle} />;
  } catch (error) {
    redirect('/cms/login');
  }
}
