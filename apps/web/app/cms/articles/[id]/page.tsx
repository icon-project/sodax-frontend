import { redirect } from "next/navigation";
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
      redirect("/cms/articles");
    }
    
    return <ArticleForm article={article} />;
  } catch (error) {
    redirect("/cms/login");
  }
}
