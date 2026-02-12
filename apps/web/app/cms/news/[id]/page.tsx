import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth-utils';
import { NewsForm } from '@/components/cms/news-form';
import { getDb } from '@/lib/db';
import { getDb as getAuthDb } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import type { NewsArticle } from '@/lib/mongodb-types';

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CMSUser {
  _id: { toString: () => string };
  id?: string;
  email: string;
  name?: string;
  role: string;
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

    // Fetch CMS users for author selection
    const usersCollection = getAuthDb().collection<CMSUser>('user');
    const users = await usersCollection
      .find({ role: { $in: ['admin', 'user'] } })
      .project({ _id: 1, id: 1, email: 1, name: 1 })
      .toArray();

    const authors = users.map(u => ({
      id: u.id || u._id.toString(),
      name: u.name || u.email,
      email: u.email,
    }));

    // Serialize the article to plain object for Client Component
    const serializedArticle = {
      ...article,
      _id: article._id.toString(),
      authorId: article.authorId,
      authorName: article.authorName,
      publishedAt: article.publishedAt?.toISOString() || undefined,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };

    return <NewsForm article={serializedArticle} authors={authors} />;
  } catch (error) {
    redirect('/cms/login');
  }
}
