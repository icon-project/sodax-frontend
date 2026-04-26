import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { IStellarWalletProvider, StellarChainKey } from '@sodax/types';
import { useSodaxContext } from './useSodaxContext.js';

export function useRequestTrustline(token: string | undefined): {
  requestTrustline: (params: {
    token: string;
    amount: bigint;
    srcChainKey: StellarChainKey;
    walletProvider: IStellarWalletProvider;
  }) => Promise<string>;
  isLoading: boolean;
  isRequested: boolean;
  error: Error | null;
  data: string | null;
} {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRequested, setIsRequested] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<string | null>(null);

  const requestTrustline = useCallback(
    async ({
      token,
      amount,
      srcChainKey,
      walletProvider,
    }: {
      token: string;
      amount: bigint;
      srcChainKey: StellarChainKey;
      walletProvider: IStellarWalletProvider;
    }): Promise<string> => {
      if (!token || !amount) {
        const error = new Error('Token and amount are required');
        setError(error);
        throw error;
      }
      setIsLoading(true);
      setError(null);
      try {
        const srcAddress = await walletProvider.getWalletAddress();
        const result = await sodax.spokeService.stellarSpokeService.requestTrustline<false>({
          raw: false,
          srcChainKey,
          srcAddress,
          token,
          amount,
          walletProvider,
        });
        setData(result);
        setIsRequested(true);
        queryClient.invalidateQueries({ queryKey: ['stellar-trustline-check', token] });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient, sodax],
  );

  return { requestTrustline, isLoading, isRequested, error, data };
}
