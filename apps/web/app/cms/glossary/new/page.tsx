import { redirect } from "next/navigation";
import { CMS_DASHBOARD_ROUTE } from "@/constants/routes";
import { requirePermission } from "@/lib/auth-utils";
import { GlossaryForm } from "@/components/cms/glossary-form";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function CreateGlossaryPage() {
  try {
    await requirePermission("glossary");
    return <GlossaryForm />;
  } catch (error) {
    redirect(CMS_DASHBOARD_ROUTE);
  }
}
