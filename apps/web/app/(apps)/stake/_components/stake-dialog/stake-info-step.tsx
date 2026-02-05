// apps/web/app/(apps)/stake/_components/stake-dialog/stake-info-step.tsx
// Info step component showing staking information and benefits

import type React from 'react';
import type { XToken } from '@sodax/types';

export default function StakeInfoStep({
  selectedToken,
}: {
  selectedToken: XToken;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
          You’ll receive xSODA tokens
        </div>
        <div className="self-stretch text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
          Your SODA value grows while xSODA stays the same.
        </div>
      </div>

      <div className="self-stretch inline-flex justify-start items-start gap-4">
        <div className="flex-1 pl-4 border-l-2 border-cream-white inline-flex flex-col justify-center items-start gap-1">
          <div className="md:w-40 h-4 justify-start text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-[1.4] overflow-hidden">
            23.77% variable APR
          </div>
          <div className="self-stretch justify-start text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
            Earnings update in cycles, not constantly.
          </div>
        </div>

        <div className="flex-1 pl-4 border-l-2 border-cream-white inline-flex flex-col justify-center items-start gap-1">
          <div className="md:w-40 h-4 justify-start text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
            180 day unstake
          </div>
          <div className="self-stretch justify-start text-clay text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-[1.4]">
            Wait for full value, or exit early anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
