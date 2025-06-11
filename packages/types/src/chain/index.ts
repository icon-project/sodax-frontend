import type {
  INTENT_RELAY_CHAIN_IDS,
  EVM_CHAIN_IDS,
  EVM_SPOKE_CHAIN_IDS,
  HUB_CHAIN_IDS,
  SPOKE_CHAIN_IDS,
  CHAIN_IDS,
} from '../constants/index.js';
import type { IconAddress } from '../icon/index.js';
import type { EvmAddress, Hex } from '../shared/index.js';
import type { Token } from '../tokens/index.js';

export type IntentRelayChainId = (typeof INTENT_RELAY_CHAIN_IDS)[keyof typeof INTENT_RELAY_CHAIN_IDS];

export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];
export type EvmSpokeChainId = (typeof EVM_SPOKE_CHAIN_IDS)[number];

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof SPOKE_CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainType = 'ICON' | 'EVM' | 'ARCHWAY' | 'HAVAH' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

export type Chain = {
  id: string | number;
  name: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: ChainId;
  xChainType: ChainType;
};

export type BaseSpokeChainInfo<T extends ChainType> = {
  name: string;
  id: GetSpokeChainIdType<T>;
  type: T;
};

export type GetSpokeChainIdType<T extends ChainType> = T extends 'EVM' ? EvmSpokeChainId : SpokeChainId;

export type SpokeChainInfo<T extends ChainType> = BaseSpokeChainInfo<T>;

export type HubChainInfo<T extends ChainType> = {
  name: string;
  id: HubChainId;
  type: T;
};

export type BaseSpokeChainConfig<T extends ChainType> = {
  chain: SpokeChainInfo<T>;
  addresses: { [key: string]: string | Uint8Array };
  supportedTokens: Record<string, Token>;
  nativeToken: string;
  bnUSD: string;
};

export type BaseHubChainConfig<T extends ChainType> = {
  chain: HubChainInfo<T>;
  addresses: { [key: string]: string | Uint8Array };
  supportedTokens: Token[];
  nativeToken: string;
};

export type EvmHubChainConfig = BaseHubChainConfig<'EVM'> & {
  addresses: {
    assetManager: EvmAddress;
    hubWallet: EvmAddress;
    xTokenManager: EvmAddress;
  };

  nativeToken: EvmAddress;
};

export type EvmSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    assetManager: EvmAddress;
    connection: EvmAddress;
  };
  nativeToken: string;
};

export type SuiSpokeChainConfig = BaseSpokeChainConfig<'SUI'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};
export type CosmosNetworkEnv = 'TestNet' | 'DevNet' | 'Mainnet';

export type CosmosSpokeChainConfig = BaseSpokeChainConfig<'INJECTIVE'> & {
  rpcUrl: string;
  walletAddress: string;
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  nativeToken: string;
  prefix: string;
  gasPrice: string;
  isBrowser: boolean;
  networkId: string;
  network: CosmosNetworkEnv;
};

export type StellarSpokeChainConfig = BaseSpokeChainConfig<'STELLAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type IconSpokeChainConfig = BaseSpokeChainConfig<'ICON'> & {
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
  };
  nid: Hex;
};

export type SolanaChainConfig = BaseSpokeChainConfig<'SOLANA'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  chain: SpokeChainInfo<'SOLANA'>;
  rpcUrl: string;
  wsUrl: string;
  walletAddress: string;
  nativeToken: string;
  gasPrice: string;
};

export type HubChainConfig = EvmHubChainConfig;

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | CosmosSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | SolanaChainConfig;

export type GetSpokeChainConfigType<T extends ChainType> = T extends 'evm'
  ? EvmSpokeChainConfig
  : T extends 'cosmos'
    ? CosmosSpokeChainConfig
    : T extends 'icon'
      ? IconSpokeChainConfig
      : T extends 'sui'
        ? SuiSpokeChainConfig
        : T extends 'stellar'
          ? StellarSpokeChainConfig
          : T extends 'solana'
            ? SolanaChainConfig
            : never;
