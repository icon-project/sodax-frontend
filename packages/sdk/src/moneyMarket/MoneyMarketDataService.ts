import type { EvmHubProvider, SpokeProvider } from '../shared/entities/Providers.js';
import type {
  AggregatedReserveData,
  BaseCurrencyInfo,
  EModeData,
  EmodeDataHumanized,
  ReservesDataHumanized,
  UserReserveData,
  UserReserveDataHumanized,
  ReserveDataLegacy,
  ReserveDataHumanized,
} from './MoneyMarketTypes.js';
import {
  formatReserves,
  formatReserveUSD,
  formatUserSummary,
  type FormatReservesUSDRequest,
  type FormatReserveUSDRequest,
  type FormatReserveUSDResponse,
  type FormatUserSummaryRequest,
  type FormatUserSummaryResponse,
  type ReserveData,
  type ReserveDataWithPrice,
} from './math-utils/index.js';
import { UiPoolDataProviderService } from './UiPoolDataProviderService.js';
import { LendingPoolService } from './LendingPoolService.js';
import type { Address, Erc20Token } from '@sodax/types';
import { Erc20Service, HubService } from '../shared/index.js';
import { erc20Abi } from 'viem';

export class MoneyMarketDataService {
  public readonly uiPoolDataProviderService: UiPoolDataProviderService;
  public readonly lendingPoolService: LendingPoolService;
  public readonly hubProvider: EvmHubProvider;

  constructor(hubProvider: EvmHubProvider) {
    this.hubProvider = hubProvider;
    this.uiPoolDataProviderService = new UiPoolDataProviderService(hubProvider);
    this.lendingPoolService = new LendingPoolService(hubProvider);
  }

  public async getATokenData(aToken: Address): Promise<Erc20Token> {
    return Erc20Service.getErc20Token(aToken, this.hubProvider.publicClient);
  }

  /**
   * Fetches multiple aToken balances in a single multicall for better performance
   * @param aTokens - Array of aToken addresses
   * @param userAddress - User's hub wallet address to fetch balances for
   * @returns Promise<Map<Address, bigint>> - Map of aToken address to balance
   */
  public async getATokensBalances(aTokens: readonly Address[], userAddress: Address): Promise<Map<Address, bigint>> {
    const contracts = aTokens.map((aToken: Address) => ({
      address: aToken,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [userAddress] as const,
    }));

    const results = await this.hubProvider.publicClient.multicall({
      contracts,
      allowFailure: false,
    });

    const balanceMap = new Map<Address, bigint>();
    let resultIndex = 0;
    for (const aToken of aTokens) {
      const result = results[resultIndex];
      if (result !== undefined) {
        balanceMap.set(aToken, result as bigint);
      }
      resultIndex++;
    }

    return balanceMap;
  }

  /**
   * LendingPool
   */

  /**
   * Get the normalized income for a reserve
   * @param asset - The address of the asset
   * @returns {Promise<bigint>} - Normalized income
   */
  public async getReserveNormalizedIncome(asset: Address): Promise<bigint> {
    return this.lendingPoolService.getReserveNormalizedIncome(asset);
  }

  /**
   * Get the reserve data for an asset
   * @param asset - The address of the asset
   * @returns {Promise<ReserveDataLegacy>} - The reserve data
   */
  public async getReserveData(asset: Address): Promise<ReserveDataLegacy> {
    return this.lendingPoolService.getReserveData(asset);
  }

  /**
   * UiPoolDataProvider
   */

  /**
   * Get the reserves list
   * @param unfiltered - If true, return the list of all reserves in the pool (including bnUSD (debt) reserve)
   * @returns {Promise<readonly Address[]>} - List of reserve asset addresses
   */
  public async getReservesList(unfiltered = false): Promise<readonly Address[]> {
    return this.uiPoolDataProviderService.getReservesList(unfiltered);
  }

  /**
   * Get the reserves data
   * @returns {Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]>} - The reserves data
   */
  public async getReservesData(): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> {
    return this.uiPoolDataProviderService.getReservesData();
  }

  /**
   * Get the user reserves data
   * @param spokeProvider - The spoke provider
   * @returns {Promise<readonly [readonly UserReserveData[], number]>} - The user reserves data
   */
  public async getUserReservesData(
    spokeProvider: SpokeProvider,
  ): Promise<readonly [readonly UserReserveData[], number]> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const spokeChainId = spokeProvider.chainConfig.chain.id;
    const hubWalletAddress = await HubService.getUserHubWalletAddress(walletAddress, spokeChainId, this.hubProvider);

