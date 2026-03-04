// apps/web/app/(apps)/pool/page.tsx
'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';
import { useEffect, useState } from 'react';
import { PoolHeader } from './_components/pool-header';
import { PoolInfoCard } from './_components/pool-info-card';
import { PriceRangeSelector } from './_components/price-range-selector';
import { LiquidityInputs } from './_components/liquidity-inputs';
import Tip from '../stake/_components/icons/tip';

export default function PoolPage(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  return (
    <motion.div
      className="self-stretch inline-flex flex-col justify-start items-start gap-6 w-full"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.div className="self-stretch flex flex-col justify-start items-start gap-4 pb-20" variants={itemVariants}>
        <PoolHeader />
        <motion.div className="self-stretch flex flex-col justify-start items-start" variants={itemVariants}>
          <PoolInfoCard />
          <div
            className="self-stretch px-(--layout-space-big) py-8 relative rounded-bl-3xl rounded-br-3xl flex flex-col justify-start items-start gap-6
  before:absolute before:inset-0 before:rounded-bl-3xl before:rounded-br-3xl 
  before:bg-almost-white before:mix-blend-multiply before:-z-10"
          >
            <div className="absolute -top-1 left-[72px] ">
              <Tip fill="#F8F3F3" />
            </div>
            <PriceRangeSelector />
            <LiquidityInputs />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
