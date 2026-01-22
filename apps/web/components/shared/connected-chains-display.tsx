'use client';

import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useXAccounts } from '@sodax/wallet-sdk-react';
import { getChainIconByName, EVM_CHAIN_ICONS } from '@/constants/chains';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ConnectedChainsDisplayProps {
  onClick?: () => void;
}

export function ConnectedChainsDisplay({ onClick }: ConnectedChainsDisplayProps): React.JSX.Element {
  const xAccounts = useXAccounts();

  const pathname = usePathname();
  const isPartner = pathname.startsWith('/partner');

  const connectedChains = Object.entries(xAccounts)
    .filter(([_, account]) => account?.address)
    .map(([chainType, account]) => ({
      chainType,
      address: account?.address,
      icon: getChainIconByName(chainType),
    }));

  if (connectedChains.length === 0) return <></>;

  // Check if there are EVM chains
  const hasEVMChains = connectedChains.some(chain => chain.chainType === 'EVM');

  return (
    <div className="flex justify-end items-center gap-4 w-auto shrink-0">
      <div className={cn('items-center cursor-pointer', isPartner ? 'hidden sm:flex' : 'flex')} onClick={onClick}>
        {!hasEVMChains &&
          connectedChains.map(chain => {
            return (
              <div key={chain.chainType} className="relative">
                <Image
                  className="rounded shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.20)] outline outline-3 outline-white"
                  src={chain.icon || ''}
                  alt={chain.chainType}
                  width={20}
                  height={20}
                />
              </div>
            );
          })}
        {hasEVMChains && (
          <>
            {EVM_CHAIN_ICONS.slice(0, 6).map((icon, index) => (
              <div
                key={index}
                className="rounded-[4px] w-5 h-5 shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative"
              >
                <Image key={index} src={icon} alt={icon} width={20} height={20} className="rounded-[4px]" />
              </div>
            ))}
            <div className="rounded-[4px] w-5 h-5 shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative bg-white">
              <div className="flex justify-center items-center">
                <span className="text-[10px] text-clay leading-[1.4] font-['InterBold']">+</span>
                <span className="text-[10px] text-espresso font-bold font-['InterBold'] leading-[1.4]">
                  {connectedChains.length + 3}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      {!hasEVMChains && connectedChains.length === 1 && (
        <div className="text-cherry-brighter text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
          Welcome!
        </div>
      )}
      <Button
        variant="cherry"
        className="w-10 h-10 p-3 bg-cherry-bright rounded-[256px] inline-flex justify-center items-center gap-2 cursor-pointer"
        aria-label="Settings"
        onClick={onClick}
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
