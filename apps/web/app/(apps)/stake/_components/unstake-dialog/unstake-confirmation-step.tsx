import type React from 'react';
import type { XToken } from '@sodax/types';
import { useStakeState } from '../../_stores/stake-store-provider';
import { UNSTAKE_METHOD } from '../../_stores/stake-store';
import CurrencyLogo from '@/components/shared/currency-logo';
import { CircleArrowRight, ShieldAlertIcon } from 'lucide-react';
import { cn, formatTokenAmount } from '@/lib/utils';
import { useStakingConfig } from '@sodax/dapp-kit';
import { ETHEREUM_MAINNET_CHAIN_ID } from '@sodax/sdk';
interface UnstakeConfirmationStepProps {
  selectedToken: XToken;
  receivedSodaAmount: string;
  unstakeError: { title: string; message: string } | null;
}

export default function UnstakeConfirmationStep({
  selectedToken,
  receivedSodaAmount,
  unstakeError,
}: UnstakeConfirmationStepProps): React.JSX.Element {
  const { stakeValue, unstakeMethod } = useStakeState();
  const { data: stakingConfig, isLoading: isLoadingStakingConfig } = useStakingConfig();
  if (isLoadingStakingConfig) {
    return <div>Loading staking config...</div>;
  }
  if (!stakingConfig) {
    return <div>No staking config found</div>;
  }

  const xSodaToken = {
    ...selectedToken,
    symbol: 'xsoda',
    xChainId: selectedToken.xChainId,
  };

  const formattedStakeValue = formatTokenAmount(stakeValue, 18);

  return (
    <div className="flex flex-col items-center mt-4">
      {unstakeError ? (
        <div className="flex flex-col text-center">
          <div className="flex justify-center gap-1 w-full items-center">
            <ShieldAlertIcon className="w-4 h-4 text-negative" />
            <span className="font-bold text-(length:--body-super-comfortable) leading-[1.4] text-negative">
              {unstakeError.title}
            </span>
          </div>
          <div className="text-espresso text-(length:--body-small) font-medium text-center leading-[1.4]">
            {unstakeError.message}
          </div>
        </div>
      ) : (
        <div className="flex flex-col text-center">
          <div className="text-espresso text-(length:--body-super-comfortable) font-bold ">
            {unstakeMethod === UNSTAKE_METHOD.INSTANT ? 'Instant unstake' : 'Unstaking'} xSODA
          </div>
          <div className="text-clay text-(length:--body-small) leading-[1.4] justify-center">
            {unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? 'Exit early to receive SODA immediately.'
              : 'You can change your mind later'}
          </div>
        </div>
      )}

      <div className="w-60 pb-6 flex justify-between items-center mt-4">
        <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
          <CurrencyLogo currency={xSodaToken} />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-espresso text-base leading-5">{formattedStakeValue}</div>
              <div className="justify-start text-clay text-base leading-5">xSODA</div>
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
            {unstakeMethod === UNSTAKE_METHOD.INSTANT
              ? selectedToken.xChainId === ETHEREUM_MAINNET_CHAIN_ID
                ? '~30s'
                : '~10s'
              : `~${stakingConfig.unstakingPeriod} s`}
          </div>
        </div>
        <div className="w-10 inline-flex flex-col justify-start items-center gap-2">
          <CurrencyLogo currency={selectedToken} />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-start text-espresso text-base leading-5">{receivedSodaAmount}</div>
              <div className="justify-start text-clay text-base leading-5">SODA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
