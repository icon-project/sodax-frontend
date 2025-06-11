import type { EvmHubProvider, SpokeChainId } from '@sodax/sdk';
import {
  SpokeService,
  type IntentRelayRequest,
  type SubmitTxResponse,
  submitTransaction,
  getIntentRelayChainId,
} from '@sodax/sdk';
import type { XChainId, XToken } from '@sodax/types';
import { getXChainType, useXAccount, xChainMap } from '@sodax/wallet-sdk';
import { useState } from 'react';
import type { Address, Hex } from 'viem';
import { parseUnits } from 'viem';
import { useHubProvider } from './useHubProvider';
import { useHubWalletAddress } from './useHubWalletAddress';
import { useSpokeProvider } from './useSpokeProvider';
import { useSodaxContext } from './useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';

interface UseRepayReturn {
  repay: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

// token: this is hub token
export function useRepay(token: XToken, spokeChainId: XChainId): UseRepayReturn {
  const { address } = useXAccount(getXChainType(token.xChainId));
  const { sodax } = useSodaxContext();
  const hubProvider = useHubProvider();
  const spokeProvider = useSpokeProvider(spokeChainId as SpokeChainId);
  const chain = xChainMap[token.xChainId];
  const { data: hubWalletAddress } = useHubWalletAddress(
    spokeChainId as SpokeChainId,
    address,
    hubProvider as EvmHubProvider,
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const repay = async (amount: string): Promise<void> => {
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
      const data: Hex = sodax.moneyMarket.repayData(
        token.address,
        hubWalletAddress as Address,
        parseUnits(amount, token.decimals),
        spokeProvider.chainConfig.chain.id,
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
          chain_id: getIntentRelayChainId(spokeChainId as SpokeChainId).toString(),
          tx_hash: txHash,
        },
      } satisfies IntentRelayRequest<'submit'>;

      const response: SubmitTxResponse = await submitTransaction(
        request,
        chain.testnet ? XCALL_RELAY_URL.testnet : XCALL_RELAY_URL.mainnet,
      );

      console.log('Withdraw transaction submitted:', response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to withdraw tokens'));
      console.error('Error withdrawing tokens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    repay,
    isLoading,
    error,
    resetError,
  };
}
