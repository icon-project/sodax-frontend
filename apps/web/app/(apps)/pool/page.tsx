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
import { cn, DEX_POSITIONS_UPDATED_EVENT } from '@/lib/utils';
import { usePoolActions, usePoolState } from './_stores/pool-store-provider';
import { useLiquidityAmounts, usePoolData, useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { dexPools, type PoolSpokeAssets } from '@sodax/sdk';
import { formatUnits, parseUnits } from 'viem';
import { SupplyOverview } from './_components/supply-overview';
import { useGetUserHubWalletAddress } from '@sodax/dapp-kit';

type DexPositionsUpdatedDetail = {
  chainId: string | number;
  userAddress: string;
};

type SavedDexPosition = {
  tokenId: string;
  chainId: string;
};

type PositionsApiItem = {
  token_id: string;
  pool_id: string;
  is_burned: boolean;
};

const ASODA_XSODA_POOL_ID = '0x1fbed2bab018dd01756162d135964186addbab00158eda8013de8a15948995cd';

export default function PoolPage() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sodaInputAmount, setSodaInputAmount] = useState<string>('');
  const [lastEditedAmount, setLastEditedAmount] = useState<'soda' | 'xsoda' | null>(null);
  const { selectedNetworkChainId, minPrice, maxPrice, isNetworkPickerOpened } = usePoolState();
  const { setSelectedToken, setMinPrice, setMaxPrice, setSodaAmount, setXSodaAmount, setIsNetworkPickerOpened } =
    usePoolActions();
  const { address } = useXAccount(selectedNetworkChainId ?? undefined);
  const { data: hubWalletAddress } = useGetUserHubWalletAddress(selectedNetworkChainId ?? undefined, address);

  const [savedPositions, setSavedPositions] = useState<SavedDexPosition[]>([]);
  const fixedPoolKey = dexPools.ASODA_XSODA;
  const { data: poolDataRaw } = usePoolData({ poolKey: fixedPoolKey });
  const poolData = poolDataRaw ?? null;
  const pairPrice = useMemo((): number | null => {
    if (!poolData) {
      return null;
    }
    const parsedPrice = Number(poolData.price.toSignificant(6));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return null;
    }
    return parsedPrice;
  }, [poolData]);

  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(selectedNetworkChainId ?? undefined);
  const spokeProvider = useSpokeProvider(selectedNetworkChainId ?? undefined, walletProvider);

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
    const fetchPositions = async (): Promise<void> => {
      if (!hubWalletAddress) {
        setSavedPositions([]);
        return;
      }

      const endpoint = `/api/pool/positions?address=${encodeURIComponent(hubWalletAddress)}&include_burned=false&limit=100&offset=0`;
      const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      console.log('response', response);
      if (!response.ok) {
        setSavedPositions([]);
        return;
      }

      const responsePayload = (await response.json()) as unknown;
      if (!Array.isArray(responsePayload)) {
        setSavedPositions([]);
        return;
      }

      const positions = responsePayload as PositionsApiItem[];
      const normalizedPoolId = ASODA_XSODA_POOL_ID.toLowerCase();
      const nextPositions = positions
        .filter(position => !position.is_burned && position.pool_id.toLowerCase() === normalizedPoolId)
        .map(
          (position): SavedDexPosition => ({
            tokenId: position.token_id,
            chainId: selectedNetworkChainId ? String(selectedNetworkChainId) : 'sonic',
          }),
        );

      setSavedPositions(nextPositions);
    };

    void fetchPositions();
  }, [hubWalletAddress, selectedNetworkChainId]);

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
    const onDexPositionsUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<DexPositionsUpdatedDetail>;
      if (!hubWalletAddress) {
        loadSavedTokenIds();
        return;
      }
      const eventAddress = customEvent.detail?.userAddress?.toLowerCase();
      if (eventAddress === hubWalletAddress.toLowerCase()) {
        loadSavedTokenIds();
      }
    };

    globalThis.addEventListener(DEX_POSITIONS_UPDATED_EVENT, onDexPositionsUpdated);
    return () => {
      globalThis.removeEventListener(DEX_POSITIONS_UPDATED_EVENT, onDexPositionsUpdated);
    };
  }, [hubWalletAddress, loadSavedTokenIds]);

  return (
    <motion.div
      className="self-stretch inline-flex flex-col justify-start items-start gap-6 w-full"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.div className="self-stretch flex flex-col justify-start items-start gap-4 pb-20" variants={itemVariants}>
        {savedPositions.length > 0 ? (
          <SupplyOverview positions={savedPositions} poolKey={fixedPoolKey} poolData={poolData} />
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
                poolId={ASODA_XSODA_POOL_ID}
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
