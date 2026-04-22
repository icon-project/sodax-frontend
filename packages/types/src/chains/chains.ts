/**
 * Chain types
 * Forbidden to import types from other packages in this file (exception for shared types)!
 */

import type { Address, Hex, HttpUrl } from '../shared/shared.js';
import {
  sonicSupportedTokens,
  redbellySupportedTokens,
  solanaSupportedTokens,
  avalancheSupportedTokens,
  arbitrumSupportedTokens,
  baseSupportedTokens,
  optimismSupportedTokens,
  bscSupportedTokens,
  polygonSupportedTokens,
  hyperevmSupportedTokens,
  lightlinkSupportedTokens,
  injectiveSupportedTokens,
  bitcoinSupportedTokens,
  stellarSupportedTokens,
  suiSupportedTokens,
  iconSupportedTokens,
  nearSupportedTokens,
  ethereumSupportedTokens,
  kaiaSupportedTokens,
  stacksSupportedTokens,
} from './tokens.js';

import { ChainKeys, CHAIN_KEYS, type ChainKey, type ChainType } from './chain-keys.js';
import type { XToken } from './tokens.js';
import type { TxPollingConfig } from '../index.js';
export * from './chain-keys.js';

// NOTE: This is not the same as the actual chain ids (wormhole based ids), only used for intent relay
export const RelayChainIdMap = {
  [ChainKeys.AVALANCHE_MAINNET]: 6n,
  [ChainKeys.ARBITRUM_MAINNET]: 23n,
  [ChainKeys.BASE_MAINNET]: 30n,
  [ChainKeys.BSC_MAINNET]: 4n,
  [ChainKeys.INJECTIVE_MAINNET]: 19n,
  [ChainKeys.SONIC_MAINNET]: 146n,
  [ChainKeys.OPTIMISM_MAINNET]: 24n,
  [ChainKeys.POLYGON_MAINNET]: 5n,
  [ChainKeys.SOLANA_MAINNET]: 1n,
  [ChainKeys.SUI_MAINNET]: 21n,
  [ChainKeys.STELLAR_MAINNET]: 27n,
  [ChainKeys.ICON_MAINNET]: 1768124270n,
  [ChainKeys.HYPEREVM_MAINNET]: 26745n,
  [ChainKeys.LIGHTLINK_MAINNET]: 27756n,
  [ChainKeys.NEAR_MAINNET]: 15n,
  [ChainKeys.ETHEREUM_MAINNET]: 2n,
  [ChainKeys.BITCOIN_MAINNET]: 627463n,
  [ChainKeys.REDBELLY_MAINNET]: 726564n,
  [ChainKeys.KAIA_MAINNET]: 27489n,
  [ChainKeys.STACKS_MAINNET]: 60n,
} as const satisfies Record<ChainKey, bigint>;

export type IntentChainId = (typeof RelayChainIdMap)[keyof typeof RelayChainIdMap];
export const INTENT_CHAIN_IDS = Object.values(RelayChainIdMap);

export const IntentRelayChainIdToChainKey: Map<IntentRelayChainId, ChainKey> = Object.fromEntries(
  Object.entries(RelayChainIdMap).map(([chainKey, chainId]) => [chainId, chainKey]),
);

