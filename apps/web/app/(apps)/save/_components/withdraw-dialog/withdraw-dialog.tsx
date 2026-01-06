// apps/web/app/(apps)/save/_components/withdraw-dialog/withdraw-dialog.tsx
'use client';

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import type { XToken } from '@sodax/types';
import { XIcon } from 'lucide-react';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import AmountInputSlider from '../amount-input-slider';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { Button } from '@/components/ui/button';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedToken: XToken | null;
}

export default function WithdrawDialog({ open, onOpenChange, selectedToken }: WithdrawDialogProps): React.JSX.Element {
  const [isWithdrawPending, setIsWithdrawPending] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);
  const [withdrawValue, setWithdrawValue] = useState(0);
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const handleClose = (): void => {
    if (isWithdrawPending) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onOpenChange(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;
    const numericValue = Number.parseFloat(inputValue);
    setWithdrawValue(numericValue);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 sm:h-82 bg-vibrant-white block"
        hideCloseButton
        enableMotion={true}
        shake={isShaking}
      >
        <DialogTitle className="flex w-full justify-end h-4 relative p-0">
          <XIcon
            className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay absolute top-0"
            onClick={handleClose}
          />
        </DialogTitle>
        <div className="flex gap-2 mb-4">
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-bold">
            ${formatBalance((withdrawValue * (tokenPrice ?? 0)).toString(), tokenPrice ?? 0)}
          </div>
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">
            worth of {selectedToken?.symbol}
          </div>
        </div>
        <AmountInputSlider
          value={[withdrawValue]}
          onValueChange={value => setWithdrawValue(value[0] ?? 0)}
          maxValue={10000}
          tokenSymbol={selectedToken?.symbol || ''}
          onInputChange={handleInputChange}
          sourceAddress={sourceAddress}
        />
        <div className="flex gap-2 mt-4">
          <div className="font-['InterRegular'] text-(length:--body-comfortable) text-clay-light">Withdrawable</div>
          <div className="font-['InterRegular'] text-(length:--body-comfortable) text-clay">
            0.249087 {selectedToken?.symbol}
          </div>
        </div>
        <DialogFooter className="flex justify-between gap-2 overflow-hidden absolute bottom-8 md:inset-x-12 inset-x-8">
          <Button
            variant="cherry"
            className="text-white font-['InterRegular'] transition-all duration-300 ease-in-out flex-1"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
