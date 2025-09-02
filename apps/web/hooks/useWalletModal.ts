import { useState, useEffect, useCallback } from 'react';
import { useXAccounts } from '@sodax/wallet-sdk';
import type { XConnector } from '@sodax/wallet-sdk';

export const useWalletModal = (
  isOpen: boolean,
  onWalletSelected: (xConnector: XConnector, xChainType: string) => void,
) => {
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const [showWalletList, setShowWalletList] = useState<boolean>(false);
  const [selectedChainType, setSelectedChainType] = useState<string | null>(null);
  const xAccounts = useXAccounts();

  const connectedWalletsCount = Object.values(xAccounts).filter(xAccount => xAccount?.address).length;

  const handleConnectorsShown = useCallback((chainType: string) => {
    setShowWalletList(true);
    setSelectedChainType(chainType);
  }, []);

  const handleConnectorsHidden = useCallback(() => {
    setShowWalletList(false);
    setSelectedChainType(null);
  }, []);

  const handleWalletSelected = useCallback(
    (xConnector: XConnector, xChainType: string) => {
      onWalletSelected(xConnector, xChainType);
      setShowWalletList(false);
    },
    [onWalletSelected],
  );

  useEffect(() => {
    if (!isOpen) {
      setShowWalletList(false);
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
    showWalletList,
    selectedChainType,
    connectedWalletsCount,
    handleConnectorsShown,
    handleConnectorsHidden,
    handleDismiss,
    handleManualClose,
    handleWalletSelected,
  };
};
