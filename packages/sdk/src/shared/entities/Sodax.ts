import {
  SwapService,
  MigrationService,
  BackendApiService,
  BridgeService,
  StakingService,
  DexService,
  SpokeService,
  EvmHubProvider,
} from '../../index.js';
import { MoneyMarketService } from '../../moneyMarket/MoneyMarketService.js';
import { sodaxConfig, type DeepPartial, type Result, type SodaxConfig } from '@sodax/types';
import type { HubProvider } from '../types/types.js';
import { ConfigService } from '../config/index.js';
import { PartnerService } from '../../partner/PartnerService.js';
import { deepMerge } from '../utils/deepMerge.js';

/**
 * Sodax class is used to interact with the Sodax.
 *
 * @see https://docs.sodax.com
 */
export class Sodax {
  public readonly instanceConfig: SodaxConfig;

  public readonly swaps: SwapService; // Solver service enabling intent based swaps
  public readonly moneyMarket: MoneyMarketService; // Money Market service enabling cross-chain lending and borrowing
  public readonly migration: MigrationService; // ICX migration service enabling ICX migration to SODA
  public readonly backendApi: BackendApiService; // backend API service enabling backend API endpoints
  public readonly bridge: BridgeService; // Bridge service enabling cross-chain transfers
  public readonly staking: StakingService; // Staking service enabling SODA staking operations
  public readonly partners: PartnerService; // Partner service enabling partner fee claim and other partner operations
  public readonly dex: DexService; // Dex service enabling DEX operations
  public readonly config: ConfigService; // Config service enabling configuration data fetching from the backend API or fallbacking to default values

  public readonly hubProvider: HubProvider; // hub provider for the hub chain (e.g. Sonic mainnet)
  public readonly spokeService: SpokeService; // spoke service enabling spoke chain operations

  constructor(config?: DeepPartial<SodaxConfig>) {
    this.instanceConfig = config ? deepMerge<SodaxConfig>(sodaxConfig, config) : sodaxConfig;
    this.backendApi = new BackendApiService(this.instanceConfig.api);
    this.config = new ConfigService({ api: this.backendApi, config: this.instanceConfig });

    this.hubProvider = new EvmHubProvider({ config: this.config }); // default to Sonic mainnet
    this.spokeService = new SpokeService({ config: this.config, hubProvider: this.hubProvider });
    this.swaps = new SwapService({
      configService: this.config,
      hubProvider: this.hubProvider,
      spokeService: this.spokeService,
    });

    this.moneyMarket = new MoneyMarketService({
      configService: this.config,
      hubProvider: this.hubProvider,
      spokeService: this.spokeService,
    });

    this.dex = new DexService({
      config: this.config,
      hubProvider: this.hubProvider,
      spoke: this.spokeService,
    });

    this.migration = new MigrationService({
      hubProvider: this.hubProvider,
      config: this.config,
      spoke: this.spokeService,
    });
    this.bridge = new BridgeService({ hubProvider: this.hubProvider, config: this.config, spoke: this.spokeService });
    this.staking = new StakingService({ hubProvider: this.hubProvider, config: this.config, spoke: this.spokeService });
    this.partners = new PartnerService({
      hubProvider: this.hubProvider,
      config: this.config,
      spoke: this.spokeService,
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
