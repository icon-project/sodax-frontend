'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { type Address, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { MIN_PARTNER_CLAIM_AMOUNT } from '@/constants/partner-claim';
import { type PartnerFeeBalance, PartnerFeeBalancesCard } from './components/partner-fee-balance';
import { ClaimModal } from './components/claim-modal';
import { formatUnits } from 'viem';
import { useFeeClaimBalances } from './utils/useFeeClaimBalances';
import { useFeeClaimPreferences } from './utils/useFeeClaimPreferences';
import { PartnerPreferencesCard } from './components/partner-preference-card';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<PartnerFeeBalance | null>(null);
  const [claimingSymbol, setClaimingSymbol] = useState<string | null>(null);

  const { address: connectedAddress } = useXAccount(SONIC_MAINNET_CHAIN_ID);

  // START: DEV TESTING LOGIC (Delete this block before PR)
  // =========================================================
  const effectiveAddress = useMemo(() => {
    const devAddress = process.env.NEXT_PUBLIC_DEV_PARTNER_ADDRESS;
    const isDev = process.env.NODE_ENV === 'development';
    console.log('Final Effective Address:', effectiveAddress);
    if (isDev && devAddress) {
      console.log('🛠️ Dev Mode: Using partner address from .env.local:', devAddress);
      return devAddress as Address;
    }
    return connectedAddress as Address;
  }, [connectedAddress]);
  // =========================================================
  // END: DEV TESTING LOGIC

  // 1. Fetch official partner balances
  const { data: rawBalancesMap, isLoading, refetch } = useFeeClaimBalances(effectiveAddress as Address);

  // 2. Fetch current auto-swap preferences to show in UI
  const { data: preferences } = useFeeClaimPreferences(effectiveAddress as Address);

  // Transform Map to Array for the UI card
  const balances = useMemo(() => {
    if (!rawBalancesMap) return [];
    // TODO
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    return Array.from(rawBalancesMap.values()).map((asset: any) => ({
      currency: {
        symbol: asset.symbol,
        decimals: asset.decimal,
        address: asset.address,
        name: asset.name,
      },
      balance: formatUnits(asset.balance, asset.decimal),
    })) as PartnerFeeBalance[];
  }, [rawBalancesMap]);

  console.log('PartnerPage balances:', balances);
  console.log('partner address:', effectiveAddress);
  // TODO IMPORTANT change to balance > 10 as partner must have sufficient funds to swap and pay fees
  // Requirement: check sufficient funds to swap and pay fees
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
          {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_PARTNER_ADDRESS && (
            <div className="bg-yellow-500/10 text-yellow-600 text-[10px] p-1 text-center rounded">
              ⚠️ VIEWING DEV PARTNER DATA
            </div>
          )}
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
                <div className="flex flex-col">
                  <span className="leading-snug">Monitor and manage fees earned through your SODAX partnership.</span>
                  {/* Show current preferences as suggested by Robi */}
                  {preferences && (
                    <span className="text-xs text-cherry-soda mt-1">
                      Current Auto-Swap: {preferences.dstAddress.slice(0, 6)}... on {preferences.dstChain}
                    </span>
                  )}
                </div>
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
      {/* 2. Preferences Card (The "New" Global Setting) */}
      {effectiveAddress && <PartnerPreferencesCard address={effectiveAddress as Address} />}
      {/* Main content */}
      <motion.div variants={itemVariants}>
        {balances && effectiveAddress && (
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
            refetch(); // Refetch using the new hook's method
          }}
        />
      )}
    </motion.div>
  );
}
