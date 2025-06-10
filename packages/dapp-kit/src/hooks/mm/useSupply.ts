import type { EvmHubProvider, SpokeChainId } from '@sodax/sdk';
import {
  SpokeService,
  type IntentRelayRequest,
  type SubmitTxResponse,
  submitTransaction,
  getIntentRelayChainId,
} from '@sodax/sdk';
import type { XToken } from '@sodax/wallet-sdk';
import { getXChainType, useXAccount, xChainMap } from '@sodax/wallet-sdk';
import { useState } from 'react';
import type { Address } from 'viem';
import { parseUnits, TransactionExecutionError } from 'viem';
import { useHubProvider } from '../provider/useHubProvider';
import { useHubWalletAddress } from '../mm/useHubWalletAddress';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';

interface UseSupplyReturn {
  supply: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for supplying tokens to the Sodax money market.
 *
 * This hook provides functionality to supply tokens to the money market protocol,
 * handling the entire supply process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @param {XToken} spokeToken - The token to supply on the spoke chain. Must be an XToken with valid address and chain information.
 *
 * @returns {UseSupplyReturn} An object containing:
 *   - supply: Function to execute the supply transaction
 *   - isLoading: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *   - resetError: Function to clear any existing error
 *
 * @example
 * ```typescript
 * const { supply, isLoading, error } = useSupply(spokeToken);
 *
 * // Supply 100 tokens
 * await supply('100');
 * ```
 *
 * @throws {Error} When:
 *   - hubWalletAddress is not found
 *   - spokeProvider is not available
 *   - hubProvider is not available
 *   - Transaction execution fails
 */
export function useSupply(spokeToken: XToken): UseSupplyReturn {
  const { address } = useXAccount(getXChainType(spokeToken.xChainId));
  const { sodax } = useSodaxContext();
  const hubProvider = useHubProvider();

  const spokeProvider = useSpokeProvider(spokeToken.xChainId as SpokeChainId);
  const chain = xChainMap[spokeToken.xChainId];
  const { data: hubWalletAddress } = useHubWalletAddress(
    spokeToken.xChainId as SpokeChainId,
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
        spokeToken.address,
        hubWalletAddress as Address,
        parseUnits(amount, spokeToken.decimals),
        spokeToken.xChainId as SpokeChainId,
      );

      const txHash = await SpokeService.deposit(
        {
          from: address as `0x${string}`,
          token: spokeToken.address as `0x${string}`,
          amount: parseUnits(amount, spokeToken.decimals),
          data,
        },
        spokeProvider,
        hubProvider,
      );

      const request = {
        action: 'submit',
        params: {
          chain_id: getIntentRelayChainId(spokeToken.xChainId as SpokeChainId).toString(),
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
