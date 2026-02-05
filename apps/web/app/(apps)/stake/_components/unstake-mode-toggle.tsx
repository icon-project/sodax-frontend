// apps/web/app/(apps)/stake/_components/unstake-mode-toggle.tsx

import type React from 'react';
import { Switch } from '@/components/ui/switch';

interface UnstakeModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function UnstakeModeToggle({ enabled, onToggle }: UnstakeModeToggleProps): React.JSX.Element {
  return (
    <div className="w-full pt-4 inline-flex justify-end items-center gap-2">
      {/* <div className="justify-center text-clay text-xs font-normal font-['Inter'] leading-5">Unstake mode</div> */}
      <div className="justify-center text-espresso text-(length:--body-comfortable) font-normal font-['InterRegular'] leading-5">
        Unstake mode
      </div>
      <div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-clay-light cursor-pointer w-8 h-4"
        />
      </div>
    </div>
  );
}
