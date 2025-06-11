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
import { useHubProvider } from './useHubProvider';
import { useHubWalletAddress } from './useHubWalletAddress';
import { useSpokeProvider } from './useSpokeProvider';
import { useSodaxContext } from './useSodaxContext';
import { XCALL_RELAY_URL } from '@/constants';
import { getSpokeTokenAddressByVault } from '@/core';

interface UseWithdrawReturn {
  withdraw: (amount: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

// token: this is hub token
export function useWithdraw(token: XToken, spokeChainId: XChainId): UseWithdrawReturn {
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
        getSpokeTokenAddressByVault(spokeChainId, token.address),
        parseUnits(amount, token.decimals),
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
