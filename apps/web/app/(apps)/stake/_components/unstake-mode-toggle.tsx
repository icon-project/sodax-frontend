// apps/web/app/(apps)/stake/_components/unstake-mode-toggle.tsx

import type React from 'react';
import { Switch } from '@/components/ui/switch';
import { useStakeState } from '../_stores/stake-store-provider';
import { cn } from '@/lib/utils';

interface UnstakeModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function UnstakeModeToggle({ enabled, onToggle }: UnstakeModeToggleProps): React.JSX.Element {
  const { userXSodaBalance } = useStakeState();
  return (
    <div className={cn('flex items-center gap-2', userXSodaBalance === 0n && 'opacity-60 pointer-events-none')}>
      {/* <div className="justify-center text-clay text-xs font-normal font-['Inter'] leading-5">Unstake mode</div> */}
      <div className="justify-center text-espresso text-(length:--body-comfortable) font-normal font-['InterRegular'] leading-5">
        Unstake
      </div>
      <div className="mix-blend-multiply">
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:!bg-clay-light cursor-pointer w-8 h-4 !bg-cream-white"
        />
      </div>
    </div>
  );
}
