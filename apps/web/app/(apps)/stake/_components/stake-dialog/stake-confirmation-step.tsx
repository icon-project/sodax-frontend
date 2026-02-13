import type React from 'react';
import type { XToken } from '@sodax/types';
import { useStakeState } from '../../_stores/stake-store-provider';
import CurrencyLogo from '@/components/shared/currency-logo';
import { CircleArrowRight, ShieldAlertIcon } from 'lucide-react';
import { formatUnits } from 'viem';
import BigNumber from 'bignumber.js';
interface StakeConfirmationStepProps {
  selectedToken: XToken;
  receivedXSodaAmount: string;
  stakeError: { title: string; message: string } | null;
}

export default function StakeConfirmationStep({
  selectedToken,
  receivedXSodaAmount,
  stakeError,
}: StakeConfirmationStepProps): React.JSX.Element {
  const { stakeValue } = useStakeState();

  const xSodaToken = {
    ...selectedToken,
    symbol: 'xsoda',
    xChainId: selectedToken.xChainId,
  };

  return (
    <div className="flex flex-col items-center mt-4">
      {stakeError ? (
        <div className="flex flex-col text-center">
          <div className="flex justify-center gap-1 w-full items-center">
            <ShieldAlertIcon className="w-4 h-4 text-negative" />
            <span className="font-['InterBold'] text-(length:--body-super-comfortable) leading-[1.4] text-negative">
              {stakeError.title}
            </span>
          </div>
          <div className="text-espresso text-(length:--body-small) font-medium font-['InterRegular'] text-center leading-[1.4]">
            {stakeError.message}
          </div>
        </div>
      ) : (
        <div className="flex flex-col text-center">
          <div className="text-espresso text-(length:--body-super-comfortable) font-['InterRegular'] leading-[1.4]">
            Staking SODA
          </div>
          <div className="text-clay text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4] justify-center">
            23.77% variable APR
          </div>
        </div>
      )}

      <div className="w-60 pb-6 flex justify-between items-center mt-4">
        <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
          <CurrencyLogo currency={selectedToken} />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-espresso text-base font-normal font-['InterRegular'] leading-5">
                {formatUnits(stakeValue, selectedToken.decimals)}
              </div>
              <div className="justify-start text-clay text-base font-normal font-['InterRegular'] leading-5">SODA</div>
            </div>
          </div>
        </div>
        <div className="w-16 h-9 inline-flex flex-col justify-between items-center">
          <div className="w-4 h-4 relative overflow-hidden">
            <CircleArrowRight className="w-4 h-4 text-clay-light" />
          </div>
          <div className="justify-start text-clay text-xs font-normal font-['InterRegular'] leading-4">~10s</div>
        </div>
        <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
          <CurrencyLogo currency={xSodaToken} />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-espresso text-base font-normal font-['InterRegular'] leading-5">
                {new BigNumber(receivedXSodaAmount).toFixed(2)}
              </div>
              <div className="justify-start text-clay text-base font-normal font-['InterRegular'] leading-5">xSODA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
