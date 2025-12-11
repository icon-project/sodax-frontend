import type { XToken } from '@sodax/types';
import { motion } from 'motion/react';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { useLiquidity } from '@/hooks/useAPY';

export default function AccordionCollapsedAPY({
  tokens,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  tokens: XToken[];
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  const { apy } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  return (
    <motion.div
      className="flex items-center gap-1 -mr-8 md:mr-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <span className="text-espresso text-(length:--body-comfortable) font-['InterBlack']">{apy.replace('%', '')}</span>
      <span className="text-clay-light text-(length:--body-comfortable)">APY</span>
    </motion.div>
  );
}
