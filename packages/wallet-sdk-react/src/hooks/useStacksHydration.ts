import { useEffect } from 'react';
import type { ChainsConfig } from '../types/config.js';
import { type RpcConfig, STACKS_MAINNET_CHAIN_ID } from '@sodax/types';
import { StacksXService } from '../xchains/stacks/StacksXService.js';

/**
 * Hydrates Stacks network config when STACKS chain is enabled.
 *
 * Delegates to `StacksXService.getInstance`, which accepts a
 * `StacksNetworkName` preset (`'mainnet' | 'testnet' | 'devnet' | 'mocknet'`)
 * or a full `StacksNetwork` object. Re-runs on rpcConfig change.
 */
export function useStacksHydration(chains: ChainsConfig, rpcConfig: RpcConfig | undefined) {
  useEffect(() => {
    if (chains.STACKS) {
      StacksXService.getInstance(rpcConfig?.[STACKS_MAINNET_CHAIN_ID]);
    }
  }, [chains.STACKS, rpcConfig?.[STACKS_MAINNET_CHAIN_ID]]);
}
