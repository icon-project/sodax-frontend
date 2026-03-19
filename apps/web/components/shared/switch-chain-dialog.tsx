// apps/web/components/shared/switch-chain-dialog.tsx
'use client';

import type React from 'react';
import Image from 'next/image';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';

type SwitchChainDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chainName: string;
  onSwitchChain: () => void | Promise<void>;
  description: string;
  titleAction?: string;
};

export function SwitchChainDialog({
  open,
  onOpenChange,
  chainName,
  onSwitchChain,
  description,
  titleAction,
}: SwitchChainDialogProps): React.JSX.Element {
  const title = titleAction ? `Switch to ${chainName} to ${titleAction}` : `Switch to ${chainName}`;

  const handleSwitchChainClick = (): void => {
    void onSwitchChain();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-[480px]! p-8 md:p-12 gap-6 bg-vibrant-white" hideCloseButton>
        <div className="inline-flex justify-start items-center gap-2 w-full">
          <Image src="/symbol_dark.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
          <DialogTitle className="mix-blend-multiply text-espresso font-bold leading-snug text-(size:--body-super-comfortable) flex justify-between items-center w-full">
            {title}
            <DialogClose asChild>
              <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
            </DialogClose>
          </DialogTitle>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-clay text-(length:--body-comfortable) leading-5">{description}</p>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="cherry" onClick={handleSwitchChainClick}>
            Switch to {chainName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
