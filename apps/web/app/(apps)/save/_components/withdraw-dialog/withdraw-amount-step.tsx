// apps/web/app/(apps)/save/_components/withdraw-dialog/withdraw-amount-step.tsx
import type React from 'react';
import type { XToken } from '@sodax/types';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import AmountInputSlider from '../amount-input-slider';

interface WithdrawAmountStepProps {
  selectedToken: XToken | null;
  withdrawValue: number;
  onWithdrawValueChange: (value: number) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  supplyBalance: string;
  sourceAddress: string | undefined;
}

export default function WithdrawAmountStep({
  selectedToken,
  withdrawValue,
  onWithdrawValueChange,
  onInputChange,
  supplyBalance,
  sourceAddress,
}: WithdrawAmountStepProps): React.JSX.Element {
  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);

  return (
    <>
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
        onValueChange={value => onWithdrawValueChange(value[0] ?? 0)}
        maxValue={Number(supplyBalance) || 0}
        tokenSymbol={selectedToken?.symbol || ''}
        onInputChange={onInputChange}
        sourceAddress={sourceAddress}
      />
      <div className="flex gap-2 mt-4">
        <div className="font-['InterRegular'] text-(length:--body-comfortable) text-clay-light">Withdrawable</div>
        <div className="font-['InterRegular'] text-(length:--body-comfortable) text-clay">
          {supplyBalance} {selectedToken?.symbol}
        </div>
      </div>
    </>
  );
}
