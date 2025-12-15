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
  // balance > 10 as partner must have sufficient funds to swap and pay fees
  const hasBalance = numericAmount > 10;
  const isThisSwapping = swappingSymbol === balance.currency.symbol;

  return (
    <div
      key={`${balance.currency.symbol}-${balance.currency.xChainId}`}
      className="flex items-center justify-between rounded-xl bg-clay-dark/60 px-6 py-4"
    >
      {/* Left section: logo + info */}
      <div className="flex items-center gap-10">
        <CurrencyLogo currency={balance.currency} hideChainIcon />
        {/* Asset name */}
        <div className="flex flex-col">
          <span className="text-sm text-clay-dark">Asset:</span>
          <span className="text-sm text-clay-light">{balance.currency.symbol}</span>
        </div>
        {/* Balance */}
        <div className="flex flex-col">
          <span className="text-sm text-clay-dark">Balance:</span>
          <span className="text-md text-clay-light">{balance.balance}</span>
        </div>
      </div>
      <Button
        variant="cherry"
        className="disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={() => onSwapToUsdc(balance)}
        disabled={!hasBalance || isThisSwapping || balance.currency.symbol === 'USDC'} //TODO to be agreed what to do with the usdc case
      >
        {isThisSwapping ? 'Swapping…' : 'Swap to USDC'}
      </Button>
    </div>
  );
}