export const baseChainInfo = {
  [ChainKeys.SONIC_MAINNET]: {
    name: 'Sonic',
    key: ChainKeys.SONIC_MAINNET,
    type: 'EVM',
    chainId: 146,
    mainnet: true,
  },
  [ChainKeys.SOLANA_MAINNET]: {
    name: 'Solana',
    key: ChainKeys.SOLANA_MAINNET,
    type: 'SOLANA',
    chainId: 'solana',
    mainnet: true,
  },
  [ChainKeys.AVALANCHE_MAINNET]: {
    name: 'Avalanche',
    key: ChainKeys.AVALANCHE_MAINNET,
    type: 'EVM',
    chainId: 43_114,
    mainnet: true,
  },
  [ChainKeys.ARBITRUM_MAINNET]: {
    name: 'Arbitrum',
    key: ChainKeys.ARBITRUM_MAINNET,
    type: 'EVM',
    chainId: 42_161,
    mainnet: true,
  },
  [ChainKeys.BASE_MAINNET]: {
    name: 'Base',
    key: ChainKeys.BASE_MAINNET,
    type: 'EVM',
    chainId: 8453,
    mainnet: true,
  },
  [ChainKeys.OPTIMISM_MAINNET]: {
    name: 'Optimism',
    key: ChainKeys.OPTIMISM_MAINNET,
    type: 'EVM',
    chainId: 10,
    mainnet: true,
  },
  [ChainKeys.BSC_MAINNET]: {
    name: 'BNB Chain',
    key: ChainKeys.BSC_MAINNET,
    type: 'EVM',
    chainId: 56,
    mainnet: true,
  },
  [ChainKeys.POLYGON_MAINNET]: {
    name: 'Polygon',
    key: ChainKeys.POLYGON_MAINNET,
    type: 'EVM',
    chainId: 137,
    mainnet: true,
  },
  [ChainKeys.HYPEREVM_MAINNET]: {
    name: 'Hyper',
    key: ChainKeys.HYPEREVM_MAINNET,
    type: 'EVM',
    chainId: 999,
    mainnet: true,
  },
  [ChainKeys.LIGHTLINK_MAINNET]: {
    name: 'LightLink',
    key: ChainKeys.LIGHTLINK_MAINNET,
    type: 'EVM',
    chainId: 1890,
    mainnet: true,
  },
  [ChainKeys.INJECTIVE_MAINNET]: {
    name: 'Injective',
    key: ChainKeys.INJECTIVE_MAINNET,
    type: 'INJECTIVE',
    chainId: 'injective-1',
    mainnet: true,
  },
  [ChainKeys.STELLAR_MAINNET]: {
    name: 'Stellar',
    key: ChainKeys.STELLAR_MAINNET,
    type: 'STELLAR',
    chainId: 'stellar',
    mainnet: true,
  },
  [ChainKeys.SUI_MAINNET]: {
    name: 'SUI',
    key: ChainKeys.SUI_MAINNET,
    type: 'SUI',
    chainId: 'sui',
    mainnet: true,
  },
  [ChainKeys.ICON_MAINNET]: {
    name: 'ICON',
    key: ChainKeys.ICON_MAINNET,
    type: 'ICON',
    chainId: '0x1.icon',
    mainnet: true,
  },
  [ChainKeys.NEAR_MAINNET]: {
    name: 'Near',
    key: ChainKeys.NEAR_MAINNET,
    type: 'NEAR',
    chainId: 'near',
    mainnet: true,
  },
  [ChainKeys.ETHEREUM_MAINNET]: {
    name: 'Ethereum',
    key: ChainKeys.ETHEREUM_MAINNET,
    type: 'EVM',
    chainId: 1,
    mainnet: true,
  },
  [ChainKeys.BITCOIN_MAINNET]: {
    name: 'Bitcoin',
    key: ChainKeys.BITCOIN_MAINNET,
    type: 'BITCOIN',
    chainId: 'bitcoin',
    mainnet: true,
  },
  [ChainKeys.REDBELLY_MAINNET]: {
    name: 'Redbelly',
    key: ChainKeys.REDBELLY_MAINNET,
    type: 'EVM',
    chainId: 151,
    mainnet: true,
  },
  [ChainKeys.KAIA_MAINNET]: {
    name: 'Kaia',
    key: ChainKeys.KAIA_MAINNET,
    type: 'EVM',
    chainId: 8217,
    mainnet: true,
  },
  [ChainKeys.STACKS_MAINNET]: {
    name: 'Stacks',
    key: ChainKeys.STACKS_MAINNET,
    type: 'STACKS',
    chainId: 'stacks',
    mainnet: true,
  },
} as const satisfies Record<ChainKey, BaseChainInfo<ChainType>>;

type ChainKeysByType<T extends ChainType> = {
  [K in keyof typeof baseChainInfo]: (typeof baseChainInfo)[K]['type'] extends T ? K : never;
}[keyof typeof baseChainInfo];

/**
 * EvmSpokeOnlyChainId is EvmChainKey excluding the Sonic chain ID.
 * Purpose: To use for types where Sonic (the hub) should not be included with spoke EVM chain lists.
 * Intersected with keyof spokeChainConfig so it can safely index the config object.
 */
