'use client';

import type React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check } from 'lucide-react';

export function SupplyConfirmationStep(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <DialogHeader className="items-center">
        <DialogTitle className="font-['InterRegular'] text-lg text-espresso text-center">
          Liquidity position created
        </DialogTitle>
        <DialogDescription className="font-['InterRegular'] text-sm text-clay text-center">
          Your position is now active and earning fees. You can view and manage it on the Pool page.
        </DialogDescription>
      </DialogHeader>
    </div>
  );
}
