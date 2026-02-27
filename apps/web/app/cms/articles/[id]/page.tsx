import { redirect } from "next/navigation";
import { CMS_ARTICLES_ROUTE, CMS_LOGIN_ROUTE } from "@/constants/routes";
import { requirePermission } from "@/lib/auth-utils";
import { ArticleForm } from "@/components/cms/article-form";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Article } from "@/lib/mongodb-types";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  try {
    await requirePermission("articles");
    const { id } = await params;
    
    const collection = getDb().collection<Article>("articles");
    const article = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!article) {
      redirect(CMS_ARTICLES_ROUTE);
    }
    
    return <ArticleForm article={article} />;
  } catch (error) {
    redirect(CMS_LOGIN_ROUTE);
  }
}
