'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useXAccounts,
  useXConnect,
  useXDisconnect,
  useXConnection,
  useXConnectors,
  useXAccount,
} from '@sodax/wallet-sdk-react';
import type { XConnector } from '@sodax/wallet-sdk-react'
import type { ChainType } from '@sodax/types';
import { TIMEOUT_CLOSE_MS } from '@/constants/ui';

// Storage key for tracking terms acceptance per wallet
const TERMS_ACCEPTANCE_KEY = 'sodax_terms_accepted_wallets';

type Pending = { xConnector: XConnector; xChainType: string } | null;

// Helper functions for managing terms acceptance
const getAcceptedWallets = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(TERMS_ACCEPTANCE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const addAcceptedWallet = (address: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const acceptedWallets = getAcceptedWallets();
    acceptedWallets.add(address);
    if (typeof window !== 'undefined')
      localStorage.setItem(TERMS_ACCEPTANCE_KEY, JSON.stringify([...acceptedWallets]));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const hasAcceptedTerms = (address: string): boolean => {
  return getAcceptedWallets().has(address);
};

export function useWalletConnection() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletModalOnTwoWallets, setShowWalletModalOnTwoWallets] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [connectedWalletName, setConnectedWalletName] = useState('');
  const [targetChainType, setTargetChainType] = useState<ChainType | undefined>(undefined);

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

  // Check if any connected wallet has already accepted terms
  const hasAnyWalletAcceptedTerms = useMemo(() => {
    return connectedChains.some(({ address }) => address && hasAcceptedTerms(address));
  }, [connectedChains]);

  // useEffect(() => {
  //   if (!showTermsModal && showWalletModalOnTwoWallets && showWalletModal && connectedWalletsCount >= 2) {
  //     const t = setTimeout(() => setShowWalletModal(false), TIMEOUT_CLOSE_MS);
  //     return () => clearTimeout(t);
  //   }
  //   if (connectedWalletsCount < 2) setShowWalletModalOnTwoWallets(true);
  // }, [connectedWalletsCount, showWalletModal, showWalletModalOnTwoWallets, showTermsModal]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(v => !v), []);

  const handleWalletSelected = useCallback((xConnector: XConnector, xChainType: string) => {
    const walletName =
      typeof xConnector === 'object' && xConnector !== null && 'name' in xConnector
        ? (xConnector as { name: string }).name
        : 'Wallet';
    setConnectedWalletName(walletName);
    setPending({ xConnector, xChainType });

    // For ICON chain, skip terms modal
    if (xChainType === 'ICON') {
      setShowTermsModal(false);
      return;
    }

    // For other chains, show terms modal
    setShowTermsModal(true);
  }, []);

  const handleTermsAccepted = useCallback(async () => {
    if (!pending) return;
    try {
      const connectedAccount = await xConnect(pending.xConnector);

      // Store that this wallet has accepted terms
      if (connectedAccount?.address) {
        addAcceptedWallet(connectedAccount.address);
      }

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

  const handleConnectWithoutTerms = useCallback(async () => {
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

  // Check if the current pending wallet has already accepted terms
  const shouldSkipTermsModal = useCallback(() => {
    if (!pending) return false;

    // Check if any connected wallet has already accepted terms
    // This is a simple check - if any wallet has accepted terms, we assume the user
    // has already gone through the terms process for this session
    return hasAnyWalletAcceptedTerms;
  }, [pending, hasAnyWalletAcceptedTerms]);

  // Auto-connect if wallet has already accepted terms
  useEffect(() => {
    if (showTermsModal && pending && shouldSkipTermsModal()) {
      handleConnectWithoutTerms();
    }
  }, [showTermsModal, pending, shouldSkipTermsModal, handleConnectWithoutTerms]);

  const handleDisconnect = useCallback(() => {
    if (pending) xDisconnect(pending.xChainType as ChainType);
  }, [pending, xDisconnect]);

  return {
    isSidebarOpen,
    showWalletModal,
    showTermsModal,
    connectedWalletName,
    targetChainType,
    setShowWalletModal,
    setShowTermsModal,
    setShowWalletModalOnTwoWallets,
    setTargetChainType,
    toggleSidebar,
    handleWalletSelected,
    handleTermsAccepted,
    handleConnectWithoutTerms,
    handleDisconnect,
  };
}
