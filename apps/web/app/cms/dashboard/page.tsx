import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { CMSDashboard } from "@/components/cms/cms-dashboard";

export default async function DashboardPage() {
  try {
    const session = await requireAuth();
    return <CMSDashboard session={session} />;
  } catch (error) {
    // If error contains "Forbidden" or "not authorized", redirect to unauthorized page
    if (error instanceof Error && (error.message.includes("Forbidden") || error.message.includes("not authorized"))) {
      redirect("/cms/unauthorized");
    }
    // Otherwise redirect to login
    redirect("/cms/login");
  }
}
