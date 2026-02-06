import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function CMSIndexPage() {
  const session = await getServerSession();
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect("/cms/login");
  }
  
  // Redirect to dashboard if authenticated
  redirect("/cms/dashboard");
}
