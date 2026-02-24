'use client';

import type React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function SupplyInfoStep(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 px-2">
      <DialogHeader>
        <DialogTitle className="font-['InterRegular'] text-lg text-espresso">
          You'll provide liquidity
        </DialogTitle>
        <DialogDescription className="font-['InterRegular'] text-sm text-clay leading-relaxed">
          By supplying liquidity, your assets will earn a share of trading fees from swaps in this pool.
          Fees are variable and depend on trading volume.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 p-4 rounded-lg bg-almost-white mix-blend-multiply">
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cherry-soda mt-1.5 shrink-0" />
          <span className="font-['InterRegular'] text-sm text-espresso">
            Your position earns fees proportional to your share of the pool
          </span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cherry-soda mt-1.5 shrink-0" />
          <span className="font-['InterRegular'] text-sm text-espresso">
            Concentrated liquidity means your capital is more efficient within the selected price range
          </span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cherry-soda mt-1.5 shrink-0" />
          <span className="font-['InterRegular'] text-sm text-espresso">
            Monitor your position — if the price moves out of your range, you'll stop earning fees
          </span>
        </div>
      </div>
    </div>
  );
}
