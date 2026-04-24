import { useEffect } from 'react';
import type { ChainsConfig } from '../types/config.js';
import { ChainKeys, type RpcConfig } from '@sodax/types';
import { StacksXService } from '../xchains/stacks/StacksXService.js';

/**
 * Hydrates Stacks network config when STACKS chain is enabled.
 *
 * Delegates to `StacksXService.getInstance`, which accepts a
 * `StacksNetworkName` preset (`'mainnet' | 'testnet' | 'devnet' | 'mocknet'`)
 * or a full `StacksNetwork` object. Re-runs on rpcConfig change.
 */
export function useStacksHydration(chains: ChainsConfig, rpcConfig: RpcConfig | undefined) {
  const stacksRpc = rpcConfig?.[ChainKeys.STACKS_MAINNET];
  useEffect(() => {
    if (chains.STACKS) {
      StacksXService.getInstance(stacksRpc);
    }
  }, [chains.STACKS, stacksRpc]);
}
