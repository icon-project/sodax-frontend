import type { EvmHubProvider } from '../entities/Providers.js';
import type {
  AggregatedReserveData,
  BaseCurrencyInfo,
  EModeData,
  EmodeDataHumanized,
  ReservesDataHumanized,
  UserReserveData,
  UserReserveDataHumanized,
  ReserveDataLegacy,
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
import type { Address } from '@sodax/types';

export class MoneyMarketDataService {
  private readonly uiPoolDataProviderService: UiPoolDataProviderService;
  private readonly lendingPoolService: LendingPoolService;

  constructor(hubProvider: EvmHubProvider) {
    this.uiPoolDataProviderService = new UiPoolDataProviderService(hubProvider);
    this.lendingPoolService = new LendingPoolService(hubProvider);
  }

  /**
   * LendingPool
   */

  public async getReserveNormalizedIncome(asset: Address): Promise<bigint> {
    return this.lendingPoolService.getReserveNormalizedIncome(asset);
  }

  public async getReserveData(asset: Address): Promise<ReserveDataLegacy> {
    return this.lendingPoolService.getReserveData(asset);
  }

  /**
   * UiPoolDataProvider
   */

  public async getReservesList(): Promise<readonly Address[]> {
    return this.uiPoolDataProviderService.getReservesList();
  }

  public async getReservesData(): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> {
    return this.uiPoolDataProviderService.getReservesData();
  }

  public async getUserReservesData(userAddress: Address): Promise<readonly [readonly UserReserveData[], number]> {
    return this.uiPoolDataProviderService.getUserReservesData(userAddress);
  }

  public async getEModes(): Promise<readonly EModeData[]> {
    return this.uiPoolDataProviderService.getEModes();
  }

  public async getEModesHumanized(): Promise<EmodeDataHumanized[]> {
    return this.uiPoolDataProviderService.getEModesHumanized();
  }

  public async getReservesHumanized(): Promise<ReservesDataHumanized> {
    return this.uiPoolDataProviderService.getReservesHumanized();
  }

  public async getUserReservesHumanized(userAddress: Address): Promise<{
    userReserves: UserReserveDataHumanized[];
    userEmodeCategoryId: number;
  }> {
    return this.uiPoolDataProviderService.getUserReservesHumanized(userAddress);
  }

  /**
   * Utils for building requests
   */

  /**
   * @description builds the request for the formatReserves function
   */
  public buildReserveDataWithPrice(reserves: ReservesDataHumanized): FormatReservesUSDRequest<ReserveDataWithPrice> {
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
   * @description builds the request for the formatReserves function
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
  public formatReservesUSD(
    params: FormatReservesUSDRequest<ReserveDataWithPrice>,
  ): (ReserveData & { priceInMarketReferenceCurrency: string } & FormatReserveUSDResponse)[] {
    return formatReserves(params);
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
