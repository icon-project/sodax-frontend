'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PartnerFeeBalancesCard } from './components/partner-fee-balance';
import type { PartnerFeeBalance } from './components/partner-fee-balance';
import { usePartnerFees } from './utils/usePartnersFee';
import { SwapModal } from './components/swap-modal';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwapModalOpen, setSwapModalModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<PartnerFeeBalance | null>(null);
  const [swappingSymbol, setSwappingSymbol] = useState<string | null>(null);

  const { address } = useXAccount(SONIC_MAINNET_CHAIN_ID);
  const { balances, isLoading, refetch } = usePartnerFees(address);

  const handleSwapToUsdc = (balance: PartnerFeeBalance) => {
    setSelectedBalance(balance);
    setSwappingSymbol(balance.currency.symbol);
    setSwapModalModalOpen(true);
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
      <div className="flex flex-col gap-2 w-full">
        <motion.div variants={itemVariants} className="w-full">
          {/* Title */}
          <div className="flex items-baseline gap-1">
            <span className="text-yellow-dark font-bold font-['InterRegular'] !text-(size:--app-title)">SODAX</span>
            <span className="text-yellow-dark font-normal font-['Shrikhand'] !text-(size:--app-title)">
              Partners Portal
            </span>
          </div>

          {/* Subtitle row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-clay-light w-full mt-2">
            {address ? (
              <>
                <span className="leading-snug">Manage your partner fee balances below.</span>
                <span className="leading-snug sm:text-right break-all sm:break-normal">
                  <span className="text-clay-medium">Connected wallet: </span>
                  <span className="font-mono text-yellow-dark">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </span>
              </>
            ) : (
              <span className="leading-snug">Please connect your wallet to view your balances.</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div variants={itemVariants}>
        {address && (
          <PartnerFeeBalancesCard
            balances={balances}
            isLoading={isLoading}
            swappingSymbol={swappingSymbol}
            onSwapToUsdc={handleSwapToUsdc}
          />
        )}
      </motion.div>

      {/* Swap modal */}
      {selectedBalance && (
        <SwapModal
          isOpen={isSwapModalOpen}
          onClose={() => {
            setSwapModalModalOpen(false);
            setSwappingSymbol(null);
            setSelectedBalance(null);
          }}
          asset={{
            symbol: selectedBalance.currency.symbol,
            decimals: selectedBalance.currency.decimals,
            address: selectedBalance.currency.address,
            chainId: selectedBalance.currency.xChainId,
          }}
          onSuccess={() => {
            setSwappingSymbol(null);
            setSelectedBalance(null);
            refetch();
          }}
        />
      )}
    </motion.div>
  );
}
