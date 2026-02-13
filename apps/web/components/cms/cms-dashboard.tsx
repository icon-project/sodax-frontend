"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Newspaper, BookOpen, Users } from "lucide-react";
import { getUserPermissions, type CMSPermission } from "@/lib/permissions";

interface CMSDashboardProps {
  session: {
    user: {
      email: string;
      name: string;
      role?: string | null;
      permissions?: string | null;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export function CMSDashboard({ session }: CMSDashboardProps) {
  const router = useRouter();
  const permissions = getUserPermissions(session.user);
  const isAdmin = session.user.role === "admin";

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/cms/login");
  };

  const sections = [
    {
      title: "News",
      description: "Manage news articles and announcements",
      icon: Newspaper,
      href: "/cms/news",
      color: "from-[var(--cherry-dark)] to-[var(--cherry-soda)]",
      permission: "news" as CMSPermission,
    },
    {
      title: "Articles",
      description: "Coming soon",
      icon: FileText,
      href: "/cms/articles",
      color: "from-[var(--yellow-dark)] to-[var(--yellow-soda)]",
      disabled: true,
    },
    {
      title: "Glossary",
      description: "Update glossary entries in SODAX Notion environment",
      icon: BookOpen,
      href: "https://www.notion.so/iconfoundation/System-Explanation-Pipeline-2c68c1d2979c801b9afbe01ef0318cc4",
      color: "from-[var(--orange-sonic)] to-[var(--yellow-soda)]",
      disabled: true,
      external: true,
    },
    {
      title: "Users",
      description: "Manage team access",
      icon: Users,
      href: "/cms/users",
      color: "from-[var(--clay-dark)] to-[var(--clay)]",
      adminOnly: true,
    },
  ].filter(section => {
    // Show admin-only sections only to admins
    if (section.adminOnly) return isAdmin;
    // Show disabled sections to everyone
    if (section.disabled) return true;
    // Show permission-based sections if user has permission
    if (section.permission) return permissions.includes(section.permission);
    return true;
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[var(--vibrant-white)] via-[var(--cream-white)] to-[var(--almost-white)]">
      {/* Header */}
      <header className="border-b border-[var(--cherry-grey)] bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--espresso)]">SODAX CMS</h1>
              <p className="text-sm text-[var(--clay)] mt-1">
                Welcome, {session.user.name || session.user.email}
                {isAdmin && <span className="ml-2 text-xs px-2 py-0.5 bg-[var(--cherry-soda)] text-white rounded-full">Admin</span>}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[var(--cherry-dark)] text-[var(--cherry-dark)] hover:bg-[var(--cherry-dark)] hover:text-white transition-colors"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--espresso)] mb-2">Content Management</h2>
          <p className="text-[var(--clay)]">Select a section to manage your content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isDisabled = 'disabled' in section && section.disabled;
            const isExternal = 'external' in section && section.external;
            return (
              <Card
                key={section.title}
                className={`group relative overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                  isDisabled 
                    ? 'opacity-60 hover:opacity-70' 
                    : 'hover:shadow-2xl hover:scale-105 border-transparent hover:border-[var(--cherry-soda)]'
                }`}
                onClick={() => {
                  if (isExternal) {
                    window.open(section.href, '_blank');
                  } else {
                    router.push(section.href);
                  }
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-5 ${
                  isDisabled ? '' : 'group-hover:opacity-10'
                } transition-opacity`} />
                
                <CardHeader className="relative">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 shadow-lg transform transition-transform group-hover:scale-110`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl text-[var(--espresso)]">{section.title}</CardTitle>
                  <CardDescription className="text-[var(--clay)]">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="flex items-center text-[var(--cherry-soda)] font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Manage <span className="ml-2">→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