export type EvmSpokeOnlyChainKey = Exclude<EvmChainKey, HubChainKey> & keyof typeof spokeChainConfig;
export type EvmChainKey = ChainKeysByType<'EVM'>;
export type SonicChainKey = typeof ChainKeys.SONIC_MAINNET; // Sonic is EVM — narrowed via HUB_CHAIN_KEY where needed
export type SolanaChainKey = ChainKeysByType<'SOLANA'>;
export type StellarChainKey = ChainKeysByType<'STELLAR'>;
export type InjectiveChainKey = ChainKeysByType<'INJECTIVE'>;
export type IconChainKey = ChainKeysByType<'ICON'>;
export type SuiChainKey = ChainKeysByType<'SUI'>;
export type StacksChainKey = ChainKeysByType<'STACKS'>;
export type NearChainKey = ChainKeysByType<'NEAR'> & keyof typeof spokeChainConfig;
export type BitcoinChainKey = ChainKeysByType<'BITCOIN'>;

const filterChainKeysByType = <T extends ChainType>(type: T) =>
  CHAIN_KEYS.filter((key): key is ChainKeysByType<T> => baseChainInfo[key].type === type);

export const HUB_CHAIN_KEY = ChainKeys.SONIC_MAINNET;
export const EVM_CHAIN_KEYS = filterChainKeysByType('EVM');
export const EVM_CHAIN_KEYS_SET = new Set(EVM_CHAIN_KEYS);
export const EVM_SPOKE_ONLY_CHAIN_KEYS = EVM_CHAIN_KEYS.filter(
  (key): key is EvmSpokeOnlyChainKey => key !== HUB_CHAIN_KEY,
);
export const EVM_SPOKE_ONLY_CHAIN_KEYS_SET = new Set(EVM_SPOKE_ONLY_CHAIN_KEYS);
export const SONIC_CHAIN_KEYS = [ChainKeys.SONIC_MAINNET] as const;
export const SONIC_CHAIN_KEYS_SET = new Set(SONIC_CHAIN_KEYS);
export const SOLANA_CHAIN_KEYS = filterChainKeysByType('SOLANA');
export const SOLANA_CHAIN_KEYS_SET = new Set(SOLANA_CHAIN_KEYS);
export const STELLAR_CHAIN_KEYS = filterChainKeysByType('STELLAR');
export const STELLAR_CHAIN_KEYS_SET = new Set(STELLAR_CHAIN_KEYS);
export const INJECTIVE_CHAIN_KEYS = filterChainKeysByType('INJECTIVE');
export const INJECTIVE_CHAIN_KEYS_SET = new Set(INJECTIVE_CHAIN_KEYS);
export const ICON_CHAIN_KEYS = filterChainKeysByType('ICON');
export const ICON_CHAIN_KEYS_SET = new Set(ICON_CHAIN_KEYS);
export const SUI_CHAIN_KEYS = filterChainKeysByType('SUI');
export const SUI_CHAIN_KEYS_SET = new Set(SUI_CHAIN_KEYS);
export const STACKS_CHAIN_KEYS = filterChainKeysByType('STACKS');
export const STACKS_CHAIN_KEYS_SET = new Set(STACKS_CHAIN_KEYS);
export const NEAR_CHAIN_KEYS = filterChainKeysByType('NEAR');
export const NEAR_CHAIN_KEYS_SET = new Set(NEAR_CHAIN_KEYS);
export const BITCOIN_CHAIN_KEYS = filterChainKeysByType('BITCOIN');
export const BITCOIN_CHAIN_KEYS_SET = new Set(BITCOIN_CHAIN_KEYS);
export type HubChainKey = typeof HUB_CHAIN_KEY;
export type HubChainType = 'EVM';
export type SpokeChainKey = (typeof CHAIN_KEYS)[number];

export type BaseSpokeChainConfig<T extends ChainType> = {
  chain: BaseChainInfo<T>;
  addresses: { [key: string]: string };
  supportedTokens: Record<string, XToken>;
  nativeToken: string;
  bnUSD: string;
  pollingConfig: TxPollingConfig;
};

export type BaseChainInfo<T extends ChainType> = {
  name: string;
  key: ChainKey;
  chainId: string | number;
  type: T;
  mainnet: boolean;
};

