import type { ChainType, IXService as IXServiceBase } from '@sodax/types';
import type { XAccount } from './index.js';

/**
 * Public interface for chain service implementations.
 *
 * Consumer code should depend on this interface instead of the concrete XService class.
 * Extends the shared `IXService` contract from `@sodax/types` with wallet-sdk-react
 * specific connector methods.
 */
export interface IXService extends IXServiceBase {
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
