import { useMemo } from 'react';

import type { ChainType } from '@sodax/types';

import type { XAccount } from '../types';
import { useXConnection } from './useXConnection';

export function useXAccount(xChainType: ChainType | undefined): XAccount {
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