export type HubConfig = {
  chain: BaseChainInfo<'EVM'> & { key: HubChainKey };
  addresses: {
    assetManager: Address;
    hubWallet: Address;
    xTokenManager: Address;
    icxMigration: Address;
    balnSwap: Address;
    sodaToken: Address;
    sodaVault: Address;
    stakedSoda: Address;
    xSoda: Address;
    stakingRouter: Address;
    walletRouter: Address;
  };
  nativeToken: Address;
  wrappedNativeToken: Address;
  rpcUrl: HttpUrl;
} & BaseSpokeChainConfig<'EVM'>;

export type EvmSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    assetManager: Address;
    connection: Address;
  };
  nativeToken: string;
  rpcUrl: HttpUrl;
};

export type SonicSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    walletRouter: Address;
    wrappedSonic: Address;
  };
  nativeToken: Address;
  rpcUrl: HttpUrl;
};

export type SolanaChainConfig = BaseSpokeChainConfig<'SOLANA'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  rpcUrl: string;
  walletAddress: string;
  nativeToken: string;
  gasPrice: string;
};

export type StellarAssetTrustline = {
  assetCode: string;
  contractId: string;
  assetIssuer: string;
};

export type StellarSpokeChainConfig = BaseSpokeChainConfig<'STELLAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  horizonRpcUrl: HttpUrl;
  sorobanRpcUrl: HttpUrl;
  trustlineConfigs: StellarAssetTrustline[];
  priorityFee: string;
  baseFee: string;
};

export type BitcoinSpokeChainConfig = BaseSpokeChainConfig<'BITCOIN'> & {
  addresses: {
    assetManager: string;
  };
  rpcUrl: string;
  network: string;
  radfi: {
    apiUrl: string;
    umsUrl: string;
    apiKey: string;
    accessToken: string;
    refreshToken: string;
    walletMode?: 'USER' | 'TRADING';
  };
};

export type InjectiveNetworkEnv = 'TestNet' | 'DevNet' | 'Mainnet';
export type InjectiveSpokeChainConfig = BaseSpokeChainConfig<'INJECTIVE'> & {
  rpcUrl: string;
  walletAddress: string;
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  nativeToken: string;
  prefix: string;
  gasPrice: string;
  isBrowser: boolean;
  networkId: string;
  network: InjectiveNetworkEnv;
};

export type SuiSpokeChainConfig = BaseSpokeChainConfig<'SUI'> & {
  addresses: {
    assetManager: string;
    assetManagerConfigId: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
  };
  rpc_url: string;
};

export type NearSpokeChainConfig = BaseSpokeChainConfig<'NEAR'> & {
  addresses: {
    assetManager: string;
    connection: string;
    rateLimit: string;
    intentFiller: string;
  };
  rpcUrl: string;
};

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | SonicSpokeChainConfig
  | InjectiveSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | BitcoinSpokeChainConfig
  | SolanaChainConfig
  | StacksSpokeChainConfig
  | NearSpokeChainConfig;

export type GetSpokeChainConfigType<T extends SpokeChainKey> = T extends SonicChainKey
  ? SonicSpokeChainConfig
  : GetChainType<T> extends 'EVM'
    ? EvmSpokeChainConfig
    : GetChainType<T> extends 'SOLANA'
      ? SolanaChainConfig
      : GetChainType<T> extends 'STELLAR'
        ? StellarSpokeChainConfig
        : GetChainType<T> extends 'ICON'
          ? IconSpokeChainConfig
          : GetChainType<T> extends 'SUI'
            ? SuiSpokeChainConfig
            : GetChainType<T> extends 'INJECTIVE'
              ? InjectiveSpokeChainConfig
              : GetChainType<T> extends 'NEAR'
                ? NearSpokeChainConfig
                : GetChainType<T> extends 'STACKS'
                  ? StacksSpokeChainConfig
                  : GetChainType<T> extends 'BITCOIN'
                    ? BitcoinSpokeChainConfig
                    : SpokeChainConfig;

export type IconAddress = `hx${string}` | `cx${string}`;
export type IconSpokeChainConfig = BaseSpokeChainConfig<'ICON'> & {
  rpcUrl: HttpUrl;
  debugRpcUrl: HttpUrl;
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
    wICX: `cx${string}`;
  };
  nid: Hex;
};

