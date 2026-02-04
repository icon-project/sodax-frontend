// apps/web/app/(apps)/stake/_components/unstake-mode-toggle.tsx
// Toggle component for switching between stake and unstake modes

import type React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface UnstakeModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function UnstakeModeToggle({
  enabled,
  onToggle,
  className,
}: UnstakeModeToggleProps): React.JSX.Element {
  return (
    <div className={cn('self-stretch pt-4 opacity-60 inline-flex justify-end items-center gap-2', className)}>
      <div className="justify-center text-clay text-xs font-normal font-['Inter'] leading-5">Unstake mode</div>
      <div
        data-property-1="Default"
        className="w-8 h-4 p-0.5 mix-blend-multiply bg-cream-white rounded-[50px] flex justify-start items-center gap-2"
      >
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-clay-light cursor-pointer w-8 h-4"
        />
      </div>
    </div>
  );
}

