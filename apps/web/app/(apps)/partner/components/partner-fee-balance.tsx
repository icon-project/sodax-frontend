'use client';

import { Card } from '@/components/ui/card';
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
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mx-4">
        <h2 className="text-xl font-bold text-yellow-dark mx-1">Fee balances</h2>
      </div>

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
        // Token list
        <div className="space-y-2">
          {balances.map(balance => (
            <PartnerFeeToken
              key={`${balance.currency.symbol}-${balance.currency.xChainId}`}
              balance={balance}
              swappingSymbol={swappingSymbol}
              onSwapToUsdc={onSwapToUsdc}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
