// packages/sdk/src/services/BackendApiService.ts
/**
 * BackendApiService - Proxy service for Sodax Backend API
 * Acts as a wrapper around all backend API endpoints for Solver and Money Market functionality
 */

import type {
  Address,
  GetAllConfigApiResponse,
  GetChainsApiResponse,
  GetHubAssetsApiResponse,
  GetHubAssetsByChainIdApiResponse,
  GetMoneyMarketReserveAssetsApiResponse,
  GetMoneyMarketTokensApiResponse,
  GetMoneyMarketTokensByChainIdApiResponse,
  GetRelayChainIdMapApiResponse,
  GetSpokeChainConfigApiResponse,
  GetSwapTokensApiResponse,
  GetSwapTokensByChainIdApiResponse,
  IConfigApi,
  SpokeChainId,
} from '@sodax/types';
import {
  DEFAULT_BACKEND_API_ENDPOINT,
  DEFAULT_BACKEND_API_HEADERS,
  DEFAULT_BACKEND_API_TIMEOUT,
} from '../shared/constants.js';
import type { BackendApiConfig } from '../shared/types.js';

// Base types for API responses
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

// HTTP request configuration
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// Intent endpoints types
export interface IntentResponse {
  intentHash: string;
  txHash: string;
  logIndex: number;
  chainId: number;
  blockNumber: number;
  open: boolean;
  intent: {
    intentId: string;
    creator: string;
    inputToken: `0x${string}`;
    outputToken: `0x${string}`;
    inputAmount: string;
    minOutputAmount: string;
    deadline: string;
    allowPartialFill: boolean;
    srcChain: number;
    dstChain: number;
    srcAddress: `0x${string}`;
    dstAddress: `0x${string}`;
    solver: string;
    data: string;
  };
  events: unknown[];
}

export interface UserIntentsResponse {
  total: number;
  offset: number;
  limit: number;
  items: IntentResponse[];
}

// Solver endpoints types
export interface OrderbookResponse {
  total: number;
  data: Array<{
    intentState: {
      exists: boolean;
      remainingInput: string;
      receivedOutput: string;
      pendingPayment: boolean;
    };
    intentData: {
      intentId: string;
      creator: string;
      inputToken: string;
      outputToken: string;
      inputAmount: string;
      minOutputAmount: string;
      deadline: string;
      allowPartialFill: boolean;
      srcChain: number;
      dstChain: number;
      srcAddress: string;
      dstAddress: string;
      solver: string;
      data: string;
      intentHash: string;
      txHash: string;
      blockNumber: number;
    };
  }>;
}

// Money Market endpoints types
export interface MoneyMarketPosition {
  userAddress: string;
  positions: Array<{
    reserveAddress: string;
    aTokenAddress: string;
    variableDebtTokenAddress: string;
    aTokenBalance: string;
    variableDebtTokenBalance: string;
    blockNumber: number;
  }>;
}

export interface MoneyMarketAsset {
  reserveAddress: string;
  aTokenAddress: string;
  totalATokenBalance: string;
  variableDebtTokenAddress: string;
  totalVariableDebtTokenBalance: string;
  liquidityRate: string;
  symbol: string;
  totalSuppliers: number;
  totalBorrowers: number;
  variableBorrowRate: string;
  stableBorrowRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  blockNumber: number;
}

export interface MoneyMarketAssetBorrowers {
  borrowers: string[];
  total: number;
  offset: number;
  limit: number;
}

export interface MoneyMarketAssetSuppliers {
  suppliers: string[];
  total: number;
  offset: number;
  limit: number;
}

export interface MoneyMarketBorrowers {
  borrowers: string[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * BackendApiService class that acts as a proxy to the Sodax Backend API
 * Provides methods for all Solver and Money Market endpoints
 */
export class BackendApiService implements IConfigApi {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;

  constructor(config?: BackendApiConfig) {
    this.baseURL = config?.baseURL ?? DEFAULT_BACKEND_API_ENDPOINT;
    this.timeout = config?.timeout ?? DEFAULT_BACKEND_API_TIMEOUT;
    this.defaultHeaders = config?.headers ?? DEFAULT_BACKEND_API_HEADERS;
  }

  /**
   * Make HTTP request using fetch API
   * @param endpoint - API endpoint path
   * @param config - Request configuration
   * @returns Promise<T>
   */
  private async makeRequest<T>(endpoint: string, config: RequestConfig): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...config.headers };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers,
        body: config.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        console.error('[BackendApiService] Request error:', error.message);
        throw error;
      }

