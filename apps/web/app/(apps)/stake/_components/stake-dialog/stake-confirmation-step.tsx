import type React from 'react';
import type { XToken } from '@sodax/types';
import { useStakeState } from '../../_stores/stake-store-provider';
import CurrencyLogo from '@/components/shared/currency-logo';
import { CircleArrowRight, ShieldAlertIcon } from 'lucide-react';
import { formatTokenAmount } from '@/lib/utils';
import { parseUnits } from 'viem';
import { cn } from '@/lib/utils';
import { ETHEREUM_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { DEFAULT_ESTIMATED_TX_TIME, ETHEREUM_ESTIMATED_TX_TIME, STAKING_APR } from '../constants';
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
            <span className="font-bold text-(length:--body-super-comfortable) leading-[1.4] text-negative">
              {stakeError.title}
            </span>
          </div>
          <div className="text-espresso text-(length:--body-small) text-center leading-[1.4]">{stakeError.message}</div>
        </div>
      ) : (
        <div className="flex flex-col text-center">
          <div className="text-espresso text-(length:--body-super-comfortable) leading-[1.4]">Staking SODA</div>
          <div className="text-clay text-(length:--body-small) font-medium leading-[1.4] justify-center">
            {STAKING_APR}% variable APY
          </div>
        </div>
      )}

      <div className="w-60 pb-6 flex justify-between items-center mt-4">
        <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
          <CurrencyLogo currency={selectedToken} />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-espresso text-base leading-5">
                {formatTokenAmount(stakeValue, selectedToken.decimals)}
              </div>
              <div className="justify-start text-clay text-base leading-5">SODA</div>
            </div>
          </div>
        </div>
        <div className="w-16 h-9 inline-flex flex-col justify-between items-center">
          <div className="w-4 h-4 relative overflow-hidden">
            <CircleArrowRight
              className={cn(
                'w-4 h-4',
                selectedToken.xChainId === ETHEREUM_MAINNET_CHAIN_ID ? 'text-cherry-bright' : 'text-clay-light',
              )}
            />
          </div>
          <div
            className={cn(
              'justify-start text-xs leading-4',
              selectedToken.xChainId === ETHEREUM_MAINNET_CHAIN_ID ? 'text-cherry-bright' : 'text-clay',
            )}
          >
            {selectedToken.xChainId === ETHEREUM_MAINNET_CHAIN_ID
              ? ETHEREUM_ESTIMATED_TX_TIME
              : DEFAULT_ESTIMATED_TX_TIME}
          </div>
        </div>
        <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
          <CurrencyLogo currency={xSodaToken} />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-espresso text-base  leading-5">
                {formatTokenAmount(parseUnits(receivedXSodaAmount, 18), 18)}
              </div>
              <div className="justify-start text-clay text-base leading-5">xSODA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
