import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { GlossaryForm } from "@/components/cms/glossary-form";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { GlossaryTerm } from "@/lib/mongodb-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGlossaryPage({ params }: PageProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    const collection = db.collection<GlossaryTerm>("glossary");
    const term = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!term) {
      redirect("/cms/glossary");
    }
    
    return <GlossaryForm term={term} />;
  } catch (error) {
    redirect("/cms/login");
  }
}
