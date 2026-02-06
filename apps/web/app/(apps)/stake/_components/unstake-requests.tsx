import type React from 'react';
import { UnstakeRequestItem } from './unstake-request-item';
import { Separator } from '@/components/ui/separator';
import { Fragment } from 'react';
import { useStakeState } from '../_stores/stake-store-provider';
import { useUnstakingInfoWithPenalty, useStakingConfig, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';

export function UnstakeRequests(): React.JSX.Element {
  const { selectedToken } = useStakeState();
  const currentNetwork = selectedToken?.xChainId;
  const { address } = useXAccount(currentNetwork);
  const walletProvider = useWalletProvider(currentNetwork);
  const spokeProvider = useSpokeProvider(currentNetwork, walletProvider);

  const { data: unstakingInfoWithPenalty, isLoading: isLoadingUnstakingInfo } = useUnstakingInfoWithPenalty(
    address,
    spokeProvider,
  );
  const { data: stakingConfig } = useStakingConfig();

  const requests = unstakingInfoWithPenalty?.requestsWithPenalty ?? [];

  if (isLoadingUnstakingInfo && requests.length > 0) {
    return (
      <div className="w-full relative flex flex-col justify-start items-start gap-(--layout-space-normal)">
        <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-bold font-['Inter'] leading-5">
          Unstake Requests
        </div>
        <div className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)">
          <div className="text-clay text-(length:--body-small) font-normal font-['Inter'] leading-4">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {requests.length > 0 && (
        <div className="w-full relative flex flex-col justify-start items-start gap-(--layout-space-normal)">
          <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-['InterBold'] leading-5">
            Unstake Requests
          </div>

          <div className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)">
            {requests.map((request, index) => (
              <Fragment key={request.id.toString()}>
                <UnstakeRequestItem request={request} stakingConfig={stakingConfig} spokeProvider={spokeProvider} />
                {index !== requests.length - 1 && <Separator className="w-full h-0.5" />}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
