// apps/web/hooks/useWalletModal.ts
import { useState, useEffect, useCallback } from 'react';
import { useXAccounts } from '@sodax/wallet-sdk';

export const useWalletModal = (isOpen: boolean) => {
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const [showingConnectors, setShowingConnectors] = useState<boolean>(false);
  const [selectedChainType, setSelectedChainType] = useState<string | null>(null);
  const xAccounts = useXAccounts();

  // Count connected wallets
  const connectedWalletsCount = Object.values(xAccounts).filter(xAccount => xAccount?.address).length;

  const handleConnectorsShown = useCallback((chainType: string) => {
    setShowingConnectors(true);
    setSelectedChainType(chainType);
  }, []);

  const handleConnectorsHidden = useCallback(() => {
    setShowingConnectors(false);
    setSelectedChainType(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowingConnectors(false);
      setSelectedChainType(null);
    }
  }, [isOpen]);

  const handleDismiss = (onDismiss: () => void) => {
    if (connectedWalletsCount < 2) {
      onDismiss();
    }
  };

  const handleManualClose = (onDismiss: () => void, onSetShowWalletModalOnTwoWallets?: (value: boolean) => void) => {
    if (onSetShowWalletModalOnTwoWallets) {
      onSetShowWalletModalOnTwoWallets(true);
    }
    onDismiss();
  };

  return {
    hoveredWallet,
    setHoveredWallet,
    showingConnectors,
    selectedChainType,
    xAccounts,
    connectedWalletsCount,
    handleConnectorsShown,
    handleConnectorsHidden,
    handleDismiss,
    handleManualClose,
  };
};
