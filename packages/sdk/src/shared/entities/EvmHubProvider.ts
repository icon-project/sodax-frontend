import { hubChainConfig, ChainKeys, type EvmHubChainConfig } from '@sodax/types';
import { type HttpTransport, type PublicClient, createPublicClient, http } from 'viem';
import type { ConfigService } from '../config/ConfigService.js';
import { getEvmViemChain } from '../constants.js';
import { SonicSpokeService } from '../services/spoke/SonicSpokeService.js';

export type EvmHubProviderConfig = {
  hubRpcUrl: string;
  chainConfig: EvmHubChainConfig;
};

export type EvmHubProviderConstructorParams = {
  config?: EvmHubProviderConfig;
  configService: ConfigService;
};

export class EvmHubProvider {
  public readonly publicClient: PublicClient<HttpTransport>;
  public readonly chainConfig: EvmHubChainConfig;
  public readonly configService: ConfigService;
  public readonly service: SonicSpokeService;

  constructor({ config, configService }: EvmHubProviderConstructorParams) {
    if (config) {
      this.publicClient = createPublicClient({
        transport: http(config.hubRpcUrl),
        chain: getEvmViemChain(config.chainConfig.chain.id),
      });
      this.chainConfig = config.chainConfig;
    } else {
      // default to Sonic mainnet
      this.publicClient = createPublicClient({
        transport: http('https://rpc.soniclabs.com'),
        chain: getEvmViemChain(ChainKeys.SONIC_MAINNET),
      });
      this.chainConfig = hubChainConfig;
    }
    this.configService = configService;
    this.service = new SonicSpokeService(this.publicClient);
  }
}
