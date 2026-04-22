import { type HttpTransport, type PublicClient, createPublicClient, http } from 'viem';
import type { ConfigService } from '../config/ConfigService.js';

import { SonicSpokeService } from '../services/spoke/SonicSpokeService.js';
import type { HubConfig } from '@sodax/types';
import { getEvmViemChain } from '../utils/constant-utils.js';

export type EvmHubProviderConstructorParams = {
  config: ConfigService;
};

export class EvmHubProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: HubConfig;
  public readonly config: ConfigService;
  public readonly service: SonicSpokeService;

  constructor({ config }: EvmHubProviderConstructorParams) {
    this.publicClient = createPublicClient({
      transport: http(config.sodaxConfig.hub.rpcUrl),
      chain: getEvmViemChain(config.sodaxConfig.hub.chain.key),
    });
    this.chainConfig = config.sodaxConfig.hub;
    this.config = config;
    this.service = new SonicSpokeService(this.config);
  }
}
