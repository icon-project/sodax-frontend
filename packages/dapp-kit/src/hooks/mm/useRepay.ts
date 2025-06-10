import type { EvmHubProvider, SpokeChainId } from '@sodax/sdk';
import {
  SpokeService,
  type IntentRelayRequest,
  type SubmitTxResponse,
  submitTransaction,
  getIntentRelayChainId,
} from '@sodax/sdk';
import type { XChainId, XToken } from '@sodax/xwagmi';
import { getXChainType, useXAccount, xChainMap } from '@sodax/xwagmi';
import { useState } from 'react';
import type { Address, Hex } from 'viem';
import { parseUnits } from 'viem';
import { useHubProvider } from '../provider/useHubProvider';
import { useHubWalletAddress } from '../mm/useHubWalletAddress';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';

interface UseRepayReturn {
  repay: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for repaying borrowed tokens to the Sodax money market.
 *
 * This hook provides functionality to repay borrowed tokens back to the money market protocol,
 * handling the entire repayment process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @param hubToken - The hub token to repay. Must be an XToken with valid address and chain information.
 * @param spokeChainId - The chain ID where the repayment will be initiated from.
 *
 * @returns {UseRepayReturn} An object containing:
 *   - repay: Function to execute the repayment transaction
 *   - isLoading: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *   - resetError: Function to clear any existing error
 *
 * @example
 * ```typescript
 * const { repay, isLoading, error } = useRepay(hubToken, spokeChainId);
 *
 * // Repay 100 tokens
 * await repay('100');
 * ```
 *
 * @throws {Error} When:
 *   - hubWalletAddress is not found
 *   - spokeProvider is not available
 *   - hubProvider is not available
 *   - Transaction execution fails
 */
export function useRepay(hubToken: XToken, spokeChainId: XChainId): UseRepayReturn {
  const { address } = useXAccount(getXChainType(spokeChainId));
  const { sodax } = useSodaxContext();
  const hubProvider = useHubProvider();
  const spokeProvider = useSpokeProvider(spokeChainId as SpokeChainId);
  const chain = xChainMap[spokeChainId];
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
        hubToken.address,
        hubWalletAddress as Address,
        parseUnits(amount, hubToken.decimals),
        spokeProvider.chainConfig.chain.id,
      );

      const txHash = await SpokeService.deposit(
        {
          from: address as `0x${string}`,
          token: hubToken.address as `0x${string}`,
          amount: parseUnits(amount, hubToken.decimals),
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
