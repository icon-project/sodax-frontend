'use client';

import { useEffect } from 'react';
import type { ChainsConfig } from '../types/config';
import type { RpcConfig } from '@sodax/types';
import { createNetwork } from '@stacks/network';
import { StacksXService } from '../xchains/stacks/StacksXService';

/**
 * Hydrates Stacks network config when STACKS chain is enabled.
 */
export function useStacksHydration(chains: ChainsConfig, rpcConfig: RpcConfig | undefined) {
  useEffect(() => {
    if (chains.STACKS) {
      StacksXService.getInstance().network = createNetwork({
        network: 'mainnet',
        client: { baseUrl: rpcConfig?.stacks ?? 'https://api.mainnet.hiro.so' },
      });
    }
  }, [chains.STACKS, rpcConfig?.stacks]);
}
