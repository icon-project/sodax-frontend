import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { ArticleForm } from "@/components/cms/article-form";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Article } from "@/lib/mongodb-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    const collection = db.collection<Article>("articles");
    const article = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!article) {
      redirect("/cms/articles");
    }
    
    return <ArticleForm article={article} />;
  } catch (error) {
    redirect("/cms/login");
  }
}
