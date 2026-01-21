'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PartnerFeeBalancesCard } from './components/partner-fee-balance';
import type { PartnerFeeBalance } from './components/partner-fee-balance';
import { usePartnerFees } from './utils/usePartnersFee';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { ClaimModal } from './components/claim-modal';
import { MIN_PARTNER_CLAIM_AMOUNT } from '@/constants/partner-claim';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<PartnerFeeBalance | null>(null);
  const [claimingSymbol, setClaimingSymbol] = useState<string | null>(null);

  const { address: connectedAddress } = useXAccount(SONIC_MAINNET_CHAIN_ID);

  const devPartnerAddress =
    process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_PARTNER_ADDRESS : undefined;

  const effectiveAddress = devPartnerAddress ?? connectedAddress;

  const { balances, isLoading, refetch } = usePartnerFees(effectiveAddress);
  // TODO IMPORTANT balance > 10 as partner must have sufficient funds to swap and pay fees
  const canClaim = (balance: PartnerFeeBalance) => Number(balance.balance) >= MIN_PARTNER_CLAIM_AMOUNT;

  const handleClaimToUsdc = (balance: PartnerFeeBalance) => {
    setSelectedBalance(balance);
    setClaimingSymbol(balance.currency.symbol);
    setClaimModalOpen(true);
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
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="mix-blend-multiply text-yellow-dark font-bold font-['InterRegular'] !text-(size:--app-title)">
              Partner
            </span>
            <span className="mix-blend-multiply text-yellow-dark font-normal font-['Shrikhand'] !text-(size:--app-title)">
              dashboard{' '}
            </span>
          </div>

          {/* Subtitle row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-clay-light w-full">
            {effectiveAddress ? (
              <>
                <span className="leading-snug">Monitor and manage fees earned through your SODAX partnership.</span>
                <span className="leading-snug sm:text-right break-all sm:break-normal">
                  <span className="text-clay-medium">Connected wallet: </span>
                  <span className="font-mono font-bold">
                    {effectiveAddress.slice(0, 6)}...{effectiveAddress.slice(-4)}
                  </span>{' '}
                </span>
              </>
            ) : (
              <span className="leading-snug">Please connect your wallet to view your balances.</span>
            )}
          </div>
        </motion.div>
      </div>
      <div className="w-full h-px bg-clay-light/30 my-2" />

      {/* Main content */}
      <motion.div variants={itemVariants}>
        {balances && (
          <PartnerFeeBalancesCard
            balances={balances}
            isLoading={isLoading}
            claimingSymbol={claimingSymbol}
            canClaim={canClaim}
            onClaimToUsdc={handleClaimToUsdc}
          />
        )}
      </motion.div>
      {selectedBalance && (
        <ClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setClaimingSymbol(null);
            setSelectedBalance(null);
          }}
          asset={{
            symbol: selectedBalance.currency.symbol,
            decimals: selectedBalance.currency.decimals,
            address: selectedBalance.currency.address,
          }}
          maxAmountToClaim={selectedBalance.balance}
          onSuccess={() => {
            setClaimingSymbol(null);
            setSelectedBalance(null);
            refetch();
          }}
        />
      )}
    </motion.div>
  );
}
