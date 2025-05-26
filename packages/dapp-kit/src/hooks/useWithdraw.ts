import { sodax } from '@/core';
import type { EvmHubProvider, SpokeChainId } from '@new-world/sdk';
import { SpokeService, type IntentRelayRequest, type SubmitTxResponse, submitTransaction } from '@new-world/sdk';
import type { XChainId, XToken } from '@new-world/xwagmi';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useState } from 'react';
import type { Address, Hash, Hex } from 'viem';
import { parseUnits } from 'viem';
import { useHubProvider } from './useHubProvider';
import { useHubWallet } from './useHubWallet';
import { useSpokeProvider } from './useSpokeProvider';

interface UseWithdrawReturn {
  withdraw: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useWithdraw(token: XToken, spokeChainId: XChainId): UseWithdrawReturn {
  const { address } = useXAccount(getXChainType(token.xChainId));

  const hubProvider = useHubProvider('sonic-blaze');
  const spokeProvider = useSpokeProvider(spokeChainId);
  const { data: hubWallet } = useHubWallet(spokeChainId, address, hubProvider as EvmHubProvider);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = async (amount: string): Promise<void> => {
    if (!hubWallet) {
      setError(new Error('hubWallet is not found'));
      return;
    }
    if (!spokeProvider) {
      setError(new Error('spokeProvider is not found'));
      return;
    }
    if (!hubProvider) {
      setError(new Error('hubProvider is not found'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: Hex = sodax.moneyMarket.withdrawData(
        hubWallet as Address,
        spokeProvider.walletProvider.getWalletAddress(),
        '0x0000000000000000000000000000000000000000',
        parseUnits(amount, token.decimals),
        spokeProvider.chainConfig.chain.id,
      );

      const txHash: Hash = await SpokeService.callWallet(
        spokeProvider.walletProvider.getWalletAddress(),
        data,
        spokeProvider,
        hubProvider,
      );

      const request = {
        action: 'submit',
        params: {
          chain_id: '6',
          tx_hash: txHash,
        },
      } satisfies IntentRelayRequest<'submit'>;

      // TODO: use the correct endpoint
      const response: SubmitTxResponse = await submitTransaction(
        request,
        'https://53naa6u2qd.execute-api.us-east-1.amazonaws.com/prod',
      );

      console.log('Withdraw transaction submitted:', response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to withdraw tokens'));
      console.error('Error withdrawing tokens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    withdraw,
    isLoading,
    error,
  };
}
