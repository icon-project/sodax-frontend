import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { ChevronDownIcon } from 'lucide-react';
import { motion, useAnimationControls } from 'framer-motion';
import CurrencyLogo from '@/components/shared/currency-logo';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { cn } from '@/lib/utils';
import { chainIdToChainName } from '@/providers/constants';
import { PoolNetworkPicker } from './pool-network-picker';
import type { SpokeChainId, XToken } from '@sodax/types';
import { supportedSpokeChains, spokeChainConfig } from '@sodax/sdk';
import { INJECTIVE_MAINNET_CHAIN_ID, REDBELLY_MAINNET_CHAIN_ID } from '@sodax/types';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { usePoolState } from '../_stores/pool-store-provider';

const sodaToken: XToken = {
  name: 'SODA',
  symbol: 'SODA',
  address: '0x0',
  decimals: 18,
  xChainId: 'sonic',
};

const xSodaToken: XToken = {
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
  onNetworkSelect: (token: XToken) => void;
};

export function PoolNetworkSelector({
  isNetworkPickerOpened,
  selectedNetworkChainId,
  onNetworkPickerOpenChange,
  onNetworkSelect,
}: PoolNetworkSelectorProps): React.JSX.Element {
  const assetRef = useRef<HTMLDivElement>(null);
  const networkPickerAnchorRef = useRef<HTMLDivElement>(null);
  const { address } = useXAccount(selectedNetworkChainId);
  const { selectedToken } = usePoolState();
  const walletConnected = !!address;
  const allChainSodaBalances = useAllChainBalances({ onlySodaTokens: true });
  const subtitleControls = useAnimationControls();
  const [subtitleText, setSubtitleText] = useState<string>(`on ${chainIdToChainName(selectedNetworkChainId)}`);
  const selectedSodaBalance = useMemo((): bigint => {
    const selectedChainConfig = spokeChainConfig[selectedNetworkChainId];
    const selectedSodaToken =
      selectedChainConfig?.supportedTokens && 'SODA' in selectedChainConfig.supportedTokens
        ? (selectedChainConfig.supportedTokens.SODA as XToken)
        : undefined;

    if (!selectedSodaToken) {
      return 0n;
    }

    const selectedSodaBalanceEntry = (allChainSodaBalances[selectedSodaToken.address] || []).find(
      balanceEntry => balanceEntry.chainId === selectedNetworkChainId,
    );

    return selectedSodaBalanceEntry?.balance ?? 0n;
  }, [allChainSodaBalances, selectedNetworkChainId]);

  useEffect((): (() => void) => {
    let isCancelled = false;

    const animateSubtitleClose = async (finalText: string): Promise<void> => {
      setSubtitleText('Choose a network');
      await subtitleControls.start({
        scale: 1.08,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 12,
          mass: 0.5,
        },
      });

      if (isCancelled) return;
      setSubtitleText(finalText);

      await subtitleControls.start({
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 12,
          mass: 0.5,
        },
      });
    };

    if (isNetworkPickerOpened) {
      setSubtitleText('Choose a network');
      void subtitleControls.start({ scale: 1 });
    } else if (!walletConnected) {
      void animateSubtitleClose('Wallet not connected');
    } else {
      if (selectedSodaBalance <= 0n) {
        void animateSubtitleClose('Required assets missing');
      } else {
        void animateSubtitleClose('Join the pool');
      }
    }

    return (): void => {
      isCancelled = true;
    };
  }, [isNetworkPickerOpened, walletConnected, selectedSodaBalance, subtitleControls]);

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
  const mockToken2WithSelectedChain = useMemo((): XToken => {
    if (!selectedToken) {
      return xSodaToken;
    }

    return {
      ...xSodaToken,
      xChainId: selectedToken.xChainId,
    };
  }, [selectedToken]);

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
            <CurrencyLogo currency={sodaToken} hideNetwork className="relative" />
            <CurrencyLogo
              currency={mockToken2WithSelectedChain}
              className="relative -ml-4"
              tokenCount={selectedToken ? 1 : sodaTokens.length}
              isGroup={selectedToken === null}
              isChainConnected={walletConnected}
            />
            {isNetworkPickerOpened && (
              <PoolNetworkPicker
                isClicked={isNetworkPickerOpened}
                tokens={sodaTokens}
                tokenSymbol="SODA"
                onSelect={(token: XToken) => {
                  onNetworkSelect(token);
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
              <motion.p animate={subtitleControls} initial={{ scale: 1 }} className="leading-4">
                {subtitleText}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
