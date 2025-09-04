// packages/sdk/src/services/BackendApiService.ts
/**
 * BackendApiService - Proxy service for Sodax Backend API
 * Acts as a wrapper around all backend API endpoints for Solver and Money Market functionality
 */

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
  };
  events: any[];
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
export class BackendApiService {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;

  constructor(baseURL = 'https://apiv1.coolify.iconblockchain.xyz') {
    this.baseURL = baseURL;
    this.timeout = 30000; // 30 seconds timeout
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
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

    console.log(`[BackendApiService] ${config.method} ${url}`);

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
   * Get intent details by transaction hash
   * @param txHash - Transaction hash
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

// Export default instance
export const backendApiService = new BackendApiService();

// Export the class as default
export default BackendApiService;
