import { useState, useEffect, useRef, useCallback } from 'react';
import type { BitcoinSpokeProvider } from '@sodax/sdk';
import {
  useRadfiAuth,
  loadRadfiSession,
  saveRadfiSession,
  clearRadfiSession,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  type RadfiSession,
} from './useRadfiAuth';

import { ACCESS_TOKEN_TTL } from './radfiConstants';
const POLL_INTERVAL = 30_000; // 30 s — access tokens expire every 10 min, no need to poll faster

export type UseRadfiSessionReturn = {
  walletAddress: string | undefined;
  isAuthed: boolean;
  tradingAddress: string | undefined;
  login: () => Promise<void>;
  isLoginPending: boolean;
};

/**
 * Manages the full Radfi session lifecycle:
 * - Restores session from localStorage on mount
 * - Polls every 2s: silently refreshes accessToken before expiry, resets auth when refreshToken expires
 * - Exposes login() and isAuthed for UI
 */
export function useRadfiSession(
  spokeProvider: BitcoinSpokeProvider | undefined,
): UseRadfiSessionReturn {
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [isAuthed, setIsAuthed] = useState(false);
  const [tradingAddress, setTradingAddress] = useState<string | undefined>();
  const isRefreshingRef = useRef(false);

  // ── Silent refresh helper ────────────────────────────────────────────────
  const silentRefresh = useCallback(async (address: string) => {
    if (!spokeProvider || isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const session = loadRadfiSession(address);
      if (!session?.refreshToken) {
        setIsAuthed(false);
        return;
      }

      const { accessToken, refreshToken } = await spokeProvider.radfi.refreshAccessToken(session.refreshToken);
      const updated: RadfiSession = {
        ...session,
        accessToken,
        refreshToken,
        accessTokenExpiry: Date.now() + ACCESS_TOKEN_TTL,
        // Keep the original refreshTokenExpiry — don't roll it forward on every silent refresh
      };

      saveRadfiSession(address, updated);
      spokeProvider.setRadfiAccessToken(accessToken);
      setIsAuthed(true);
      setTradingAddress(updated.tradingAddress || undefined);
    } catch {
      clearRadfiSession(address);
      spokeProvider.setRadfiAccessToken('');
      setIsAuthed(false);
      setTradingAddress(undefined);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [spokeProvider]);

  // ── Poll wallet address + restore session eagerly ────────────────────────
  useEffect(() => {
    if (!spokeProvider) return;

    const fetchAndRestore = () => {
      spokeProvider.walletProvider.getWalletAddress()
        .then((addr) => {
          setWalletAddress(addr);
          // Eagerly restore session in the same tick to avoid extra render cycle
          const session = loadRadfiSession(addr);
          if (!session || isRefreshTokenExpired(addr)) return;

          if (!isAccessTokenExpired(addr)) {
            spokeProvider.setRadfiAccessToken(session.accessToken);
            setIsAuthed(true);
            setTradingAddress(session.tradingAddress || undefined);
          } else {
            // Access token expired but refresh valid — trigger silent refresh
            silentRefresh(addr);
          }
        })
        .catch(() => {});
    };

    fetchAndRestore();
    const id = setInterval(fetchAndRestore, 3000);
    return () => clearInterval(id);
  }, [spokeProvider, silentRefresh]);

  // ── Polling: check expiry every 30s ──────────────────────────────────────
  useEffect(() => {
    if (!walletAddress || !spokeProvider) return;

    const id = setInterval(() => {
      if (isRefreshTokenExpired(walletAddress)) {
        clearRadfiSession(walletAddress);
        spokeProvider.setRadfiAccessToken('');
        setIsAuthed(false);
        setTradingAddress(undefined);
        return;
      }

      if (isAccessTokenExpired(walletAddress)) {
        silentRefresh(walletAddress);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [walletAddress, spokeProvider, silentRefresh]);

  // ── Login ────────────────────────────────────────────────────────────────
  const { mutateAsync: loginMutate, isPending: isLoginPending } = useRadfiAuth(spokeProvider);

  const login = useCallback(async () => {
    const result = await loginMutate();
    setIsAuthed(true);
    setTradingAddress(result.tradingAddress || undefined);
  }, [loginMutate]);

  return { walletAddress, isAuthed, tradingAddress, login, isLoginPending };
}
