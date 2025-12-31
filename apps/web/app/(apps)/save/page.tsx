// apps/web/app/(apps)/save/page.tsx
'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import AnimatedNumber from '@/components/shared/animated-number';
import AssetList from './_components/asset-list';
import { delay, flattenTokens, getUniqueTokenSymbols, calculateAPY } from '@/lib/utils';
import CarouselWithPagination from './_components/carousel';
import TotalSaveTokens from './_components/total-save-tokens';
import { useSaveActions } from './_stores/save-store-provider';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useTokenSupplyBalances } from '@/hooks/useTokenSupplyBalances';
import { useAllTokenPrices } from '@/hooks/useAllTokenPrices';
import type { XToken } from '@sodax/types';

export interface NetworkBalance {
  networkId: string;
  balance: string;
  token: XToken;
}

export interface CarouselItemData {
  token: XToken;
  totalBalance: string;
  fiatValue: string;
  networksWithFunds: NetworkBalance[];
  apy: string;
}

export default function SavingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [openValue, setOpenValue] = useState('');
  const { setDepositValue, setTokenCount } = useSaveActions();

  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const allTokens = useMemo(() => flattenTokens(), []);
  const groupedTokens = useMemo(() => getUniqueTokenSymbols(allTokens), [allTokens]);
  const allGroupTokens = useMemo(() => groupedTokens.flatMap(group => group.tokens), [groupedTokens]);
  const tokensWithSupplyBalances = useTokenSupplyBalances(allGroupTokens, formattedReserves || []);
  const { data: tokenPrices } = useAllTokenPrices(allGroupTokens);

  // Filter and prepare carousel items with balances > 0
  const carouselItems = useMemo((): CarouselItemData[] => {
    const items: CarouselItemData[] = [];

    groupedTokens.forEach(group => {
      const tokensWithBalance = tokensWithSupplyBalances.filter(
        token => token.symbol === group.symbol && Number(token.supplyBalance) > 0,
      );

      if (tokensWithBalance.length === 0) {
        return;
      }

      // Calculate total balance (sum of all balances for this token symbol)
      const totalBalance = tokensWithBalance.reduce((sum, token) => {
        return sum + Number(token.supplyBalance || '0');
      }, 0);

      // Get networks that have funds with their balances
      const networksWithFunds: NetworkBalance[] = tokensWithBalance
        .map(token => ({
          networkId: token.xChainId,
          balance: token.supplyBalance || '0',
          token,
        }))
        .filter(network => network.networkId);

      // Use first token for price and APY calculation
      const firstToken = tokensWithBalance[0];
      if (!firstToken) {
        return;
      }

      const totalBalanceStr = totalBalance.toFixed(6);

      // Calculate fiat value
      let fiatValue = '$0.00';
      if (tokenPrices && Number(totalBalanceStr) > 0) {
        const priceKey = `${firstToken.symbol}-${firstToken.xChainId}`;
        const tokenPrice = tokenPrices[priceKey] || 0;
        const usdValue = new BigNumber(totalBalanceStr).multipliedBy(tokenPrice).toFixed(2);
        fiatValue = `$${Number(usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      // Calculate APY
      const apy = calculateAPY(formattedReserves, isFormattedReservesLoading, firstToken);

      items.push({
        token: firstToken,
        totalBalance: totalBalanceStr,
        fiatValue,
        networksWithFunds,
        apy,
      });
    });

    return items;
  }, [groupedTokens, tokensWithSupplyBalances, tokenPrices, formattedReserves, isFormattedReservesLoading]);

  // Update token count in store when carousel items change
  useEffect(() => {
    setTokenCount(carouselItems.length);
  }, [carouselItems.length, setTokenCount]);

  const hasDeposits = carouselItems.length > 0;

  useEffect(() => {
    delay(500).then(() => {
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    if (openValue !== '') {
      setDepositValue(0);
    }
  }, [openValue, setDepositValue]);

  return (
    <motion.div
      className="w-full flex flex-col gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      {hasDeposits ? (
        <motion.div className="w-full flex flex-col gap-4" variants={itemVariants}>
          <TotalSaveTokens />
          <CarouselWithPagination carouselItems={carouselItems} tokenPrices={tokenPrices} />
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
              to={9.81}
              decimalPlaces={2}
              className="text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) min-w-6 ml-1"
            />
            % with no lockups.
          </div>
        </motion.div>
      )}

      <motion.div className="w-full flex-grow-1" variants={itemVariants}>
        <AssetList searchQuery={''} openValue={openValue} setOpenValue={setOpenValue} />
      </motion.div>
    </motion.div>
  );
}
