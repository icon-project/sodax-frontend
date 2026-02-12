import type React from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import BigNumber from 'bignumber.js';
import { ETHEREUM_MAINNET_CHAIN_ID } from '@sodax/types';
import { ShieldAlertIcon, TimerIcon } from 'lucide-react';

interface WithdrawConfirmationStepProps {
  selectedToken: XToken;
  amount: string;
  withdrawError: { title: string; message: string } | null;
}

export default function WithdrawConfirmationStep({
  selectedToken,
  amount,
  withdrawError,
}: WithdrawConfirmationStepProps): React.JSX.Element {
  const { data: usdPrice } = useTokenPrice(selectedToken);
  return (
    <div className="flex flex-col gap-4">
      {withdrawError ? (
        <div className="flex flex-col text-center">
          <div className="flex justify-center gap-1 w-full items-center">
            <ShieldAlertIcon className="w-4 h-4 text-negative" />
            <span className="font-['InterBold'] text-(length:--body-super-comfortable) leading-[1.4] text-negative">
              {withdrawError.title}
            </span>
          </div>
          <div className="text-espresso text-(length:--body-small) font-medium font-['InterRegular'] text-center leading-[1.4] ">
            {withdrawError.message}
          </div>
        </div>
      ) : (
        <div className="flex flex-col text-center">
          <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
            Withdraw
          </div>
          <div className="self-stretch text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4] justify-center">
            {selectedToken.xChainId === ETHEREUM_MAINNET_CHAIN_ID ? (
              <span className="flex items-center gap-1 text-cherry-bright justify-center">
                <TimerIcon className="w-4 h-4 text-cherry-bright" />
                Takes longer (~1m)
              </span>
            ) : (
              'Takes ~20 seconds'
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center">
        <CurrencyLogo currency={selectedToken} />
        <div className="mt-2">
          <div className="text-(length:--body-super-comfortable) font-['InterRegular'] leading-[1.4] gap-1 flex justify-center">
            <span className="text-espresso">{formatBalance(amount, usdPrice ?? 0)}</span>
            <span className="text-clay-light">{selectedToken.symbol}</span>
          </div>
          <div className="text-clay-light font-['InterRegular'] text-(length:--body-small) leading-[1.4] text-center">
            ${formatBalance(new BigNumber(amount).multipliedBy(usdPrice ?? 0).toString(), usdPrice ?? 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
