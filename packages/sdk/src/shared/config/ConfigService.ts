import {
  type Address,
  type GetChainsApiResponse,
  type GetMoneyMarketReserveAssetsApiResponse,
  type GetRelayChainIdMapApiResponse,
  type HubChainKey,
  type IntentRelayChainId,
  type OriginalAssetAddress,
  type SpokeChainKey,
  type XToken,
  hubConfig,
  type GetMoneyMarketTokensApiResponse,
  type GetSwapTokensByChainIdApiResponse,
  type GetSwapTokensApiResponse,
  type SpokeChainConfig,
  type MoneyMarketConfig,
  type SodaxConfig,
  type HubConfig,
  type RelayConfig,
  type SolverConfig,
  type DexConfig,
  type PoolKey,
  type Result,
  CONFIG_VERSION,
  type SwapsConfig,
  type BridgeConfig,
} from '@sodax/types';
import type { BackendApiService } from '../../index.js';

export type ConfigServiceConstructorParams = {
  api: BackendApiService;
  config: SodaxConfig;
};

/**
 * ConfigApiService - Service for fetching configuration data from the backend API or fallbacking to default values
 */
export class ConfigService {
  private sodax: SodaxConfig;
  private readonly api: BackendApiService;

  private initialized = false;

  // data structures for quick lookup
  private supportedHubAssetsSet!: Set<Address>;
  private supportedSodaVaultAssetsSet!: Set<Address>;
  private intentRelayChainIdToSpokeChainKeyMap!: Map<IntentRelayChainId, SpokeChainKey>;
  private supportedTokensPerChain!: Map<SpokeChainKey, readonly XToken[]>;
  private moneyMarketReserveAssetsSet!: Set<Address>;
  private spokeChainKeysSet!: Set<SpokeChainKey>;
  private stakedATokenAddressesSet!: Set<Address>;
  private chainToSupportedTokenAddressMap!: Map<SpokeChainKey, Set<string>>;
  private hubAssetToXTokenMap!: Map<Address, XToken>;

  constructor({ api, config }: ConfigServiceConstructorParams) {
    this.api = api;
    this.sodax = config;
    this.loadSodaxConfigDataStructures(config);
  }

