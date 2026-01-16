'use client';

import type { XToken } from '@sodax/types';
import { PartnerFeeToken } from './partner-fee-token';

export type PartnerFeeBalance = {
  currency: XToken;
  balance: string;
};

export type PartnerFeeBalancesProps = {
  balances: PartnerFeeBalance[];
  isLoading: boolean;
  swappingSymbol: string | null;
  onSwapToUsdc: (balance: PartnerFeeBalance) => void;
};

export function PartnerFeeBalancesCard({ balances, isLoading, swappingSymbol, onSwapToUsdc }: PartnerFeeBalancesProps) {
  return (
    <main>
      {/* Header */}
      <div className="text-lg font-semibold text-clay mb-6">Your fee balances</div>
      {/* Content */}
      {isLoading ? (
        // Skeleton while loading
        <div className="space-y-3 mx-4">
          <div className="h-6 w-full rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-full rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-full rounded bg-clay-light/20 animate-pulse" />
          <div className="h-6 w-full rounded bg-clay-light/20 animate-pulse" />
        </div>
      ) : balances.length === 0 ? (
        <p className="text-sm text-clay-light px-4">No fee tokens found for this address.</p>
      ) : (
        <>
          {/* Table header (desktop only) */}
          <div className="hidden sm:flex items-center justify-between px-4 sm:px-2 mb-2 text-sm text-clay font-bold">
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="w-4"></div>
              <div className="w-10">Asset</div>
              <div className="w-30">Balance</div>
            </div>
            <div className="w-[140px]" />
          </div>
          <div className="space-y-1">
            {balances.map(balance => (
              <PartnerFeeToken
                key={`${balance.currency.symbol}-${balance.currency.xChainId}`}
                balance={balance}
                swappingSymbol={swappingSymbol}
                onSwapToUsdc={onSwapToUsdc}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
