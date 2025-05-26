import type { EvmHubProvider, SpokeChainId } from '@new-world/sdk';
import { SpokeService, type IntentRelayRequest, type SubmitTxResponse, submitTransaction } from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { getXChainType, useXAccount } from '@new-world/xwagmi';
import { useState } from 'react';
import type { Address } from 'viem';
import { parseUnits } from 'viem';
import { useHubProvider } from './useHubProvider';
import { useHubWallet } from './useHubWallet';
import { useSpokeProvider } from './useSpokeProvider';
import { useSodaxContext } from './useSodaxContext';

interface UseSupplyReturn {
  supply: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useSupply(token: XToken): UseSupplyReturn {
  const { address } = useXAccount(getXChainType(token.xChainId));
  const { sodax } = useSodaxContext();
  const hubProvider = useHubProvider();

  const spokeProvider = useSpokeProvider(token.xChainId);

  const { data: hubWallet } = useHubWallet(token.xChainId, address, hubProvider as EvmHubProvider);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const supply = async (amount: string): Promise<void> => {
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
      const data = sodax.moneyMarket.supplyData(
        token.address,
        hubWallet as Address,
        parseUnits(amount, token.decimals),
        token.xChainId as SpokeChainId,
      );

      const txHash = await SpokeService.deposit(
        {
          from: address as `0x${string}`,
          token: token.address as `0x${string}`,
          amount: parseUnits(amount, token.decimals),
          data,
        },
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

      console.log('Supply transaction submitted:', response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to supply tokens'));
      console.error('Error supplying tokens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    supply,
    isLoading,
    error,
  };
}
