import {
  type Address,
  type GetChainsApiResponse,
  type GetHubAssetsApiResponse,
  type GetMoneyMarketReserveAssetsApiResponse,
  type GetRelayChainIdMapApiResponse,
  type GetSpokeChainConfigApiResponse,
  type HttpUrl,
  type HubAssetInfo,
  type HubChainId,
  type IntentRelayChainId,
  type OriginalAssetAddress,
  type SpokeChainId,
  type Token,
  type XToken,
  type EvmHubChainConfig,
  type GetAllConfigApiResponse,
  defaultSodaxConfig,
  hubChainConfig,
  type GetMoneyMarketTokensApiResponse,
  type GetSwapTokensByChainIdApiResponse,
  type GetSwapTokensApiResponse,
  CONFIG_VERSION,
  defaultSharedConfig,
} from '@sodax/types';
import type { BackendApiService } from '../../backendApi/BackendApiService.js';
import { DEFAULT_BACKEND_API_ENDPOINT, DEFAULT_BACKEND_API_TIMEOUT } from '../constants.js';
import type { Result } from '../types.js';

export type ConfigServiceConfig = {
  backendApiUrl: HttpUrl | undefined;
  timeout: number | undefined; // in milliseconds
};

export type ConfigServiceConstructorParams = {
  backendApiService: BackendApiService;
  config?: ConfigServiceConfig;
  sharedConfig?: typeof defaultSharedConfig;
};

/**
 * ConfigApiService - Service for fetching configuration data from the backend API or fallbacking to default values
 */
export class ConfigService {
  readonly serviceConfig: ConfigServiceConfig;
  readonly backendApiService: BackendApiService;
  readonly sharedConfig: typeof defaultSharedConfig;
  private initialized = false;

  private sodaxConfig: GetAllConfigApiResponse;

  // data structures for quick lookup
  private originalAssetTohubAssetMap!: Map<SpokeChainId, Map<OriginalAssetAddress, HubAssetInfo>>;
  private hubAssetToOriginalAssetMap!: Map<SpokeChainId, Map<Address, OriginalAssetAddress>>;
  private chainIdToHubAssetsMap!: Map<SpokeChainId, Map<Address, HubAssetInfo>>;
  private supportedHubAssetsSet!: Set<Address>;
  private supportedSodaVaultAssetsSet!: Set<Address>;
  private intentRelayChainIdToSpokeChainIdMap!: Map<IntentRelayChainId, SpokeChainId>;
  private supportedTokensPerChain!: Map<SpokeChainId, readonly XToken[]>;
  private moneyMarketReserveAssetsSet!: Set<Address>;
  private spokeChainIdsSet!: Set<SpokeChainId>;

  constructor({ backendApiService, config, sharedConfig }: ConfigServiceConstructorParams) {
    this.serviceConfig = {
      backendApiUrl: config?.backendApiUrl ?? DEFAULT_BACKEND_API_ENDPOINT,
      timeout: config?.timeout ?? DEFAULT_BACKEND_API_TIMEOUT,
    } satisfies ConfigServiceConfig;
    this.backendApiService = backendApiService;
    this.sodaxConfig = defaultSodaxConfig;
    this.loadSodaxConfigDataStructures(this.sodaxConfig);
    this.sharedConfig = {
      ...defaultSharedConfig,
      ...sharedConfig,
    }
  }

