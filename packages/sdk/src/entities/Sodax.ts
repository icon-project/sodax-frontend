import { MoneyMarketService, SolverService } from "../services/index.js";
import type { MoneyMarketConfig, SolverConfig } from "../types.js"
import { EvmHubProvider, type EvmHubProviderConfig } from "./Providers.js";


export type SodaxConfig = {
  solver?: SolverConfig
  moneyMarket?: MoneyMarketConfig
  hubProviderConfig?: EvmHubProviderConfig // defaults to Sonic mainnet as a hub provider
}

/**
 * Sodax class is used to interact with the Sodax API.
 *
 * @see https://docs.sodax.com
 */
export class Sodax {

  public readonly config: SodaxConfig;

  private readonly solverService?: SolverService;
  private readonly moneyMarketService?: MoneyMarketService;
  private readonly hubProvider: EvmHubProvider;

  constructor(config: SodaxConfig) {
    this.config = config;
    this.hubProvider = new EvmHubProvider(config.hubProviderConfig);

    if (config.solver) {
      this.solverService = new SolverService(config.solver, this.hubProvider);
    }
    if (config.moneyMarket) {
      this.moneyMarketService = new MoneyMarketService(config.moneyMarket, this.hubProvider);
    }
  }

  get solver(): SolverService {
    if (!this.solverService) {
      throw new Error("Solver service not initialized");
    }
    return this.solverService;
  }

  get moneyMarket(): MoneyMarketService {
    if (!this.moneyMarketService) {
      throw new Error("Money market service not initialized");
    }
    return this.moneyMarketService;
  }
}
