// apps/demo/src/hooks/useSodaBalance.ts
import { useSodaxContext, useXBalances } from '@sodax/dapp-kit';
import type { SpokeChainKey } from '@sodax/types';
import { getXChainType, useXService } from '@sodax/wallet-sdk-react';

/**
 * Hook for getting the SODA token balance of the connected wallet on a specific chain. Wraps
 * `useXBalances` and looks up the SODA token via `sodax.config.findSupportedTokenBySymbol`.
 */
export function useSodaBalance(chainKey: SpokeChainKey, userAddress: string | undefined): bigint | undefined {
  const { sodax } = useSodaxContext();
  const sodaToken = sodax.config.findSupportedTokenBySymbol(chainKey, 'SODA');
  const xService = useXService(getXChainType(chainKey));

  const { data: balances } = useXBalances({
    xService,
    xChainId: chainKey,
    xTokens: sodaToken ? [sodaToken] : [],
    address: userAddress,
  });

  return sodaToken ? balances?.[sodaToken.address] : undefined;
}
