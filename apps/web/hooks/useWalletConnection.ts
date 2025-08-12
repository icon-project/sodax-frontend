'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useXAccounts,
  useXConnect,
  useXDisconnect,
  useXConnection,
  useXConnectors,
  useXAccount,
} from '@sodax/wallet-sdk';
import type { XConnector } from '@sodax/wallet-sdk';
import type { ChainType } from '@sodax/types';
import { TIMEOUT_CLOSE_MS } from '@/constants/ui';

type Pending = { xConnector: XConnector; xChainType: string } | null;

export function useWalletConnection() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletModalOnTwoWallets, setShowWalletModalOnTwoWallets] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [connectedWalletName, setConnectedWalletName] = useState('');

  const { mutateAsync: xConnect } = useXConnect();
  const xDisconnect = useXDisconnect();
  const xAccounts = useXAccounts();

  const connectedChains = useMemo(
    () =>
      Object.entries(xAccounts)
        .filter(([, account]) => account?.address)
        .map(([chainType, account]) => ({ chainType, address: account?.address })),
    [xAccounts],
  );
  const connectedWalletsCount = connectedChains.length;

  const connectedWalletsCountRef = useRef(connectedWalletsCount);
  useEffect(() => {
    connectedWalletsCountRef.current = connectedWalletsCount;
  }, [connectedWalletsCount]);

  useEffect(() => {
    if (!showTermsModal && showWalletModalOnTwoWallets && showWalletModal && connectedWalletsCount >= 2) {
      const t = setTimeout(() => setShowWalletModal(false), TIMEOUT_CLOSE_MS);
      return () => clearTimeout(t);
    }
    if (connectedWalletsCount < 2) setShowWalletModalOnTwoWallets(true);
  }, [connectedWalletsCount, showWalletModal, showWalletModalOnTwoWallets, showTermsModal]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(v => !v), []);

  const handleWalletSelected = useCallback((xConnector: XConnector, xChainType: string) => {
    const walletName =
      typeof xConnector === 'object' && xConnector !== null && 'name' in xConnector
        ? (xConnector as { name: string }).name
        : 'Wallet';
    setConnectedWalletName(walletName);
    setPending({ xConnector, xChainType });
    if (xChainType !== 'ICON') setShowTermsModal(true);
    else setShowTermsModal(false);
  }, []);

  const handleTermsAccepted = useCallback(async () => {
    if (!pending) return;
    try {
      await xConnect(pending.xConnector);
      setShowTermsModal(false);
      setPending(null);
      setConnectedWalletName('');
      setShowWalletModal(true);
    } catch {
      setShowTermsModal(false);
      setPending(null);
      setConnectedWalletName('');
    }
  }, [pending, xConnect]);

  const handleDisconnect = useCallback(() => {
    if (pending) xDisconnect(pending.xChainType as ChainType);
  }, [pending, xDisconnect]);

  return {
    // state
    isSidebarOpen,
    showWalletModal,
    showTermsModal,
    connectedWalletName,
    connectedWalletsCount,
    // setters
    setShowWalletModal,
    setShowTermsModal,
    setShowWalletModalOnTwoWallets,
    // actions
    toggleSidebar,
    handleWalletSelected,
    handleTermsAccepted,
    handleDisconnect,
  };
}
