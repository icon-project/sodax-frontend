import type { ChainType, XToken } from '@sodax/types';
import type { XAccount } from './index.js';

/**
 * Public interface for chain service implementations.
 * Consumer code should depend on this interface instead of the concrete XService class.
 */
export interface IXService {
  readonly xChainType: ChainType;

  getBalance(address: string | undefined, xToken: XToken): Promise<bigint>;
  getBalances(address: string | undefined, xTokens: readonly XToken[]): Promise<Record<string, bigint>>;
  getXConnectors(): IXConnector[];
  getXConnectorById(xConnectorId: string): IXConnector | undefined;
}

/**
 * Public interface for wallet connector implementations.
 * Consumer code should depend on this interface instead of the concrete XConnector class.
 */
export interface IXConnector {
  readonly xChainType: ChainType;
  readonly name: string;
  readonly id: string;
  readonly icon: string | undefined;

  connect(): Promise<XAccount | undefined>;
  disconnect(): Promise<void>;
}
