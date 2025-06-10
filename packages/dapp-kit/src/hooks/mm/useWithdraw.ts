import type { EvmHubProvider, SpokeChainId } from '@sodax/sdk';
import {
  SpokeService,
  type IntentRelayRequest,
  type SubmitTxResponse,
  submitTransaction,
  getIntentRelayChainId,
} from '@sodax/sdk';
import type { XChainId, XToken } from '@sodax/wallet-sdk';
import { useXAccount, xChainMap } from '@sodax/wallet-sdk';
import { useState } from 'react';
import type { Address, Hash, Hex } from 'viem';
import { parseUnits } from 'viem';
import { useHubProvider } from '../provider/useHubProvider';
import { useHubWalletAddress } from '../mm/useHubWalletAddress';
import { useSpokeProvider } from '../provider/useSpokeProvider';
import { useSodaxContext } from '../shared/useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';
import { getSpokeTokenAddressByVault } from '@/core';

interface UseWithdrawReturn {
  withdraw: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for withdrawing supplied tokens from the Sodax money market.
 *
 * This hook provides functionality to withdraw previously supplied tokens from the money market protocol,
 * handling the entire withdrawal process including transaction creation, submission,
 * and cross-chain communication.
 *
 * @param token - The hub token to withdraw. Must be an XToken with valid address and chain information.
 * @param spokeChainId - The chain ID where the withdrawal will be initiated from.
 *
 * @returns {UseWithdrawReturn} An object containing:
 *   - withdraw: Function to execute the withdrawal transaction
 *   - isLoading: Boolean indicating if a transaction is in progress
 *   - error: Error object if the last transaction failed, null otherwise
 *   - resetError: Function to clear any existing error
 *
 * @example
 * ```typescript
 * const { withdraw, isLoading, error } = useWithdraw(hubToken, spokeChainId);
 *
 * // Withdraw 100 tokens
 * await withdraw('100');
 * ```
 *
 * @throws {Error} When:
 *   - hubWalletAddress is not found
 *   - spokeProvider is not available
 *   - hubProvider is not available
 *   - Transaction execution fails
 */

export function useWithdraw(hubToken: XToken, spokeChainId: XChainId): UseWithdrawReturn {
  const { address } = useXAccount(spokeChainId as SpokeChainId);
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

  const withdraw = async (amount: string): Promise<void> => {
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
      const data: Hex = sodax.moneyMarket.withdrawData(
        hubWalletAddress as Address,
        spokeProvider.walletProvider.getWalletAddress(),
        getSpokeTokenAddressByVault(spokeChainId, hubToken.address),
        parseUnits(amount, hubToken.decimals),
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
    withdraw,
    isLoading,
    error,
    resetError,
  };
}
