'use client';

import { createContext, useContext } from 'react';
import type { ChainType } from '@sodax/types';
import type { XAccount, XConnection } from '../types';
import type { IXConnector } from '../types/interfaces';

export type ChainActions = {
  connect: (xConnectorId: string) => Promise<XAccount | undefined>;
  disconnect: () => Promise<void>;
  getConnectors: () => IXConnector[];
  getConnection: () => XConnection | undefined;
  signMessage?: (message: string) => Promise<string>;
};

export type ChainActionsRegistry = Partial<Record<ChainType, ChainActions>>;

const ChainActionsContext = createContext<ChainActionsRegistry>({});

export const ChainActionsProvider = ChainActionsContext.Provider;

export function useChainActions(chainType: ChainType): ChainActions | undefined {
  const registry = useContext(ChainActionsContext);
  return registry[chainType];
}

export function useChainActionsRegistry(): ChainActionsRegistry {
  return useContext(ChainActionsContext);
}
