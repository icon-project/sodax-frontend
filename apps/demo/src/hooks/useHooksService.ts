import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { HooksService } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

export function useHooksService() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const hooksService = useMemo(() => {
    if (!publicClient) return null;
    return new HooksService({
      publicClient,
      walletClient: walletClient ?? undefined,
      chainId: SONIC_MAINNET_CHAIN_ID,
    });
  }, [publicClient, walletClient]);

  return { hooksService, isReady: !!publicClient && !!walletClient };
}
