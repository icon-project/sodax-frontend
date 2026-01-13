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
  const numericAmount = Number(balance.balance);
  // IMPORTANT balance > 10 as partner must have sufficient funds to swap and pay fees
  const hasBalance = numericAmount > 4;
  const isThisSwapping = swappingSymbol === balance.currency.symbol;
  const isUsdc = balance.currency.symbol === 'USDC';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-clay-light/10 px-4 sm:px-6 py-4 mx-1">
      {/* Left section: logo + info */}
      <div className="flex items-center gap-4 sm:gap-10">
        <CurrencyLogo currency={balance.currency} hideNetwork />
        {/* Asset name */}
        <div className="flex flex-col">
          <span className="text-sm text-clay-dark">Asset:</span>
          <span className="text-sm text-clay-light">{balance.currency.symbol}</span>
        </div>
        {/* Balance */}
        <div className="flex flex-col">
          <span className="text-sm text-clay-dark">Balance:</span>
          <span className="sm:text-md text-sm text-clay-light break-all sm:break-normal">{balance.balance}</span>
        </div>
      </div>
      <Button
        variant="cherry"
        className="w-full sm:w-auto h-11 disabled:opacity-80 disabled:cursor-not-allowed"
        onClick={() => {
          if (isUsdc) return;
          onSwapToUsdc(balance);
        }}
        disabled={!hasBalance || isThisSwapping || isUsdc}
      >
        {isThisSwapping ? 'Swapping…' : isUsdc ? 'Already USDC' : 'Swap to USDC'}
      </Button>
    </div>
  );
}
