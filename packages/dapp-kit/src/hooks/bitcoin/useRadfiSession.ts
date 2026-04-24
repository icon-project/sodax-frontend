import { useState, useEffect, useRef, useCallback } from 'react';
import type { IBitcoinWalletProvider } from '@sodax/types';
import { useRadfiAuth, loadRadfiSession, saveRadfiSession, clearRadfiSession, type RadfiSession } from './useRadfiAuth.js';
import { useSodaxContext } from '../shared/useSodaxContext.js';

const REFRESH_INTERVAL = 5 * 60 * 1000;

export type UseRadfiSessionReturn = {
  walletAddress: string | undefined;
  isAuthed: boolean;
  tradingAddress: string | undefined;
  login: () => Promise<void>;
  isLoginPending: boolean;
};

export function useRadfiSession(walletProvider: IBitcoinWalletProvider | undefined): UseRadfiSessionReturn {
  const { sodax } = useSodaxContext();
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [isAuthed, setIsAuthed] = useState(false);
  const [tradingAddress, setTradingAddress] = useState<string | undefined>();
  const isRefreshingRef = useRef(false);

  const silentRefresh = useCallback(
    async (address: string) => {
      if (!walletProvider || isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        const session = loadRadfiSession(address);
        if (!session?.refreshToken) {
          setIsAuthed(false);
          return;
        }

        const radfi = sodax.spokeService.bitcoinSpokeService.radfi;
        const { accessToken, refreshToken } = await radfi.refreshAccessToken(session.refreshToken);
        const updated: RadfiSession = { ...session, accessToken, refreshToken };

        saveRadfiSession(address, updated);
        radfi.setRadfiAccessToken(accessToken, refreshToken);
        setIsAuthed(true);
        setTradingAddress(updated.tradingAddress || undefined);
      } catch {
        clearRadfiSession(address);
        sodax.spokeService.bitcoinSpokeService.radfi.setRadfiAccessToken('', '');
        setIsAuthed(false);
        setTradingAddress(undefined);
      } finally {
        isRefreshingRef.current = false;
      }
    },
    [walletProvider, sodax],
  );

  useEffect(() => {
    if (!walletProvider) return;

    setIsAuthed(false);
    setTradingAddress(undefined);
    setWalletAddress(undefined);

    walletProvider
      .getWalletAddress()
      .then((addr: string) => {
        setWalletAddress(addr);
        const session = loadRadfiSession(addr);
        if (!session?.refreshToken) return;
        silentRefresh(addr);
      })
      .catch(() => {});
  }, [walletProvider, silentRefresh]);

  useEffect(() => {
    if (!walletAddress || !walletProvider) return;

    const id = setInterval(() => {
      silentRefresh(walletAddress);
    }, REFRESH_INTERVAL);

    return () => clearInterval(id);
  }, [walletAddress, walletProvider, silentRefresh]);

  const { mutateAsync: loginMutate, isPending: isLoginPending } = useRadfiAuth(walletProvider);

  const login = useCallback(async () => {
    const result = await loginMutate();
    setIsAuthed(true);
    setTradingAddress(result.tradingAddress || undefined);
  }, [loginMutate]);

  return { walletAddress, isAuthed, tradingAddress, login, isLoginPending };
}
