import type React from 'react';
import { UnstakeRequestItem } from './unstake-request-item';
import { Separator } from '@/components/ui/separator';
import { Fragment } from 'react';
import { useStakeState } from '../_stores/stake-store-provider';
import { useUnstakingInfoWithPenalty, useStakingConfig, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import NetworkIcon from '@/components/shared/network-icon';
import { AVALANCHE_MAINNET_CHAIN_ID } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import { Loader2 } from 'lucide-react';

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

  return (
    <>
      {requests.length > 0 && (
        <div className="w-full relative flex flex-col justify-start items-start gap-(--layout-space-normal)">
          <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-bold leading-5 flex gap-2 items-center">
            <div className="w-4 h-4 relative">
              <NetworkIcon id={selectedToken?.xChainId || AVALANCHE_MAINNET_CHAIN_ID} />
              <div className="w-2.5 h-2.5 left-[8px] top-[8px] absolute bg-green-500 rounded-full border-[1.50px] border-white" />
            </div>
            Unstaking to {chainIdToChainName(selectedToken?.xChainId || AVALANCHE_MAINNET_CHAIN_ID)}
          </div>

          <div className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)">
            {isLoadingUnstakingInfo && (
              <div className="w-full flex justify-center items-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
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
