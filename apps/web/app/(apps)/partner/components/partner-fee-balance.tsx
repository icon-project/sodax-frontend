'use client';

import CurrencyLogo from '@/components/shared/currency-logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { XToken } from '@sodax/types';

export type PartnerFeeBalance = {
  currency: XToken;
  balance: string;
};

export type PartnerFeeBalancesProps = {
  balances: PartnerFeeBalance[];
  isLoading: boolean;
  swappingSymbol: string | null; // e.g. "USDC" when that one is being swapped
  onSwapToUsdc: (balance: PartnerFeeBalance) => void;
};

export function PartnerFeeBalancesCard({ balances, isLoading, swappingSymbol, onSwapToUsdc }: PartnerFeeBalancesProps) {
  return (
    <Card>
      {' '}
      {/* Header */}
      <div className="flex items-center justify-between mx-4">
        <h2 className="text-lg font-bold text-yellow-dark">Fee balances</h2>
      </div>
      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-6 w-full rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-2/3 rounded bg-clay-light/20 animate-pulse" />
        </div>
      ) : balances.length === 0 ? (
        <p className="text-sm text-clay-light">No fee tokens found for this address.</p>
      ) : (
        <div className="space-y-2">
          {balances.map(balance => {
            const numericAmount = Number(balance.balance);
            const hasBalance = numericAmount > 0;
            const isThisSwapping = swappingSymbol === balance.currency.symbol;

            return (
              <div
                key={`${balance.currency.symbol}-${balance.currency.xChainId}`}
                className="flex items-center justify-between rounded-xl bg-clay-dark/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CurrencyLogo currency={balance.currency} hideChainIcon />
                  <div className="flex flex-col">
                    <span className="text-sm text-clay-light">{balance.currency.symbol}</span>
                    <span className="text-md text-clay-dark">{balance.balance}</span>
                  </div>
                </div>

                <Button
                  variant="cherry"
                  className="disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => onSwapToUsdc(balance)}
                  disabled={!hasBalance || isThisSwapping}
                >
                  {isThisSwapping ? 'Swapping…' : 'Swap to USDC'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
