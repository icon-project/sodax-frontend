import { createContext } from 'react';
import type { EvmHubProvider, Sodax } from '@sodax/sdk';

export interface SodaxContextType {
  sodax: Sodax;
  testnet: boolean;
  hubProvider: EvmHubProvider | undefined;
}

export const SodaxContext = createContext<SodaxContextType | null>(null);
