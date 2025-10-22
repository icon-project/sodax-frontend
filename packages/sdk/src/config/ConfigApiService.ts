import {
  CHAIN_IDS,
  hubAssets,
  moneyMarketSupportedTokens,
  solverSupportedTokens,
  type GetChainsApiResponse,
  type GetHubAssetsApiResponse,
  type GetHubAssetsByChainIdApiResponse,
  type GetMoneyMarketTokensApiResponse,
  type GetMoneyMarketTokensByChainIdApiResponse,
  type GetSwapTokensApiResponse,
  type GetSwapTokensByChainIdApiResponse,
  type HttpUrl,
  type IConfigApi,
  type SpokeChainId,
} from '@sodax/types';
import type { BackendApiService } from '../services/index.js';

export type ConfigServiceConfig = {
  backendApiUrl: HttpUrl;
  timeout?: number; // in milliseconds
};

export class ConfigApiService implements IConfigApi {
  readonly config: ConfigServiceConfig;
  readonly backendApiService: BackendApiService;
  private supportedSwapTokens: GetSwapTokensApiResponse | undefined = undefined;
  private supportedMoneyMarketTokens: GetMoneyMarketTokensApiResponse | undefined = undefined;
  private supportedChains: GetChainsApiResponse | undefined = undefined;
  private supportedHubAssets: GetHubAssetsApiResponse | undefined = undefined;

  constructor(config: ConfigServiceConfig, backendApiService: BackendApiService) {
    this.config = config;
    this.backendApiService = backendApiService;
  }

  public async getChains(): Promise<GetChainsApiResponse> {
    if (this.supportedChains) {
      // return cached chains
      return this.supportedChains;
    }

    try {
      const response = await this.backendApiService.getChains();

      return response;
    } catch (error) {
      console.error('Error fetching chains:', error);
      this.supportedChains = CHAIN_IDS; // fallback to default chains
    }

    return this.supportedChains;
  }

  public async getSwapTokens(): Promise<GetSwapTokensApiResponse> {
    if (this.supportedSwapTokens) {
      // return cached swap tokens
      return this.supportedSwapTokens;
    }

    try {
      const response = await this.backendApiService.getSwapTokens();
      this.supportedSwapTokens = response;
      return response;
    } catch (error) {
      console.error('Error fetching swap tokens:', error);
      this.supportedSwapTokens = solverSupportedTokens; // fallback to default swap tokens
    }

    return this.supportedSwapTokens;
  }

  public async getSwapTokensByChainId(chainId: SpokeChainId): Promise<GetSwapTokensByChainIdApiResponse> {
    if (this.supportedSwapTokens) {
      // return cached swap tokens by chainId
      return this.supportedSwapTokens[chainId];
    }

    try {
      const response = await this.backendApiService.getSwapTokens();
      this.supportedSwapTokens = response;
      return this.supportedSwapTokens[chainId];
    } catch (error) {
      console.error('Error fetching swap tokens by chainId:', error);
      this.supportedSwapTokens = solverSupportedTokens; // fallback to default swap tokens
    }

    return this.supportedSwapTokens[chainId];
  }

  public async getMoneyMarketTokens(): Promise<GetMoneyMarketTokensApiResponse> {
    if (this.supportedMoneyMarketTokens) {
      // return cached money market tokens
      return this.supportedMoneyMarketTokens;
    }

    try {
      const response = await this.backendApiService.getMoneyMarketTokens();
      this.supportedMoneyMarketTokens = response;
      return response;
    } catch (error) {
      console.error('Error fetching money market tokens:', error);
      this.supportedMoneyMarketTokens = moneyMarketSupportedTokens; // fallback to default money market tokens
    }

    return this.supportedMoneyMarketTokens;
  }

  public async getMoneyMarketTokensByChainId(chainId: SpokeChainId): Promise<GetMoneyMarketTokensByChainIdApiResponse> {
    if (this.supportedMoneyMarketTokens) {
      // return cached money market tokens by chainId
      return this.supportedMoneyMarketTokens[chainId];
    }

    try {
      const response = await this.backendApiService.getMoneyMarketTokens();
      this.supportedMoneyMarketTokens = response;
      return this.supportedMoneyMarketTokens[chainId];
    } catch (error) {
      console.error('Error fetching money market tokens by chainId:', error);
      this.supportedMoneyMarketTokens = moneyMarketSupportedTokens; // fallback to default money market tokens
    }

    return this.supportedMoneyMarketTokens[chainId];
  }

  public async getHubAssets(): Promise<GetHubAssetsApiResponse> {
    if (this.supportedHubAssets) {
      // return cached hub assets
      return this.supportedHubAssets;
    }

    try {
      const response = await this.backendApiService.getHubAssets();
      this.supportedHubAssets = response;
      return response;
    } catch (error) {
      console.error('Error fetching hub assets:', error);
      this.supportedHubAssets = hubAssets; // fallback to default hub assets
    }

    return this.supportedHubAssets;
  }

  public async getHubAssetsByChainId(chainId: SpokeChainId): Promise<GetHubAssetsByChainIdApiResponse> {
    if (this.supportedHubAssets) {
      // return cached hub assets by chainId
      return this.supportedHubAssets[chainId];
    }

    try {
      const response = await this.backendApiService.getHubAssets();
      this.supportedHubAssets = response;
      return this.supportedHubAssets[chainId];
    } catch (error) {
      console.error('Error fetching hub assets by chainId:', error);
      this.supportedHubAssets = hubAssets; // fallback to default hub assets
    }

    return this.supportedHubAssets[chainId];
  }
}
