import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { GlossaryListView } from "@/components/cms/glossary-list-view";

export default async function GlossaryManagementPage() {
  try {
    await requirePermission("glossary");
    return <GlossaryListView />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
