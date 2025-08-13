// apps/web/components/shared/wallet-modal/wallet-list.tsx
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ChainType, XConnector } from '@sodax/wallet-sdk';

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
    <div className="flex flex-col gap-4 w-full">
      <Separator className="h-1 bg-clay opacity-30" />
      {sortedConnectors.map((xConnector, index) => {
        const isConnectingToThis = isPending && connectingConnector?.id === xConnector.id;
        return (
          <React.Fragment key={`${xChainType}-${xConnector.name}-${index}`}>
            <div className="inline-flex justify-between items-center transition-opacity duration-200 hover:opacity-100 opacity-60 cursor-pointer">
              <div className="flex justify-start items-center gap-4">
                <div className="flex justify-start items-center flex-wrap content-center">
                  <div className="flex justify-start items-center flex-wrap content-center">
                    <div className="w-6 relative rounded-md shadow-[-4px_0px_4px_0px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-start items-start overflow-hidden ml-1">
                      <Image src={chainIcon} alt={chainName} width={24} height={24} className="rounded-md" />
                      <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                    </div>
                  </div>
                  <div
                    data-property-1="Active"
                    className="rounded-md shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.40)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden z-51"
                  >
                    <Image
                      src={xConnector.icon || ''}
                      alt={xConnector.name}
                      width={24}
                      height={24}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
                  {isConnectingToThis ? 'Waiting for wallet' : xConnector.name}
                </div>
              </div>
              <Button
                className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                onClick={() => onWalletSelect?.(xConnector)}
                disabled={isPending && connectingConnector?.id === xConnector.id}
              >
                {isConnectingToThis && <Loader2 className="animate-spin" />}
                {!isConnectingToThis && <PlusIcon className="w-4 h-4" />}
              </Button>
            </div>
            <Separator className="h-1 bg-clay opacity-30" />
          </React.Fragment>
        );
      })}
    </div>
  );
};
