import type { ChainType, IXServiceBase } from '@sodax/types';
import type { XAccount } from './index.js';

/**
 * Public interface for chain service implementations.
 *
 * Consumer code should depend on this interface instead of the concrete XService class.
 * Extends the shared `IXServiceBase` from `@sodax/types` with wallet-sdk-react
 * specific connector methods.
 */
export interface IXService extends IXServiceBase {
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
  /** Unique identifier for the connector */
  readonly _id: string;

  /** Optional icon URL for the wallet provider */
  readonly _icon?: string;

  // public getters for id and icon
  readonly id: string;
  readonly icon: string | undefined;

  /** True when the wallet extension backing this connector is installed. */
  readonly isInstalled: boolean;
  /** URL where users can install the wallet extension if missing. */
  readonly installUrl?: string;

  connect(): Promise<XAccount | undefined>;
  disconnect(): Promise<void>;
}
