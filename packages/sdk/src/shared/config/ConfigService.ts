import {
  type Address,
  type GetChainsApiResponse,
  type GetMoneyMarketReserveAssetsApiResponse,
  type GetRelayChainIdMapApiResponse,
  type GetSpokeChainConfigApiResponse,
  type HttpUrl,
  type HubChainKey,
  type IntentRelayChainId,
  type OriginalAssetAddress,
  type SpokeChainKey,
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
  type EvmChainKey,
  type SonicChainKey,
  type SharedConfig,
  type PartialSharedConfig,
  type SharedChainConfigFor,
  type SpokeChainConfig,
} from '@sodax/types';
import type { BackendApiService } from '../../backendApi/BackendApiService.js';
import {
  DEFAULT_BACKEND_API_ENDPOINT,
  DEFAULT_BACKEND_API_TIMEOUT,
  dexPools,
  StatATokenAddresses,
} from '../constants.js';
import type { Result } from '../types/types.js';
import type { PoolKey } from '../../dex/types.js';
import { createPublicClient, http, type PublicClient } from 'viem';
import { getEvmViemChain } from '../constants.js';

export type ConfigServiceConfig = {
  backendApiUrl: HttpUrl | undefined;
  timeout: number | undefined; // in milliseconds
};

export type ConfigServiceConstructorParams = {
  backendApiService: BackendApiService;
  config?: ConfigServiceConfig;
  sharedConfig?: PartialSharedConfig;
};

/**
 * ConfigApiService - Service for fetching configuration data from the backend API or fallbacking to default values
 */
export class ConfigService {
  readonly serviceConfig: ConfigServiceConfig;
  readonly backendApiService: BackendApiService;
  readonly sharedConfig: SharedConfig;
  private initialized = false;

  private sodaxConfig: GetAllConfigApiResponse;

  // data structures for quick lookup
  private originalAssetToTokenMap!: Map<SpokeChainKey, Map<OriginalAssetAddress, XToken>>;
  private hubAssetToOriginalAssetMap!: Map<SpokeChainKey, Map<Address, OriginalAssetAddress>>;
  private chainIdToHubAssetsMap!: Map<SpokeChainKey, Map<Address, XToken>>;
  private supportedHubAssetsSet!: Set<Address>;
  private supportedSodaVaultAssetsSet!: Set<Address>;
  private intentRelayChainIdToSpokeChainKeyMap!: Map<IntentRelayChainId, SpokeChainKey>;
  private supportedTokensPerChain!: Map<SpokeChainKey, readonly XToken[]>;
  private moneyMarketReserveAssetsSet!: Set<Address>;
  private spokeChainIdsSet!: Set<SpokeChainKey>;
  private stakedATokenAddressesSet!: Set<Address>;

