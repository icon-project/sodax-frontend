import { createContext } from 'react';
import type { EvmHubProvider, Sodax } from '@sodax/sdk';
import type { RpcConfig } from '@/types';

export interface SodaxContextType {
  sodax: Sodax;
  testnet: boolean;
  hubProvider: EvmHubProvider | undefined;
  rpcConfig: RpcConfig;
}

export const SodaxContext = createContext<SodaxContextType | null>(null);
