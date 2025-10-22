import { defineChain, type Address, type Chain } from 'viem';
import { arbitrum, avalanche, base, bsc, nibiru, optimism, polygon, sonic, lightlinkPhoenix } from 'viem/chains';
import type {
  EvmHubChainConfig,
  HubAssetInfo,
  LegacybnUSDChainId,
  LegacybnUSDToken,
  NewbnUSDChainId,
  BaseSpokeChainInfo,
} from './index.js';
import {
  type ChainId,
  type Token,
  type SpokeChainId,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
  INJECTIVE_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  type HubChainId,
  CHAIN_IDS,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  getMoneyMarketConfig,
  spokeChainConfig,
  ChainIdToIntentRelayChainId,
  hubVaults,
  hubAssets,
  type IntentRelayChainId,
  type OriginalAssetAddress,
  type EvmChainId,
  type XToken,
  baseChainInfo,
} from '@sodax/types';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RELAY_TX_TIMEOUT = 120000; // 120 seconds
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;
export const MAX_UINT256 = (1n << 256n) - 1n;
export const FEE_PERCENTAGE_SCALE = 10000n; // 100% = 10000
export const STELLAR_PRIORITY_FEE = '10000';
export const STELLAR_DEFAULT_TX_TIMEOUT_SECONDS = 100;
export const DEFAULT_DEADLINE_OFFSET = 300n; // 5 minutes in seconds
export const DEFAULT_BACKEND_API_ENDPOINT = 'https://apiv1.coolify.iconblockchain.xyz';
export const DEFAULT_BACKEND_API_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_BACKEND_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const VAULT_TOKEN_DECIMALS = 18;

// HyperEVM chain is not supported by viem, so we need to define it manually
export const hyper = /*#__PURE__*/ defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVMScan',
      url: 'https://hyperevmscan.io/',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
});

export function getEvmViemChain(id: EvmChainId): Chain {
  switch (id) {
    case SONIC_MAINNET_CHAIN_ID:
      return sonic;
    case AVALANCHE_MAINNET_CHAIN_ID:
      return avalanche;
    case ARBITRUM_MAINNET_CHAIN_ID:
      return arbitrum;
    case BASE_MAINNET_CHAIN_ID:
      return base;
    case OPTIMISM_MAINNET_CHAIN_ID:
      return optimism;
    case BSC_MAINNET_CHAIN_ID:
      return bsc;
    case POLYGON_MAINNET_CHAIN_ID:
      return polygon;
    case NIBIRU_MAINNET_CHAIN_ID:
      return nibiru;
    case HYPEREVM_MAINNET_CHAIN_ID:
      return hyper;
    case LIGHTLINK_MAINNET_CHAIN_ID:
      return lightlinkPhoenix;
    default:
      throw new Error(`Unsupported EVM chain ID: ${id}`);
  }
}

const hubChainConfig: Record<HubChainId, EvmHubChainConfig> = {
  [SONIC_MAINNET_CHAIN_ID]: {
    chain: {
      name: 'Sonic',
      id: SONIC_MAINNET_CHAIN_ID,
      type: 'EVM',
    },
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
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    wrappedNativeToken: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    supportedTokens: [],
  } satisfies EvmHubChainConfig,
} as const;

export const getHubChainConfig = (chainId: HubChainId): EvmHubChainConfig => hubChainConfig[chainId];

// bnUSD Migration configs
export const bnUSDLegacySpokeChainIds = [
  ICON_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
] as const;
export const newbnUSDSpokeChainIds = CHAIN_IDS.filter(chainId => chainId !== ICON_MAINNET_CHAIN_ID);
export const bnUSDLegacyTokens = [
  spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  spokeChainConfig[SUI_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD,
  spokeChainConfig[STELLAR_MAINNET_CHAIN_ID].supportedTokens.legacybnUSD,
] as const;
export const bnUSDNewTokens = newbnUSDSpokeChainIds.map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD);

export const isLegacybnUSDChainId = (chainId: SpokeChainId): boolean => {
  return bnUSDLegacySpokeChainIds.includes(chainId as LegacybnUSDChainId);
};

export const isNewbnUSDChainId = (chainId: SpokeChainId): boolean => {
  return newbnUSDSpokeChainIds.includes(chainId as NewbnUSDChainId);
};

export const isLegacybnUSDToken = (token: Token | string): boolean => {
  if (typeof token === 'string') {
    return bnUSDLegacyTokens.some(t => t.address.toLowerCase() === token.toLowerCase());
  }

  return bnUSDLegacyTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase());
};

export const isNewbnUSDToken = (token: Token | string): boolean => {
  if (typeof token === 'string') {
    return newbnUSDSpokeChainIds
      .map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD)
      .some(t => t.address.toLowerCase() === token.toLowerCase());
  }
  return newbnUSDSpokeChainIds
    .map(chainId => spokeChainConfig[chainId].supportedTokens.bnUSD)
    .some(t => t.address.toLowerCase() === token.address.toLowerCase());
};

export const getAllLegacybnUSDTokens = (): { token: LegacybnUSDToken; chainId: LegacybnUSDChainId }[] => {
  return bnUSDLegacySpokeChainIds.map(chainId => ({
    token: spokeChainConfig[chainId].supportedTokens.legacybnUSD,
    chainId,
  }));
};

export const DEFAULT_RELAYER_API_ENDPOINT = 'https://xcall-relay.nw.iconblockchain.xyz';

export const hubVaultsAddressSet = new Set<Address>(
  Object.values(hubVaults).map(vault => vault.address.toLowerCase() as Address),
);

