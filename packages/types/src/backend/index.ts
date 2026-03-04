import type {
  SpokeChainId,
  Token,
  HubAsset,
  IntentRelayChainIdMap,
  SpokeChainConfigMap,
  Address,
} from '../common/index.js';

export type GetChainsApiResponse = readonly SpokeChainId[];
export type GetSwapTokensApiResponse = Record<SpokeChainId, readonly Token[]>;
export type GetSwapTokensByChainIdApiResponse = readonly Token[];
export type GetMoneyMarketTokensApiResponse = Record<SpokeChainId, readonly Token[]>;
export type GetMoneyMarketTokensByChainIdApiResponse = readonly Token[];
export type GetHubAssetsApiResponse = Record<SpokeChainId, Record<string, HubAsset>>;
export type GetHubAssetsByChainIdApiResponse = Record<string, HubAsset>;
export type GetRelayChainIdMapApiResponse = IntentRelayChainIdMap;
export type GetSpokeChainConfigApiResponse = SpokeChainConfigMap;
export type GetMoneyMarketReserveAssetsApiResponse = readonly Address[];
export type GetAllConfigApiResponse = {
  version?: number;
  supportedChains: GetChainsApiResponse;
  supportedSwapTokens: GetSwapTokensApiResponse;
  supportedMoneyMarketTokens: GetMoneyMarketTokensApiResponse;
  supportedMoneyMarketReserveAssets: GetMoneyMarketReserveAssetsApiResponse;
  supportedHubAssets: GetHubAssetsApiResponse;
  relayChainIdMap: GetRelayChainIdMapApiResponse;
  spokeChainConfig: GetSpokeChainConfigApiResponse;
};

export interface IConfigApi {
  getChains(): Promise<GetChainsApiResponse>;
  getSwapTokens(): Promise<GetSwapTokensApiResponse>;
  getSwapTokensByChainId(chainId: SpokeChainId): Promise<GetSwapTokensByChainIdApiResponse>;
  getMoneyMarketTokens(): Promise<GetMoneyMarketTokensApiResponse>;
  getMoneyMarketTokensByChainId(chainId: SpokeChainId): Promise<GetMoneyMarketTokensByChainIdApiResponse>;
  getHubAssets(): Promise<GetHubAssetsApiResponse>;
  getHubAssetsByChainId(chainId: SpokeChainId): Promise<GetHubAssetsByChainIdApiResponse>;
}
