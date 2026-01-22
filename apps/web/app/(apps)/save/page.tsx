'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import AnimatedNumber from '@/components/shared/animated-number';
import AssetList from './_components/asset-list';
import { delay, getMoneymarketTokens, getUniqueTokenSymbols, calculateAPY, formatBalance } from '@/lib/utils';
import DepositOverview from './_components/deposit-overview';
import TotalSaveAssets from './_components/total-save-assets';
import { useSaveActions, useSaveState } from './_stores/save-store-provider';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useTokenSupplyBalances } from '@/hooks/useTokenSupplyBalances';
import { useAllTokenPrices } from '@/hooks/useAllTokenPrices';
import type { XToken } from '@sodax/types';
import type { CarouselApi } from '@/components/ui/carousel';
import CurrencySearchPanel from './_components/currency-search-panel';

export interface NetworkBalance {
  networkId: string;
  balance: string;
  token: XToken;
}

export interface DepositItemData {
  asset: XToken;
  totalBalance: string;
  fiatValue: string;
  networksWithFunds: NetworkBalance[];
  apy: string;
}

export default function SavingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { setDepositValue, setSuppliedAssetCount } = useSaveActions();
  const { activeAsset, isSwitchingChain } = useSaveState();
  const carouselApiRef = useRef<CarouselApi | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: formattedReserves } = useReservesUsdFormat();
  const allTokens = useMemo(() => getMoneymarketTokens(), []);
  const allAssets = useMemo(() => getUniqueTokenSymbols(allTokens), [allTokens]);
  const originalTokensWithSupplyBalances = useTokenSupplyBalances(allTokens, formattedReserves || []);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const cachedTokensWithSupplyBalancesRef = useRef<typeof originalTokensWithSupplyBalances>(
    originalTokensWithSupplyBalances,
  );

  const tokensWithSupplyBalances = useMemo(() => {
    if (isSwitchingChain) {
      return cachedTokensWithSupplyBalancesRef.current;
    }
    cachedTokensWithSupplyBalancesRef.current = originalTokensWithSupplyBalances;
    return originalTokensWithSupplyBalances;
  }, [originalTokensWithSupplyBalances, isSwitchingChain]);

  const { data: tokenPrices } = useAllTokenPrices(allTokens);

  const highestAPY = useMemo((): number => {
    if (!formattedReserves || allTokens.length === 0) {
      return 0;
    }

    let maxAPY = 0;

    allTokens.forEach(token => {
      const apyString = calculateAPY(formattedReserves, token);
      if (apyString !== '-') {
        const apyValue = Number.parseFloat(apyString.replace('%', ''));
        if (!Number.isNaN(apyValue) && apyValue > maxAPY) {
          maxAPY = apyValue;
        }
      }
    });

    return maxAPY;
  }, [allTokens, formattedReserves]);

  const suppliedAssets = useMemo((): DepositItemData[] => {
    const items: DepositItemData[] = [];

    allAssets.forEach(asset => {
      const tokensWithBalance = tokensWithSupplyBalances.filter(
        token => token.symbol === asset.symbol && Number(token.supplyBalance) > 0,
      );

      if (tokensWithBalance.length === 0) {
        return;
      }

      const totalBalance = tokensWithBalance.reduce((sum, token) => {
        return sum + Number(token.supplyBalance || '0');
      }, 0);

      const networksWithFunds: NetworkBalance[] = tokensWithBalance
        .map(token => ({
          networkId: token.xChainId,
          balance: token.supplyBalance || '0',
          token,
        }))
        .filter(network => network.networkId);

      const firstToken = tokensWithBalance[0];
      if (!firstToken) {
        return;
      }

      let fiatValue = '$0.00';
      if (tokenPrices && Number(totalBalance) > 0) {
        const priceKey = `${firstToken.symbol}-${firstToken.xChainId}`;
        const tokenPrice = tokenPrices[priceKey] || 0;
        const usdValue = new BigNumber(totalBalance).multipliedBy(tokenPrice).toString();
        fiatValue = `$${formatBalance(usdValue, tokenPrice)}`;
      }

      const apy = calculateAPY(formattedReserves, firstToken);

      items.push({
        asset: firstToken,
        totalBalance: totalBalance.toFixed(6),
        fiatValue,
        networksWithFunds,
        apy,
      });
    });

    return items;
  }, [allAssets, tokensWithSupplyBalances, tokenPrices, formattedReserves]);

  useEffect(() => {
    setSuppliedAssetCount(suppliedAssets.length);
  }, [suppliedAssets.length, setSuppliedAssetCount]);

  const hasDeposits = suppliedAssets.length > 0;

  useEffect(() => {
    delay(500).then(() => {
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    if (activeAsset !== '') {
      setDepositValue(0);
    }
  }, [activeAsset, setDepositValue]);

  const navigateToAsset = useCallback(
    (asset: XToken): void => {
      if (!carouselApiRef.current) {
        return;
      }

      const assetIndex = suppliedAssets.findIndex(item => item.asset.symbol === asset.symbol);
      if (assetIndex !== -1) {
        carouselApiRef.current.scrollTo(assetIndex);
      }
    },
    [suppliedAssets],
  );

  const handleCarouselApiReady = useCallback((api: CarouselApi | undefined): void => {
    carouselApiRef.current = api;
  }, []);

  return (
    <motion.div
      className="w-full flex flex-col gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      {hasDeposits ? (
        <motion.div className="w-full flex flex-col gap-4" variants={itemVariants}>
          <DepositOverview
            suppliedAssets={suppliedAssets}
            tokenPrices={tokenPrices}
            onApiReady={handleCarouselApiReady}
          />
          <TotalSaveAssets suppliedAssets={suppliedAssets} onAssetClick={navigateToAsset} />
        </motion.div>
      ) : (
        <motion.div className="inline-flex flex-col justify-start items-start gap-4" variants={itemVariants}>
          <div className="self-stretch mix-blend-multiply justify-end">
            <div className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-9">
              Deposit and earn{' '}
            </div>
            <div className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-9">
              instantly
            </div>
          </div>
          <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) flex">
            Up to
            <AnimatedNumber
              to={highestAPY}
              decimalPlaces={2}
              className="text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) min-w-6 ml-1"
            />
            % with no lockups.
          </div>
        </motion.div>
      )}

      <motion.div className="w-full flex-grow-1" variants={itemVariants}>
        <CurrencySearchPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain}
        />
      </motion.div>

      <motion.div className="w-full flex-grow-1" variants={itemVariants}>
        <AssetList searchQuery={searchQuery} selectedChain={selectedChain} />
      </motion.div>
    </motion.div>
  );
}
