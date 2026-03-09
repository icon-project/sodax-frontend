import type React from 'react';
import { useMemo, useRef } from 'react';
import { useClickAway } from 'react-use';
import { ChevronDownIcon } from 'lucide-react';
import CurrencyLogo from '@/components/shared/currency-logo';
import { cn } from '@/lib/utils';
import { chainIdToChainName } from '@/providers/constants';
import { PoolNetworkPicker } from './pool-network-picker';
import type { SpokeChainId, XToken } from '@sodax/types';
import { supportedSpokeChains, spokeChainConfig } from '@sodax/sdk';
import { INJECTIVE_MAINNET_CHAIN_ID, REDBELLY_MAINNET_CHAIN_ID } from '@sodax/types';

const mockToken1: XToken = {
  name: 'SODA',
  symbol: 'SODA',
  address: '0x0',
  decimals: 18,
  xChainId: 'sonic',
};

const mockToken2: XToken = {
  name: 'xSODA',
  symbol: 'xSODA',
  address: '0x1',
  decimals: 18,
  xChainId: 'sonic',
};

type PoolNetworkSelectorProps = {
  isNetworkPickerOpened: boolean;
  selectedNetworkChainId: SpokeChainId;
  onNetworkPickerOpenChange: (isOpened: boolean) => void;
  onNetworkSelect: (chainId: SpokeChainId) => void;
};

export function PoolNetworkSelector({
  isNetworkPickerOpened,
  selectedNetworkChainId,
  onNetworkPickerOpenChange,
  onNetworkSelect,
}: PoolNetworkSelectorProps): React.JSX.Element {
  const assetRef = useRef<HTMLDivElement>(null);
  const networkPickerAnchorRef = useRef<HTMLDivElement>(null);
  // Get all SODA tokens from all supported chains
  const sodaTokens = useMemo((): XToken[] => {
    const tokens: XToken[] = [];
    for (const chainId of supportedSpokeChains) {
      const chainConfig = spokeChainConfig[chainId as SpokeChainId];
      if (chainConfig?.supportedTokens && 'SODA' in chainConfig.supportedTokens) {
        const sodaToken = chainConfig.supportedTokens.SODA as XToken;
        if (
          sodaToken &&
          sodaToken.xChainId !== INJECTIVE_MAINNET_CHAIN_ID &&
          sodaToken.xChainId !== REDBELLY_MAINNET_CHAIN_ID
        ) {
          tokens.push(sodaToken);
        }
      }
    }
    return tokens;
  }, []);

  useClickAway(assetRef, event => {
    const target = event.target as HTMLElement;
    const isInNetworkPicker = target.closest('.network-picker-container') !== null;
    if (!isInNetworkPicker) {
      onNetworkPickerOpenChange(false);
    }
  });

  return (
    <div className="absolute top-8 left-(--layout-space-big) z-30">
      <div
        className="relative flex justify-start items-center gap-4 cursor-pointer"
        onClick={() => onNetworkPickerOpenChange(!isNetworkPickerOpened)}
        ref={assetRef}
      >
        <div data-property-1="Pair" className="inline-flex flex-col justify-start items-center gap-2">
          <div className="relative inline-flex justify-start items-center" ref={networkPickerAnchorRef}>
            <CurrencyLogo currency={mockToken1} hideNetwork className="relative" />
            <CurrencyLogo currency={mockToken2} hideNetwork className="relative -ml-4" tokenCount={16} isGroup />
            {isNetworkPickerOpened && (
              <PoolNetworkPicker
                isClicked={isNetworkPickerOpened}
                tokens={sodaTokens}
                tokenSymbol="SODA"
                onSelect={(token: XToken) => {
                  onNetworkSelect(token.xChainId as SpokeChainId);
                  onNetworkPickerOpenChange(false);
                }}
                reference={networkPickerAnchorRef.current}
              />
            )}
          </div>
        </div>
        <div
          className={cn('inline-flex flex-col justify-center items-start gap-1', isNetworkPickerOpened && 'blur-sm')}
        >
          <div className="inline-flex justify-start items-center gap-2">
            <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-normal font-['InterRegular'] leading-6">
              SODA / xSODA
            </div>
            <ChevronDownIcon
              className={cn(
                'w-4 h-4 text-clay-light transition-transform duration-200',
                isNetworkPickerOpened && 'rotate-180',
              )}
            />
          </div>
          <div className="inline-flex justify-start items-center gap-2">
            <div className="justify-center text-clay text-(length:--body-small) font-normal font-['InterRegular'] leading-4">
              {isNetworkPickerOpened ? 'Choose a network' : `on ${chainIdToChainName(selectedNetworkChainId)}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
