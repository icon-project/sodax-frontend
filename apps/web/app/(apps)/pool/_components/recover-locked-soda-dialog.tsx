'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { XIcon, Loader2, TriangleAlertIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DISCORD_ROUTE } from '@/constants/routes';

const SHAKE_DURATION_MS = 500;

type RecoverLockedSodaDialogProps = {
  open: boolean;
  onRecover: () => void;
  isRecovering: boolean;
};

export default function RecoverLockedSodaDialog({
  open,
  onRecover,
  isRecovering,
}: RecoverLockedSodaDialogProps): React.JSX.Element {
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleDismissAttempt = (): void => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), SHAKE_DURATION_MS);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismissAttempt}>
      <DialogContent
        className="w-full md:max-w-[480px]! p-8 bg-vibrant-white shadow-[0px_20px_160px_0px_rgba(185,172,171,0.40)] flex flex-col gap-6"
        hideCloseButton
        enableMotion={true}
        shake={isShaking}
      >
        <div className="self-stretch px-4 flex flex-col gap-6">
          <DialogTitle className="self-stretch flex justify-end items-center gap-2 p-0">
            <XIcon
              className="w-4 h-4 cursor-pointer text-clay hover:text-espresso"
              onClick={handleDismissAttempt}
            />
          </DialogTitle>

          <div className="self-stretch flex justify-start items-center gap-2">
            <TriangleAlertIcon className="w-4 h-4 text-yellow-dark mix-blend-multiply" />
            <div className="text-espresso text-base font-bold font-['InterBold'] leading-5">
              Your SODA needs a quick recovery
            </div>
          </div>

          <div className="self-stretch text-clay text-xs font-normal font-['InterRegular'] leading-5">
            Part of your SODA didn’t complete transfer. You can safely recover it now in one step.
          </div>

          <button
            type="button"
            onClick={onRecover}
            disabled={isRecovering}
            className="self-stretch h-10 px-6 py-2 bg-cherry-bright rounded-[240px] flex justify-center items-center gap-1 text-white text-xs font-medium font-['InterMedium'] leading-5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isRecovering ? 'Recovering now' : 'Recover now'}
            {isRecovering && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </button>

          <div className="self-stretch h-px bg-clay/30" />

          <div className="self-stretch text-xs leading-5">
            <span className="text-espresso font-normal font-['InterRegular']">Need help? </span>
            <Link
              href={DISCORD_ROUTE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-espresso font-bold font-['InterBold'] underline"
            >
              Get support here
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
