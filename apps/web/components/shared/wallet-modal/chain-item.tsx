// apps/web/components/shared/wallet-modal/chain-item.tsx
import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, CopyIcon, Loader2 } from 'lucide-react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';

export function shortenAddress(address: string, chars = 7): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export type ChainItemProps = {
  icon: string;
  name: string;
  xChainType: ChainType;
  address?: string;
  activeConnector?: XConnector;
  isConnecting?: boolean;
  showCopied?: boolean;
  copiedFadingOut?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onCopyAddress?: () => void;
  onShowWallets?: () => void;
};

export const ChainItem: React.FC<ChainItemProps> = ({
  icon,
  name,
  xChainType,
  address,
  activeConnector,
  isConnecting = false,
  showCopied = false,
  copiedFadingOut = false,
  onConnect,
  onDisconnect,
  onCopyAddress,
  onShowWallets,
}) => {
  return (
    <div className="flex items-center w-full text-[#0d0229]">
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
                onClick={onCopyAddress}
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
                {activeConnector && activeConnector.name.replace('Hana Wallet', 'Hana')}
              </span>
              <Button
                variant="default"
                size="sm"
                className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                onClick={onDisconnect}
              >
                <MinusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center w-full">
            <div></div>
            <div className="flex gap-1 items-center">
              <Button
                variant="default"
                size="sm"
                className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                onClick={onShowWallets}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
