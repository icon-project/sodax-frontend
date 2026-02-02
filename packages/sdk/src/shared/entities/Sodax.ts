import { DEFAULT_RELAYER_API_ENDPOINT } from '../constants.js';
import { SwapService, MigrationService, BackendApiService, BridgeService, StakingService } from '../../index.js';
import { MoneyMarketService } from '../../moneyMarket/MoneyMarketService.js';
import type { HttpUrl, defaultSharedConfig } from '@sodax/types';
import type {
  SolverConfigParams,
  MoneyMarketConfigParams,
  MigrationServiceConfig,
  BridgeServiceConfig,
  BackendApiConfig,
  Result,
} from '../types.js';
import { EvmHubProvider, type EvmHubProviderConfig } from './Providers.js';
import { ConfigService } from '../config/index.js';

export type SodaxConfig = {
  swaps?: SolverConfigParams; // optional Solver service enabling intent based swaps
  moneyMarket?: MoneyMarketConfigParams; // optional Money Market service enabling cross-chain lending and borrowing
  migration?: MigrationServiceConfig; // optional Migration service enabling ICX migration to SODA
  bridge?: BridgeServiceConfig; // optional Bridge service enabling cross-chain transfers
  hubProviderConfig?: EvmHubProviderConfig; // hub provider for the hub chain (e.g. Sonic mainnet)
  relayerApiEndpoint?: HttpUrl; // relayer API endpoint used to relay intents/user actions to the hub and vice versa
  backendApiConfig?: BackendApiConfig; // backend API config used to interact with the backend API
  sharedConfig?: typeof defaultSharedConfig;
};

/**
 * Sodax class is used to interact with the Sodax.
 *
 * @see https://docs.sodax.com
 */
export class Sodax {
  public readonly instanceConfig?: SodaxConfig;

  public readonly swaps: SwapService; // Solver service enabling intent based swaps
  public readonly moneyMarket: MoneyMarketService; // Money Market service enabling cross-chain lending and borrowing
  public readonly migration: MigrationService; // ICX migration service enabling ICX migration to SODA
  public readonly backendApi: BackendApiService; // backend API service enabling backend API endpoints
  public readonly bridge: BridgeService; // Bridge service enabling cross-chain transfers
  public readonly staking: StakingService; // Staking service enabling SODA staking operations
  public readonly config: ConfigService; // Config service enabling configuration data fetching from the backend API or fallbacking to default values

  public readonly hubProvider: EvmHubProvider; // hub provider for the hub chain (e.g. Sonic mainnet)
  public readonly relayerApiEndpoint: HttpUrl; // relayer API endpoint used to relay intents/user actions to the hub and vice versa

  constructor(config?: SodaxConfig) {
    this.instanceConfig = config;
    this.relayerApiEndpoint = config?.relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;
    this.backendApi = new BackendApiService(config?.backendApiConfig);
    this.config = new ConfigService({
      backendApiService: this.backendApi,
      config: {
        backendApiUrl: config?.backendApiConfig?.baseURL,
        timeout: config?.backendApiConfig?.timeout,
      },
      sharedConfig: config?.sharedConfig,
    });
    this.hubProvider = new EvmHubProvider({ config: config?.hubProviderConfig, configService: this.config }); // default to Sonic mainnet
    this.swaps =
      config && config.swaps
        ? new SwapService({
            config: config.swaps,
            configService: this.config,
            hubProvider: this.hubProvider,
            relayerApiEndpoint: this.relayerApiEndpoint,
          })
        : new SwapService({
            config: undefined,
            configService: this.config,
            hubProvider: this.hubProvider,
            relayerApiEndpoint: this.relayerApiEndpoint,
          }); // default to mainnet config

    this.moneyMarket =
      config && config.moneyMarket
        ? new MoneyMarketService({
            config: config.moneyMarket,
            hubProvider: this.hubProvider,
            relayerApiEndpoint: this.relayerApiEndpoint,
            configService: this.config,
          })
        : new MoneyMarketService({
            config: undefined,
            hubProvider: this.hubProvider,
            relayerApiEndpoint: this.relayerApiEndpoint,
            configService: this.config,
          }); // default to mainnet config

    this.migration =
      config && config.migration
        ? new MigrationService({
            relayerApiEndpoint: this.relayerApiEndpoint,
            hubProvider: this.hubProvider,
            configService: this.config,
          })
        : new MigrationService({
            relayerApiEndpoint: this.relayerApiEndpoint,
            hubProvider: this.hubProvider,
            configService: this.config,
          });

    this.bridge =
      config && config.bridge
        ? new BridgeService({
            hubProvider: this.hubProvider,
            relayerApiEndpoint: this.relayerApiEndpoint,
            config: config.bridge,
            configService: this.config,
          })
        : new BridgeService({
            hubProvider: this.hubProvider,
            relayerApiEndpoint: this.relayerApiEndpoint,
            config: undefined,
            configService: this.config,
          });
    this.staking = new StakingService({
      hubProvider: this.hubProvider,
      relayerApiEndpoint: this.relayerApiEndpoint,
      configService: this.config,
    });
  }

  /**
   * Initializes the Sodax instance with dynamic configuration.
   * You should use this option if you do not want to update package versions when new chains and tokens are added.
   * NOTE: Default configuration will be used if initialization fails.
   * @param sodax - The Sodax instance to initialize.
   */
  public async initialize(): Promise<Result<void>> {
    return this.config.initialize();
  }
}
