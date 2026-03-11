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

const ACCESS_TOKEN_TTL = 10 * 60 * 1000;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL = 2000;

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

  // ── Poll wallet address ──────────────────────────────────────────────────
  useEffect(() => {
    if (!spokeProvider) return;

    const fetch = () => {
      spokeProvider.walletProvider.getWalletAddress()
        .then(setWalletAddress)
        .catch(() => {});
    };

    fetch();
    const id = setInterval(fetch, 3000);
    return () => clearInterval(id);
  }, [spokeProvider]);

  // ── Restore session on mount (once walletAddress is known) ───────────────
  useEffect(() => {
    if (!walletAddress || !spokeProvider) return;

    const session = loadRadfiSession(walletAddress);
    if (!session || isRefreshTokenExpired(walletAddress)) return;

    if (!isAccessTokenExpired(walletAddress)) {
      spokeProvider.setRadfiAccessToken(session.accessToken);
      setIsAuthed(true);
      setTradingAddress(session.tradingAddress || undefined);
    }
    // If access token expired but refresh valid — polling below handles it
  }, [walletAddress, spokeProvider]);

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
        refreshTokenExpiry: Date.now() + REFRESH_TOKEN_TTL,
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

  // ── Polling: check expiry every 2s ──────────────────────────────────────
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
