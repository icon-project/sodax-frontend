import type {
  HUB_CHAIN_IDS,
  CHAIN_IDS,
  EVM_CHAIN_IDS,
  ChainIdToIntentRelayChainId,
  HubVaultSymbols,
} from '../constants/index.js';
import type { InjectiveNetworkEnv } from '../injective/index.js';

export type HubChainId = (typeof HUB_CHAIN_IDS)[number];

export type SpokeChainId = (typeof CHAIN_IDS)[number];

export type ChainId = (typeof CHAIN_IDS)[number];

export type ChainType = 'ICON' | 'EVM' | 'INJECTIVE' | 'SUI' | 'STELLAR' | 'SOLANA';

export type Chain = {
  id: string | number;
  name: string;
  testnet: boolean;
};

export type XChain = Chain & {
  xChainId: ChainId;
  xChainType: ChainType;
};

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type XToken = Token & {
  xChainId: ChainId;
};

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type Address = `0x${string}`;
export type HubAddress = Address;
export type OriginalAssetAddress = string;

export interface WalletAddressProvider {
  getWalletAddress(): Promise<string>; // The wallet address as a string
}

export type HttpUrl = `http://${string}` | `https://${string}`;

export type RpcConfig = {
  // EVM chains - all use string RPC URLs
  sonic?: string;
  '0xa86a.avax'?: string;
  '0xa4b1.arbitrum'?: string;
  '0x2105.base'?: string;
  '0x38.bsc'?: string;
  '0xa.optimism'?: string;
  '0x89.polygon'?: string;
  nibiru?: string;

  // Other chains - all use string RPC URLs
  'injective-1'?: string;
  sui?: string;
  solana?: string;
  '0x1.icon'?: string;

  // Stellar - uses object with horizon and soroban RPC URLs
  stellar?: {
    horizonRpcUrl?: HttpUrl;
    sorobanRpcUrl?: HttpUrl;
  };
};

export type IntentRelayChainId = (typeof ChainIdToIntentRelayChainId)[keyof typeof ChainIdToIntentRelayChainId];
export type HubVaultSymbol = (typeof HubVaultSymbols)[number];
export type EvmChainId = (typeof EVM_CHAIN_IDS)[number];
export type EvmSpokeChainId = (typeof EVM_CHAIN_IDS)[number];

export type GetSpokeChainIdType<T extends ChainType> = T extends 'EVM' ? EvmSpokeChainId : SpokeChainId;

export type BaseSpokeChainInfo<T extends ChainType> = {
  name: string;
  id: GetSpokeChainIdType<T>;
  type: T;
};

export type SpokeChainInfo<T extends ChainType> = BaseSpokeChainInfo<T>;

export type BaseSpokeChainConfig<T extends ChainType> = {
  chain: SpokeChainInfo<T>;
  addresses: { [key: string]: string | Uint8Array };
  supportedTokens: Record<string, XToken>;
  nativeToken: string;
  bnUSD: string;
};

export type SonicSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    walletRouter: Address;
    wrappedSonic: Address;
  };
  nativeToken: Address;
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
    testToken: string;
  };
  horizonRpcUrl: HttpUrl;
  sorobanRpcUrl: HttpUrl;
  trustlineConfigs: StellarAssetTrustline[];
};

export type InjectiveSpokeChainConfig = BaseSpokeChainConfig<'INJECTIVE'> & {
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
  network: InjectiveNetworkEnv;
};

export type EvmSpokeChainConfig = BaseSpokeChainConfig<'EVM'> & {
  addresses: {
    assetManager: Address;
    connection: Address;
  };
  nativeToken: string;
};

export type SuiSpokeChainConfig = BaseSpokeChainConfig<'SUI'> & {
  addresses: {
    originalAssetManager: string;
    assetManagerConfigId: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  rpc_url: string;
};

export type IconAddress = `hx${string}` | `cx${string}`;
export type IconSpokeChainConfig = BaseSpokeChainConfig<'ICON'> & {
  addresses: {
    assetManager: IconAddress;
    connection: IconAddress;
    rateLimit: IconAddress;
    wICX: `cx${string}`;
  };
  nid: Hex;
};

export type SpokeChainConfig =
  | EvmSpokeChainConfig
  | SonicSpokeChainConfig
  | InjectiveSpokeChainConfig
  | IconSpokeChainConfig
  | SuiSpokeChainConfig
  | StellarSpokeChainConfig
  | SolanaChainConfig;

export type SolverConfig = {
  intentsContract: Address; // Intents Contract (Hub)
  solverApiEndpoint: HttpUrl;
};

export type MoneyMarketConfig = {
  uiPoolDataProvider: Address;
  lendingPool: Address;
  poolAddressesProvider: Address;
  bnUSD: Address;
  bnUSDVault: Address;
};

export type VaultType = {
  address: Address; // vault address
  reserves: Address[]; // hub asset addresses contained in the vault
};

export type HubAsset = {
  asset: Address;
  decimal: number;
  vault: Address;
  symbol: string;
  name: string;
};
