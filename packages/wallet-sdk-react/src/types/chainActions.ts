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
