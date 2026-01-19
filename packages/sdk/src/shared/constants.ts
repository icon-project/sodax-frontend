import { defineChain, type Chain } from 'viem';
import { arbitrum, avalanche, base, bsc, optimism, polygon, sonic, lightlinkPhoenix, mainnet } from 'viem/chains';
import type { LegacybnUSDChainId, LegacybnUSDToken, NewbnUSDChainId } from '../index.js';
import {
  type Token,
  type SpokeChainId,
  AVALANCHE_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  OPTIMISM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  CHAIN_IDS,
  HYPEREVM_MAINNET_CHAIN_ID,
  LIGHTLINK_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type EvmChainId,
  ETHEREUM_MAINNET_CHAIN_ID,
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
export const DEFAULT_BACKEND_API_ENDPOINT = 'https://api.sodax.com/v1/be';
export const DEFAULT_BACKEND_API_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_BACKEND_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
export const DEFAULT_RELAYER_API_ENDPOINT = 'https://xcall-relay.nw.iconblockchain.xyz';
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
    case HYPEREVM_MAINNET_CHAIN_ID:
      return hyper;
    case LIGHTLINK_MAINNET_CHAIN_ID:
      return lightlinkPhoenix;
    case ETHEREUM_MAINNET_CHAIN_ID:
      return mainnet;
    default:
      throw new Error(`Unsupported EVM chain ID: ${id}`);
  }
}

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

// export const isMoneyMarketReserveHubAsset = (hubAsset: Address): boolean =>
//   moneyMarketReserveHubAssetsSet.has(hubAsset.toLowerCase() as Address);

// export const originalAssetTohubAssetMap: Map<SpokeChainId, Map<OriginalAssetAddress, HubAssetInfo>> = new Map(
//   Object.entries(hubAssets).map(([chainId, assets]) => [
//     chainId as SpokeChainId,
//     new Map(Object.entries(assets).map(([asset, info]) => [asset.toLowerCase(), info])),
//   ]),
// );
// export const hubAssetToOriginalAssetMap: Map<SpokeChainId, Map<Address, OriginalAssetAddress>> = new Map(
//   Object.entries(hubAssets).map(([chainId, assets]) => [
//     chainId as SpokeChainId,
//     new Map(Object.entries(assets).map(([asset, info]) => [info.asset.toLowerCase() as Address, asset])),
//   ]),
// );
// export const chainIdToHubAssetsMap: Map<SpokeChainId, Map<Address, HubAssetInfo>> = new Map(
//   Object.entries(hubAssets).map(([chainId, assets]) => [
//     chainId as SpokeChainId,
//     new Map(Object.entries(assets).map(([, info]) => [info.asset.toLowerCase() as Address, info])),
//   ]),
// );
// export const supportedHubAssets: Set<Address> = new Set(
//   Object.values(hubAssets).flatMap(assets => Object.values(assets).map(info => info.asset.toLowerCase() as Address)),
// );
// export const supportedSodaAssets: Set<Address> = new Set(
//   Object.values(hubAssets).flatMap(assets => Object.values(assets).map(info => info.vault.toLowerCase() as Address)),
// );
// export const spokeChainIdsSet = new Set(CHAIN_IDS);

// Returns the first hub asset info for a given chainId whose vault address matches the provided vault address (case-insensitive)
// export const getOriginalAssetInfoFromVault = (chainId: SpokeChainId, vault: Address): OriginalAssetAddress[] => {
//   const assets = hubAssets[chainId];
//   if (!assets) {
//     return [];
//   }
//   const vaultAddress = vault.toLowerCase();
//   const result: OriginalAssetAddress[] = [];
//   for (const [spokeToken, info] of Object.entries(assets)) {
//     if (info.vault.toLowerCase() === vaultAddress) {
//       result.push(spokeToken);
//     }
//   }
//   return result;
// };
// export const getHubAssetInfo = (chainId: SpokeChainId, asset: OriginalAssetAddress): HubAssetInfo | undefined =>
//   originalAssetTohubAssetMap.get(chainId)?.get(asset.toLowerCase());
// export const isValidOriginalAssetAddress = (chainId: SpokeChainId, asset: OriginalAssetAddress): boolean =>
//   originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
// export const getOriginalAssetAddress = (chainId: SpokeChainId, hubAsset: Address): OriginalAssetAddress | undefined =>
//   hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
// export const getOriginalTokenFromOriginalAssetAddress = (
//   chainId: SpokeChainId,
//   asset: OriginalAssetAddress,
// ): XToken | undefined =>
//   Object.values(spokeChainConfig[chainId].supportedTokens).find(t => t.address.toLowerCase() === asset.toLowerCase()) ??
//   undefined;
// export const isValidHubAsset = (hubAsset: Address): boolean =>
//   supportedHubAssets.has(hubAsset.toLowerCase() as Address);
// export const isValidVault = (vault: Address): boolean => supportedSodaAssets.has(vault.toLowerCase() as Address);
// export const isValidChainHubAsset = (chainId: SpokeChainId, hubAsset: Address): boolean =>
//   chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
// export const isValidSpokeChainId = (chainId: SpokeChainId): boolean => spokeChainIdsSet.has(chainId);
// export const isValidIntentRelayChainId = (chainId: bigint): boolean =>
//   Object.values(ChainIdToIntentRelayChainId).some(id => id === chainId);
// export const supportedHubChains: HubChainId[] = Object.keys(hubChainConfig) as HubChainId[];
// export const intentRelayChainIdToSpokeChainIdMap: Map<IntentRelayChainId, SpokeChainId> = new Map(
//   Object.entries(ChainIdToIntentRelayChainId).map(([chainId, intentRelayChainId]) => [
//     intentRelayChainId,
//     chainId as SpokeChainId,
//   ]),
// );
// export const supportedTokensPerChain: Map<SpokeChainId, readonly XToken[]> = new Map(
//   Object.entries(spokeChainConfig).map(([chainId, config]) => [
//     chainId as SpokeChainId,
//     Object.values(config.supportedTokens),
//   ]),
// );

// export const getSpokeChainIdFromIntentRelayChainId = (intentRelayChainId: IntentRelayChainId): SpokeChainId => {
//   const spokeChainId = intentRelayChainIdToSpokeChainIdMap.get(intentRelayChainId);
//   if (!spokeChainId) {
//     throw new Error(`Invalid intent relay chain id: ${intentRelayChainId}`);
//   }
//   return spokeChainId;
// };
// export const isNativeToken = (chainId: SpokeChainId, token: Token | string): boolean => {
//   if (typeof token === 'string') {
//     return token.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
//   }

//   return token.address.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
// };

// export const findSupportedTokenBySymbol = (chainId: SpokeChainId, symbol: string): XToken | undefined => {
//   const supportedTokens = Object.values(spokeChainConfig[chainId].supportedTokens);
//   return supportedTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
// };
