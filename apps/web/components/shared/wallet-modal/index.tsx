import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ChainType } from '@sodax/types';
import WalletItem from './wallet-item';
import Image from 'next/image';
import { ArrowLeftIcon, XIcon } from 'lucide-react';
import type { XConnector } from '@sodax/wallet-sdk';
import { xChainTypes } from '@/constants/wallet';
import { useWalletModal } from '@/hooks/useWalletModal';

type WalletModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void;
  onSetShowWalletModalOnTwoWallets?: (value: boolean) => void;
};

export const WalletModal = ({
  isOpen,
  onDismiss,
  onWalletSelected,
  onSetShowWalletModalOnTwoWallets,
}: WalletModalProps) => {
  const {
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
  } = useWalletModal(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={() => handleDismiss(onDismiss)}>
      <DialogContent
        className="max-w-full w-full md:max-w-[480px] p-12 w-[90%] shadow-none bg-white gap-4 h-fit"
        hideCloseButton
      >
        <DialogTitle>
          {!showingConnectors ? (
            <div className="flex flex-row justify-between items-center">
              <div className=" inline-flex justify-center items-center gap-2">
                <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
                <div className="flex-1 justify-center text-espresso text-base font-['InterRegular'] font-bold leading-snug">
                  Connect wallets
                </div>
              </div>
              <DialogClose asChild>
                <XIcon
                  className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay"
                  onClick={() => handleManualClose(onDismiss, onSetShowWalletModalOnTwoWallets)}
                />
              </DialogClose>
            </div>
          ) : (
            <div className="flex flex-row justify-between items-center">
              <div
                data-property-1="Left default"
                className="w-6 h-6 bg-cream-white hover:bg-cherry-bright hover:text-white rounded-[80px] inline-flex justify-center items-center cursor-pointer transition-colors duration-200"
                onClick={handleConnectorsHidden}
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
          <div className=" justify-start text-clay-light text-sm font-medium font-['InterRegular'] leading-tight">
            You will need to connect on both networks
          </div>
        )}
        <div className={cn('flex flex-col justify-between')}>
          <ScrollArea className="h-full">
            <div className="w-full flex flex-col gap-4">
              {!showingConnectors ? (
                <>
                  <Separator className="h-1 bg-clay opacity-30" />
                  {xChainTypes.map(wallet => {
                    const isConnected = xAccounts[wallet.xChainType]?.address;
                    return (
                      <React.Fragment key={`wallet_${wallet.xChainType}`}>
                        <div
                          className={`flex flex-row items-center transition-opacity duration-200 cursor-pointer ${
                            hoveredWallet === wallet.xChainType || isConnected ? 'opacity-100 ' : 'opacity-40'
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
                    );
                  })}
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
          <div className=" justify-start flex gap-1">
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