  public async initialize(): Promise<Result<void>> {
    try {
      const response = await this.backendApiService.getAllConfig();

      // if the config version is not set or is less than the current version, log a warning and fall back to default config
      if (!response.version || response.version < CONFIG_VERSION) {
        console.warn(
          `Dynamic config version is less than the current version, resorting to the default one. Current version: ${CONFIG_VERSION}, response version: ${response.version}`,
        );
      } else {
        this.sodaxConfig = response;
        this.loadSodaxConfigDataStructures(this.sodaxConfig);
        this.initialized = true;
      }

      return {
        ok: true,
        value: undefined,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  public getChains(): GetChainsApiResponse {
    return this.sodaxConfig.supportedChains;
  }

  public getSwapTokens(): GetSwapTokensApiResponse {
    return this.sodaxConfig.supportedSwapTokens;
  }

  public getSwapTokensByChainId(chainId: SpokeChainId): GetSwapTokensByChainIdApiResponse {
    return this.sodaxConfig.supportedSwapTokens[chainId];
  }

  public getHubAssets(): GetHubAssetsApiResponse {
    return this.sodaxConfig.supportedHubAssets;
  }

  public getRelayChainIdMap(): GetRelayChainIdMapApiResponse {
    return this.sodaxConfig.relayChainIdMap;
  }

  public getMoneyMarketTokens(): GetMoneyMarketTokensApiResponse {
    return this.sodaxConfig.supportedMoneyMarketTokens;
  }

  public getMoneyMarketToken(chainId: SpokeChainId, token: string): Token | undefined {
    return this.sodaxConfig.supportedMoneyMarketTokens[chainId].find(
      t => t.address.toLowerCase() === token.toLowerCase(),
    );
  }

  public getMoneyMarketReserveAssets(): GetMoneyMarketReserveAssetsApiResponse {
    return this.sodaxConfig.supportedMoneyMarketReserveAssets;
  }

  public getHubAssetInfo(chainId: SpokeChainId, asset: OriginalAssetAddress): HubAssetInfo | undefined {
    return this.originalAssetTohubAssetMap.get(chainId)?.get(asset.toLowerCase());
  }

  public isValidOriginalAssetAddress(chainId: SpokeChainId, asset: OriginalAssetAddress): boolean {
    return this.originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
  }

  public getOriginalAssetAddress(chainId: SpokeChainId, hubAsset: Address): OriginalAssetAddress | undefined {
    return this.hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
  }

  public isValidHubAsset(hubAsset: Address): boolean {
    return this.supportedHubAssetsSet.has(hubAsset.toLowerCase() as Address);
  }

  public isValidSodaVaultAsset(vault: string): boolean {
    return this.supportedSodaVaultAssetsSet.has(vault.toLowerCase() as Address);
  }

  public isValidVault(vault: string | Token): boolean {
    if (typeof vault === 'string') {
      return this.isValidSodaVaultAsset(vault);
    }

    return this.isValidSodaVaultAsset(vault.address);
  }

  public isValidChainHubAsset(chainId: SpokeChainId, hubAsset: Address): boolean {
    return this.chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
  }

  public isValidSpokeChainId(chainId: SpokeChainId): boolean {
    return this.spokeChainIdsSet.has(chainId);
  }

  public isValidIntentRelayChainId(chainId: bigint): boolean {
    return Object.values(this.sodaxConfig.relayChainIdMap).some(id => id === chainId);
  }

  public getSupportedHubChains(): HubChainId[] {
    return Object.keys(hubChainConfig) as HubChainId[];
  }

  public getHubChainConfig(): EvmHubChainConfig {
    return hubChainConfig;
  }

  public getSupportedSpokeChains(): SpokeChainId[] {
    return Object.keys(this.sodaxConfig.spokeChainConfig) as SpokeChainId[];
  }

  public getSpokeChainIdFromIntentRelayChainId(intentRelayChainId: IntentRelayChainId): SpokeChainId {
    const spokeChainId = this.intentRelayChainIdToSpokeChainIdMap.get(intentRelayChainId);

    if (!spokeChainId) {
      throw new Error(`Invalid intent relay chain id: ${intentRelayChainId}`);
    }

    return spokeChainId;
  }

  public getSupportedTokensPerChain(): Map<SpokeChainId, readonly XToken[]> {
    return this.supportedTokensPerChain;
  }

  public getSupportedMoneyMarketTokensByChainId(chainId: SpokeChainId): readonly Token[] {
    return this.sodaxConfig.supportedMoneyMarketTokens[chainId];
  }

  public getSupportedMoneyMarketTokens(): GetMoneyMarketTokensApiResponse {
    return this.sodaxConfig.supportedMoneyMarketTokens;
  }

  public getSupportedSwapTokensByChainId(chainId: SpokeChainId): readonly Token[] {
    return this.sodaxConfig.supportedSwapTokens[chainId];
  }

  public getSupportedSwapTokens(): GetSwapTokensApiResponse {
    return this.sodaxConfig.supportedSwapTokens;
  }

  public isNativeToken(chainId: SpokeChainId, token: Token | string): boolean {
    if (typeof token === 'string') {
      return token.toLowerCase() === this.sodaxConfig.spokeChainConfig[chainId].nativeToken.toLowerCase();
    }

    return token.address.toLowerCase() === this.sodaxConfig.spokeChainConfig[chainId].nativeToken.toLowerCase();
  }

  public findSupportedTokenBySymbol(chainId: SpokeChainId, symbol: string): XToken | undefined {
    const supportedTokens = Object.values(this.sodaxConfig.spokeChainConfig[chainId].supportedTokens);
    return supportedTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  }

  public getOriginalAssetInfoFromVault(chainId: SpokeChainId, vault: Address): OriginalAssetAddress[] {
    const hubAssets = this.sodaxConfig.supportedHubAssets;
    const assets = hubAssets[chainId];
    if (!assets) {
      return [];
    }
    const vaultAddress = vault.toLowerCase();
    const result: OriginalAssetAddress[] = [];
    for (const [spokeToken, info] of Object.entries(assets)) {
      if (info.vault.toLowerCase() === vaultAddress) {
        result.push(spokeToken);
      }
    }
    return result;
  }

  public isMoneyMarketSupportedToken(chainId: SpokeChainId, token: string): boolean {
    return this.sodaxConfig.supportedMoneyMarketTokens[chainId].some(
      t => t.address.toLowerCase() === token.toLowerCase(),
    );
  }

  public isMoneyMarketReserveAsset(asset: Address): boolean {
    return this.sodaxConfig.supportedMoneyMarketReserveAssets.map(a => a.toLowerCase()).includes(asset.toLowerCase());
  }

  public isMoneyMarketReserveHubAsset(hubAsset: Address): boolean {
    return this.moneyMarketReserveAssetsSet.has(hubAsset.toLowerCase() as Address);
  }

  private loadSodaxConfigDataStructures(sodaxConfig: GetAllConfigApiResponse): void {
    this.loadHubAssetDataStructures(sodaxConfig.supportedHubAssets);
    this.loadSpokeChainDataStructures(sodaxConfig.supportedChains);
    this.loadRelayChainIdMapDataStructures(sodaxConfig.relayChainIdMap);
    this.loadSpokeChainConfigDataStructures(sodaxConfig.spokeChainConfig);
    this.loadMoneyMarketReserveAssetsDataStructures(sodaxConfig.supportedMoneyMarketReserveAssets);
  }

  private loadHubAssetDataStructures(hubAssets: GetHubAssetsApiResponse): void {
    this.originalAssetTohubAssetMap = new Map(
      Object.entries(hubAssets).map(([chainId, assets]) => [
        chainId as SpokeChainId,
        new Map(Object.entries(assets).map(([asset, info]) => [asset.toLowerCase(), info])),
      ]),
    );

    this.hubAssetToOriginalAssetMap = new Map(
      Object.entries(hubAssets).map(([chainId, assets]) => [
        chainId as SpokeChainId,
        new Map(Object.entries(assets).map(([asset, info]) => [info.asset.toLowerCase() as Address, asset])),
      ]),
    );

    this.chainIdToHubAssetsMap = new Map(
      Object.entries(hubAssets).map(([chainId, assets]) => [
        chainId as SpokeChainId,
        new Map(Object.entries(assets).map(([, info]) => [info.asset.toLowerCase() as Address, info])),
      ]),
    );

    this.supportedHubAssetsSet = new Set(
      Object.values(hubAssets).flatMap(assets =>
        Object.values(assets).map(info => info.asset.toLowerCase() as Address),
      ),
    );

    this.supportedSodaVaultAssetsSet = new Set(
      Object.values(hubAssets).flatMap(assets =>
        Object.values(assets).map(info => info.vault.toLowerCase() as Address),
      ),
    );
  }

  private loadSpokeChainDataStructures(chains: GetChainsApiResponse): void {
    this.spokeChainIdsSet = new Set(chains);
  }

  private loadRelayChainIdMapDataStructures(relayChainIdMap: GetRelayChainIdMapApiResponse): void {
    this.intentRelayChainIdToSpokeChainIdMap = new Map(
      Object.entries(relayChainIdMap).map(([chainId, intentRelayChainId]) => [
        intentRelayChainId as IntentRelayChainId,
        chainId as SpokeChainId,
      ]),
    );
  }

  private loadSpokeChainConfigDataStructures(spokeChainConfig: GetSpokeChainConfigApiResponse): void {
    this.supportedTokensPerChain = new Map(
      Object.entries(spokeChainConfig).map(([chainId, config]) => [
        chainId as SpokeChainId,
        Object.values(config.supportedTokens),
      ]),
    );
  }

  private loadMoneyMarketReserveAssetsDataStructures(
    moneyMarketReserveAssets: GetMoneyMarketReserveAssetsApiResponse,
  ): void {
    this.moneyMarketReserveAssetsSet = new Set(moneyMarketReserveAssets);
  }

  public isInitialized(): boolean {
    return this.sodaxConfig !== undefined && this.initialized;
  }

  get spokeChainConfig(): GetSpokeChainConfigApiResponse {
    return this.sodaxConfig.spokeChainConfig;
  }
}

/**
 * static configs that should never change
 */

export function getHubChainConfig(): EvmHubChainConfig {
  return hubChainConfig;
}
