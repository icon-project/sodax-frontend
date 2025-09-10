// apps/web/components/shared/connected-chains-display.tsx
import type React from 'react';
import Image from 'next/image';
import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useXAccounts } from '@sodax/wallet-sdk';
import { getChainIconByName } from '@/constants/chains';

const EVM_CHAIN_ICONS = [
  '/chain/0x2105.base.png',
  '/chain/0x38.bsc.png',
  '/chain/0xa86a.avax.png',
  '/chain/0x89.polygon.png',
  '/chain/0xa.optimism.png',
  '/chain/0xa4b1.arbitrum.png',
  '/chain/sonic.png',
];

interface ConnectedChainsDisplayProps {
  onClick?: () => void;
}

interface ConnectedChain {
  chainType: string;
  address: string;
  icon: string;
}

// Safe validation function for account data
const isValidAccount = (account: unknown): account is { address: string; xChainType: string } => {
  return (
    account !== null &&
    typeof account === 'object' &&
    'address' in account &&
    'xChainType' in account &&
    typeof (account as { address: unknown }).address === 'string' &&
    (account as { address: string }).address.length > 0 &&
    typeof (account as { xChainType: unknown }).xChainType === 'string'
  );
};

// Safe validation function for chain type
const isValidChainType = (chainType: string): boolean => {
  return typeof chainType === 'string' && chainType.length > 0;
};

export function ConnectedChainsDisplay({ onClick }: ConnectedChainsDisplayProps): React.JSX.Element {
  const xAccounts = useXAccounts();

  // Memoized and safe processing of connected chains
  const connectedChains = useMemo((): ConnectedChain[] => {
    if (!xAccounts || typeof xAccounts !== 'object') {
      return [];
    }

    try {
      return Object.entries(xAccounts)
        .filter(([chainType, account]) => {
          // Safe validation of both chain type and account
          return isValidChainType(chainType) && isValidAccount(account) && account.address.trim().length > 0;
        })
        .map(([chainType, account]) => {
          const icon = getChainIconByName(chainType);
          const safeAccount = account as { address: string; xChainType: string };
          return {
            chainType: chainType.trim(),
            address: safeAccount.address.trim(),
            icon: icon || '', // Fallback to empty string if icon is undefined
          };
        });
    } catch (error) {
      console.warn('Error processing connected chains:', error);
      return [];
    }
  }, [xAccounts]);

  // Memoized check for EVM chains to prevent unnecessary re-renders
  const hasEVMChains = useMemo((): boolean => {
    return connectedChains.some(chain => chain.chainType === 'EVM');
  }, [connectedChains]);

  // Safe click handler with error boundary
  const handleClick = useCallback(() => {
    try {
      onClick?.();
    } catch (error) {
      console.warn('Error in click handler:', error);
    }
  }, [onClick]);

  // Early return if no connected chains (safe fallback)
  if (connectedChains.length === 0) {
    return <></>;
  }

  return (
    <div className="flex justify-end items-center gap-4 w-[183px]">
      <div className="flex items-center cursor-pointer" onClick={handleClick}>
        {!hasEVMChains &&
          connectedChains.map(chain => {
            // Additional safety check for icon
            const safeIcon = chain.icon || '/chain/default.png';
            return (
              <div key={`${chain.chainType}-${chain.address}`} className="relative">
                <Image
                  className="rounded shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.20)] outline outline-3 outline-white"
                  src={safeIcon}
                  alt={chain.chainType}
                  width={20}
                  height={20}
                  onError={e => {
                    // Fallback to default icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/chain/default.png';
                  }}
                />
              </div>
            );
          })}
        {hasEVMChains && (
          <>
            {EVM_CHAIN_ICONS.slice(0, 6).map((icon, index) => (
              <div
                key={`evm-icon-${index}`}
                className="rounded-[4px] w-5 h-5 shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative"
              >
                <Image
                  key={`evm-image-${index}`}
                  src={icon}
                  alt={`EVM Chain ${index + 1}`}
                  width={20}
                  height={20}
                  className="rounded-[4px]"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/chain/default.png';
                  }}
                />
              </div>
            ))}
            <div className="rounded-[4px] w-5 h-5 shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative bg-white">
              <div className="flex justify-center items-center">
                <span className="text-[10px] text-clay leading-[1.4] font-['InterBold']">+</span>
                <span className="text-[10px] text-espresso font-bold font-['InterBold'] leading-[1.4]">
                  {Math.max(0, connectedChains.length)} {/* Ensure non-negative count */}
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
        onClick={handleClick}
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
