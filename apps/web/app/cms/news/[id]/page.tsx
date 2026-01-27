import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { NewsForm } from "@/components/cms/news-form";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { NewsArticle } from "@/lib/mongodb-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: PageProps) {
  try {
    await requirePermission("news");
    const { id } = await params;
    
    const collection = db.collection<NewsArticle>("news");
    const article = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!article) {
      redirect("/cms/news");
    }
    
    return <NewsForm article={article} />;
  } catch (error) {
    redirect("/cms/login");
  }
}
