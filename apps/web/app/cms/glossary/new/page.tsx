import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { GlossaryForm } from "@/components/cms/glossary-form";

export default async function CreateGlossaryPage() {
  try {
    await requireAdmin();
    return <GlossaryForm />;
  } catch (error) {
    redirect("/cms/login");
  }
}
