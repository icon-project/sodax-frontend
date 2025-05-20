import { MoneyMarketService, SolverService } from "../services/index.js";
import type { MoneyMarketConfig, SolverConfig } from "../types.js"


export type SodaxConfig = {
  solver?: SolverConfig
  moneyMarket?: MoneyMarketConfig
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

  constructor(config: SodaxConfig) {
    this.config = config;
    if (config.solver) {
      this.solverService = new SolverService(config.solver);
    }
    if (config.moneyMarket) {
      this.moneyMarketService = new MoneyMarketService(config.moneyMarket);
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
