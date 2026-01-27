import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { CMSDashboard } from "@/components/cms/cms-dashboard";

export default async function DashboardPage() {
  try {
    const session = await requireAdmin();
    return <CMSDashboard session={session} />;
  } catch (error) {
    redirect("/cms/login");
  }
}
