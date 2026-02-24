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

// AMM NFT Positions types
export interface AMMNftPosition {
  tokenId: string;
  owner: string;
  poolId200: string;
  currency0: string;
  currency1: string;
}

export interface PaginationResponse {
  offset: number;
  limit: number;
  returned: number;
  hasMore: boolean;
  nextOffset: number;
}

export interface AMMNftPositionsResponse {
  items: AMMNftPosition[];
  pagination: PaginationResponse;
}
