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
 *
 * `isInstalled` reads `window.*` at getter-call time (render time); no extra
 * subscription is installed. Components get fresh values through normal React
 * render triggers (store updates, parent rerenders).
 */
export interface IXConnector {
  readonly xChainType: ChainType;
  readonly name: string;
  readonly id: string;
  readonly icon: string | undefined;

  /** True when the wallet extension backing this connector is installed. */
  readonly isInstalled: boolean;
  /** URL where users can install the wallet extension if missing. */
  readonly installUrl?: string;

  connect(): Promise<XAccount | undefined>;
  disconnect(): Promise<void>;
}
