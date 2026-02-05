import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { GlossaryForm } from "@/components/cms/glossary-form";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { GlossaryTerm } from "@/lib/mongodb-types";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGlossaryPage({ params }: PageProps) {
  try {
    await requirePermission("glossary");
    const { id } = await params;
    
    const collection = getDb().collection<GlossaryTerm>("glossary");
    const term = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!term) {
      redirect("/cms/glossary");
    }
    
    return <GlossaryForm term={term} />;
  } catch (error) {
    redirect("/cms/login");
  }
}