export type StacksSpokeChainConfig = BaseSpokeChainConfig<'STACKS'> & {
  addresses: {
    assetManager: string;
    connection: string;
    rateLimit: string;
    xTokenManager: string;
  };
  rpcUrl: string;
  nativeToken: string;
};

export const spokeChainConfig = {
  [ChainKeys.SONIC_MAINNET]: {
    chain: baseChainInfo[ChainKeys.SONIC_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://rpc.soniclabs.com',
    addresses: {
      walletRouter: '0xC67C3e55c665E78b25dc9829B3Aa5af47d914733',
      wrappedSonic: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    bnUSD: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
    supportedTokens: sonicSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 500,
      maxTimeoutMs: 30_000,
    },
  } as const satisfies SonicSpokeChainConfig,
  [ChainKeys.REDBELLY_MAINNET]: {
    chain: baseChainInfo[ChainKeys.REDBELLY_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://governors.mainnet.redbelly.network',
    addresses: {
      assetManager: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
      connection: '0x88F03d1b4e84FB6ED54dFFadc609D724E324Ab02',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8',
    supportedTokens: redbellySupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.SOLANA_MAINNET]: {
    addresses: {
      assetManager: 'AnCCJjheynmGqPp6Vgat9DTirGKD4CtQzP8cwTYV8qKH',
      connection: 'GxS8i6D9qQjbSeniD487CnomUxU2pXt6V8P96T6MkUXB',
      rateLimit: '2Vyy3A3Teju2EMCkdnappEeWqBXyAaF5V2WsrU4hDtsk',
      xTokenManager: '',
    },
    chain: baseChainInfo[ChainKeys.SOLANA_MAINNET] satisfies BaseChainInfo<'SOLANA'>,
    nativeToken: '11111111111111111111111111111111' as const,
    bnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
    supportedTokens: solanaSupportedTokens,
    gasPrice: '500000',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    walletAddress: '',
    pollingConfig: {
      pollingIntervalMs: 750,
      maxTimeoutMs: 60_000, // aligns with blockhash expiry timeout.
    },
  } as const satisfies SolanaChainConfig,
  [ChainKeys.AVALANCHE_MAINNET]: {
    chain: baseChainInfo[ChainKeys.AVALANCHE_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    addresses: {
      assetManager: '0x5bDD1E1C5173F4c912cC919742FB94A55ECfaf86',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F',
    supportedTokens: avalancheSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 500,
      maxTimeoutMs: 30_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.ARBITRUM_MAINNET]: {
    chain: baseChainInfo[ChainKeys.ARBITRUM_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xA256dd181C3f6E5eC68C6869f5D50a712d47212e',
    supportedTokens: arbitrumSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.BASE_MAINNET]: {
    chain: baseChainInfo[ChainKeys.BASE_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://mainnet.base.org',
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xAcfab3F31C0a18559D78556BBf297EC29c6cf8aa',
    supportedTokens: baseSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.OPTIMISM_MAINNET]: {
    chain: baseChainInfo[ChainKeys.OPTIMISM_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://mainnet.optimism.io',
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xF4f7dC27c17470a26d0de9039Cf0EA5045F100E8',
    supportedTokens: optimismSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 12_000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.BSC_MAINNET]: {
    chain: baseChainInfo[ChainKeys.BSC_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://56.rpc.thirdweb.com',
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0xA143488cDc5B74B366231E6A4d5a55A2D9Dc8484',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x8428FedC020737a5A2291F46cB1B80613eD71638',
    supportedTokens: bscSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.POLYGON_MAINNET]: {
    chain: baseChainInfo[ChainKeys.POLYGON_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://polygon-rpc.com',
    addresses: {
      assetManager: '0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
    supportedTokens: polygonSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 2000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.HYPEREVM_MAINNET]: {
    chain: baseChainInfo[ChainKeys.HYPEREVM_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
    addresses: {
      assetManager: '0xAfd6A6e4287A511D3BAAd013093815268846FBb7',
      connection: '0xA143488cDc5B74B366231E6A4d5a55A2D9Dc8484',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x506Ba7C8d91dAdf7a91eE677a205D9687b751579',
    supportedTokens: hyperevmSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 500,
      maxTimeoutMs: 30_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.LIGHTLINK_MAINNET]: {
    chain: baseChainInfo[ChainKeys.LIGHTLINK_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://replicator.phoenix.lightlink.io/rpc/v1',
    addresses: {
      assetManager: '0x4A1C82744cDDeE675A255fB289Cb0917A482e7C7',
      connection: '0x6D2126DB97dd88AfA85127253807D04A066b6746',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x36134A03dcD03Bbe858B8F7ED28a71AAC608F9E7',
    supportedTokens: lightlinkSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.INJECTIVE_MAINNET]: {
    addresses: {
      assetManager: 'inj1dg6tm62uup53wn2kn97caeqfwt0sukx3qjk8rw',
      connection: 'inj1eexvfglsptxwfj9hft96xcnsdrvr7d7dalcm8w',
      rateLimit: 'inj1x8p2h56edcdrm9tzx7a7zkwe0l334klgrxpqyk',
      xTokenManager: '',
    },
    chain: baseChainInfo[ChainKeys.INJECTIVE_MAINNET] satisfies BaseChainInfo<'INJECTIVE'>,
    nativeToken: 'inj' as const,
    bnUSD: 'factory/inj1d036ftaatxpkqsu9hja8r24rv3v33chz3appxp/bnUSD',
    networkId: 'injective-1',
    supportedTokens: injectiveSupportedTokens,
    gasPrice: '500000000inj',
    network: 'Mainnet',
    prefix: 'inj',
    isBrowser: false,
    rpcUrl: 'https://injective-rpc.publicnode.com:443',
    walletAddress: '',
    pollingConfig: {
      pollingIntervalMs: 750,
      maxTimeoutMs: 45_000,
    },
  } as const satisfies InjectiveSpokeChainConfig,
  [ChainKeys.BITCOIN_MAINNET]: {
    addresses: {
      assetManager: 'bc1pxguu2r4p9jcxp3gj7dh4r4jd9qzccwpyap3nj5nlapy28s76lhrqw522fz',
    },
    chain: baseChainInfo[ChainKeys.BITCOIN_MAINNET] satisfies BaseChainInfo<'BITCOIN'>,
    bnUSD: 'no',
    nativeToken: 'BTC' as const,
    supportedTokens: bitcoinSupportedTokens,
    radfi: {
      walletMode: 'TRADING',
      apiUrl: 'https://api.radfi.co/api',
      apiKey: '',
      umsUrl: 'https://ums.radfi.co/api',
      accessToken: '',
      refreshToken: '',
    },
    network: 'MAINNET',
    rpcUrl: 'https://mempool.space/api',
    pollingConfig: {
      pollingIntervalMs: 60_000,
      maxTimeoutMs: 3_600_000,
    },
  } as const satisfies BitcoinSpokeChainConfig,
  [ChainKeys.STELLAR_MAINNET]: {
    addresses: {
      connection: 'CDFQDDPUPAM3XPGORHDOEFRNLMKOH3N3X6XTXNLSXJQXIU3RVCM3OPEP',
      assetManager: 'CCGF33A4CO6D3BXFEKPXVCFCZBK76I3AQOZK6KIKRPAWAZR3632WHCJ3',
      xTokenManager: '',
      rateLimit: 'CB6G3ULISTTBPXUN3BI6ADHQGWJEN7BPQINHL45TCB6TDFM5QWU24HAY',
    },
    trustlineConfigs: [
      {
        assetCode: 'USDC',
        contractId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
        assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      },
      {
        assetCode: 'bnUSD',
        contractId: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
        assetIssuer: 'GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA',
      },
      {
        assetCode: 'SODA',
        contractId: 'CAH5LKJC2ZB4RVUVEVL2QWJWNJLHQE2UF767ILLQ5EQ4O3OURR2XIUGM',
        assetIssuer: 'GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA',
      },
    ],
    supportedTokens: stellarSupportedTokens,
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA' as const,
    bnUSD: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
    horizonRpcUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://rpc.ankr.com/stellar_soroban',
    chain: baseChainInfo[ChainKeys.STELLAR_MAINNET] satisfies BaseChainInfo<'STELLAR'>,
    pollingConfig: {
      pollingIntervalMs: 500,
      maxTimeoutMs: 30_000,
    },
    priorityFee: '10000',
    baseFee: '100',
  } as const satisfies StellarSpokeChainConfig,
  [ChainKeys.SUI_MAINNET]: {
    addresses: {
      connection:
        '0xf3b1e696a66d02cb776dc15aae73c68bc8f03adcb6ba0ec7f6332d9d90a6a3d2::connectionv3::0x3ee76d13909ac58ae13baab4c9be5a5142818d9a387aed641825e5d4356969bf',
      assetManagerConfigId: '0xcb7346339340b7f8dea40fcafb70721dc2fcfa7e8626a89fd954d46c1f928b61',
      assetManager:
        '0xa17a409164d1676db71b411ab50813ba2c7dd547d2df538c699049566f1ff922::asset_manager::0xcb7346339340b7f8dea40fcafb70721dc2fcfa7e8626a89fd954d46c1f928b61',
      xTokenManager: '',
      rateLimit: '',
    },
    supportedTokens: suiSupportedTokens,
    nativeToken: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI' as const,
    bnUSD: '0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD',
    rpc_url: 'https://fullnode.mainnet.sui.io:443',
    chain: baseChainInfo[ChainKeys.SUI_MAINNET] satisfies BaseChainInfo<'SUI'>,
    pollingConfig: {
      pollingIntervalMs: 500,
      maxTimeoutMs: 15_000,
    },
  } as const satisfies SuiSpokeChainConfig,
  [ChainKeys.ICON_MAINNET]: {
    rpcUrl: 'https://ctz.solidwallet.io/api/v3',
    debugRpcUrl: 'https://ctz.solidwallet.io/api/v3d',
    addresses: {
      assetManager: 'cx1be33c283c7dc7617181d1b21a6a2309e71b1ee7',
      connection: 'cxe5cdf3b0f26967b0efc72d470d57bbf534268f94',
      rateLimit: 'cxbbdcea9e6757023a046067ba8daa3c4c50304358',
      wICX: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
    },
    chain: baseChainInfo[ChainKeys.ICON_MAINNET] satisfies BaseChainInfo<'ICON'>,
    supportedTokens: iconSupportedTokens,
    nativeToken: 'cx0000000000000000000000000000000000000000' as const,
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    nid: '0x1',
    pollingConfig: {
      pollingIntervalMs: 2000,
      maxTimeoutMs: 90_000,
    },
  } as const satisfies IconSpokeChainConfig,
  [ChainKeys.NEAR_MAINNET]: {
    rpcUrl: 'https://1rpc.io/near',
    chain: baseChainInfo[ChainKeys.NEAR_MAINNET] as BaseChainInfo<'NEAR'>,
    nativeToken: 'NEAR',
    addresses: {
      assetManager: 'asset-manager.sodax.near',
      connection: 'connection.sodax.near',
      rateLimit: 'rate-limit.sodax.near',
      intentFiller: 'intent-filler.sodax.near',
    },
    supportedTokens: nearSupportedTokens,
    bnUSD: 'bnusd.sodax.near',
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 45_000,
    },
  } as const satisfies NearSpokeChainConfig,
  [ChainKeys.ETHEREUM_MAINNET]: {
    chain: baseChainInfo[ChainKeys.ETHEREUM_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://eth.merkle.io',
    addresses: {
      assetManager: '0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0x1f22279C89B213944b7Ea41daCB0a868DdCDFd13',
    supportedTokens: ethereumSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 12_000,
      maxTimeoutMs: 300_000,
    },
  } as const satisfies EvmSpokeChainConfig,
  [ChainKeys.KAIA_MAINNET]: {
    chain: baseChainInfo[ChainKeys.KAIA_MAINNET] satisfies BaseChainInfo<'EVM'>,
    rpcUrl: 'https://public-en.node.kaia.io',
    addresses: {
      assetManager: '0x6D2126DB97dd88AfA85127253807D04A066b6746',
      connection: '0x4555aC13D7338D9E671584C1D118c06B2a3C88eD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000' as const,
    bnUSD: '0xF8D13cAcb8E2B6BA8396DbA35a7365EF6b603cd6',
    supportedTokens: kaiaSupportedTokens,
    pollingConfig: {
      pollingIntervalMs: 1000,
      maxTimeoutMs: 60_000,
    },
  } as const satisfies EvmSpokeChainConfig,

  [ChainKeys.STACKS_MAINNET]: {
    addresses: {
      assetManager: 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-state',
      connection: 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.connection-v3',
      rateLimit: 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.rate-limit-state',
      xTokenManager: '',
    },
    chain: baseChainInfo[ChainKeys.STACKS_MAINNET] satisfies BaseChainInfo<'STACKS'>,
    nativeToken: 'ST000000000000000000002AMW42H.nativetoken' as const,
    bnUSD: 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.bnusd',
    supportedTokens: stacksSupportedTokens,
    rpcUrl: 'https://api.mainnet.hiro.so',
    pollingConfig: {
      pollingIntervalMs: 10_000,
      maxTimeoutMs: 120_000,
    },
  } as const satisfies StacksSpokeChainConfig,
} as const satisfies Record<SpokeChainKey, SpokeChainConfig>;

export const supportedSpokeChains: SpokeChainKey[] = Object.keys(spokeChainConfig) as SpokeChainKey[];

export type GetChainType<C extends SpokeChainKey | ChainType> = C extends ChainType
  ? C
  : C extends SpokeChainKey
    ? (typeof spokeChainConfig)[C]['chain']['type']
    : ChainType;

// bnUSD Migration configs
export const bnUSDLegacySpokeChainIds = [
  ChainKeys.ICON_MAINNET,
  ChainKeys.SUI_MAINNET,
  ChainKeys.STELLAR_MAINNET,
] as const;
export const newbnUSDSpokeChainIds = CHAIN_KEYS.filter(chainId => chainId !== ChainKeys.ICON_MAINNET);
export type LegacybnUSDChainId = (typeof bnUSDLegacySpokeChainIds)[number];

export const bnUSDLegacyTokens = [
  spokeChainConfig[ChainKeys.ICON_MAINNET].supportedTokens.bnUSD,
  spokeChainConfig[ChainKeys.SUI_MAINNET].supportedTokens.legacybnUSD,
  spokeChainConfig[ChainKeys.STELLAR_MAINNET].supportedTokens.legacybnUSD,
] as const;
export const bnUSDNewTokens = newbnUSDSpokeChainIds.map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD);

export type LegacybnUSDTokenAddress = (typeof bnUSDLegacyTokens)[number]['address'];
export type LegacybnUSDToken = (typeof bnUSDLegacyTokens)[number];
export type NewbnUSDChainId = (typeof newbnUSDSpokeChainIds)[number];

export const hubConfig = {
  chain: baseChainInfo[ChainKeys.SONIC_MAINNET] satisfies BaseChainInfo<'EVM'>,
  addresses: {
    assetManager: '0x60c5681bD1DB4e50735c4cA3386005A4BA4937C0',
    hubWallet: '0xA0ed3047D358648F2C0583B415CffCA571FDB544',
    xTokenManager: '0x5bD2843de9D6b0e6A05d0FB742072274EA3C6CA3',
    icxMigration: '0x8294DE9fc60F5ABCc19245E5857071d7C42B9875',
    balnSwap: '0x610a90B61b89a98b954d5750E94834Aa45d08d10',
    sodaToken: '0x7c7d53eecda37a87ce0d5bf8e0b24512a48dc963',
    sodaVault: '0x21685E341DE7844135329914Be6Bd8D16982d834',
    stakedSoda: '0x4333B324102d00392038ca92537DfbB8CB0DAc68',
    xSoda: '0xADC6561Cc8FC31767B4917CCc97F510D411378d9',
    stakingRouter: '0xE287Cd568543d880e0F0DfaDCE18B44930759367',
    walletRouter: '0xC67C3e55c665E78b25dc9829B3Aa5af47d914733',
  },
  nativeToken: '0x0000000000000000000000000000000000000000',
  wrappedNativeToken: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
  supportedTokens: sonicSupportedTokens,
  bnUSD: sonicSupportedTokens.bnUSD.address,
  pollingConfig: {
    pollingIntervalMs: 500,
    maxTimeoutMs: 30_000,
  },
  rpcUrl: 'https://rpc.soniclabs.com',
} as const satisfies HubConfig;

export type IntentRelayChainId = (typeof RelayChainIdMap)[keyof typeof RelayChainIdMap];
export type IntentRelayChainIdMap = Record<ChainKey, IntentRelayChainId>;
