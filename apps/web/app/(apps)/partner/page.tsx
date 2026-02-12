'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { PartnerPreferencesCard } from './components/partner-preference-card';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { PartnerFeeBalances } from './components/partner-fee-balances';
import { BackToTop } from '@/components/shared/back-to-top';
import { usePartnerFeeLifecycle } from './hooks/usePartnerFeeLifecycle';
import type { FeeClaimAsset } from './hooks/useFeeClaimAssets';
import { ConfirmClaimModal } from './components/modals/confirm-claim-modal';
import { ClaimSubmittedModal } from './components/modals/claim-submitted-modal';
import { ClaimFlowStep } from './utils/fee-claim';
import type { SetSwapPreferenceParams } from '@sodax/sdk';
import { getUsdcDestinations } from './utils/getUsdDestinations';
import { isAddress } from 'viem';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [claimFlow, setClaimFlow] = useState<ClaimFlowStep>(ClaimFlowStep.NONE);
  const [selectedAsset, setSelectedAsset] = useState<FeeClaimAsset | null>(null);

  const { address: rawAddress } = useXAccount(SONIC_MAINNET_CHAIN_ID);

  const partnerAddress = rawAddress && isAddress(rawAddress) ? rawAddress : undefined;

  const [submittedTxHash, setSubmittedTxHash] = useState<`0x${string}` | null>(null);

  const lifecycle = usePartnerFeeLifecycle(partnerAddress);

  const { activePreferences, claimableFees, isInitialLoading, refreshBalances } = lifecycle;

  const usdcDestinations = useMemo(() => getUsdcDestinations(), []);

  const normalizedPreferences = useMemo<SetSwapPreferenceParams | undefined>(() => {
    if (!activePreferences) return undefined;
    if (activePreferences.dstChain === 'not configured') return undefined;

    return {
      dstChain: activePreferences.dstChain,
      dstAddress: activePreferences.dstAddress,
      outputToken: activePreferences.outputToken,
    };
  }, [activePreferences]);

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
          {/* Title & subtitle*/}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="mix-blend-multiply text-yellow-dark font-bold font-['InterRegular'] text-(size:--app-title)!">
              Partner
            </span>
            <span className="mix-blend-multiply text-yellow-dark font-normal font-['Shrikhand'] text-(size:--app-title)!">
              dashboard{' '}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-clay-light w-full">
            {partnerAddress ? (
              <>
                <div className="flex flex-col">
                  <span className="leading-snug">Monitor and manage fees earned through your SODAX partnership.</span>
                </div>
                <span className="leading-snug sm:text-right break-all sm:break-normal">
                  <span className="text-clay-medium">Connected wallet: </span>
                  <span className="font-mono font-bold">
                    {partnerAddress.slice(0, 6)}...{partnerAddress.slice(-4)}
                  </span>{' '}
                </span>
              </>
            ) : (
              <span className="leading-snug">Please connect your wallet to view your balances.</span>
            )}
          </div>
        </motion.div>
      </div>
      {/* Preferences Card*/}
      {partnerAddress && (
        <PartnerPreferencesCard
          address={partnerAddress}
          prefs={lifecycle.activePreferences}
          updateMutation={lifecycle.updateMutation}
          usdcDestinations={usdcDestinations}
        />
      )}
      <div className="w-1/2 h-px bg-clay-light/30 my-2" />
      {/* Main content */}
      <motion.div variants={itemVariants}>
        {partnerAddress && (
          <PartnerFeeBalances
            assets={claimableFees}
            isLoading={isInitialLoading}
            onClaim={handleClaim}
            prefs={normalizedPreferences}
          />
        )}
      </motion.div>
      {claimFlow === ClaimFlowStep.CONFIRM && selectedAsset && partnerAddress && (
        <ConfirmClaimModal
          isOpen
          asset={selectedAsset}
          partnerAddress={partnerAddress}
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
            normalizedPreferences
              ? {
                  chain: normalizedPreferences.dstChain,
                  address: normalizedPreferences.dstAddress,
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