  public async initialize(): Promise<Result<void>> {
    try {
      const response = await this.api.getAllConfig();

      // if the config version is not set or is less than the current version, log a warning and fall back to default config
      if (!response.version || response.version < CONFIG_VERSION) {
        console.warn(
          `Dynamic config version is less than the current version, resorting to the default one. Current version: ${CONFIG_VERSION}, response version: ${response.version}`,
        );
      } else {
        this.sodax = response.config;
        this.loadSodaxConfigDataStructures(this.sodax);
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
    return Object.keys(this.sodax.chains) as SpokeChainKey[];
  }

  public getSwapTokens(): GetSwapTokensApiResponse {
    return this.sodax.swaps.supportedTokens;
  }

  public getSwapTokensByChainId(chainId: SpokeChainKey): GetSwapTokensByChainIdApiResponse {
    return this.sodax.swaps.supportedTokens[chainId];
  }

  public getRelayChainIdMap(): GetRelayChainIdMapApiResponse {
    return this.sodax.relay.relayChainIdMap;
  }

  public getMoneyMarketTokens(): GetMoneyMarketTokensApiResponse {
    return this.sodax.moneyMarket.supportedTokens;
  }

  public getMoneyMarketToken(chainId: SpokeChainKey, token: string): XToken | undefined {
    return this.sodax.moneyMarket.supportedTokens[chainId].find(t => t.address.toLowerCase() === token.toLowerCase());
  }

  public getMoneyMarketReserveAssets(): GetMoneyMarketReserveAssetsApiResponse {
    return this.sodax.moneyMarket.supportedReserveAssets;
  }

  public isValidOriginalAssetAddress(chainId: SpokeChainKey, asset: OriginalAssetAddress): boolean {
    return this.chainToSupportedTokenAddressMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
  }

  public getOriginalAssetAddress(chainId: SpokeChainKey, hubAsset: Address): OriginalAssetAddress | undefined {
    return this.hubAssetToXTokenMap.get(hubAsset.toLowerCase() as Address)?.address;
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

  public isValidVault(vault: string | XToken): boolean {
    if (typeof vault === 'string') {
      return this.isValidSodaVaultAsset(vault);
    }

    return this.isValidSodaVaultAsset(vault.address);
  }

  public isValidChainHubAsset(chainId: SpokeChainKey, hubAsset: Address): boolean {
    return this.chainToSupportedTokenAddressMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
  }

  public isValidSpokeChainKey(chainId: SpokeChainKey): boolean {
    return this.spokeChainKeysSet.has(chainId);
  }

  public isValidIntentRelayChainId(chainId: bigint): chainId is IntentRelayChainId {
    return typeof chainId === 'bigint' && Object.values(this.sodax.relay.relayChainIdMap).some(id => id === chainId);
  }

  public getSupportedHubChains(): HubChainKey[] {
    return Object.keys(hubConfig) as HubChainKey[];
  }

  public getHubChainConfig(): HubConfig {
    return hubConfig;
  }

  public getSupportedSpokeChains(): SpokeChainKey[] {
    return Object.keys(this.sodax.chains) as SpokeChainKey[];
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

  public getSupportedMoneyMarketTokensByChainId(chainId: SpokeChainKey): readonly XToken[] {
    return this.sodax.moneyMarket.supportedTokens[chainId];
  }

  public getSupportedMoneyMarketTokens(): GetMoneyMarketTokensApiResponse {
    return this.sodax.moneyMarket.supportedTokens;
  }

  public getSupportedSwapTokensByChainId(chainId: SpokeChainKey): readonly XToken[] {
    return this.sodax.swaps.supportedTokens[chainId];
  }

  public getSupportedSwapTokens(): GetSwapTokensApiResponse {
    return this.sodax.swaps.supportedTokens;
  }

  public findSupportedTokenBySymbol(chainId: SpokeChainKey, symbol: string): XToken | undefined {
    const supportedTokens = Object.values(this.sodax.chains[chainId].supportedTokens);
    return supportedTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  }

  public isValidStakedATokenAddress(address: Address): boolean {
    return this.stakedATokenAddressesSet.has(address.toLowerCase() as Address);
  }

  public getOriginalAssetsFromVault(chainId: SpokeChainKey, vault: Address): OriginalAssetAddress[] {
    const chainConfig = this.sodax.chains[chainId];
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
    return this.sodax.chains[chainId].supportedTokens.SODA?.address;
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

    const normalizedAddress = address.toLowerCase() as keyof typeof this.dex.statATokenAddresses;
    const sodaToken = this.dex.statATokenAddresses[normalizedAddress] ?? address;

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
    return Object.values(this.dex.dexPools);
  }

  public isMoneyMarketSupportedToken(chainId: SpokeChainKey, token: string): boolean {
    return this.sodax.moneyMarket.supportedTokens[chainId].some(t => t.address.toLowerCase() === token.toLowerCase());
  }

  public isMoneyMarketReserveAsset(asset: Address): boolean {
    return this.sodax.moneyMarket.supportedReserveAssets.map(a => a.toLowerCase()).includes(asset.toLowerCase());
  }

  public isMoneyMarketReserveHubAsset(hubAsset: Address): boolean {
    return this.moneyMarketReserveAssetsSet.has(hubAsset.toLowerCase() as Address);
  }

  private loadSodaxConfigDataStructures(sodaxConfig: SodaxConfig): void {
    // Maps each hub asset address to its original XToken with the matching hubAsset property
    this.hubAssetToXTokenMap = new Map<`0x${string}`, XToken>(
      Object.values(sodaxConfig.chains)
        .flatMap(chainConfig => Object.values(chainConfig.supportedTokens))
        .filter(token => token.hubAsset)
        .map(token => [token.hubAsset.toLowerCase() as Address, token]),
    );
    this.chainToSupportedTokenAddressMap = new Map(
      Object.entries(sodaxConfig.chains).map(([chainId, config]) => [
        chainId as SpokeChainKey,
        new Set(Object.values(config.supportedTokens).map(token => token.address.toLowerCase() as Address)),
      ]),
    );
    this.supportedSodaVaultAssetsSet = new Set(
      Object.values(sodaxConfig.chains).flatMap(config =>
        Object.values(config.supportedTokens).map(token => token.vault.toLowerCase() as Address),
      ),
    );
    this.loadSpokeChainDataStructures(sodaxConfig);
    this.intentRelayChainIdToSpokeChainKeyMap = new Map(
      Object.entries(sodaxConfig.relay.relayChainIdMap).map(([chainId, intentRelayChainId]) => [
        intentRelayChainId as IntentRelayChainId,
        chainId as SpokeChainKey,
      ]),
    );
    this.loadSpokeChainConfigDataStructures(sodaxConfig);
    this.moneyMarketReserveAssetsSet = new Set(this.moneyMarket.supportedReserveAssets);
    this.stakedATokenAddressesSet = new Set(
      Object.keys(this.dex.statATokenAddresses).map(address => address.toLowerCase() as Address),
    );
  }

  private loadSpokeChainDataStructures(sodaxConfig: SodaxConfig): void {
    this.spokeChainKeysSet = new Set(Object.keys(sodaxConfig.chains) as SpokeChainKey[]);
  }

  private loadSpokeChainConfigDataStructures(sodaxConfig: SodaxConfig): void {
    this.supportedTokensPerChain = new Map(
      Object.entries(sodaxConfig.chains).map(([chainId, config]) => [
        chainId as SpokeChainKey,
        Object.values(config.supportedTokens),
      ]),
    );
  }

  public isInitialized(): boolean {
    return this.sodax !== undefined && this.initialized;
  }

  get spokeChainConfig(): Record<SpokeChainKey, SpokeChainConfig> {
    return this.sodax.chains;
  }

  get relay(): RelayConfig {
    return this.sodax.relay;
  }

  get solver(): SolverConfig {
    return this.sodax.solver;
  }
  get swaps(): SwapsConfig {
    return this.sodax.swaps;
  }

  get bridge(): BridgeConfig {
    return this.sodax.bridge;
  }

  get moneyMarket(): MoneyMarketConfig {
    return this.sodax.moneyMarket;
  }

  get dex(): DexConfig {
    return this.sodax.dex;
  }
}
