// apps/web/hooks/useChainItem.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useXConnection, useXAccount, useXConnectors, useXConnect, useXDisconnect } from '@sodax/wallet-sdk';
import type { XConnector } from '@sodax/wallet-sdk';
import type { ChainType } from '@sodax/types';

export function useChainItem(
  xChainType: ChainType,
  onConnectorsShown?: () => void,
  onConnectorsHidden?: () => void,
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void,
) {
  const xConnection = useXConnection(xChainType);
  const { address } = useXAccount(xChainType);
  const [connectingXConnector, setConnectingXConnector] = useState<XConnector | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [copiedFadingOut, setCopiedFadingOut] = useState(false);

  const xConnectors = useXConnectors(xChainType);
  const { mutateAsync: xConnect, isPending } = useXConnect();
  const xDisconnect = useXDisconnect();

  const handleConnect = useCallback(
    async (xConnector: XConnector) => {
      setConnectingXConnector(xConnector);
      try {
        await xConnect(xConnector);
        if (onWalletSelected) {
          onWalletSelected(xConnector, xChainType);
        }
      } catch (error) {
        setConnectingXConnector(null);
        return;
      } finally {
        setConnectingXConnector(null);
      }
    },
    [onWalletSelected, xChainType, xConnect],
  );

  const handleDisconnect = useCallback(() => {
    setConnectingXConnector(null);
    xDisconnect(xChainType);
  }, [xDisconnect, xChainType]);

  const handleCopyClick = useCallback(() => {
    if (address) {
      setShowCopied(true);
      setCopiedFadingOut(false);

      navigator.clipboard.writeText(address);
      setTimeout(() => {
        setCopiedFadingOut(true);
      }, 1000);

      setTimeout(() => {
        setShowCopied(false);
        setCopiedFadingOut(false);
      }, 3000);
    }
  }, [address]);

  const activeXConnector = useMemo(() => {
    return xConnectors.find(connector => connector.id === xConnection?.xConnectorId);
  }, [xConnectors, xConnection]);

  const isHanaOnly = useMemo(() => {
    const hanaConnectors = xConnectors.filter(
      connector =>
        connector.name === 'Hana Wallet' || connector.name === 'Hana' || connector.name.toLowerCase().includes('hana'),
    );
    return hanaConnectors.length === 1 && xConnectors.length === 1;
  }, [xConnectors]);

  const handleShowWallets = useCallback(() => {
    if (isHanaOnly) {
      const hanaConnector = xConnectors.find(
        connector =>
          connector.name === 'Hana Wallet' ||
          connector.name === 'Hana' ||
          connector.name.toLowerCase().includes('hana'),
      );
      if (hanaConnector) {
        handleConnect(hanaConnector);
      }
    } else if (xConnectors.length >= 2) {
      if (onConnectorsShown) {
        onConnectorsShown();
      }
    }
  }, [isHanaOnly, xConnectors, handleConnect, onConnectorsShown]);

  const isConnecting = isPending && connectingXConnector !== null;

  return {
    address,
    connectingXConnector,
    showCopied,
    copiedFadingOut,
    xConnectors,
    isPending,
    activeXConnector,
    isHanaOnly,
    isConnecting,
    handleConnect,
    handleDisconnect,
    handleCopyClick,
    handleShowWallets,
  };
}
