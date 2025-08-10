"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuccessDialog({ open, onOpenChange }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-[480px] p-12">
        <DialogHeader>
          <div className="flex flex-row justify-between items-center">
            <div className="inline-flex justify-start items-center gap-2">
              <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
              <div className="mix-blend-multiply text-espresso font-['InterRegular'] font-bold leading-snug text-(size:--subtitle)">
                Transaction completed
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="text-clay-light">
          <p className="font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
            Your new assets are now in your wallet. Make sure you have native gas to transact with them.
          </p>
        </div>
        <div className="text-clay-light font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
          Need help?{' '}
          <span className="underline hover:text-cherry-brighter transition-colors cursor-pointer">
            Join our Discord
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
