'use client';

import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PoolHeader } from './_components/pool-header';
import { PoolInfoCard } from './_components/pool-info-card';
import { PoolNetworkSelector } from './_components/pool-network-selector';
import { PriceRangeSelector } from './_components/price-range-selector';
import { LiquidityInputs } from './_components/liquidity-inputs';
import Tip from '../stake/_components/icons/tip';
import { cn } from '@/lib/utils';
import { usePoolActions, usePoolState } from './_stores/pool-store-provider';
import { useLiquidityAmounts, usePoolData, useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { dexPools, type PoolSpokeAssets } from '@sodax/sdk';
import { formatUnits, parseUnits } from 'viem';
import { SuppliedPositionsCarousel } from './_components/supplied-positions-carousel';

type DexPositionsUpdatedDetail = {
  chainId: string | number;
  userAddress: string;
};

type SavedDexPosition = {
  tokenId: string;
  chainId: string;
};

const DEX_POSITIONS_UPDATED_EVENT = 'sodax-dex-positions-updated';

function parseTokenIdsFromStorageValue(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map(tokenId => tokenId.trim())
    .filter(tokenId => tokenId.length > 0);
}

function isDexPositionsStorageKeyForAddress(storageKey: string, normalizedAddress: string): boolean {
  const normalizedStorageKey = storageKey.toLowerCase();
  return (
    normalizedStorageKey.startsWith('sodax-dex-positions-') && normalizedStorageKey.endsWith(`-${normalizedAddress}`)
  );
}

function extractChainIdFromDexPositionsStorageKey(storageKey: string, normalizedAddress: string): string | null {
  if (!isDexPositionsStorageKeyForAddress(storageKey, normalizedAddress)) {
    return null;
  }

  const prefix = 'sodax-dex-positions-';
  const suffix = `-${normalizedAddress}`;
  if (storageKey.length <= prefix.length + suffix.length) {
    return null;
  }

  return storageKey.slice(prefix.length, storageKey.length - suffix.length);
}

export default function PoolPage() {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    return null;
  }

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sodaInputAmount, setSodaInputAmount] = useState<string>('');
  const [lastEditedAmount, setLastEditedAmount] = useState<'soda' | 'xsoda' | null>(null);
  const { selectedNetworkChainId, minPrice, maxPrice, isNetworkPickerOpened } = usePoolState();
  const { setSelectedToken, setMinPrice, setMaxPrice, setSodaAmount, setXSodaAmount, setIsNetworkPickerOpened } =
    usePoolActions();
  const { address } = useXAccount(selectedNetworkChainId);
  const [savedPositions, setSavedPositions] = useState<SavedDexPosition[]>([]);
  const fixedPoolKey = dexPools.ASODA_XSODA;
  const { data: poolDataRaw } = usePoolData({ poolKey: fixedPoolKey });
  const poolData = poolDataRaw ?? null;
  const pairPrice = useMemo((): number | null => {
    if (!poolData) {
      return null;
    }
    const parsedPrice = Number(poolData.price.toSignificant(12));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return null;
    }
    return parsedPrice;
  }, [poolData]);

  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(selectedNetworkChainId);
  const spokeProvider = useSpokeProvider(selectedNetworkChainId, walletProvider);
  const poolSpokeAssets = useMemo((): PoolSpokeAssets | null => {
    if (!spokeProvider) {
      return null;
    }
    try {
      return sodax.dex.clService.getAssetsForPool(spokeProvider, fixedPoolKey);
    } catch {
      return null;
    }
  }, [fixedPoolKey, sodax, spokeProvider]);
  const { liquidityToken0Amount, liquidityToken1Amount, handleToken0AmountChange, handleToken1AmountChange } =
    useLiquidityAmounts(minPrice.toString(), maxPrice.toString(), poolData);

  const convertSodaToPoolTokenAmount = useCallback(
    (underlyingAmount: string): string => {
      if (underlyingAmount.trim() === '' || !poolData?.token0IsStatAToken || !poolData.token0ConversionRate) {
        return underlyingAmount;
      }

      try {
        const underlyingDecimals = poolData.token0UnderlyingToken?.decimals ?? 18;
        const underlyingRawAmount = parseUnits(underlyingAmount, underlyingDecimals);
        const wrappedRawAmount = (underlyingRawAmount * 10n ** 18n) / poolData.token0ConversionRate;

        return formatUnits(wrappedRawAmount, poolData.token0.decimals);
      } catch {
        return underlyingAmount;
      }
    },
    [poolData],
  );

  const convertPoolTokenToSodaAmount = useCallback(
    (wrappedAmount: string): string => {
      if (wrappedAmount.trim() === '' || !poolData?.token0IsStatAToken || !poolData.token0ConversionRate) {
        return wrappedAmount;
      }

      try {
        const underlyingDecimals = poolData.token0UnderlyingToken?.decimals ?? 18;
        const wrappedRawAmount = parseUnits(wrappedAmount, poolData.token0.decimals);
        const underlyingRawAmount = (wrappedRawAmount * poolData.token0ConversionRate) / 10n ** 18n;

        return formatUnits(underlyingRawAmount, underlyingDecimals);
      } catch {
        return wrappedAmount;
      }
    },
    [poolData],
  );
  const convertedSodaAmount = useMemo((): string => {
    return convertPoolTokenToSodaAmount(liquidityToken0Amount);
  }, [convertPoolTokenToSodaAmount, liquidityToken0Amount]);

  const handleSodaAmountChange = useCallback(
    (value: string): void => {
      setLastEditedAmount('soda');
      setSodaInputAmount(value);
      const poolTokenAmount = convertSodaToPoolTokenAmount(value);
      handleToken0AmountChange(poolTokenAmount);
    },
    [convertSodaToPoolTokenAmount, handleToken0AmountChange],
  );
  const handleXSodaAmountChange = useCallback(
    (value: string): void => {
      setLastEditedAmount('xsoda');
      handleToken1AmountChange(value);
    },
    [handleToken1AmountChange],
  );

  const loadSavedTokenIds = useCallback((): void => {
    if (typeof globalThis.localStorage === 'undefined' || !address) {
      setSavedPositions([]);
      return;
    }

    const positionsByTokenId = new Map<string, SavedDexPosition>();
    const normalizedAddress = address.toLowerCase();

    for (let index = 0; index < globalThis.localStorage.length; index += 1) {
      const storageKey = globalThis.localStorage.key(index);
      if (!storageKey) {
        continue;
      }

      const chainId = extractChainIdFromDexPositionsStorageKey(storageKey, normalizedAddress);
      if (!chainId) {
        continue;
      }

      const parsedTokenIds = parseTokenIdsFromStorageValue(globalThis.localStorage.getItem(storageKey));
      for (const tokenId of parsedTokenIds) {
        const normalizedTokenId = tokenId.toLowerCase();
        if (positionsByTokenId.has(normalizedTokenId)) {
          continue;
        }
        positionsByTokenId.set(normalizedTokenId, {
          tokenId,
          chainId,
        });
      }
    }

    setSavedPositions(Array.from(positionsByTokenId.values()));
  }, [address]);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  useEffect((): void => {
    if (lastEditedAmount !== 'soda') {
      setSodaInputAmount(convertedSodaAmount);
    }
  }, [convertedSodaAmount, lastEditedAmount]);

  useEffect((): void => {
    setSodaAmount(sodaInputAmount);
  }, [setSodaAmount, sodaInputAmount]);

  useEffect((): void => {
    setXSodaAmount(liquidityToken1Amount);
  }, [liquidityToken1Amount, setXSodaAmount]);

  useEffect((): void => {
    loadSavedTokenIds();
  }, [loadSavedTokenIds]);

  useEffect((): (() => void) => {
    const onStorageUpdated = (event: StorageEvent): void => {
      if (!address) {
        return;
      }
      if (event.storageArea !== globalThis.localStorage) {
        return;
      }
      if (event.key && !isDexPositionsStorageKeyForAddress(event.key, address.toLowerCase())) {
        return;
      }
      loadSavedTokenIds();
    };

    const onDexPositionsUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<DexPositionsUpdatedDetail>;
      if (!address) {
        loadSavedTokenIds();
        return;
      }
      const eventAddress = customEvent.detail?.userAddress?.toLowerCase();
      if (eventAddress === address.toLowerCase()) {
        loadSavedTokenIds();
      }
    };

    globalThis.addEventListener('storage', onStorageUpdated);
    globalThis.addEventListener(DEX_POSITIONS_UPDATED_EVENT, onDexPositionsUpdated);
    return () => {
      globalThis.removeEventListener('storage', onStorageUpdated);
      globalThis.removeEventListener(DEX_POSITIONS_UPDATED_EVENT, onDexPositionsUpdated);
    };
  }, [address, loadSavedTokenIds]);

  return (
    <motion.div
      className="self-stretch inline-flex flex-col justify-start items-start gap-6 w-full"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.div className="self-stretch flex flex-col justify-start items-start gap-4 pb-20" variants={itemVariants}>
        {savedPositions.length > 0 ? (
          <SuppliedPositionsCarousel positions={savedPositions} poolKey={fixedPoolKey} poolData={poolData} />
        ) : (
          <PoolHeader />
        )}

        <motion.div className="relative self-stretch flex flex-col justify-start items-start" variants={itemVariants}>
          <PoolNetworkSelector
            isNetworkPickerOpened={isNetworkPickerOpened}
            selectedNetworkChainId={selectedNetworkChainId}
            onNetworkPickerOpenChange={setIsNetworkPickerOpened}
            onNetworkSelect={setSelectedToken}
          />
          <div className="relative self-stretch">
            {isNetworkPickerOpened && <div className="inset-0 absolute w-full h-full bg-transparent-white z-20" />}
            <div className={cn('self-stretch transition-[filter] duration-300', isNetworkPickerOpened && 'blur-sm')}>
              <PoolInfoCard
                pairPrice={pairPrice}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
              />
              <div
                className={cn(
                  'self-stretch px-(--layout-space-big) py-8 relative rounded-bl-3xl rounded-br-3xl flex flex-col justify-start items-start gap-6',
                  'before:absolute before:inset-0 before:rounded-bl-3xl before:rounded-br-3xl',
                  'before:bg-almost-white before:mix-blend-multiply before:-z-10',
                )}
              >
                <div className="absolute -top-1 left-[72px] ">
                  <Tip fill="#F8F3F3" />
                </div>
                <PriceRangeSelector
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onMinPriceChange={setMinPrice}
                  onMaxPriceChange={setMaxPrice}
                />
                <LiquidityInputs
                  selectedNetworkChainId={selectedNetworkChainId}
                  sodaAmount={sodaInputAmount}
                  xSodaAmount={liquidityToken1Amount}
                  onSodaAmountChange={handleSodaAmountChange}
                  onXSodaAmountChange={handleXSodaAmountChange}
                  poolData={poolData}
                  poolSpokeAssets={poolSpokeAssets}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
