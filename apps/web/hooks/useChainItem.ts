import { useState, useCallback, useMemo } from 'react';
import { useXConnection, useXAccount, useXConnectors, useXConnect, useXDisconnect } from '@sodax/wallet-sdk-react';
import type { XConnector } from '@sodax/wallet-sdk-react';
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
      } catch (error) {
        setConnectingXConnector(null);
        return;
      } finally {
        if (onWalletSelected) {
          onWalletSelected(xConnector, xChainType);
        }
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

  const isOnlyOneWallet = useMemo(() => {
    return xConnectors.length === 1;
  }, [xConnectors]);

  const handleShowWallets = useCallback(() => {
    if (isOnlyOneWallet) {
      handleConnect(xConnectors[0] as XConnector);
    } else if (xConnectors.length >= 2) {
      if (onConnectorsShown) {
        onConnectorsShown();
      }
    }
  }, [isOnlyOneWallet, xConnectors, handleConnect, onConnectorsShown]);

  const isConnecting = isPending && connectingXConnector !== null;

  return {
    address,
    connectingXConnector,
    showCopied,
    copiedFadingOut,
    xConnectors,
    isPending,
    activeXConnector,
    isOnlyOneWallet,
    isConnecting,
    handleConnect,
    handleDisconnect,
    handleCopyClick,
    handleShowWallets,
  };
}
