import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { WalletModalItem } from './wallet-modal-item';
import Image from 'next/image';
import { ArrowLeftIcon, XIcon } from 'lucide-react';
import type { XConnector } from '@sodax/wallet-sdk';
import { getXChainType } from '@sodax/wallet-sdk';
import type { ChainType } from '@sodax/types';
import { xChainTypes } from '@/constants/wallet';
import { useWalletModal } from '@/hooks/useWalletModal';
import { AllSupportItem } from './all-support-item';
import { usePathname } from 'next/navigation';
import { useSwapState } from '@/app/(apps)/swap/_stores/swap-store-provider';

type WalletModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
  onWalletSelected?: (xConnector: XConnector, xChainType: string) => void;
  onSetShowWalletModalOnTwoWallets?: (value: boolean) => void;
  targetChainType?: ChainType;
};

export const WalletModal = ({
  isOpen,
  onDismiss,
  onWalletSelected,
  onSetShowWalletModalOnTwoWallets,
  targetChainType,
}: WalletModalProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const pathname = usePathname();
  const isMigrateRoute = pathname.includes('migrate');

  // Move useSwapState to top level
  const { sourceToken } = useSwapState();
  const {
    hoveredWallet,
    setHoveredWallet,
    showWalletList,
    selectedChainType,
    xAccounts,
    handleConnectorsShown,
    handleConnectorsHidden,
    handleDismiss,
    handleManualClose,
    handleWalletSelected,
  } = useWalletModal(isOpen, onWalletSelected || (() => {}));

  const selectedChain = xChainTypes.find(w => w.xChainType === selectedChainType);

  const availableChains = isMigrateRoute
    ? xChainTypes.filter(w => w.xChainType === 'ICON' || w.xChainType === 'EVM')
    : xChainTypes;

  const getMainChain = (): (typeof availableChains)[0] | undefined => {
    // Check if we're on swap page and use sourceToken chain as main chain

    if (isMigrateRoute) {
      return availableChains.find(w => w.xChainType === 'ICON');
    }

    if (isExpanded) {
      return availableChains.find(w => w.xChainType === 'EVM');
    }

    if (targetChainType) {
      const targetChain = availableChains.find(w => w.xChainType === targetChainType);
      if (targetChain) {
        return targetChain;
      }
    }

    if (pathname.includes('swap')) {
      const sourceChainType = getXChainType(sourceToken.xChainId);
      if (sourceChainType) {
        const swapChain = availableChains.find(w => w.xChainType === sourceChainType);
        if (swapChain) {
          return swapChain;
        }
      }
    }

    return availableChains.find(w => w.xChainType === 'SOLANA');
  };

  const mainChain = getMainChain();

  const otherChains = isMigrateRoute
    ? availableChains.filter(w => w.xChainType !== 'ICON')
    : availableChains.filter(w => w.xChainType !== mainChain?.xChainType);

  const handleToggleExpanded = (expanded: boolean): void => {
    setIsExpanded(expanded);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleDismiss(onDismiss)}>
      <DialogContent
        className="max-w-full w-full md:max-w-[480px] p-12 w-[90%] shadow-none bg-vibrant-white gap-4"
        hideCloseButton
      >
        <DialogTitle>
          {!showWalletList ? (
            <div className="flex flex-row justify-between items-center">
              {!isExpanded && (
                <div className="inline-flex justify-center items-center gap-2">
                  <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
                  <div className="flex-1 justify-center text-espresso text-base font-['InterRegular'] font-bold leading-snug">
                    Connect wallets
                  </div>
                </div>
              )}
              {!isExpanded && (
                <DialogClose asChild>
                  <XIcon
                    className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay"
                    onClick={() => handleManualClose(onDismiss, onSetShowWalletModalOnTwoWallets)}
                  />
                </DialogClose>
              )}
              {isExpanded && (
                <div className="flex flex-row justify-end w-full">
                  <XIcon
                    className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay"
                    onClick={() => setIsExpanded(false)}
                  />
                </div>
              )}
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
                  Connect your {isMigrateRoute ? 'Sonic' : selectedChain?.name || 'wallet'} wallet
                </div>
                <DialogClose asChild>
                  <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                </DialogClose>
              </div>
            </div>
          )}
        </DialogTitle>
        {!showWalletList && !isExpanded && (
          <div className=" justify-start text-clay-light text-sm font-medium font-['InterRegular'] leading-tight">
            {isMigrateRoute
              ? 'You will need to connect on both networks.'
              : 'You will need to connect your wallet to proceed.'}
          </div>
        )}
        <div className={cn('flex flex-col justify-between')}>
          <ScrollArea className="h-full">
            <div className="w-full flex flex-col">
              {!showWalletList ? (
                <>
                  {!isExpanded && <Separator className="h-1 bg-clay opacity-30" />}

                  {/* Show main chain first */}
                  {mainChain && (
                    <React.Fragment>
                      <div
                        className={`flex flex-row items-center transition-opacity duration-200 cursor-pointer ${
                          hoveredWallet === mainChain.xChainType || xAccounts[mainChain.xChainType]?.address
                            ? 'opacity-100 '
                            : 'opacity-40'
                        }`}
                        onMouseEnter={() => setHoveredWallet(mainChain.xChainType)}
                        onMouseLeave={() => setHoveredWallet(null)}
                      >
                        <WalletModalItem
                          icon={mainChain.icon}
                          name={mainChain.name}
                          xChainType={mainChain.xChainType}
                          onConnectorsShown={() => handleConnectorsShown(mainChain.xChainType)}
                          onConnectorsHidden={handleConnectorsHidden}
                          onWalletSelected={handleWalletSelected}
                          showWalletList={showWalletList}
                        />
                      </div>
                    </React.Fragment>
                  )}

                  {!isExpanded && !isMigrateRoute && (
                    <>
                      <Separator className="h-1 bg-clay opacity-30" />
                      <AllSupportItem onToggleExpanded={handleToggleExpanded} isExpanded={isExpanded} />
                    </>
                  )}

                  {/* Show other chains when expanded or on migration route */}
                  {(isExpanded || isMigrateRoute) &&
                    otherChains.map(wallet => {
                      const isConnected = xAccounts[wallet.xChainType]?.address;
                      return (
                        <React.Fragment key={`wallet_${wallet.xChainType}`}>
                          <Separator className="h-1 bg-clay opacity-30" />
                          <div
                            className={`flex flex-row items-center transition-opacity duration-200 cursor-pointer ${
                              hoveredWallet === wallet.xChainType || isConnected ? 'opacity-100 ' : 'opacity-40'
                            }`}
                            onMouseEnter={() => setHoveredWallet(wallet.xChainType)}
                            onMouseLeave={() => setHoveredWallet(null)}
                          >
                            <WalletModalItem
                              icon={wallet.icon}
                              name={wallet.name}
                              xChainType={wallet.xChainType}
                              onConnectorsShown={() => handleConnectorsShown(wallet.xChainType)}
                              onConnectorsHidden={handleConnectorsHidden}
                              onWalletSelected={handleWalletSelected}
                              showWalletList={showWalletList}
                            />
                          </div>
                        </React.Fragment>
                      );
                    })}
                </>
              ) : (
                <div className="w-full">
                  {selectedChain && (
                    <WalletModalItem
                      icon={selectedChain.icon}
                      name={selectedChain.name}
                      xChainType={selectedChain.xChainType}
                      onConnectorsShown={() => selectedChainType && handleConnectorsShown(selectedChainType)}
                      onConnectorsHidden={handleConnectorsHidden}
                      onWalletSelected={handleWalletSelected}
                      showWalletList={showWalletList}
                    />
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        {!showWalletList && !isExpanded && (
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
