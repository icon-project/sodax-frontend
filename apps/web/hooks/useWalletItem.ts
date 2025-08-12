// apps/web/hooks/useWalletItem.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useXConnection, useXAccount, useXConnectors, useXConnect, useXDisconnect } from '@sodax/wallet-sdk';
import type { ChainType, XConnector } from '@sodax/wallet-sdk';

export function useWalletItem(
  xChainType: ChainType,
  onConnectorsShown?: () => void,
  onConnectorsHidden?: () => void,
  forceShowConnectors?: boolean,
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void,
) {
  const xConnection = useXConnection(xChainType);
  const { address } = useXAccount(xChainType);
  const [connectingXConnector, setConnectingXConnector] = useState<XConnector | null>(null);
  const [showConnectorModal, setShowConnectorModal] = useState<boolean>(false);
  const [selectedConnector, setSelectedConnector] = useState<XConnector | null>(null);
  const [showConnectors, setShowConnectors] = useState<boolean>(forceShowConnectors || false);
  const [isClicked, setIsClicked] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [copiedFadingOut, setCopiedFadingOut] = useState(false);
  const [logoFadingOut, setLogoFadingOut] = useState(false);

  const onConnectorsShownRef = useRef(onConnectorsShown);
  const onConnectorsHiddenRef = useRef(onConnectorsHidden);

  useEffect(() => {
    onConnectorsShownRef.current = onConnectorsShown;
    onConnectorsHiddenRef.current = onConnectorsHidden;
  });

  const xConnectors = useXConnectors(xChainType);
  const { mutateAsync: xConnect, isPending } = useXConnect();
  const xDisconnect = useXDisconnect();

  useEffect(() => {
    setShowConnectors(forceShowConnectors || false);
  }, [forceShowConnectors]);

  useEffect(() => {
    if (showConnectors && onConnectorsShownRef.current) {
      onConnectorsShownRef.current();
    } else if (!showConnectors && onConnectorsHiddenRef.current) {
      onConnectorsHiddenRef.current();
    }
  }, [showConnectors]);

  const handleConnect = useCallback(
    async (xConnector: XConnector) => {
      setConnectingXConnector(xConnector);
      try {
        await xConnect(xConnector);
        if (onWalletSelected) {
          onWalletSelected(xConnector, xChainType);
        }
        if (onConnectorsHidden) {
          onConnectorsHidden();
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
        setConnectingXConnector(null);
        return;
      } finally {
        setConnectingXConnector(null);
      }
    },
    [onConnectorsHidden, onWalletSelected, xChainType, xConnect],
  );

  const handleDisconnect = useCallback(() => {
    setConnectingXConnector(null);
    setSelectedConnector(null);
    xDisconnect(xChainType);
  }, [xDisconnect, xChainType]);

  const handleConnectorSelect = useCallback((xConnector: XConnector) => {
    setSelectedConnector(xConnector);
    setShowConnectorModal(false);
  }, []);

  const handleCopyClick = useCallback(() => {
    if (address) {
      setIsClicked(true);
      setShowCopied(true);
      setCopiedFadingOut(false);
      setLogoFadingOut(false);

      navigator.clipboard.writeText(address);
      setTimeout(() => {
        setCopiedFadingOut(true);
        setLogoFadingOut(true);
      }, 1000);

      setTimeout(() => {
        setIsClicked(false);
        setShowCopied(false);
        setCopiedFadingOut(false);
        setLogoFadingOut(false);
      }, 3000);
    }
  }, [address]);

  const activeXConnector = useMemo(() => {
    return xConnectors.find(connector => connector.id === xConnection?.xConnectorId);
  }, [xConnectors, xConnection]);

  const sortedXConnectors = useMemo(() => {
    const hanaWallet = xConnectors.find(connector => connector.name === 'Hana Wallet');
    if (!hanaWallet) return xConnectors;
    const filteredConnectors = xConnectors.filter(connector => connector.name !== 'Hana Wallet');
    return [hanaWallet, ...filteredConnectors];
  }, [xConnectors]);

  const isHanaOnly = useMemo(() => {
    const hanaConnectors = xConnectors.filter(
      connector =>
        connector.name === 'Hana Wallet' || connector.name === 'Hana' || connector.name.toLowerCase().includes('hana'),
    );
    return hanaConnectors.length === 1 && xConnectors.length === 1;
  }, [xConnectors]);

  const handlePlusButtonClick = useCallback(() => {
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
    } else {
      setShowConnectors(true);
    }
  }, [isHanaOnly, xConnectors, handleConnect]);

  const isConnecting = isPending && connectingXConnector !== null;

  return {
    // state
    address,
    connectingXConnector,
    showConnectorModal,
    selectedConnector,
    showConnectors,
    isClicked,
    showCopied,
    copiedFadingOut,
    logoFadingOut,
    xConnectors,
    isPending,
    activeXConnector,
    sortedXConnectors,
    isHanaOnly,
    isConnecting,
    // setters
    setShowConnectorModal,
    setShowConnectors,
    // actions
    handleConnect,
    handleDisconnect,
    handleConnectorSelect,
    handleCopyClick,
    handlePlusButtonClick,
  };
}
