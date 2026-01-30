'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { type Address, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { PartnerPreferencesCard } from './components/partner-preference-card';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { PartnerFeeBalances } from './components/partner-fee-balances';
import { BackToTop } from '@/components/shared/back-to-top';
import { usePartnerFeeLifecycle } from './hooks/usePartnerFeeLifecycle';
import type { FeeClaimAsset } from './hooks/useFeeClaimAssets';
import { MIN_PARTNER_CLAIM_AMOUNT } from '@/constants/partner-claim';
import { ConfirmClaimModal } from './components/modals/confirm-claim-modal';
import { ClaimSubmittedModal } from './components/modals/claim-submitted-modal';
import { ClaimFlowStep } from './utils/fee-claim';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [claimFlow, setClaimFlow] = useState<ClaimFlowStep>(ClaimFlowStep.NONE);
  const [selectedAsset, setSelectedAsset] = useState<FeeClaimAsset | null>(null);

  const { address: connectedAddress } = useXAccount(SONIC_MAINNET_CHAIN_ID);
  const [submittedTxHash, setSubmittedTxHash] = useState<`0x${string}` | null>(null);

  // TODO START: DEV TESTING LOGIC (Delete this block before PR)
  // =========================================================
  // const effectiveAddress = useMemo(() => {
  //   const devAddress = process.env.NEXT_PUBLIC_DEV_PARTNER_ADDRESS;
  //   const isDev = process.env.NODE_ENV === 'development';
  //   if (isDev && devAddress) {
  //     // console.log('Dev Mode: Using partner address from .env.local:', devAddress);
  //     return devAddress as Address;
  //   }
  //   return connectedAddress as Address;
  // }, [connectedAddress]);
  // console.log('Final Effective Address:', effectiveAddress);

  // =========================================================
  // END: DEV TESTING LOGIC

  // 2. Fetch current auto-swap preferences to show in UI
  // const { assets, isLoading, refetch, hasPreferences } = useFeeClaimAssets(effectiveAddress);
  // const { data: preferences } = useFeeClaimPreferences(effectiveAddress as Address);

  const { activePreferences, claimableFees, isInitialLoading, refreshBalances } = usePartnerFeeLifecycle(
    connectedAddress as Address,
  );

  const handleClaim = (asset: FeeClaimAsset) => {
    setSelectedAsset(asset);
    setClaimFlow(ClaimFlowStep.CONFIRM);
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
            <div className="bg-cherry text-negative text-[12px] p-1 text-center rounded font-bold">
              VIEWING DEV PARTNER DATA!
            </div>
          )}
          {/* Title */}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="mix-blend-multiply text-yellow-dark font-bold font-['InterRegular'] text-(size:--app-title)!">
              Partner
            </span>
            <span className="mix-blend-multiply text-yellow-dark font-normal font-['Shrikhand'] text-(size:--app-title)!">
              dashboard{' '}
            </span>
          </div>
          {/* Subtitle row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-clay-light w-full">
            {connectedAddress ? (
              <>
                <div className="flex flex-col">
                  <span className="leading-snug">Monitor and manage fees earned through your SODAX partnership.</span>
                  {/* Show current preferences as suggested by Robi */}
                  {activePreferences && (
                    <span className="text-xs text-clay mt-1">
                      Auto-swap destination set: {activePreferences.dstAddress.slice(0, 6)}... on{' '}
                      {activePreferences.dstChain}
                    </span>
                  )}
                </div>
                <span className="leading-snug sm:text-right break-all sm:break-normal">
                  <span className="text-clay-medium">Connected wallet: </span>
                  <span className="font-mono font-bold">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>{' '}
                </span>
              </>
            ) : (
              <span className="leading-snug">Please connect your wallet to view your balances.</span>
            )}
          </div>
        </motion.div>
      </div>
      {connectedAddress && (
        <>
          <div className="w-full h-px bg-clay-light/30 my-2" />
          <div className="w-1/2 rounded-lg   bg-cream-white   border border-cherry-grey   px-4 py-3   text-sm   text-clay ">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-clay-dark font-bold">How fee claiming works</span>
            </div>
            <div className="h-px bg-cherry-grey/60 my-2" />
            <ul className="list-disc pl-5 space-y-1 text-clay-light">
              <li>Destination is configured once</li>
              <li>First claim requires a one-time approval</li>
              <li>Minimum claim amount is {MIN_PARTNER_CLAIM_AMOUNT} USDC</li>
              <li>Only assets with a positive balance are displayed</li>
            </ul>
          </div>
        </>
      )}
      {/* 2. Preferences Card*/}
      {connectedAddress && <PartnerPreferencesCard address={connectedAddress as Address} />}
      <div className="w-1/2 h-px bg-clay-light/30 my-2" />
      {/* Main content */}
      <motion.div variants={itemVariants}>
        {connectedAddress && (
          <PartnerFeeBalances
            assets={claimableFees}
            isLoading={isInitialLoading}
            onClaim={handleClaim}
            prefs={activePreferences}
          />
        )}
      </motion.div>
      {claimFlow === ClaimFlowStep.CONFIRM && selectedAsset && (
        <ConfirmClaimModal
          isOpen
          asset={selectedAsset}
          partnerAddress={connectedAddress as Address}
          onClose={() => {
            setClaimFlow(ClaimFlowStep.NONE);
            setSelectedAsset(null);
          }}
          onSuccess={({ srcTxHash }) => {
            setSubmittedTxHash(srcTxHash);
            setClaimFlow(ClaimFlowStep.SUBMITTED);
            refreshBalances();
          }}
        />
      )}

      {claimFlow === ClaimFlowStep.SUBMITTED && (
        <ClaimSubmittedModal
          isOpen
          onClose={() => {
            setClaimFlow(ClaimFlowStep.NONE);
            setSelectedAsset(null);
            setSubmittedTxHash(null); // optional cleanup, but good
          }}
          destination={
            activePreferences
              ? {
                  chain: activePreferences.dstChain,
                  address: activePreferences.dstAddress,
                }
              : undefined
          }
          srcTxHash={submittedTxHash}
        />
      )}

      <BackToTop />
    </motion.div>
  );
}
