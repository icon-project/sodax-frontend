'use client';

import { Button } from '@/components/ui/button';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { PartnerFeeBalance } from './partner-fee-balance';

type PartnerFeeTokenProps = {
  balance: PartnerFeeBalance;
  claimingSymbol: string | null;
  canClaim: boolean;
  onClaimToUsdc: (balance: PartnerFeeBalance) => void;
};

export function PartnerFeeToken({ balance, claimingSymbol, onClaimToUsdc, canClaim }: PartnerFeeTokenProps) {
  const rawAmount = Number(balance.balance);
  const displayAmount = rawAmount.toFixed(4);

  const isThisClaiming = claimingSymbol === balance.currency.symbol;
  const isUsdc = balance.currency.symbol === 'USDC';

  return (
    <div className="flex flex-col gap-4 rounded-xl px-4 py-4 sm:py-3 sm:px-2 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center">
      {/* Left section: logo + info */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="w-10 flex justify-center">
          <CurrencyLogo currency={balance.currency} />
        </div>
        {/* Asset */}
        <div className="w-15 text-sm text-espresso">{balance.currency.symbol}</div>
        {/* Balance */}
        <div className="w-20 text-sm text-clay-light break-all sm:break-normal"> {displayAmount}</div>
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
            onClick={() => onClaimToUsdc(balance)}
            disabled={!canClaim || isThisClaiming}
          >
            {isThisClaiming ? 'Processing...' : 'Claim to USDC'}
          </Button>
        )}
      </div>
    </div>
  );
}
