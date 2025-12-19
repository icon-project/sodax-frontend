import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, CopyIcon, Loader2 } from 'lucide-react';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { shortenAddress } from '@/lib/utils';
import { useState } from 'react';
import type { ChainType } from '@sodax/types';
import { EVM_CHAIN_ICONS, getChainIconClass, getChainIconSize } from '@/constants/chains';

export type EVMChainItemProps = {
  handleConnect: () => void;
  handleDisconnect: () => void;
  isPending: boolean;
  setHoveredChainType?: (chainType: ChainType | undefined) => void;
  hoveredChainType?: ChainType | undefined;
};

export const EVMChainItem: React.FC<EVMChainItemProps> = ({
  handleConnect,
  handleDisconnect,
  isPending,
  setHoveredChainType,
  hoveredChainType,
}) => {
  const { address } = useXAccount('EVM');
  const [showCopied, setShowCopied] = useState(false);
  const [copiedFadingOut, setCopiedFadingOut] = useState(false);

  const onCopyAddress = () => {
    if (!address) return;
    setShowCopied(true);
    navigator.clipboard.writeText(address);
    setTimeout(() => {
      setCopiedFadingOut(true);
    }, 1000);

    setTimeout(() => {
      setShowCopied(false);
      setCopiedFadingOut(false);
    }, 3000);
  };
  return (
    <div
      className={`
          inline-flex justify-between items-center
          transition-opacity duration-200
          hover:opacity-100
          group
          cursor-pointer py-4 pl-1
          ${address ? 'opacity-100' : ''}
          ${hoveredChainType === undefined || hoveredChainType === 'EVM' ? 'opacity-100' : 'opacity-60'}
        `}
      onMouseEnter={() => {
        setHoveredChainType?.('EVM');
      }}
      onMouseLeave={() => {
        setHoveredChainType?.(undefined);
      }}
      onClick={address ? handleDisconnect : handleConnect}
    >
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center">
          {address ? (
            <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold flex gap-1 items-center">
              {!showCopied && address ? shortenAddress(address, 4) : 'EVM'}
              {address && (
                <CopyIcon
                  className="w-4 h-4 cursor-pointer text-cherry-grey hover:text-clay"
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCopyAddress();
                  }}
                />
              )}
              {showCopied && (
                <div
                  className={`flex font-['InterRegular'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-espresso text-(length:--body-comfortable) text-left text-nowrap transition-opacity ${
                    copiedFadingOut ? 'duration-[2000ms] opacity-0' : 'duration-100 opacity-100'
                  }`}
                >
                  <p className="block leading-[1.4] whitespace-pre">Copied</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex">
              <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
                EVM multi-connect
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 grow">
            <div className="flex gap-1">
              {address && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full bg-cream text-espresso bg-cherry-brighter hover:bg-cherry-bright hover:text-white cursor-pointer"
                  onClick={handleDisconnect}
                >
                  <MinusIcon className="w-4 h-4" />
                </Button>
              )}
              {!address && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                  onClick={handleConnect}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="inline-flex justify-start items-center gap-4">
          <div className="self-stretch inline-flex justify-start items-center flex-wrap content-center relative">
            {EVM_CHAIN_ICONS.map((evmIcon, index) => (
              <div
                key={index}
                className={`rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden ${getChainIconClass(evmIcon)}`}
              >
                <Image
                  key={index}
                  src={evmIcon}
                  alt={`EVM Chain ${index + 1}`}
                  width={getChainIconSize(evmIcon, 24)}
                  height={getChainIconSize(evmIcon, 24)}
                  className="rounded-sm shadow-[0px_6px_12px_0px_rgba(185,172,171,0.10)]"
                />
              </div>
            ))}
            {address && (
              <div className="absolute -bottom-1 -right-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <title>Connected</title>
                  <circle cx="7" cy="7" r="5.5" fill="#00A778" stroke="white" strokeWidth="3" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
