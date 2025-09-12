// apps/web/components/shared/wallet-modal/wallet-item.tsx
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { XConnector } from '@sodax/wallet-sdk-react';
import { usePathname } from 'next/navigation';

const EVM_CHAIN_ICONS = [
  '/chain/0x2105.base.png',
  '/chain/0x38.bsc.png',
  '/chain/0xa86a.avax.png',
  '/chain/0x89.polygon.png',
  '/chain/0xa.optimism.png',
  '/chain/0xa4b1.arbitrum.png',
  '/chain/sonic.png',
];

export type WalletItemProps = {
  chainIcon: string;
  chainName: string;
  xConnector: XConnector;
  isConnectingToThis: boolean;
  onWalletSelect?: (xConnector: XConnector) => void;
};

export const WalletItem: React.FC<WalletItemProps> = ({
  chainIcon,
  chainName,
  xConnector,
  isConnectingToThis,
  onWalletSelect,
}) => {
  const isEVMWithMultipleIcons = chainName === 'EVM';
  return (
    <React.Fragment>
      <div className="inline-flex justify-between items-center transition-opacity duration-200 hover:opacity-100 opacity-60 cursor-pointer py-4 pl-1">
        <div className="flex justify-start items-center gap-4">
          <div className="flex justify-start items-center flex-wrap content-center">
            <div className="flex justify-start items-center flex-wrap content-center">
              {!isEVMWithMultipleIcons && (
                <div className="w-6 relative rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-start items-start overflow-hidden ml-1">
                  <Image src={chainIcon} alt={chainName} width={24} height={24} className="rounded-[6px]" />
                  <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                </div>
              )}
              {isEVMWithMultipleIcons && (
                <div className="flex justify-start items-center flex-wrap content-center">
                  {EVM_CHAIN_ICONS.map((icon, index) => (
                    <div
                      key={index}
                      className="rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative"
                    >
                      <Image key={index} src={icon} alt={chainName} width={24} height={24} className="rounded-[6px]" />
                      <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              data-property-1="Active"
              className="rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden z-51"
            >
              <Image
                src={xConnector.icon?.trim() || ''}
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
          disabled={isConnectingToThis}
        >
          {isConnectingToThis && <Loader2 className="animate-spin" />}
          {!isConnectingToThis && <PlusIcon className="w-4 h-4" />}
        </Button>
      </div>
      <Separator className="h-1 bg-clay opacity-30" />
    </React.Fragment>
  );
};
