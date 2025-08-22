import type React from 'react';
import { ChainItem } from './chain-item';
import { WalletList } from './wallet-list';
import { useChainItem } from '@/hooks/useChainItem';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';

export type WalletModalItemProps = {
  icon: string;
  name: string;
  xChainType: ChainType;
  onConnectorsShown?: () => void;
  onConnectorsHidden?: () => void;
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void;
  forceShowConnectors?: boolean;
  showWalletList?: boolean;
};

export const WalletModalItem: React.FC<WalletModalItemProps> = ({
  icon,
  name,
  xChainType,
  onConnectorsShown,
  onConnectorsHidden,
  onWalletSelected,
  showWalletList,
}) => {
  const {
    address,
    connectingXConnector,
    showCopied,
    copiedFadingOut,
    xConnectors,
    isPending,
    activeXConnector,
    isConnecting,
    handleConnect,
    handleDisconnect,
    handleCopyClick,
    handleShowWallets,
  } = useChainItem(xChainType, onConnectorsShown, onConnectorsHidden, onWalletSelected);

  console.log('isPending', isPending);
  console.log('connectingXConnector', connectingXConnector);

  return (
    <div className="flex flex-col w-full">
      {!showWalletList ? (
        <ChainItem
          icon={icon}
          name={name}
          xChainType={xChainType}
          address={address}
          activeConnector={activeXConnector}
          isConnecting={isConnecting}
          showCopied={showCopied}
          copiedFadingOut={copiedFadingOut}
          onDisconnect={handleDisconnect}
          onCopyAddress={handleCopyClick}
          onShowWallets={handleShowWallets}
        />
      ) : (
        <WalletList
          chainIcon={icon}
          chainName={name}
          xChainType={xChainType}
          xConnectors={xConnectors}
          connectingConnector={connectingXConnector}
          isPending={isPending}
          onWalletSelect={handleConnect}
        />
      )}
    </div>
  );
};
