// apps/web/app/(apps)/stake/page.tsx
// Main stake page component that orchestrates all stake-related components

'use client';

import { StakeHeader, StakeInputPanel, StakeStatsCard, UnstakeModeToggle } from './_components';

export default function StakePage(): React.JSX.Element {
  return (
    <div className="w-full self-stretch inline-flex flex-col justify-start items-start gap-5">
      <StakeHeader apr={23.77} />

      <div className="w-full rounded-(--layout-container-radius) outline-[#e4dada] outline outline-[3px] outline-offset-[-3px] flex flex-col justify-start items-start gap-2">
        <div>
          <StakeInputPanel />
        </div>
        <div className="w-full flex flex-col justify-start items-start gap-2 bg-almost-white mix-blend-multiply">
          <StakeStatsCard />
          <UnstakeModeToggle enabled={false} onToggle={() => {}} />
        </div>
      </div>
    </div>
  );
}
