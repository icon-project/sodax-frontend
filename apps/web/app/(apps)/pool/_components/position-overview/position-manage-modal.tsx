'use client';

import type React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { EnrichedPosition } from '../../_mocks';

interface PositionManageModalProps {
  position: EnrichedPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PositionManageModal({
  position,
  open,
  onOpenChange,
}: PositionManageModalProps): React.JSX.Element {
  if (!position) return <></>;

  const symbol0 = position.symbol0 ?? `${position.currency0.slice(0, 6)}...`;
  const symbol1 = position.symbol1 ?? `${position.currency1.slice(0, 6)}...`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent enableMotion hideCloseButton className="sm:max-w-[380px]">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="h-4 w-4 text-clay" />
        </button>

        <DialogHeader>
          <DialogTitle className="font-['InterRegular'] text-lg text-espresso">
            {symbol0} / {symbol1}
          </DialogTitle>
        </DialogHeader>

        {/* Position amounts */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between p-3 rounded-lg bg-almost-white mix-blend-multiply">
            <span className="font-['InterRegular'] text-sm text-clay">{symbol0}</span>
            <span className="font-['InterRegular'] text-sm text-espresso font-medium">{position.amount0}</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-almost-white mix-blend-multiply">
            <span className="font-['InterRegular'] text-sm text-clay">{symbol1}</span>
            <span className="font-['InterRegular'] text-sm text-espresso font-medium">{position.amount1}</span>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="flex flex-col gap-2 mt-4">
          <Button variant="cherry" className="w-full">
            Add liquidity
          </Button>
          <Button variant="outline" className="w-full">
            Withdraw
          </Button>
          {position.earnedFeesUsd > 0 && (
            <Button variant="cream" className="w-full">
              Claim ${position.earnedFeesUsd.toFixed(4)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
