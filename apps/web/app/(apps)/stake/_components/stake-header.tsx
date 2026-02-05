// apps/web/app/(apps)/stake/_components/stake-header.tsx
// Header component for stake page with title and description

import type React from 'react';
import { STAKING_APR } from './constants';

interface StakeHeaderProps {
  apr?: number;
}

export function StakeHeader({ apr = STAKING_APR }: StakeHeaderProps): React.JSX.Element {
  return (
    <div className="self-stretch mix-blend-multiply flex flex-col justify-start items-start gap-4">
      <div className="self-stretch mix-blend-multiply justify-end">
        <span className="text-yellow-dark text-3xl font-normal font-['Shrikhand'] leading-8">Stake</span>
        <span className="text-yellow-dark text-3xl font-bold font-['Inter'] leading-8"> your SODA</span>
      </div>
      <div className="self-stretch mix-blend-multiply justify-start text-clay-light text-base font-normal font-['InterRegular'] leading-5">
        Earn {apr}% from protocol fees.
      </div>
    </div>
  );
}
