import { motion } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import TokenAssetWithSupply from './token-asset-with-supply';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { AlertCircleIcon } from 'lucide-react';
import { useLiquidity } from '@/hooks/useAPY';

export default function AccordionExpandedContent({
  tokens,
  symbol,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  tokens: XToken[];
  symbol: string;
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  const { apy, deposits } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);

  return (
    <motion.div
      variants={accordionVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="pl-0 md:pl-18 flex flex-col gap-4"
      layout
    >
      <div className="flex h-12">
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value={apy.replace('%', '')} label="Current APY" />
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value={deposits} label="All deposits" />
      </div>

      <div className="flex flex-wrap mt-4 -ml-3">
        {tokens.map(t => (
          <TokenAssetWithSupply
            key={t.xChainId}
            token={t}
            symbol={symbol}
            tokens={tokens}
            formattedReserves={formattedReserves}
            isFormattedReservesLoading={isFormattedReservesLoading}
          />
        ))}
      </div>

      <div className="flex gap-4 items-center mt-4 mb-8">
        <Button variant="cream" className="w-27 mix-blend-multiply shadow-none">
          Continue
        </Button>
        <span className="text-clay text-(length:--body-small) font-['InterRegular']">Select a source</span>
      </div>
    </motion.div>
  );
}

function InfoBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-col px-(--layout-space-normal)">
      <div className="text-espresso text-(length:--subtitle) font-['InterBold']">{value}</div>
      <div className="flex gap-1 text-clay-light text-(length:--body-small)">
        {label} <AlertCircleIcon className="w-4 h-4" />
      </div>
    </div>
  );
}
