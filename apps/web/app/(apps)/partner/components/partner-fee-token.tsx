'use client';

import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { PartnerFeeBalance } from './partner-fee-balance';

type PartnerFeeTokenProps = {
  balance: PartnerFeeBalance;
  swappingSymbol: string | null;
  onSwapToUsdc: (balance: PartnerFeeBalance) => void;
};

export function PartnerFeeToken({ balance, swappingSymbol, onSwapToUsdc }: PartnerFeeTokenProps) {
  const rawAmount = Number(balance.balance);
  const displayAmount = rawAmount.toFixed(4);
  // IMPORTANT balance > 10 as partner must have sufficient funds to swap and pay fees
  const hasBalance = rawAmount > 5;

  const isThisSwapping = swappingSymbol === balance.currency.symbol;
  const isUsdc = balance.currency.symbol === 'USDC';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl px-4 sm:px-2 py-4">
      {/* Left section: logo + info */}
      <div className="flex items-center gap-4 sm:gap-10">
        {/* Logo */}
        <div className="w-10 flex justify-center">
          <CurrencyLogo currency={balance.currency} />
        </div>
        {/* Asset */}
        <div className="w-20 text-sm text-espresso">{balance.currency.symbol}</div>
        {/* Balance */}
        <div className="w-32 text-sm text-clay-light break-all sm:break-normal"> {displayAmount}</div>
      </div>
      <div className="w-full sm:w-[140px] flex justify-end">
        {isUsdc ? (
          <div className="mix-blend-multiply px-4 h-11 flex items-center justify-center rounded-full bg-cream text-clay text-sm w-full">
            USDC balance
          </div>
        ) : (
          <Button
            variant="cherry"
            className="mix-blend-multiply w-full h-11"
            onClick={() => onSwapToUsdc(balance)}
            disabled={!hasBalance || isThisSwapping}
          >
            {isThisSwapping ? 'Swapping…' : 'Swap to USDC'}
          </Button>
        )}
      </div>
    </div>
  );
}
