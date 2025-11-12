'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AnimatedNumber from '@/components/shared/animated-number';
import CurrencySearchPanel from './_components/currency-search-panel';
import CurrencyList from './_components/currency-list';

export default function SavingsPage() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);

  return (
    <motion.div
      className="w-full flex flex-col gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.div className="inline-flex flex-col justify-start items-start gap-4" variants={itemVariants}>
        <div className="self-stretch mix-blend-multiply justify-end">
          <div className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-9">
            Deposit and earn{' '}
          </div>
          <div className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-9">
            instantly
          </div>
        </div>
        <div className="mix-blend-multiply justify-start text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) flex gap-1">
          Up to{' '}
          <AnimatedNumber
            to={9.81}
            decimalPlaces={2}
            className="text-clay-light font-normal font-['InterRegular'] leading-snug !text-(length:--subtitle) min-w-6"
          />
          % with no lockups.
        </div>
      </motion.div>

      <motion.div className="w-full" variants={itemVariants}>
        <CurrencySearchPanel />
      </motion.div>

      <motion.div className="w-full" variants={itemVariants}>
        <CurrencyList />
      </motion.div>
    </motion.div>
  );
}
