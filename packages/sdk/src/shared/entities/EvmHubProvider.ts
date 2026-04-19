import type { HubChainConfig } from '@sodax/types';
import { type HttpTransport, type PublicClient, createPublicClient, http } from 'viem';
import type { ConfigService } from '../config/ConfigService.js';

import { SonicSpokeService } from '../services/spoke/SonicSpokeService.js';

export type EvmHubProviderConstructorParams = {
  config: HubChainConfig;
  configService: ConfigService;
};

export class EvmHubProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: HubChainConfig;
  public readonly configService: ConfigService;
  public readonly service: SonicSpokeService;

  constructor({ config, configService }: EvmHubProviderConstructorParams) {
    this.publicClient = createPublicClient({
      transport: http(config.hubRpcUrl),
      chain: getEvmViemChain(config.chainConfig.chain.id),
    });
    this.chainConfig = config.chainConfig;
    this.configService = configService;
    this.service = new SonicSpokeService(this.publicClient);
  }
}