  constructor({ backendApiService, config, sharedConfig }: ConfigServiceConstructorParams) {
    this.serviceConfig = {
      backendApiUrl: config?.backendApiUrl ?? DEFAULT_BACKEND_API_ENDPOINT,
      timeout: config?.timeout ?? DEFAULT_BACKEND_API_TIMEOUT,
    } satisfies ConfigServiceConfig;
    this.backendApiService = backendApiService;
    this.sodaxConfig = defaultSodaxConfig;
    this.loadSodaxConfigDataStructures(this.sodaxConfig);
    this.sharedConfig = mergeSharedConfig(defaultSharedConfig, sharedConfig);
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

  public getSwapTokensByChainId(chainId: SpokeChainKey): GetSwapTokensByChainIdApiResponse {
    return this.sodaxConfig.supportedSwapTokens[chainId];
  }

  public getRelayChainIdMap(): GetRelayChainIdMapApiResponse {
    return this.sodaxConfig.relayChainIdMap;
  }

  public getMoneyMarketTokens(): GetMoneyMarketTokensApiResponse {
    return this.sodaxConfig.supportedMoneyMarketTokens;
  }

  public getMoneyMarketToken(chainId: SpokeChainKey, token: string): Token | undefined {
    return this.sodaxConfig.supportedMoneyMarketTokens[chainId].find(
      t => t.address.toLowerCase() === token.toLowerCase(),
    );
  }

  public getMoneyMarketReserveAssets(): GetMoneyMarketReserveAssetsApiResponse {
    return this.sodaxConfig.supportedMoneyMarketReserveAssets;
  }

  public getHubAssetInfo(chainId: SpokeChainKey, asset: OriginalAssetAddress): XToken | undefined {
    return this.originalAssetToTokenMap.get(chainId)?.get(asset.toLowerCase());
  }

  public isValidOriginalAssetAddress(chainId: SpokeChainKey, asset: OriginalAssetAddress): boolean {
    return this.originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
  }

  public getOriginalAssetAddress(chainId: SpokeChainKey, hubAsset: Address): OriginalAssetAddress | undefined {
    return this.hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
  }

  public getSpokeTokenFromOriginalAssetAddress(
    chainId: SpokeChainKey,
    originalAssetAddress: OriginalAssetAddress,
  ): XToken | undefined {
    return this.supportedTokensPerChain
      .get(chainId)
      ?.find(token => token.address.toLowerCase() === originalAssetAddress.toLowerCase());
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

  public isValidChainHubAsset(chainId: SpokeChainKey, hubAsset: Address): boolean {
    return this.chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
  }

  public isValidSpokeChainKey(chainId: SpokeChainKey): boolean {
    return this.spokeChainIdsSet.has(chainId);
  }

  public isValidIntentRelayChainId(chainId: bigint): boolean {
    return Object.values(this.sodaxConfig.relayChainIdMap).some(id => id === chainId);
  }

  public getSupportedHubChains(): HubChainKey[] {
    return Object.keys(hubChainConfig) as HubChainKey[];
  }

  public getHubChainConfig(): EvmHubChainConfig {
    return hubChainConfig;
  }

  public getSupportedSpokeChains(): SpokeChainKey[] {
    return Object.keys(this.sodaxConfig.spokeChainConfig) as SpokeChainKey[];
  }

  public getSpokeChainKeyFromIntentRelayChainId(intentRelayChainId: IntentRelayChainId): SpokeChainKey {
    const spokeChainId = this.intentRelayChainIdToSpokeChainKeyMap.get(intentRelayChainId);

    if (!spokeChainId) {
      throw new Error(`Invalid intent relay chain id: ${intentRelayChainId}`);
    }

    return spokeChainId;
  }

  public getSupportedTokensPerChain(): Map<SpokeChainKey, readonly XToken[]> {
    return this.supportedTokensPerChain;
  }

  public getSupportedMoneyMarketTokensByChainId(chainId: SpokeChainKey): readonly Token[] {
    return this.sodaxConfig.supportedMoneyMarketTokens[chainId];
  }

  public getSupportedMoneyMarketTokens(): GetMoneyMarketTokensApiResponse {
    return this.sodaxConfig.supportedMoneyMarketTokens;
  }

  public getSupportedSwapTokensByChainId(chainId: SpokeChainKey): readonly Token[] {
    return this.sodaxConfig.supportedSwapTokens[chainId];
  }

  public getSupportedSwapTokens(): GetSwapTokensApiResponse {
    return this.sodaxConfig.supportedSwapTokens;
  }

  public findSupportedTokenBySymbol(chainId: SpokeChainKey, symbol: string): XToken | undefined {
    const supportedTokens = Object.values(this.sodaxConfig.spokeChainConfig[chainId].supportedTokens);
    return supportedTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  }

  public isValidStakedATokenAddress(address: Address): boolean {
    return this.stakedATokenAddressesSet.has(address.toLowerCase() as Address);
  }

  public getOriginalAssetsFromVault(chainId: SpokeChainKey, vault: Address): OriginalAssetAddress[] {
    const chainConfig = this.sodaxConfig.spokeChainConfig[chainId];
    if (!chainConfig) {
      return [];
    }
    const vaultAddress = vault.toLowerCase();
    const result: OriginalAssetAddress[] = [];
    for (const token of Object.values(chainConfig.supportedTokens)) {
      if (token.vault.toLowerCase() === vaultAddress) {
        result.push(token.address);
      }
    }
    return result;
  }

  public getSodaTokenAddress(chainId: SpokeChainKey): string | undefined {
    return this.sodaxConfig.spokeChainConfig[chainId].supportedTokens.SODA?.address;
  }

  public getOriginalAssetAddressFromStakedATokenAddress = (
    chainId: SpokeChainKey,
    address: Address,
  ): OriginalAssetAddress => {
    if (address.toLowerCase() === this.getHubChainConfig().addresses.xSoda.toLowerCase()) {
      const sodaTokenAddress = this.getSodaTokenAddress(chainId);
      if (!sodaTokenAddress) {
        throw new Error(
          `[getOriginalAssetAddressFromStakedATokenAddress] Soda token address not found for chain ${chainId}`,
        );
      }
      return sodaTokenAddress;
    }

    const normalizedAddress = address.toLowerCase() as keyof typeof StatATokenAddresses;
    const sodaToken = StatATokenAddresses[normalizedAddress] ?? address;

    const originalAssetAddresses = this.getOriginalAssetsFromVault(chainId, sodaToken);

    if (!originalAssetAddresses.length) {
      throw new Error('[getOriginalAssetAddressFromStakedATokenAddress] Original asset address not found');
    }
    return originalAssetAddresses[0] as OriginalAssetAddress;
  };

  public findTokenByOriginalAddress(originalAddress: OriginalAssetAddress, chainId: SpokeChainKey): XToken | undefined {
    const tokens = this.supportedTokensPerChain.get(chainId);
    if (tokens && tokens.length > 0) {
      return tokens.find(token => token.address.toLowerCase() === originalAddress.toLowerCase());
    }
    return undefined;
  }

  public getDexPools(): PoolKey[] {
    // TODO make those dynamic in future
    return Object.values(dexPools);
  }

  public isMoneyMarketSupportedToken(chainId: SpokeChainKey, token: string): boolean {
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
    this.loadHubAssetDataStructures(sodaxConfig.spokeChainConfig);
    this.loadSpokeChainDataStructures(sodaxConfig.supportedChains);
    this.loadRelayChainIdMapDataStructures(sodaxConfig.relayChainIdMap);
    this.loadSpokeChainConfigDataStructures(sodaxConfig.spokeChainConfig);
    this.loadMoneyMarketReserveAssetsDataStructures(sodaxConfig.supportedMoneyMarketReserveAssets);
    this.stakedATokenAddressesSet = new Set(
      Object.keys(StatATokenAddresses).map(address => address.toLowerCase() as Address),
    );
  }

  private loadHubAssetDataStructures(spokeChainConfig: GetSpokeChainConfigApiResponse): void {
    const originalAssetToToken = new Map<SpokeChainKey, Map<OriginalAssetAddress, XToken>>();
    const hubAssetToOriginalAsset = new Map<SpokeChainKey, Map<Address, OriginalAssetAddress>>();
    const chainIdToHubAssets = new Map<SpokeChainKey, Map<Address, XToken>>();
    const hubAssetsSet = new Set<Address>();
    const vaultAssetsSet = new Set<Address>();

    for (const [chainId, config] of Object.entries(spokeChainConfig)) {
      const originalMap = new Map<OriginalAssetAddress, XToken>();
      const reverseMap = new Map<Address, OriginalAssetAddress>();
      const hubMap = new Map<Address, XToken>();

      for (const token of Object.values(config.supportedTokens)) {
        originalMap.set(token.address.toLowerCase() as OriginalAssetAddress, token);
        reverseMap.set(token.hubAsset.toLowerCase() as Address, token.address);
        hubMap.set(token.hubAsset.toLowerCase() as Address, token);
        hubAssetsSet.add(token.hubAsset.toLowerCase() as Address);
        vaultAssetsSet.add(token.vault.toLowerCase() as Address);
      }

      originalAssetToToken.set(chainId as SpokeChainKey, originalMap);
      hubAssetToOriginalAsset.set(chainId as SpokeChainKey, reverseMap);
      chainIdToHubAssets.set(chainId as SpokeChainKey, hubMap);
    }

    this.originalAssetToTokenMap = originalAssetToToken;
    this.hubAssetToOriginalAssetMap = hubAssetToOriginalAsset;
    this.chainIdToHubAssetsMap = chainIdToHubAssets;
    this.supportedHubAssetsSet = hubAssetsSet;
    this.supportedSodaVaultAssetsSet = vaultAssetsSet;
  }

  private loadSpokeChainDataStructures(chains: GetChainsApiResponse): void {
    this.spokeChainIdsSet = new Set(chains);
  }

  private loadRelayChainIdMapDataStructures(relayChainIdMap: GetRelayChainIdMapApiResponse): void {
    this.intentRelayChainIdToSpokeChainKeyMap = new Map(
      Object.entries(relayChainIdMap).map(([chainId, intentRelayChainId]) => [
        intentRelayChainId as IntentRelayChainId,
        chainId as SpokeChainKey,
      ]),
    );
  }

  private loadSpokeChainConfigDataStructures(spokeChainConfig: GetSpokeChainConfigApiResponse): void {
    this.supportedTokensPerChain = new Map(
      Object.entries(spokeChainConfig).map(([chainId, config]) => [
        chainId as SpokeChainKey,
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

  get spokeChainConfig(): SpokeChainConfig {
    return this.sodaxConfig.spokeChainConfig;
  }

  public getSharedChainConfig<C extends SpokeChainKey>(chainId: C): SharedChainConfigFor<C> {
    return this.sharedConfig[chainId] as SharedChainConfigFor<C>;
  }

  public getPublicClient(chainId: EvmChainKey | SonicChainKey): PublicClient {
    const rpcUrl = this.sharedConfig[chainId].rpcUrl;
    const chain = getEvmViemChain(chainId);
    return createPublicClient({
      transport: http(rpcUrl || chain.rpcUrls.default.http[0]),
      chain,
    });
  }

  public getEvmRpcUrl(chainId: EvmChainKey): HttpUrl {
    return this.sharedConfig[chainId].rpcUrl;
  }
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }
  return result;
}

function mergeSharedConfig(defaults: SharedConfig, overrides?: PartialSharedConfig): SharedConfig {
  if (!overrides) return { ...defaults };

  const result = { ...defaults } as Record<SpokeChainKey, Record<string, unknown>>;
  for (const key of Object.keys(overrides) as SpokeChainKey[]) {
    const override = overrides[key];
    if (override) {
      result[key] = deepMerge(result[key], override as Record<string, unknown>);
    }
  }
  return result as SharedConfig;
}

/**
 * static configs that should never change
 */

export function getHubChainConfig(): EvmHubChainConfig {
  return hubChainConfig;
}
