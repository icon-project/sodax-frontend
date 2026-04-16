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


// export const isMoneyMarketReserveHubAsset = (hubAsset: Address): boolean =>
//   moneyMarketReserveHubAssetsSet.has(hubAsset.toLowerCase() as Address);

// export const originalAssetTohubAssetMap: Map<SpokeChainKey, Map<OriginalAssetAddress, HubAssetInfo>> = new Map(
//   Object.entries(hubAssets).map(([chainId, assets]) => [
//     chainId as SpokeChainKey,
//     new Map(Object.entries(assets).map(([asset, info]) => [asset.toLowerCase(), info])),
//   ]),
// );
// export const hubAssetToOriginalAssetMap: Map<SpokeChainKey, Map<Address, OriginalAssetAddress>> = new Map(
//   Object.entries(hubAssets).map(([chainId, assets]) => [
//     chainId as SpokeChainKey,
//     new Map(Object.entries(assets).map(([asset, info]) => [info.asset.toLowerCase() as Address, asset])),
//   ]),
// );
// export const chainIdToHubAssetsMap: Map<SpokeChainKey, Map<Address, HubAssetInfo>> = new Map(
//   Object.entries(hubAssets).map(([chainId, assets]) => [
//     chainId as SpokeChainKey,
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
// export const getOriginalAssetInfoFromVault = (chainId: SpokeChainKey, vault: Address): OriginalAssetAddress[] => {
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
// export const getHubAssetInfo = (chainId: SpokeChainKey, asset: OriginalAssetAddress): HubAssetInfo | undefined =>
//   originalAssetTohubAssetMap.get(chainId)?.get(asset.toLowerCase());
// export const isValidOriginalAssetAddress = (chainId: SpokeChainKey, asset: OriginalAssetAddress): boolean =>
//   originalAssetTohubAssetMap.get(chainId)?.has(asset.toLowerCase()) ?? false;
// export const getOriginalAssetAddress = (chainId: SpokeChainKey, hubAsset: Address): OriginalAssetAddress | undefined =>
//   hubAssetToOriginalAssetMap.get(chainId)?.get(hubAsset.toLowerCase() as Address);
// export const getOriginalTokenFromOriginalAssetAddress = (
//   chainId: SpokeChainKey,
//   asset: OriginalAssetAddress,
// ): XToken | undefined =>
//   Object.values(spokeChainConfig[chainId].supportedTokens).find(t => t.address.toLowerCase() === asset.toLowerCase()) ??
//   undefined;
// export const isValidHubAsset = (hubAsset: Address): boolean =>
//   supportedHubAssets.has(hubAsset.toLowerCase() as Address);
// export const isValidVault = (vault: Address): boolean => supportedSodaAssets.has(vault.toLowerCase() as Address);
// export const isValidChainHubAsset = (chainId: SpokeChainKey, hubAsset: Address): boolean =>
//   chainIdToHubAssetsMap.get(chainId)?.has(hubAsset.toLowerCase() as Address) ?? false;
// export const isValidSpokeChainKey = (chainId: SpokeChainKey): boolean => spokeChainIdsSet.has(chainId);
// export const isValidIntentRelayChainId = (chainId: bigint): boolean =>
//   Object.values(ChainIdToIntentRelayChainId).some(id => id === chainId);
// export const supportedHubChains: HubChainKey[] = Object.keys(hubChainConfig) as HubChainKey[];
// export const intentRelayChainIdToSpokeChainKeyMap: Map<IntentRelayChainId, SpokeChainKey> = new Map(
//   Object.entries(ChainIdToIntentRelayChainId).map(([chainId, intentRelayChainId]) => [
//     intentRelayChainId,
//     chainId as SpokeChainKey,
//   ]),
// );
// export const supportedTokensPerChain: Map<SpokeChainKey, readonly XToken[]> = new Map(
//   Object.entries(spokeChainConfig).map(([chainId, config]) => [
//     chainId as SpokeChainKey,
//     Object.values(config.supportedTokens),
//   ]),
// );

// export const getSpokeChainKeyFromIntentRelayChainId = (intentRelayChainId: IntentRelayChainId): SpokeChainKey => {
//   const spokeChainId = intentRelayChainIdToSpokeChainKeyMap.get(intentRelayChainId);
//   if (!spokeChainId) {
//     throw new Error(`Invalid intent relay chain id: ${intentRelayChainId}`);
//   }
//   return spokeChainId;
// };
// export const isNativeToken = (chainId: SpokeChainKey, token: Token | string): boolean => {
//   if (typeof token === 'string') {
//     return token.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
//   }

//   return token.address.toLowerCase() === spokeChainConfig[chainId].nativeToken.toLowerCase();
// };

// export const findSupportedTokenBySymbol = (chainId: SpokeChainKey, symbol: string): XToken | undefined => {
//   const supportedTokens = Object.values(spokeChainConfig[chainId].supportedTokens);
//   return supportedTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
// };
