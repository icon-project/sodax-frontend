import { createAuthClient } from 'better-auth/react';

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

// Validate baseURL in production to prevent insecure connections
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !baseURL) {
  console.error('NEXT_PUBLIC_BETTER_AUTH_URL is not configured');
}

export const authClient = createAuthClient({
  baseURL: baseURL || 'http://localhost:3000',
});

export const { signIn, signOut, signUp, useSession } = authClient;
