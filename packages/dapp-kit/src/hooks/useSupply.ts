import type { EvmHubProvider, SpokeChainId } from '@new-world/sdk';
import {
  SpokeService,
  type IntentRelayRequest,
  type SubmitTxResponse,
  submitTransaction,
  getIntentRelayChainId,
} from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { getXChainType, useXAccount, xChainMap } from '@new-world/xwagmi';
import { useState } from 'react';
import type { Address } from 'viem';
import { parseUnits, TransactionExecutionError } from 'viem';
import { useHubProvider } from './useHubProvider';
import { useHubWalletAddress } from './useHubWalletAddress';
import { useSpokeProvider } from './useSpokeProvider';
import { useSodaxContext } from './useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';

interface UseSupplyReturn {
  supply: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

export function useSupply(token: XToken): UseSupplyReturn {
  const { address } = useXAccount(getXChainType(token.xChainId));
  const { sodax } = useSodaxContext();
  const hubProvider = useHubProvider();

  const spokeProvider = useSpokeProvider(token.xChainId);
  const chain = xChainMap[token.xChainId];
  const { data: hubWalletAddress } = useHubWalletAddress(
    token.xChainId as SpokeChainId,
    address,
    hubProvider as EvmHubProvider,
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const supply = async (amount: string): Promise<void> => {
    if (!hubWalletAddress) {
      setError(new Error('hubWalletAddress is not found'));
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
        hubWalletAddress as Address,
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
          chain_id: getIntentRelayChainId(token.xChainId as SpokeChainId).toString(),
          tx_hash: txHash,
        },
      } satisfies IntentRelayRequest<'submit'>;

      const response: SubmitTxResponse = await submitTransaction(
        request,
        chain.testnet ? XCALL_RELAY_URL.testnet : XCALL_RELAY_URL.mainnet,
      );

      console.log('Supply transaction submitted:', response);
    } catch (err) {
      // setError(err instanceof Error ? err : new Error('Failed to supply tokens'));
      if (err instanceof TransactionExecutionError) {
        setError(new Error(err.message));
      } else {
        setError(new Error('Failed to supply tokens'));
      }
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    supply,
    isLoading,
    error,
    resetError,
  };
}
