import { useEffect } from 'react';
import type { ChainsConfig } from '../types/config.js';
import { ChainKeys, type RpcConfig } from '@sodax/types';
import { createNetwork } from '@stacks/network';
import { StacksXService } from '../xchains/stacks/StacksXService.js';
import { STACKS_DEFAULT_NETWORK, STACKS_DEFAULT_RPC_URL } from '../constants.js';

/**
 * Hydrates Stacks network config when STACKS chain is enabled.
 */
export function useStacksHydration(chains: ChainsConfig, rpcConfig: RpcConfig | undefined) {
  const stacksRpc = rpcConfig?.[ChainKeys.STACKS_MAINNET] as string | undefined;
  useEffect(() => {
    if (chains.STACKS) {
      StacksXService.getInstance().network = createNetwork({
        network: STACKS_DEFAULT_NETWORK,
        client: { baseUrl: stacksRpc ?? STACKS_DEFAULT_RPC_URL },
      });
    }
  }, [chains.STACKS, stacksRpc]);
}
