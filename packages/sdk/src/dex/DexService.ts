import type { EvmHubProvider } from '../shared/entities/Providers.js';
import type { HttpUrl } from '@sodax/types';
import type { ConfigService } from './../shared/config/ConfigService.js';
import { AssetService, type AssetServiceConfig } from './AssetService.js';
import { ConcentratedLiquidityService } from './ConcentratedLiquidityService.js';

export type DexServiceConfig = {
  assetServiceConfig?: AssetServiceConfig;
};

export type DexServiceConstructorParams = {
  configService: ConfigService;
  hubProvider: EvmHubProvider;
  relayerApiEndpoint?: HttpUrl;
  config?: DexServiceConfig;
}

export class DexService {
  public readonly assetService: AssetService;
  public readonly clService: ConcentratedLiquidityService;
  public readonly configService: ConfigService;

  constructor(params: DexServiceConstructorParams) {
    this.assetService = new AssetService({
      hubProvider: params.hubProvider,
      relayerApiEndpoint: params.relayerApiEndpoint,
      configService: params.configService,
      config: params.config?.assetServiceConfig,
    });
    this.clService = new ConcentratedLiquidityService({
      hubProvider: params.hubProvider,
      relayerApiEndpoint: params.relayerApiEndpoint,
      configService: params.configService,
    });
    this.configService = params.configService;
  }
}