    return this.uiPoolDataProviderService.getUserReservesData(hubWalletAddress);
  }

  /**
   * Get the list of all eModes in the pool
   * @returns {Promise<readonly EModeData[]>} - Array of eMode data
   */
  public async getEModes(): Promise<readonly EModeData[]> {
    return this.uiPoolDataProviderService.getEModes();
  }

  /**
   * Get the list of all eModes in the pool humanized
   * @returns {Promise<EmodeDataHumanized[]>} - Array of eMode data humanized
   */
  public async getEModesHumanized(): Promise<EmodeDataHumanized[]> {
    return this.uiPoolDataProviderService.getEModesHumanized();
  }

  /**
   * Get the reserves data humanized
   * @returns {Promise<ReservesDataHumanized>} - The reserves data humanized
   */
  public async getReservesHumanized(): Promise<ReservesDataHumanized> {
    return this.uiPoolDataProviderService.getReservesHumanized();
  }

  /**
   * Get the user reserves humanized
   * @param spokeProvider - The spoke provider
   * @returns {Promise<{userReserves: UserReserveDataHumanized[], userEmodeCategoryId: number}>} - The user reserves humanized
   */
  public async getUserReservesHumanized(spokeProvider: SpokeProvider): Promise<{
    userReserves: UserReserveDataHumanized[];
    userEmodeCategoryId: number;
  }> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const spokeChainId = spokeProvider.chainConfig.chain.id;
    const hubWalletAddress = await HubService.getUserHubWalletAddress(walletAddress, spokeChainId, this.hubProvider);

    return this.uiPoolDataProviderService.getUserReservesHumanized(hubWalletAddress);
  }

  /**
   * Utils for building requests
   */

  /**
   * @description Util function to build the request for the formatReserves function
   */
  public buildReserveDataWithPrice(reserves: ReservesDataHumanized): FormatReservesUSDRequest<ReserveDataHumanized> {
    // Current UNIX timestamp in seconds
    const currentUnixTimestamp: number = Math.floor(Date.now() / 1000);
    const baseCurrencyData = reserves.baseCurrencyData;

    return {
      reserves: reserves.reservesData,
      currentTimestamp: currentUnixTimestamp,
      marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    };
  }

  /**
   * @description Util function to build the request for the formatReserves function
   */
  public buildUserSummaryRequest(
    reserves: ReservesDataHumanized,
    formattedReserves: (ReserveData & { priceInMarketReferenceCurrency: string } & FormatReserveUSDResponse)[],
    userReserves: {
      userReserves: UserReserveDataHumanized[];
      userEmodeCategoryId: number;
    },
  ): FormatUserSummaryRequest<FormatReserveUSDResponse> {
    // Current UNIX timestamp in seconds
    const currentUnixTimestamp: number = Math.floor(Date.now() / 1000);
    const baseCurrencyData = reserves.baseCurrencyData;
    const userReservesArray = userReserves.userReserves;

    return {
      currentTimestamp: currentUnixTimestamp,
      marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      userReserves: userReservesArray,
      formattedReserves,
      userEmodeCategoryId: userReserves.userEmodeCategoryId,
    };
  }

  /**
   * Formatted data
   */

  /**
   * @description computes additional fields and normalizes numbers into human readable decimals
   * In addition to that it also converts the numbers to USD
   * @param {FormatReservesUSDRequest<ReserveDataWithPrice>} - the request parameters
   * @returns {FormatReserveUSDResponse<FormatReservesUSDRequest>} - an array of formatted configuration and live usage data for each reserve in a Sodax market
   */
  public formatReservesUSD<T extends ReserveDataWithPrice>(
    params: FormatReservesUSDRequest<T>,
  ): FormatReserveUSDResponse[] {
    return formatReserves<T>(params);
  }

  /**
   * @description computes additional fields and normalizes numbers into human readable decimals
   * In addition to that it also converts the numbers to USD
   * @param FormatReserveUSDRequest - the request parameters
   * @returns an array of formatted configuration and live usage data for each reserve in a Sodax market
   */
  public formatReserveUSD(params: FormatReserveUSDRequest): FormatReserveUSDResponse {
    return formatReserveUSD(params);
  }

  /**
   * Returns formatted summary of Sodax money market user portfolio (holdings, total liquidity,
   *  collateral, borrows, liquidation threshold, health factor, available borrowing power, etc..)
   * @param {FormatUserSummaryRequest<FormatReserveUSDResponse>} - the request parameters
   * @returns {FormatReserveUSDResponse<FormatUserSummaryRequest>} - a formatted summary of Sodax user portfolio
   */
  public formatUserSummary(
    params: FormatUserSummaryRequest<FormatReserveUSDResponse>,
  ): FormatUserSummaryResponse<FormatReserveUSDResponse> {
    return formatUserSummary(params);
  }
}

// Helper functions to format data
export function formatPercentage(value: bigint, decimals = 27): string {
  return `${(Number(value) / 10 ** decimals).toFixed(2)}%`;
}

export function formatBasisPoints(value: bigint): string {
  return `${(Number(value) / 100).toFixed(2)}%`;
}
