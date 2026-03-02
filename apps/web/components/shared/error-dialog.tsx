// apps/web/components/shared/error-dialog.tsx
'use client';

import type React from 'react';
import Image from 'next/image';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { XIcon } from 'lucide-react';

interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  title?: string;
}

export function ErrorDialog({ open, onOpenChange, errorMessage, title = 'Transaction failed' }: ErrorDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-[480px] py-8 px-12 bg-vibrant-white" hideCloseButton>
        <DialogHeader>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="inline-flex justify-start items-center gap-2 w-full">
              <Image src="/symbol_dark.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
              <DialogTitle className="mix-blend-multiply text-espresso font-['InterBold'] leading-snug text-(size:--body-super-comfortable) flex justify-between items-center w-full">
                {title}
                <DialogClose asChild>
                  <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                </DialogClose>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-clay-light font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable) mt-2">
            {errorMessage || 'An error occurred. Please try again.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