// all hub assets contained in the money market reserves (supply / borrow assets)
export const moneyMarketReserveHubAssetsSet = new Set<Address>(
  Object.values(hubVaults).flatMap(vault => vault.reserves.map(reserve => reserve.toLowerCase() as Address)),
);

export const isMoneyMarketReserveHubAsset = (hubAsset: Address): boolean =>
  moneyMarketReserveHubAssetsSet.has(hubAsset.toLowerCase() as Address);

export const moneyMarketReserveAssets = [
  ...Object.values(hubVaults).map(vault => vault.address),
  getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault,
] as const;

export const isMoneyMarketReserveAsset = (asset: Address): boolean =>
  moneyMarketReserveAssets.map(a => a.toLowerCase()).includes(asset.toLowerCase());

export const originalAssetTohubAssetMap: Map<SpokeChainId, Map<OriginalAssetAddress, HubAssetInfo>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    chainId as SpokeChainId,
    new Map(Object.entries(assets).map(([asset, info]) => [asset.toLowerCase(), info])),
  ]),
);
export const hubAssetToOriginalAssetMap: Map<SpokeChainId, Map<Address, OriginalAssetAddress>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    chainId as SpokeChainId,
    new Map(Object.entries(assets).map(([asset, info]) => [info.asset.toLowerCase() as Address, asset])),
  ]),
);
export const chainIdToHubAssetsMap: Map<SpokeChainId, Map<Address, HubAssetInfo>> = new Map(
  Object.entries(hubAssets).map(([chainId, assets]) => [
    chainId as SpokeChainId,
    new Map(Object.entries(assets).map(([, info]) => [info.asset.toLowerCase() as Address, info])),
  ]),
);
export const supportedHubAssets: Set<Address> = new Set(
  Object.values(hubAssets).flatMap(assets => Object.values(assets).map(info => info.asset.toLowerCase() as Address)),
);
export const supportedSodaAssets: Set<Address> = new Set(
  Object.values(hubAssets).flatMap(assets => Object.values(assets).map(info => info.vault.toLowerCase() as Address)),
);
export const spokeChainIdsSet = new Set(CHAIN_IDS);

// Returns the first hub asset info for a given chainId whose vault address matches the provided vault address (case-insensitive)
export const getOriginalAssetInfoFromVault = (chainId: SpokeChainId, vault: Address): OriginalAssetAddress[] => {
  const assets = hubAssets[chainId];
  if (!assets) {
    return [];
  }
  const vaultAddress = vault.toLowerCase();
  const result: OriginalAssetAddress[] = [];
  for (const [spokeToken, info] of Object.entries(assets)) {
    if (info.vault.toLowerCase() === vaultAddress) {
      result.push(spokeToken);
    }
  }
  return result;
};
export const getHubAssetInfo = (chainId: SpokeChainId, asset: OriginalAssetAddress): HubAssetInfo | undefined =>
  originalAssetTohubAssetMap.get(chainId)?.get(asset.toLowerCase());
export const isValidOriginalAssetAddress = (chainId: SpokeChainId, asset: OriginalAssetAddress): boolean =>
  originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
export const getOriginalAssetAddress = (chainId: SpokeChainId, hubAsset: Address): OriginalAssetAddress | undefined =>
  hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
export const getOriginalTokenFromOriginalAssetAddress = (
  chainId: SpokeChainId,
  asset: OriginalAssetAddress,
): XToken | undefined =>
  Object.values(spokeChainConfig[chainId].supportedTokens).find(t => t.address.toLowerCase() === asset.toLowerCase()) ??
  undefined;
export const isValidHubAsset = (hubAsset: Address): boolean =>
  supportedHubAssets.has(hubAsset.toLowerCase() as Address);
export const isValidVault = (vault: Address): boolean => supportedSodaAssets.has(vault.toLowerCase() as Address);
export const isValidChainHubAsset = (chainId: SpokeChainId, hubAsset: Address): boolean =>
  chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
export const isValidSpokeChainId = (chainId: SpokeChainId): boolean => spokeChainIdsSet.has(chainId);
export const isValidIntentRelayChainId = (chainId: bigint): boolean =>
  Object.values(ChainIdToIntentRelayChainId).some(id => id === chainId);
export const supportedHubChains: HubChainId[] = Object.keys(hubChainConfig) as HubChainId[];
export const supportedSpokeChains: SpokeChainId[] = Object.keys(spokeChainConfig) as SpokeChainId[];
export const intentRelayChainIdToSpokeChainIdMap: Map<IntentRelayChainId, SpokeChainId> = new Map(
  Object.entries(ChainIdToIntentRelayChainId).map(([chainId, intentRelayChainId]) => [
    intentRelayChainId,
    chainId as SpokeChainId,
  ]),
);
export const supportedTokensPerChain: Map<SpokeChainId, readonly XToken[]> = new Map(
  Object.entries(spokeChainConfig).map(([chainId, config]) => [
    chainId as SpokeChainId,
    Object.values(config.supportedTokens),
  ]),
);

export const getSpokeChainIdFromIntentRelayChainId = (intentRelayChainId: IntentRelayChainId): SpokeChainId => {
  const spokeChainId = intentRelayChainIdToSpokeChainIdMap.get(intentRelayChainId);
  if (!spokeChainId) {
    throw new Error(`Invalid intent relay chain id: ${intentRelayChainId}`);
  }
  return spokeChainId;
};
export const isNativeToken = (chainId: SpokeChainId, token: Token | string): boolean => {
  if (typeof token === 'string') {
    return token.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
  }

  return token.address.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
};
export const findSupportedTokenBySymbol = (chainId: SpokeChainId, symbol: string): XToken | undefined => {
  const supportedTokens = Object.values(spokeChainConfig[chainId].supportedTokens);
  return supportedTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
};
