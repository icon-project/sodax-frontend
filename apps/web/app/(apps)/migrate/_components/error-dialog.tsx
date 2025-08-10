"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
}

export function ErrorDialog({ open, onOpenChange, errorMessage }: ErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-[480px] p-12">
        <DialogHeader>
          <div className="flex flex-row justify-between items-center">
            <div className="inline-flex justify-start items-center gap-2">
              <Image src="/symbol.png" alt="SODAX Symbol" width={16} height={16} />
              <div className="mix-blend-multiply text-espresso font-['InterRegular'] font-bold leading-snug text-(size:--subtitle)">
                Transaction failed
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-clay-light font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
            {errorMessage || 'An error occurred during migration. Please try again.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
