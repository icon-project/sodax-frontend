'use client';

import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AnimatedNumber from '@/components/shared/animated-number';
import CurrencySearchPanel from './_components/currency-search-panel';
import CurrencyList from './_components/currency-list';
import { delay } from '@/lib/utils';
import CarouselWithPagination from './_components/carousel';
import TotalSaveTokens from './_components/total-save-tokens';

export default function SavingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openValue, setOpenValue] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    delay(500).then(() => {
      setIsOpen(true);
    });
  }, []);

  return (
    <motion.div
      className="w-full flex flex-col gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <TotalSaveTokens />
      <CarouselWithPagination />
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

      <motion.div className="w-full" variants={itemVariants}>
        <CurrencySearchPanel
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          currencyListOpened={openValue !== ''}
          onSearchFocus={() => setOpenValue('')}
        />
      </motion.div>

      <motion.div className="w-full flex-grow-1" variants={itemVariants}>
        <CurrencyList searchQuery={searchQuery} openValue={openValue} setOpenValue={setOpenValue} />
      </motion.div>
    </motion.div>
  );
}
