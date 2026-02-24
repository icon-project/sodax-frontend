import type React from 'react';
import { itemVariants } from '@/constants/animation';
import { motion } from 'framer-motion';

export function PoolHeader(): React.JSX.Element {
  return (
    <motion.div className="self-stretch mix-blend-multiply flex flex-col justify-start items-start gap-4" variants={itemVariants}>
      <div className="self-stretch mix-blend-multiply justify-end">
        <span className="text-yellow-dark text-(length:--app-title) font-normal font-['InterRegular'] leading-8">Supply </span>
        <span className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] italic leading-8">liquidity</span>
      </div>
      <div className="flex self-stretch mix-blend-multiply justify-start text-clay-light text-(length:--subtitle) font-normal font-['InterRegular'] leading-5">
        Enable your assets to collect market fees.
      </div>
    </motion.div>
  );
}
