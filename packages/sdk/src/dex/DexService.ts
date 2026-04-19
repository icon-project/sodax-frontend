import type { HttpUrl, DexConfig } from '@sodax/types';
import type { ConfigService } from './../shared/config/ConfigService.js';
import { AssetService, type AssetServiceConfig } from './AssetService.js';
import { ClService } from './ConcentratedLiquidityService.js';
import type { HubProvider } from '../shared/types/types.js';

export type DexServiceConstructorParams = {
  configService: ConfigService;
  hubProvider: HubProvider;
  relayerApiEndpoint?: HttpUrl;
  config?: DexConfig;
};

/**
 * DexService is a main class that provides underlying services for DEX operations.
 * @namespace SodaxFeatures
 */
export class DexService {
  public readonly assetService: AssetService;
  public readonly clService: ClService;
  public readonly configService: ConfigService;

  constructor(params: DexServiceConstructorParams) {
    this.assetService = new AssetService({
      hubProvider: params.hubProvider,
      relayerApiEndpoint: params.relayerApiEndpoint,
      configService: params.configService,
      config: params.config?.assetServiceConfig,
    });
    this.clService = new ClService({
      hubProvider: params.hubProvider,
      relayerApiEndpoint: params.relayerApiEndpoint,
      configService: params.configService,
    });
    this.configService = params.configService;
  }
}
