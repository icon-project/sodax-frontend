import { createContext } from 'react';
import type { Sodax } from '@sodax/sdk';
import type { RpcConfig } from '@sodax/types';

export interface SodaxContextType {
  sodax: Sodax;
  testnet: boolean;
  rpcConfig: RpcConfig;
}

export const SodaxContext = createContext<SodaxContextType | null>(null);
