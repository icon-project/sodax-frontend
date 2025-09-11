import type { ChainType } from '@sodax/types';
import type { XAccount } from '../types';

/**
 * Base class for wallet provider connectors that handles connection management and wallet interactions
 *
 * @abstract
 * @class XConnector
 * @property {ChainType} xChainType - The blockchain type this connector supports
 * @property {string} name - Display name of the wallet provider
 * @property {string} _id - Unique identifier for the connector
 * @property {string | undefined} _icon - Optional icon URL for the wallet provider
 */

export abstract class XConnector {
  /** The blockchain type this connector supports */
  public readonly xChainType: ChainType;

  /** Display name of the wallet provider */
  public readonly name: string;

  /** Unique identifier for the connector */
  private readonly _id: string;

  /** Optional icon URL for the wallet provider */
  private readonly _icon?: string;

  constructor(xChainType: ChainType, name: string, id: string) {
    this.xChainType = xChainType;
    this.name = name;
    this._id = id;
  }

  /**
   * Connects to the wallet provider
   * @returns Promise resolving to the connected account, or undefined if connection fails
   */
  abstract connect(): Promise<XAccount | undefined>;

  /**
   * Disconnects from the wallet provider
   */
  abstract disconnect(): Promise<void>;

  /** Get the unique identifier for this connector */
  public get id(): string {
    return this._id;
  }

  /** Get the optional icon URL for this wallet provider */
  public get icon(): string | undefined {
    return this._icon;
  }
}