      console.error('[BackendApiService] Unknown error:', error);
      throw new Error('Unknown error occurred');
    }
  }

  // Intent endpoints
  /**
   * Get intent details by intent created transaction hash from the hub chain.
   * Intents are only created on the hub chain, so the transaction hash must be from the hub chain.
   * @param txHash - The intent created transaction hash from the hub chain
   * @returns Promise<IntentResponse>
   */
  public async getIntentByTxHash(txHash: string): Promise<IntentResponse> {
    return this.makeRequest<IntentResponse>(`/intent/tx/${txHash}`, { method: 'GET' });
  }

  /**
   * Get intent details by intent hash
   * @param intentHash - Intent hash
   * @returns Promise<IntentResponse>
   */
  public async getIntentByHash(intentHash: string): Promise<IntentResponse> {
    return this.makeRequest<IntentResponse>(`/intent/${intentHash}`, { method: 'GET' });
  }

  // Solver endpoints
  /**
   * Get the solver orderbook
   * @param params - Object containing offset and limit parameters for pagination
   * @returns Promise<OrderbookResponse>
   */
  public async getOrderbook(params: { offset: string; limit: string }): Promise<OrderbookResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('offset', params.offset);
    queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const endpoint = `/solver/orderbook?${queryString}`;

    return this.makeRequest<OrderbookResponse>(endpoint, { method: 'GET' });
  }

  /**
   * Get all intents created by a specific user address with optional filters.
   *
   * @param params - Options to filter the user intents.
   * @param params.userAddress - The user's wallet address on the hub chain (required).
   * @param params.startDate - Optional. Start timestamp in milliseconds (number, required if filtering by date).
   * @param params.endDate - Optional. End timestamp in milliseconds (number, required if filtering by date).
   * @param params.limit - Optional. Max number of results (string).
   * @param params.offset - Optional. Pagination offset (string).
   *
   * @returns {Promise<UserIntentsResponse>} Promise resolving to an array of intent responses for the user.
   */
  public async getUserIntents(params: {
    userAddress: Address;
    startDate?: number;
    endDate?: number;
    limit?: string;
    offset?: string;
  }): Promise<UserIntentsResponse> {
    const { userAddress, startDate, endDate, limit, offset } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', new Date(startDate).toISOString());
    if (endDate) queryParams.append('endDate', new Date(endDate).toISOString());
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);

    const queryString = queryParams.toString();
    const endpoint =
      queryString.length > 0 ? `/intent/user/${userAddress}?${queryString}` : `/intent/user/${userAddress}`;

    return this.makeRequest<UserIntentsResponse>(endpoint, { method: 'GET' });
  }

  // Money Market endpoints
  /**
   * Get money market position for a specific user
   * @param userAddress - User's wallet address
   * @returns Promise<MoneyMarketPosition>
   */
  public async getMoneyMarketPosition(userAddress: string): Promise<MoneyMarketPosition> {
    return this.makeRequest<MoneyMarketPosition>(`/moneymarket/position/${userAddress}`, { method: 'GET' });
  }

  /**
   * Get all money market assets
   * @returns Promise<MoneyMarketAsset[]>
   */
  public async getAllMoneyMarketAssets(): Promise<MoneyMarketAsset[]> {
    return this.makeRequest<MoneyMarketAsset[]>('/moneymarket/asset/all', { method: 'GET' });
  }

  /**
   * Get specific money market asset details
   * @param reserveAddress - Reserve contract address
   * @returns Promise<MoneyMarketAsset>
   */
  public async getMoneyMarketAsset(reserveAddress: string): Promise<MoneyMarketAsset> {
    return this.makeRequest<MoneyMarketAsset>(`/moneymarket/asset/${reserveAddress}`, { method: 'GET' });
  }

  /**
   * Get borrowers for a specific money market asset
   * @param reserveAddress - Reserve contract address
   * @param params - Object containing offset and limit parameters for pagination
   * @returns Promise<MoneyMarketAssetBorrowers>
   */
  public async getMoneyMarketAssetBorrowers(
    reserveAddress: string,
    params: { offset: string; limit: string },
  ): Promise<MoneyMarketAssetBorrowers> {
    const queryParams = new URLSearchParams();
    queryParams.append('offset', params.offset);
    queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const endpoint = `/moneymarket/asset/${reserveAddress}/borrowers?${queryString}`;

    return this.makeRequest<MoneyMarketAssetBorrowers>(endpoint, { method: 'GET' });
  }

  /**
   * Get suppliers for a specific money market asset
   * @param reserveAddress - Reserve contract address
   * @param params - Object containing offset and limit parameters for pagination
   * @returns Promise<MoneyMarketAssetSuppliers>
   */
  public async getMoneyMarketAssetSuppliers(
    reserveAddress: string,
    params: { offset: string; limit: string },
  ): Promise<MoneyMarketAssetSuppliers> {
    const queryParams = new URLSearchParams();
    queryParams.append('offset', params.offset);
    queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const endpoint = `/moneymarket/asset/${reserveAddress}/suppliers?${queryString}`;

    return this.makeRequest<MoneyMarketAssetSuppliers>(endpoint, { method: 'GET' });
  }

  /**
   * Get all money market borrowers
   * @param params - Object containing offset and limit parameters for pagination
   * @returns Promise<MoneyMarketBorrowers>
   */
  public async getAllMoneyMarketBorrowers(params: { offset: string; limit: string }): Promise<MoneyMarketBorrowers> {
    const queryParams = new URLSearchParams();
    queryParams.append('offset', params.offset);
    queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const endpoint = `/moneymarket/borrowers?${queryString}`;

    return this.makeRequest<MoneyMarketBorrowers>(endpoint, { method: 'GET' });
  }

  /**
   * Get all supported config
   * @returns Promise<GetAllConfigApiResponse>
   */
  public async getAllConfig(): Promise<GetAllConfigApiResponse> {
    return this.makeRequest<GetAllConfigApiResponse>('/config/all', { method: 'GET' });
  }

  /**
   * Get all supported spoke chains
   * @returns Promise<GetChainsApiResponse>
   */
  public async getChains(): Promise<GetChainsApiResponse> {
    return this.makeRequest<GetChainsApiResponse>('/config/spoke/chains', { method: 'GET' });
  }

  /**
   * Get all supported swap tokens
   * @returns Promise<GetSwapTokensApiResponse>
   */
  public async getSwapTokens(): Promise<GetSwapTokensApiResponse> {
    return this.makeRequest<GetSwapTokensApiResponse>('/config/swap/tokens', { method: 'GET' });
  }

  /**
   * Get supported swap tokens for a specific spoke chain
   * @param chainId - Spoke chain id
   * @returns Promise<GetSwapTokensByChainIdApiResponse>
   */
  public async getSwapTokensByChainId(chainId: SpokeChainId): Promise<GetSwapTokensByChainIdApiResponse> {
    return this.makeRequest<GetSwapTokensByChainIdApiResponse>(`/config/swap/${chainId}/tokens`, { method: 'GET' });
  }

  /**
   * Get all supported money market tokens
   * @returns Promise<GetMoneyMarketTokensApiResponse>
   */
  public async getMoneyMarketTokens(): Promise<GetMoneyMarketTokensApiResponse> {
    return this.makeRequest<GetMoneyMarketTokensApiResponse>('/config/money-market/tokens', { method: 'GET' });
  }

  /**
   * Get all supported money market tokens
   * @returns Promise<GetMoneyMarketTokensApiResponse>
   */
  public async getMoneyMarketReserveAssets(): Promise<GetMoneyMarketReserveAssetsApiResponse> {
    return this.makeRequest<GetMoneyMarketReserveAssetsApiResponse>('/config/money-market/reserve-assets', {
      method: 'GET',
    });
  }

  /**
   * Get supported money market tokens for a specific spoke chain
   * @param chainId - Spoke chain id
   * @returns Promise<GetMoneyMarketTokensByChainIdApiResponse>
   */
  public async getMoneyMarketTokensByChainId(chainId: SpokeChainId): Promise<GetMoneyMarketTokensByChainIdApiResponse> {
    return this.makeRequest<GetMoneyMarketTokensByChainIdApiResponse>(`/config/money-market/${chainId}/tokens`, {
      method: 'GET',
    });
  }

  /**
   * Get all supported hub assets (assets representing spoke token deposit)
   * @returns Promise<GetHubAssetsApiResponse>
   */
  public async getHubAssets(): Promise<GetHubAssetsApiResponse> {
    return this.makeRequest<GetHubAssetsApiResponse>('/config/hub/assets', { method: 'GET' });
  }

  /**
   * Get supported hub assets (assets representing spoke token deposit) for a specific spoke chain
   * @param chainId - Spoke chain id
   * @returns Promise<GetHubAssetsByChainIdApiResponse>
   */
  public async getHubAssetsByChainId(chainId: SpokeChainId): Promise<GetHubAssetsByChainIdApiResponse> {
    return this.makeRequest<GetHubAssetsByChainIdApiResponse>(`/config/hub/${chainId}/assets`, { method: 'GET' });
  }

  /**
   * Get the intent relay chain id map
   * @returns Promise<GetRelayChainIdMapApiResponse>
   */
  public async getRelayChainIdMap(): Promise<GetRelayChainIdMapApiResponse> {
    return this.makeRequest<GetRelayChainIdMapApiResponse>('/config/relay/chain-id-map', { method: 'GET' });
  }

  /**
   * Get the spoke chain config
   * @returns Promise<GetSpokeChainConfigApiResponse>
   */
  public async getSpokeChainConfig(): Promise<GetSpokeChainConfigApiResponse> {
    return this.makeRequest<GetSpokeChainConfigApiResponse>('/config/spoke/all-chains-configs', { method: 'GET' });
  }

  /**
   * Set custom headers for API requests
   * @param headers - Object containing header key-value pairs
   */
  public setHeaders(headers: Record<string, string>): void {
    Object.entries(headers).forEach(([key, value]) => {
      this.defaultHeaders[key] = value;
    });
  }

  /**
   * Get the current base URL
   * @returns string
   */
  public getBaseURL(): string {
    return this.baseURL;
  }
}
