'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { type PartnerFeeBalance, PartnerFeeBalancesCard } from './components/partner-fee-balance';
import { getSupportedSolverTokens, SONIC_MAINNET_CHAIN_ID, type XToken } from '@sodax/types';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);

  const [balances, setBalances] = useState<PartnerFeeBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [swappingSymbol, setSwappingSymbol] = useState<string | null>(null);

  //TODO mock data, to be replaced this with real balanceOf calls.
  useEffect(() => {
    const timer = setTimeout(() => {
      const tokens = getSupportedSolverTokens(SONIC_MAINNET_CHAIN_ID) as XToken[];

      const mockBalances: PartnerFeeBalance[] = tokens.map(t => ({
        currency: t,
        balance: '0.00',
      }));

      if (mockBalances[0]) mockBalances[0].balance = '123.45';
      if (mockBalances[1]) mockBalances[1].balance = '50.00';

      setBalances(mockBalances);
      setIsLoadingBalances(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleSwapToUsdc = async (feeBalance: PartnerFeeBalance) => {
    try {
      setSwappingSymbol(feeBalance.currency.symbol);

      console.log('Pretend swap', feeBalance.currency.symbol, 'from', feeBalance.currency.address, 'to USDC');

      await new Promise(res => setTimeout(res, 2000));

      setBalances(prev =>
        prev.map(b => (b.currency.symbol === feeBalance.currency.symbol ? { ...b, balance: '0.00' } : b)),
      );
    } catch (e) {
      console.error('Error swapping', feeBalance.currency.symbol, e);
    } finally {
      setSwappingSymbol(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col w-full gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      {/* Header */}
      <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable)">
        <motion.div variants={itemVariants}>
          <span className="text-yellow-dark font-bold leading-9 font-['InterRegular'] !text-(size:--app-title)">
            SODAX{' '}
          </span>
          <span className="text-yellow-dark font-normal font-['Shrikhand'] leading-9 !text-(size:--app-title)">
            Partners Portal
          </span>
          <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) flex gap-1">
            View your fee balances and swap them to USDC.
          </div>
        </motion.div>
      </div>

      {/* Fee balances section */}
      <motion.div variants={itemVariants}>
        <PartnerFeeBalancesCard
          balances={balances}
          isLoading={isLoadingBalances}
          swappingSymbol={swappingSymbol}
          onSwapToUsdc={handleSwapToUsdc}
        />
      </motion.div>
    </motion.div>
  );
}
