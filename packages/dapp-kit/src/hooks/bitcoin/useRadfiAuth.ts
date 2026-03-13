import type { BitcoinSpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './radfiConstants';

export type RadfiSession = {
  accessToken: string;
  refreshToken: string;
  tradingAddress: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
};

type RadfiAuthResult = {
  accessToken: string;
  refreshToken: string;
  tradingAddress: string;
};

const SESSION_KEY = (address: string) => `radfi_session_${address}`;

export function saveRadfiSession(address: string, session: RadfiSession): void {
  try {
    // Radfi tokens are only used for API rate-limiting / anti-spam, not for accessing user assets.
    localStorage.setItem(SESSION_KEY(address), JSON.stringify(session));
  } catch {}
}

export function loadRadfiSession(address: string): RadfiSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY(address));
    return raw ? (JSON.parse(raw) as RadfiSession) : null;
  } catch {
    return null;
  }
}

export function clearRadfiSession(address: string): void {
  try {
    localStorage.removeItem(SESSION_KEY(address));
  } catch {}
}

export function isAccessTokenExpired(address: string): boolean {
  const session = loadRadfiSession(address);
  if (!session) return true;
  return Date.now() >= session.accessTokenExpiry;
}

export function isRefreshTokenExpired(address: string): boolean {
  const session = loadRadfiSession(address);
  if (!session) return true;
  return Date.now() >= session.refreshTokenExpiry;
}

/**
 * Hook to authenticate with Radfi using BIP322 message signing.
 * Saves full session (accessToken, refreshToken, tradingAddress, expiry) to localStorage.
 */
export function useRadfiAuth(
  spokeProvider: BitcoinSpokeProvider | undefined,
): UseMutationResult<RadfiAuthResult, Error, void> {
  return useMutation<RadfiAuthResult, Error, void>({
    mutationFn: async () => {
      if (!spokeProvider) {
        throw new Error('Bitcoin spoke provider not found');
      }

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      try {
        const { accessToken, refreshToken, tradingAddress } = await spokeProvider.authenticateWithWallet();

        const session: RadfiSession = {
          accessToken,
          refreshToken,
          tradingAddress,
          accessTokenExpiry: Date.now() + ACCESS_TOKEN_TTL,
          refreshTokenExpiry: Date.now() + REFRESH_TOKEN_TTL,
        };

        saveRadfiSession(walletAddress, session);

        return { accessToken, refreshToken, tradingAddress };
      } catch (err: unknown) {
        // Error 4008: wallet already registered — authenticate is register+login combined.
        // Try to refresh with existing session if available.
        const isAlreadyRegistered =
          err instanceof Error &&
          (err.message.includes('duplicatedPubKey') || err.message.includes('4008'));

        if (isAlreadyRegistered) {
          const existing = loadRadfiSession(walletAddress);
          if (existing && !isRefreshTokenExpired(walletAddress)) {
            // Try silent refresh
            const refreshed = await spokeProvider.radfi.refreshAccessToken(existing.refreshToken);
            const session: RadfiSession = {
              ...existing,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              accessTokenExpiry: Date.now() + ACCESS_TOKEN_TTL,
              refreshTokenExpiry: Date.now() + REFRESH_TOKEN_TTL,
            };
            spokeProvider.setRadfiAccessToken(refreshed.accessToken);
            saveRadfiSession(walletAddress, session);
            return { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken, tradingAddress: existing.tradingAddress };
          }
        }

        throw err;
      }
    },
  });
}
