import type React from 'react';
import { Switch } from '@/components/ui/switch';
import { useStakeState } from '../_stores/stake-store-provider';

interface UnstakeModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function UnstakeModeToggle({ enabled, onToggle }: UnstakeModeToggleProps): React.JSX.Element | null {
  const { userXSodaBalance } = useStakeState();
  if (userXSodaBalance === 0n) {
    return null;
  }
  return (
    <div className="flex items-center gap-2">
      <div className="justify-center text-espresso text-(length:--body-comfortable) leading-5">Unstake</div>
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
