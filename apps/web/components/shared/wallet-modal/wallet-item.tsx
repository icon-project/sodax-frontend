import { XIcon, Loader2, PlusIcon, MinusIcon, CopyIcon } from 'lucide-react';
import React from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useWalletItem } from '@/hooks/useWalletItem';
import type { WalletItemProps } from '@/constants/wallet';

export function shortenAddress(address: string, chars = 7): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

const WalletItem = ({
  icon,
  name,
  xChainType,
  onConnectorsShown,
  onConnectorsHidden,
  forceShowConnectors = false,
  onWalletSelected,
}: WalletItemProps) => {
  const {
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
    setShowConnectorModal,
    setShowConnectors,
    handleConnect,
    handleDisconnect,
    handleConnectorSelect,
    handleCopyClick,
    handlePlusButtonClick,
  } = useWalletItem(xChainType, onConnectorsShown, onConnectorsHidden, forceShowConnectors, onWalletSelected);

  return (
    <div className="flex items-center w-full text-[#0d0229]">
      {!forceShowConnectors && (
        <div className="inline-flex justify-start items-center gap-4">
          <div
            data-property-1="Default"
            className="rounded-md border border-4 border-white inline-flex flex-col justify-center items-center overflow-hidden"
            style={{
              boxShadow: 'rgba(185, 172, 171, 0.2) 0px 4px 8px 0px',
            }}
          >
            <Image src={icon} alt={name} width={24} height={24} className="rounded-md" />
          </div>
          <div className="flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
              {isConnecting ? 'Waiting for wallet' : address ? '' : name}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-start gap-2 grow">
        {address ? (
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-1">
              <div className="flex flex-col">
                <span className="text-espresso text-(size:--body-comfortable) leading-[1.4] font-medium">
                  {shortenAddress(address, 4)}
                </span>
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-6 h-6 p-0 rounded-full bg-transparent text-cherry-grey hover:bg-transparent hover:text-clay cursor-pointer"
                onClick={handleCopyClick}
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
              {showCopied && (
                <div
                  className={`flex flex-col font-['InterRegular'] text-espresso leading-[1.4] text-(size:--body-comfortable) text-nowrap transition-opacity ${
                    copiedFadingOut ? 'duration-[2000ms] opacity-0' : 'duration-100 opacity-100'
                  }`}
                >
                  <p className="block leading-[1.4] whitespace-pre">Copied</p>
                </div>
              )}
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-(size:--body-small) text-clay-light leading-[1.4] font-['InterRegular']">
                {activeXConnector && activeXConnector.name.replace('Hana Wallet', 'Hana')}
              </span>
              <Button
                variant="default"
                size="sm"
                className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                onClick={handleDisconnect}
              >
                <MinusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!showConnectors ? (
              <div className="flex justify-between items-center w-full">
                <div></div>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                    onClick={handlePlusButtonClick}
                    disabled={isConnecting}
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                <Separator className="h-1 bg-clay opacity-30" />
                {sortedXConnectors.map((xConnector, index) => {
                  const isConnectingToThis = isPending && connectingXConnector?.id === xConnector.id;
                  return (
                    <React.Fragment key={`${xChainType}-${xConnector.name}-${index}`}>
                      <div className=" inline-flex justify-between items-center transition-opacity duration-200 hover:opacity-100 opacity-60 cursor-pointer">
                        <div className="flex justify-start items-center gap-4">
                          <div className="flex justify-start items-center flex-wrap content-center">
                            <div className="flex justify-start items-center flex-wrap content-center">
                              <div className="w-6 relative rounded-md shadow-[-4px_0px_4px_0px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-start items-start overflow-hidden ml-1">
                                <Image src={icon} alt={name} width={24} height={24} className="rounded-md" />
                                <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                              </div>
                            </div>
                            <div
                              data-property-1="Active"
                              className="rounded-md shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.40)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden z-51"
                            >
                              <img src={xConnector.icon} className="w-6 h-6 rounded-lg" />
                            </div>
                          </div>
                          <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
                            {isConnectingToThis ? 'Waiting for wallet' : xConnector.name}
                          </div>
                        </div>
                        <Button
                          className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                          onClick={() => handleConnect(xConnector)}
                          disabled={isPending && connectingXConnector?.id === xConnector.id}
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WalletItem;
