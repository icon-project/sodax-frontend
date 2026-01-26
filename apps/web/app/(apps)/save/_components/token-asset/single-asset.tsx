import CurrencyLogo from '@/components/shared/currency-logo';
import type { XToken } from '@sodax/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SingleAsset({ token, amount }: { token: XToken; amount: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center group">
      <CurrencyLogo currency={token} />
      <div
        className={cn(
          "font-['InterRegular'] flex items-center justify-center text-(length:--body-small) mt-2 transition-all h-[18px] group-hover:text-espresso group-hover:font-bold",
          Number(amount) > 0 ? '!text-espresso' : 'text-clay',
        )}
      >
        {token.symbol}
      </div>

      {Number(amount) > 0 && (
        <motion.p
          className="text-clay !text-(length:--text-body-fine-print) text-center group-hover:text-espresso"
          transition={{ duration: 0.3 }}
        >
          {amount}
        </motion.p>
      )}
    </div>
  );
}
