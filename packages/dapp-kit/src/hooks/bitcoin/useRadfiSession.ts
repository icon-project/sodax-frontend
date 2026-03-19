import { useState, useEffect, useRef, useCallback } from 'react';
import type { BitcoinSpokeProvider } from '@sodax/sdk';
import {
  useRadfiAuth,
  loadRadfiSession,
  saveRadfiSession,
  clearRadfiSession,
  type RadfiSession,
} from './useRadfiAuth';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min — refresh before access token expires (10 min TTL)

export type UseRadfiSessionReturn = {
  walletAddress: string | undefined;
  isAuthed: boolean;
  tradingAddress: string | undefined;
  login: () => Promise<void>;
  isLoginPending: boolean;
};

/**
 * Manages the full Radfi session lifecycle:
 * - On mount / wallet switch: refreshes token to validate session
 * - Single interval (~5 min): refreshes access token. If refresh fails → clears session, isAuthed=false
 * - ensureRadfiAccessToken (SDK layer) acts as safety net before swap/bridge
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
      };

      saveRadfiSession(address, updated);
      spokeProvider.setRadfiAccessToken(accessToken, refreshToken);
      setIsAuthed(true);
      setTradingAddress(updated.tradingAddress || undefined);
    } catch {
      clearRadfiSession(address);
      spokeProvider.setRadfiAccessToken('', '');
      setIsAuthed(false);
      setTradingAddress(undefined);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [spokeProvider]);

  // ── On mount / wallet switch: reset state + refresh to validate session ──
  useEffect(() => {
    if (!spokeProvider) return;

    // Reset state immediately to avoid stale data from previous wallet
    setIsAuthed(false);
    setTradingAddress(undefined);
    setWalletAddress(undefined);

    spokeProvider.walletProvider.getWalletAddress()
      .then((addr) => {
        setWalletAddress(addr);
        const session = loadRadfiSession(addr);
        if (!session?.refreshToken) return;

        // Always refresh on mount to validate the session is actually valid
        silentRefresh(addr);
      })
      .catch(() => {});
  }, [spokeProvider, silentRefresh]);

  // ── Interval: refresh token every 5 min to keep access token fresh ──────
  useEffect(() => {
    if (!walletAddress || !spokeProvider) return;

    const id = setInterval(() => {
      silentRefresh(walletAddress);
    }, REFRESH_INTERVAL);

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
