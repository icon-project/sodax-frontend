'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ClaimFunds, type Reward } from './components/claim-funds';

export default function PartnerPage() {
  const [isOpen, setIsOpen] = useState(false);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [claimingToken, setClaimingToken] = useState<string | null>(null);

  useEffect(() => {
    // fake fetch
    const timer = setTimeout(() => {
      setRewards([
        { tokenSymbol: 'USDC', amount: '123.45' },
        { tokenSymbol: 'SODA', amount: '50.00' },
        { tokenSymbol: 'BTCB', amount: '0.01' },
      ]);
      setIsLoadingRewards(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleClaim = async (tokenSymbol: string) => {
    try {
      setClaimingToken(tokenSymbol);

      // TODO:
      // - connect wallet
      // - call contract to claim that specific token
      // - wait for tx

      await new Promise(res => setTimeout(res, 2000));

      // after success, set that token’s amount to "0.00"
      setRewards(prev => prev.map(r => (r.tokenSymbol === tokenSymbol ? { ...r, amount: '0.00' } : r)));
    } catch (e) {
      console.error('Error claiming', tokenSymbol, e);
    } finally {
      setClaimingToken(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col w-full gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      {/*Header*/}
      <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable)">
        <motion.div className="" variants={itemVariants}>
          <span className="text-yellow-dark font-bold leading-9 font-['InterRegular'] !text-(size:--app-title)">
            SODAX{' '}
          </span>
          <span className="text-yellow-dark font-normal font-['Shrikhand'] leading-9 !text-(size:--app-title)">
            Partners Portal
          </span>
          <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) flex gap-1">
            Manage and claim your partner rewards
          </div>
        </motion.div>
      </div>
      {/* Claim section */}
      <motion.div>
        <ClaimFunds
          rewards={rewards}
          isLoading={isLoadingRewards}
          claimingToken={claimingToken}
          onClaim={handleClaim}
        />
      </motion.div>
    </motion.div>
  );
}
