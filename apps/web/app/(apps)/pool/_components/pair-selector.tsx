import type React from 'react';
import { useRef, useMemo } from 'react';
import { useClickAway } from 'react-use';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import CurrencyLogo from '@/components/shared/currency-logo';
import { usePoolState, usePoolActions } from '../_stores/pool-store-provider';
import { MOCK_POOL_PAIR } from '../_mocks';
import { chainIdToChainName } from '@/providers/constants';
import type { XToken, SpokeChainId, ChainId } from '@sodax/types';
import { supportedSpokeChains, spokeChainConfig } from '@sodax/sdk';
import { NetworkPickerGrid } from './network-picker/network-picker';

export function PairSelector(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isNetworkPickerOpened, selectedChainId } = usePoolState();
  const { setIsNetworkPickerOpened, setSelectedChainId } = usePoolActions();

  const pair = MOCK_POOL_PAIR;

  // Get all chains that support SODA
  const supportedChains = useMemo((): { chainId: ChainId; token: XToken }[] => {
    const chains: { chainId: ChainId; token: XToken }[] = [];
    for (const chainId of supportedSpokeChains) {
      const chainConfig = spokeChainConfig[chainId as SpokeChainId];
      if (chainConfig?.supportedTokens && 'SODA' in chainConfig.supportedTokens) {
        const sodaToken = chainConfig.supportedTokens.SODA as XToken;
        if (sodaToken) {
          chains.push({ chainId, token: sodaToken });
        }
      }
    }
    return chains;
  }, []);

  const selectedChainName = selectedChainId ? chainIdToChainName(selectedChainId as SpokeChainId) : null;

  useClickAway(containerRef, event => {
    const target = event.target as HTMLElement;
    const isInNetworkPicker = target.closest('.network-picker-container') !== null;
    if (!isInNetworkPicker && isNetworkPickerOpened) {
      setIsNetworkPickerOpened(false);
    }
  });

  const handleChainSelect = (chainId: ChainId) => {
    setSelectedChainId(chainId);
    setIsNetworkPickerOpened(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Token pair display + network selector trigger */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setIsNetworkPickerOpened(!isNetworkPickerOpened)}
      >
        {/* Token pair logos */}
        <div className="flex items-center -space-x-3">
          <CurrencyLogo currency={pair.token0} hideNetwork />
          <CurrencyLogo currency={pair.token1} hideNetwork />
        </div>

        {/* Pair name + network info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-medium">
              {pair.token0.symbol} / {pair.token1.symbol}
            </span>
            <ChevronDownIcon
              className={cn(
                'w-4 h-4 text-clay transition-transform duration-200',
                isNetworkPickerOpened && 'rotate-180',
              )}
            />
          </div>
          <span className="font-['InterRegular'] text-(length:--body-small) text-clay">
            {selectedChainName ? `on ${selectedChainName}` : 'Choose a network'}
          </span>
        </div>

        {/* Fee tier badge */}
        <div className="ml-auto px-2 py-0.5 rounded-full bg-almost-white mix-blend-multiply">
          <span className="font-['InterRegular'] text-[10px] text-clay font-medium">
            {(pair.feeTier / 10000).toFixed(1)}% fee
          </span>
        </div>
      </div>

      {/* Network picker overlay */}
      {isNetworkPickerOpened && (
        <NetworkPickerGrid
          supportedChains={supportedChains}
          selectedChainId={selectedChainId}
          onSelect={handleChainSelect}
        />
      )}
    </div>
  );
}
