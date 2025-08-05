import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ChainType } from '@sodax/types';
import type { WalletItemProps } from './wallet-item';
import WalletItem from './wallet-item';
import Image from 'next/image';
import { ArrowLeftIcon, XIcon } from 'lucide-react';
import { useXAccounts } from '@sodax/wallet-sdk';

type WalletModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
  onWalletSelected?: (xConnector: unknown, xChainType: string) => void;
};

export const xChainTypes: WalletItemProps[] = [
  {
    name: 'ICON',
    xChainType: 'ICON',
    icon: '/coin/icx1.png',
  },
  // {
  //   name: 'EVM',
  //   xChainType: 'EVM',
  //   icon: '/coin/eth1.png',
  // },
  {
    name: 'SONIC',
    xChainType: 'EVM',
    icon: '/coin/s1.png',
  },
  // {
  //   name: 'Injective',
  //   xChainType: 'INJECTIVE',
  //   icon: '/coin/inj1.png',
  // },
  // {
  //   name: 'Solana',
  //   xChainType: 'SOLANA',
  //   icon: '/coin/sol.png',
  // },
  // {
  //   name: 'Sui',
  //   xChainType: 'SUI',
  //   icon: '/coin/sui1.png',
  // },
  // {
  //   name: 'Stellar',
  //   xChainType: 'STELLAR',
  //   icon: '/coin/ste1.png',
  // },
];

export const WalletModal = ({ isOpen, onDismiss, onWalletSelected }: WalletModalProps) => {
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

  // Reset showingConnectors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowingConnectors(false);
      setSelectedChainType(null);
    }
  }, [isOpen]);

  // Custom dismiss handler that prevents auto-closing when 2 wallets are connected
  const handleDismiss = () => {
    // Only allow dismissal if less than 2 wallets are connected
    // or if user explicitly closes the modal (not auto-close)
    if (connectedWalletsCount < 2) {
      onDismiss();
    }
  };

  // Manual close handler that allows explicit closing even with 2 wallets connected
  const handleManualClose = () => {
    onDismiss();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent
        className="max-w-full w-full md:max-w-[480px] p-12 w-[90%] shadow-none bg-white gap-4 h-fit"
        hideCloseButton
      >
        <DialogTitle>
          {!showingConnectors ? (
            <div className="flex flex-row justify-between items-center">
              <div className="self-stretch inline-flex justify-center items-center gap-2">
                <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
                <div className="flex-1 justify-center text-espresso text-base font-['InterRegular'] font-bold leading-snug">
                  Connect wallets
                </div>
              </div>
              <DialogClose asChild>
                <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" onClick={handleManualClose} />
              </DialogClose>
            </div>
          ) : (
            <div className="flex flex-row justify-between items-center">
              <div
                data-property-1="Left default"
                className="w-6 h-6 bg-cream-white hover:bg-cherry-bright hover:text-white rounded-[80px] inline-flex justify-center items-center cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setShowingConnectors(false);
                  setSelectedChainType(null);
                }}
              >
                <ArrowLeftIcon className="w-3 h-3" />
              </div>
              <div className="flex flex-row justify-between items-center gap-4">
                <div className="text-right justify-end text-clay-light text-(size:--body-small) font-medium font-['InterRegular'] leading-none">
                  Connect your Sonic wallet
                </div>
                <DialogClose asChild>
                  <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                </DialogClose>
              </div>
            </div>
          )}
        </DialogTitle>
        {!showingConnectors && (
          <div className="self-stretch justify-start text-clay-light text-sm font-medium font-['InterRegular'] leading-tight">
            You will need to connect on both networks
          </div>
        )}
        <div className={cn('flex flex-col justify-between')}>
          <ScrollArea className="h-full">
            <div className="w-full flex flex-col gap-4">
              {!showingConnectors ? (
                <>
                  <Separator className="h-1 bg-clay opacity-30" />
                  {xChainTypes.map(wallet => (
                    <React.Fragment key={`wallet_${wallet.xChainType}`}>
                      <div
                        className={`flex flex-row items-center transition-opacity duration-200 cursor-pointer ${
                          hoveredWallet === wallet.xChainType ? 'opacity-100 ' : 'opacity-40'
                        }`}
                        onMouseEnter={() => setHoveredWallet(wallet.xChainType)}
                        onMouseLeave={() => setHoveredWallet(null)}
                      >
                        <WalletItem
                          icon={wallet.icon}
                          name={wallet.name}
                          xChainType={wallet.xChainType}
                          onConnectorsShown={() => handleConnectorsShown(wallet.xChainType)}
                          onConnectorsHidden={handleConnectorsHidden}
                          onWalletSelected={onWalletSelected}
                        />
                      </div>
                      <Separator className="h-1 bg-clay opacity-30" />
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <div className="w-full">
                  <WalletItem
                    icon={xChainTypes.find(w => w.xChainType === selectedChainType)?.icon || ''}
                    name={xChainTypes.find(w => w.xChainType === selectedChainType)?.name || ''}
                    xChainType={selectedChainType as ChainType}
                    onConnectorsShown={() => selectedChainType && handleConnectorsShown(selectedChainType)}
                    onConnectorsHidden={handleConnectorsHidden}
                    forceShowConnectors={true}
                    onWalletSelected={onWalletSelected}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        {!showingConnectors && (
          <div className="self-stretch justify-start flex gap-1">
            <span className="text-clay-light text-sm font-medium font-['InterRegular'] leading-tight">
              Need help? Check our guide{' '}
            </span>
            <span className="text-clay-light text-sm font-medium font-['InterRegular'] underline leading-tight">
              here
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
