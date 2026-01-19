'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { XIcon } from 'lucide-react';

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuccessDialog({ open, onOpenChange }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-[480px] py-8 px-12 bg-vibrant-white" hideCloseButton>
        <DialogHeader>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="inline-flex justify-start items-center gap-2 w-full">
              <Image src="/symbol_dark.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
              <DialogTitle className="mix-blend-multiply text-espresso font-['InterBold'] leading-snug text-(size:--body-super-comfortable) flex justify-between items-center w-full">
                Transaction completed
                <DialogClose asChild>
                  <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                </DialogClose>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <div className="text-clay">
          <p className="font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable) mt-2">
            Your new assets are now in your wallet. Make sure you have native gas to transact with them.
          </p>
        </div>
        <div className="text-espresso font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
          Need help?{' '}
          <span className="underline hover:text-cherry-brighter transition-colors cursor-pointer hover:font-bold">
            Join our Discord
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
