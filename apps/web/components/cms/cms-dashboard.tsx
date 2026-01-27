"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Newspaper, BookOpen, Users } from "lucide-react";

interface CMSDashboardProps {
  session: {
    user: {
      email: string;
      name: string;
      role: string;
    };
  };
}

export function CMSDashboard({ session }: CMSDashboardProps) {
  const router = useRouter();

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
    },
    {
      title: "Articles",
      description: "Long-form content and blog posts",
      icon: FileText,
      href: "/cms/articles",
      color: "from-[var(--yellow-dark)] to-[var(--yellow-soda)]",
    },
    {
      title: "Glossary",
      description: "Terminology and definitions",
      icon: BookOpen,
      href: "/cms/glossary",
      color: "from-[var(--orange-sonic)] to-[var(--yellow-soda)]",
    },
    {
      title: "Users",
      description: "Manage team access (Coming soon)",
      icon: Users,
      href: "/cms/users",
      color: "from-[var(--clay-dark)] to-[var(--clay)]",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vibrant-white)] via-[var(--cream-white)] to-[var(--almost-white)]">
      {/* Header */}
      <header className="border-b border-[var(--cherry-grey)] bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--espresso)]">SODAX CMS</h1>
              <p className="text-sm text-[var(--clay)] mt-1">
                Welcome, {session.user.name || session.user.email}
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
            return (
              <Card
                key={section.title}
                className={`group relative overflow-hidden border-2 transition-all duration-300 ${
                  section.disabled
                    ? "opacity-50 cursor-not-allowed border-[var(--clay-light)]"
                    : "cursor-pointer hover:shadow-2xl hover:scale-105 border-transparent hover:border-[var(--cherry-soda)]"
                }`}
                onClick={() => !section.disabled && router.push(section.href)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
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
                  {!section.disabled && (
                    <div className="flex items-center text-[var(--cherry-soda)] font-medium text-sm group-hover:translate-x-1 transition-transform">
                      Manage <span className="ml-2">→</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
