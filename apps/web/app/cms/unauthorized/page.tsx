"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/cms/login");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[var(--cream)] via-[var(--vibrant-white)] to-[var(--almost-white)]">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
      
      <Card className="w-full max-w-md mx-4 shadow-2xl border-[var(--cherry-grey)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--negative)] to-[var(--orange-sonic)]" />
        
        <CardHeader className="space-y-3 pt-8">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--negative)] to-[var(--orange-sonic)] flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-[var(--espresso)]">
            Access Denied
          </CardTitle>
          <CardDescription className="text-center text-[var(--clay)]">
            You are not authorized to access the SODAX CMS
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          <div className="p-4 rounded-lg bg-[var(--negative)]/10 border border-[var(--negative)]/20">
            <p className="text-sm text-[var(--clay)] text-center">
              Only authorized team members can access this system. If you believe you should have access, please contact your administrator at david@sodax.com.
            </p>
          </div>
          
          <Button
            onClick={handleLogout}
            className="w-full h-12 bg-[var(--cherry-dark)] hover:bg-[var(--cherry-soda)] text-white transition-all"
          >
            Go back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
