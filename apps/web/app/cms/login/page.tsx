"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CMSLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/cms/dashboard",
      });
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[var(--cream)] via-[var(--vibrant-white)] to-[var(--almost-white)]">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" />
      
      <Card className="w-full max-w-md mx-4 shadow-2xl border-[var(--cherry-grey)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--cherry-dark)] via-[var(--cherry-soda)] to-[var(--cherry-bright)]" />
        
        <CardHeader className="space-y-3 pt-8">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--cherry-dark)] to-[var(--cherry-soda)] flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="edit-icon-title">
                <title id="edit-icon-title">Edit icon</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-[var(--espresso)]">
            SODAX CMS
          </CardTitle>
          <CardDescription className="text-center text-[var(--clay)]">
            Content management system for @sodax.com team
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--negative)]/10 border border-[var(--negative)]/20">
              <p className="text-sm text-[var(--negative)] text-center">{error}</p>
            </div>
          )}
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-[var(--espresso)] border-2 border-[var(--clay-light)] shadow-sm transition-all hover:shadow-md hover:border-[var(--cherry-soda)] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-[var(--clay)] border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-labelledby="google-logo-title">
                  <title id="google-logo-title">Google logo</title>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Continue with Google</span>
              </div>
            )}
          </Button>
          
          <p className="text-xs text-center text-[var(--clay)]">
            Only @sodax.com email addresses are authorized
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
