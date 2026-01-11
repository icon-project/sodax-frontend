import type React from 'react';
import type { SpokeChainId, XToken } from '@sodax/types';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import AmountInputSlider from '../amount-input-slider';
import { chainIdToChainName } from '@/providers/constants';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';

interface WithdrawAmountSelectProps {
  selectedToken: XToken | null;
  withdrawValue: number;
  onWithdrawValueChange: (value: number) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  supplyBalance: string;
  sourceAddress: string | undefined;
}

export default function WithdrawAmountSelect({
  selectedToken,
  withdrawValue,
  onWithdrawValueChange,
  onInputChange,
  supplyBalance,
  sourceAddress,
}: WithdrawAmountSelectProps): React.JSX.Element {
  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);
  const allChainBalances = useAllChainBalances();
  const balance = selectedToken
    ? (allChainBalances[selectedToken.address]?.find(entry => entry.chainId === selectedToken.xChainId)?.balance ?? 0n)
    : 0n;
  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-bold">
          ${formatBalance((withdrawValue * (tokenPrice ?? 0)).toString(), tokenPrice ?? 0)}
        </div>
        <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">
          worth of {selectedToken?.symbol} to {chainIdToChainName(selectedToken?.xChainId as SpokeChainId)}
        </div>
      </div>
      <AmountInputSlider
        value={[withdrawValue]}
        onValueChange={value => onWithdrawValueChange(value[0] ?? 0)}
        maxValue={Number(supplyBalance) || 0}
        tokenSymbol={selectedToken?.symbol || ''}
        onInputChange={onInputChange}
        isSimulate={!(sourceAddress && balance > 0n)}
      />
      <div className="flex gap-2 mt-4">
        <div className="font-['InterRegular'] text-(length:--body-comfortable) text-clay-light">Withdrawable</div>
        <div className="font-['InterRegular'] text-(length:--body-comfortable) text-clay">
          {formatBalance((Number(supplyBalance) - withdrawValue).toString(), tokenPrice ?? 0)} {selectedToken?.symbol}
        </div>
      </div>
    </>
  );
}
