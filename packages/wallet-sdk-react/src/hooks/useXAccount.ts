import { useMemo } from 'react';

import type { ChainId, ChainType } from '@sodax/types';

import type { XAccount } from '../types';
import { useXConnection } from './useXConnection';
import { getXChainType } from '../actions';

/**
 * Hook to get the current connected account for a specific blockchain
 *
 * @param chainIdentifier - The blockchain identifier (either chain type like 'EVM' or chain ID like '0xa86a.avax')
 * @returns {XAccount} The current connected account, or undefined if no account is connected
 *
 * @example
 * ```ts
 * // Using ChainType (preferred)
 * const { address } = useXAccount('EVM');
 *
 * // Using ChainId
 * const { address } = useXAccount('0xa86a.avax');
 *
 * // Returns: { address: string | undefined, xChainType: ChainType | undefined }
 * ```
 */
function isChainType(chainIdentifier: ChainType | ChainId): chainIdentifier is ChainType {
  return ['ICON', 'EVM', 'INJECTIVE', 'SUI', 'STELLAR', 'SOLANA'].includes(chainIdentifier);
}

export function useXAccount(chainIdentifier?: ChainType | ChainId): XAccount {
  const resolvedChainType: ChainType | undefined = chainIdentifier
    ? isChainType(chainIdentifier)
      ? chainIdentifier
      : getXChainType(chainIdentifier as ChainId)
    : undefined;

  const xConnection = useXConnection(resolvedChainType);

  const xAccount = useMemo((): XAccount => {
    if (!resolvedChainType) {
      return {
        address: undefined,
        xChainType: undefined,
      };
    }

    return xConnection?.xAccount || { address: undefined, xChainType: resolvedChainType };
  }, [resolvedChainType, xConnection]);

  return xAccount;
}
