// apps/web/components/shared/wallet-modal/wallet-list.tsx
import React from 'react';
import { Separator } from '@/components/ui/separator';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';
import { WalletItem } from './wallet-item';

export type WalletListProps = {
  chainIcon: string;
  chainName: string;
  xChainType: ChainType;
  xConnectors: XConnector[];
  connectingConnector?: XConnector | null;
  isPending?: boolean;
  onWalletSelect?: (xConnector: XConnector) => void;
};

export const WalletList: React.FC<WalletListProps> = ({
  chainIcon,
  chainName,
  xChainType,
  xConnectors,
  connectingConnector,
  isPending = false,
  onWalletSelect,
}) => {
  // Sort connectors to show Hana Wallet first
  const sortedConnectors = React.useMemo(() => {
    const hanaWallet = xConnectors.find(
      connector =>
        connector.name === 'Hana Wallet' || connector.name === 'Hana' || connector.name.toLowerCase().includes('hana'),
    );
    if (!hanaWallet) return xConnectors;
    const filteredConnectors = xConnectors.filter(
      connector =>
        connector.name !== 'Hana Wallet' && connector.name !== 'Hana' && !connector.name.toLowerCase().includes('hana'),
    );
    return [hanaWallet, ...filteredConnectors];
  }, [xConnectors]);

  return (
    <div className="flex flex-col w-full">
      <Separator className="h-1 bg-clay opacity-30" />
      {sortedConnectors.map((xConnector, index) => {
        const isConnectingToThis = isPending && connectingConnector?.id === xConnector.id;
        return (
          <WalletItem
            key={`${xChainType}-${xConnector.name}-${index}`}
            chainIcon={chainIcon}
            chainName={chainName}
            xConnector={xConnector}
            isConnectingToThis={isConnectingToThis}
            onWalletSelect={onWalletSelect}
          />
        );
      })}
    </div>
  );
};
