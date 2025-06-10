import type { EvmHubProvider, SpokeChainId } from '@sodax/sdk';
import {
  SpokeService,
  type IntentRelayRequest,
  type SubmitTxResponse,
  submitTransaction,
  getIntentRelayChainId,
} from '@sodax/sdk';
import type { XChainId, XToken } from '@sodax/wallet-sdk';
import { getXChainType, useXAccount, xChainMap } from '@sodax/wallet-sdk';
import { useState } from 'react';
import type { Address, Hash, Hex } from 'viem';
import { parseUnits } from 'viem';
import { useHubProvider } from '../provider/useHubProvider';
import { useHubWalletAddress } from '../mm/useHubWalletAddress';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';

interface UseBorrowReturn {
  borrow: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for borrowing tokens from the Sodax money market.
 *
 * This hook provides functionality to borrow tokens from the money market protocol,
 * handling the entire borrow process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @param hubToken - The hub token to borrow. Must be an XToken with valid address and chain information.
 * @param spokeChainId - The chain ID where the borrowed tokens will be received.
 *
 * @returns {UseBorrowReturn} An object containing:
 *   - borrow: Function to execute the borrow transaction
 *   - isLoading: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *   - resetError: Function to clear any existing error
 *
 * @example
 * ```typescript
 * const { borrow, isLoading, error } = useBorrow(hubToken, spokeChainId);
 *
 * // Borrow 100 tokens
 * await borrow('100');
 * ```
 *
 * @throws {Error} When:
 *   - hubWalletAddress is not found
 *   - spokeProvider is not available
 *   - hubProvider is not available
 *   - Transaction execution fails
 */

export function useBorrow(hubToken: XToken, spokeChainId: XChainId): UseBorrowReturn {
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

  const borrow = async (amount: string): Promise<void> => {
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
      const data: Hex = sodax.moneyMarket.borrowData(
        hubWalletAddress as Address,
        spokeProvider.walletProvider.getWalletAddress(),
        hubToken.address,
        parseUnits(amount, hubToken.decimals),
        spokeProvider.chainConfig.chain.id,
      );

      const txHash: Hash = await SpokeService.callWallet(hubWalletAddress as Address, data, spokeProvider, hubProvider);

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

      console.log('Borrow transaction submitted:', response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to borrow tokens'));
      console.error('Error borrowing tokens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    borrow,
    isLoading,
    error,
    resetError,
  };
}
