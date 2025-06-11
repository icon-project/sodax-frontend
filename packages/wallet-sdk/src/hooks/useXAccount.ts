import { useMemo } from 'react';

import type { XChainType } from '@/types';

import type { XAccount } from '../types';
import { useXConnection } from './useXConnection';

/**
 * Hook to get the current connected account for a specific blockchain type
 *
 * @param xChainType - The blockchain type to get the account for (e.g. 'EVM', 'SUI', 'SOLANA')
 * @returns {XAccount} The current connected account, or undefined if no account is connected
 *
 * @example
 * ```ts
 * const { address } = useXAccount('EVM');
 * // Returns: { address: string | undefined, xChainType: XChainType | undefined }
 * ```
 */
export function useXAccount(xChainType: XChainType | undefined): XAccount {
  const xConnection = useXConnection(xChainType);

  const xAccount = useMemo((): XAccount => {
    if (!xChainType) {
      return {
        address: undefined,
        xChainType: undefined,
      };
    }

    return xConnection?.xAccount || { address: undefined, xChainType };
  }, [xChainType, xConnection]);

  return xAccount;
}
