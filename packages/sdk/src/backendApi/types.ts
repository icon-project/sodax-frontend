import type { SpokeChainId } from "../shared/constants.js";
import type { IntentRelayChainIdMap, Token } from "../shared/types.js";

export type GetChainsApiResponse = readonly SpokeChainId[];
export type GetSwapTokensApiResponse = Record<SpokeChainId, readonly Token[]>;
export type GetSwapTokensByChainIdApiResponse = readonly Token[];
export type GetMoneyMarketTokensApiResponse = Record<SpokeChainId, readonly Token[]>;
export type GetMoneyMarketTokensByChainIdApiResponse = readonly Token[];
export type GetRelayChainIdMapApiResponse = IntentRelayChainIdMap;
export type GetSpokeChainConfigApiResponse = SpokeChainConfigMap;
export type GetMoneyMarketReserveAssetsApiResponse = readonly Address[];
export type GetAllConfigApiResponse = {
  version?: number;
  supportedChains: GetChainsApiResponse;
  supportedSwapTokens: GetSwapTokensApiResponse;
  supportedMoneyMarketTokens: GetMoneyMarketTokensApiResponse;
  supportedMoneyMarketReserveAssets: GetMoneyMarketReserveAssetsApiResponse;
  relayChainIdMap: GetRelayChainIdMapApiResponse;
  spokeChainConfig: GetSpokeChainConfigApiResponse;
};

export interface IConfigApi {
  getChains(): Promise<GetChainsApiResponse>;
  getSwapTokens(): Promise<GetSwapTokensApiResponse>;
  getSwapTokensByChainId(chainId: SpokeChainId): Promise<GetSwapTokensByChainIdApiResponse>;
  getMoneyMarketTokens(): Promise<GetMoneyMarketTokensApiResponse>;
  getMoneyMarketTokensByChainId(chainId: SpokeChainId): Promise<GetMoneyMarketTokensByChainIdApiResponse>;
}

// Swap submit-tx types
export interface SwapIntentData {
  intentId: string;
  creator: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  minOutputAmount: string;
  deadline: string;
  allowPartialFill: boolean;
  srcChain: number;
  dstChain: number;
  srcAddress: string;
  dstAddress: string;
  solver: string;
  data: string;
}

export interface SubmitSwapTxRequest {
  txHash: string;
  srcChainId: string;
  walletAddress: string;
  intent: SwapIntentData;
  relayData: string;
}

export interface SubmitSwapTxResponse {
  success: boolean;
  message: string;
}

export interface GetSubmitSwapTxStatusParams {
  txHash: string;
  srcChainId?: string;
}

export interface SubmitSwapTxStatusResult {
  dstIntentTxHash: string;
  packetData?: Record<string, unknown>;
  intent_hash?: string;
}

export type SubmitSwapTxStatus =
  | 'pending'
  | 'verifying'
  | 'verified'
  | 'relaying'
  | 'relayed'
  | 'posting_execution'
  | 'executed'
  | 'failed';

export interface SubmitSwapTxStatusData {
  txHash: string;
  srcChainId: string;
  status: SubmitSwapTxStatus;
  failedAtStep?: string;
  failureReason?: string;
  failedAttempts: number;
  result?: SubmitSwapTxStatusResult;
}

export interface SubmitSwapTxStatusResponse {
  success: boolean;
  data: SubmitSwapTxStatusData;
}