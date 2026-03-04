import type { ChainType, XToken } from '@sodax/types';
import type { XConnector } from './XConnector';

/**
 * Abstract base class for blockchain service implementations.
 *
 * The XService class serves as a foundation for implementing blockchain-specific services
 * in a multi-chain environment. It provides a standardized interface for:
 * 1. Managing wallet connectors for different blockchain types
 * 2. Querying token balances across different chains
 *
 * Each blockchain implementation (e.g., Solana, EVM chains) extends this class
 * to provide chain-specific functionality while maintaining a consistent interface.
 *
 * @abstract
 * @class XService
 * @property {ChainType} xChainType - The blockchain type this service handles (e.g., 'SOLANA', 'EVM')
 * @property {XConnector[]} xConnectors - Available wallet connectors for this chain
 *
 */
export abstract class XService {
  /** The blockchain type this service handles */
  public readonly xChainType: ChainType;

  /** Available wallet connectors for this chain */
  private xConnectors: XConnector[] = [];

  constructor(xChainType: ChainType) {
    this.xChainType = xChainType;
  }

  /**
   * Gets the balance of a specific token for an address
   * @param address The wallet address to check
   * @param xToken The token to get the balance for
   * @returns Promise resolving to the token balance as a bigint
   */
  public async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    return 0n;
  }

  /**
   * Gets balances for multiple tokens for an address
   * @param address The wallet address to check
   * @param xTokens Array of tokens to get balances for
   * @returns Promise resolving to object mapping token addresses to balances
   */
  public async getBalances(address: string | undefined, xTokens: readonly XToken[]): Promise<Record<string, bigint>> {
    if (!address) return {};

    const balancePromises = xTokens.map(async xToken => {
      const balance = await this.getBalance(address, xToken);
      return { address: xToken.address, balance };
    });

    const balances = await Promise.all(balancePromises);
    return balances.reduce<Record<string, bigint>>((acc, { address, balance }) => {
      acc[address] = balance;
      return acc;
    }, {});
  }

  /**
   * Gets all available connectors for this chain
   */
  public getXConnectors(): XConnector[] {
    return this.xConnectors;
  }

  /**
   * Sets the available connectors for this chain
   */
  public setXConnectors(xConnectors: XConnector[]): void {
    this.xConnectors = xConnectors;
  }

  /**
   * Gets a specific connector by its ID
   * @param xConnectorId The connector ID to look up
   * @returns The matching connector or undefined if not found
   */
  public getXConnectorById(xConnectorId: string): XConnector | undefined {
    return this.getXConnectors().find(xConnector => xConnector.id === xConnectorId);
  }
}
