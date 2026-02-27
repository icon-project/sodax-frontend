// apps/web/app/(apps)/migrate/_components/success-dialog.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ExternalLinkIcon, XIcon } from 'lucide-react';
import { DISCORD_ROUTE } from '@/constants/routes';
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
        <div className="text-espresso font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable) flex flex-wrap items-center gap-1">
          Need help?{' '}
          <Link
            href={DISCORD_ROUTE}
            target="_blank"
            className="inline-flex gap-1 items-center underline hover:text-cherry-brighter transition-colors cursor-pointer hover:font-bold"
          >
            Get support on Discord <ExternalLinkIcon className="w-4 h-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
