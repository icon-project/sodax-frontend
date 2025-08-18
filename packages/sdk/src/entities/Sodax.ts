import { DEFAULT_RELAYER_API_ENDPOINT } from '../constants.js';
import { MoneyMarketService } from '../index.js';
import { SolverService, MigrationService } from '../services/index.js';
import type { HttpUrl, SolverConfigParams, MoneyMarketConfigParams, MigrationServiceConfig } from '../types.js';
import { EvmHubProvider, type EvmHubProviderConfig } from './Providers.js';

export type SodaxConfig = {
  solver?: SolverConfigParams; // optional Solver service enabling intent based swaps
  moneyMarket?: MoneyMarketConfigParams; // optional Money Market service enabling cross-chain lending and borrowing
  migration?: MigrationServiceConfig; // optional Migration service enabling ICX migration to SODA
  hubProviderConfig?: EvmHubProviderConfig; // hub provider for the hub chain (e.g. Sonic mainnet)
  relayerApiEndpoint?: HttpUrl; // relayer API endpoint used to relay intents/user actions to the hub and vice versa
};

/**
 * Sodax class is used to interact with the Sodax.
 *
 * @see https://docs.sodax.com
 */
export class Sodax {
  public readonly config?: SodaxConfig;

  public readonly solver: SolverService; // Solver service enabling intent based swaps
  public readonly moneyMarket: MoneyMarketService; // Money Market service enabling cross-chain lending and borrowing
  public readonly migration: MigrationService; // ICX migration service enabling ICX migration to SODA

  public readonly hubProvider: EvmHubProvider; // hub provider for the hub chain (e.g. Sonic mainnet)
  public readonly relayerApiEndpoint: HttpUrl; // relayer API endpoint used to relay intents/user actions to the hub and vice versa

  constructor(config?: SodaxConfig) {
    this.config = config;
    this.relayerApiEndpoint = config?.relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;
    this.hubProvider = new EvmHubProvider(config?.hubProviderConfig); // default to Sonic mainnet

    this.solver =
      config && config.solver
        ? new SolverService(config.solver, this.hubProvider, this.relayerApiEndpoint)
        : new SolverService(undefined, this.hubProvider, this.relayerApiEndpoint); // default to mainnet config

    this.moneyMarket =
      config && config.moneyMarket
        ? new MoneyMarketService(config.moneyMarket, this.hubProvider, this.relayerApiEndpoint)
        : new MoneyMarketService(undefined, this.hubProvider, this.relayerApiEndpoint); // default to mainnet config

    this.migration =
      config && config.migration
        ? new MigrationService(this.hubProvider, config.migration)
        : new MigrationService(this.hubProvider);
  }
}
