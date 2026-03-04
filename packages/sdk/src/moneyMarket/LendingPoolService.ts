import { getMoneyMarketConfig, type Address } from '@sodax/types';
import type { EvmHubProvider } from '../shared/entities/Providers.js';
import { poolAbi } from '../shared/abis/pool.abi.js';
import type { ReserveDataLegacy } from './MoneyMarketTypes.js';

export class LendingPoolService {
  private readonly hubProvider: EvmHubProvider;
  private readonly lendingPool: Address;

  constructor(hubProvider: EvmHubProvider) {
    this.hubProvider = hubProvider;
    this.lendingPool = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).lendingPool;
  }

  /**
   * Get the list of all reserves in the lending pool
   * @returns {Promise<readonly Address[]>} - Array of reserve addresses
   */
  async getReservesList(): Promise<readonly Address[]> {
    return this.hubProvider.publicClient.readContract({
      address: this.lendingPool,
      abi: poolAbi,
      functionName: 'getReservesList',
      args: [],
    });
  }

  /**
   * Get detailed data for a reserve in the pool
   * @param assetAddress - The address of the asset
   * @returns {Promise<ReserveDataLegacy>} - Reserve data
   */
  async getReserveData(assetAddress: Address): Promise<ReserveDataLegacy> {
    return this.hubProvider.publicClient.readContract({
      address: this.lendingPool,
      abi: poolAbi,
      functionName: 'getReserveData',
      args: [assetAddress],
    });
  }

  /**
   * Get the normalized income for a reserve
   * @param asset - The address of the asset
   * @returns {Promise<bigint>} - Normalized income
   */
  async getReserveNormalizedIncome(asset: Address): Promise<bigint> {
    return this.hubProvider.publicClient.readContract({
      address: this.lendingPool,
      abi: poolAbi,
      functionName: 'getReserveNormalizedIncome',
      args: [asset],
    });
  }
}
