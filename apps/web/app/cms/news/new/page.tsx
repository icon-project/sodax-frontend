import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth-utils";
import { NewsForm } from "@/components/cms/news-form";
import { getDb } from "@/lib/auth";

// CMS pages require authentication - cannot be statically generated
export const dynamic = 'force-dynamic';

interface CMSUser {
  _id: { toString: () => string };
  id?: string;
  email: string;
  name?: string;
  role: string;
}

export default async function CreateNewsPage() {
  try {
    await requirePermission("news");
    
    // Fetch CMS users for author selection
    const usersCollection = getDb().collection<CMSUser>("user");
    const users = await usersCollection
      .find({ role: { $in: ["admin", "user"] } })
      .project({ _id: 1, id: 1, email: 1, name: 1 })
      .toArray();
    
    const authors = users.map(u => ({
      id: u.id || u._id.toString(),
      name: u.name || u.email,
      email: u.email,
    }));
    
    return <NewsForm authors={authors} />;
  } catch (error) {
    redirect("/cms/dashboard");
  }
}
