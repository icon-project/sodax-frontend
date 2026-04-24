import type { SpokeChainKey, IntentRelayChainIdMap } from '../chains/chains.js';
import type { XToken } from '../chains/tokens.js';
import type { Result, SpokeChainConfigMap } from '../common/common.js';
import type { Address } from '../shared/shared.js';
import type { SodaxConfig } from '../sodax-config/sodax-config.js';

export type GetChainsApiResponse = readonly SpokeChainKey[];
export type GetSwapTokensApiResponse = Record<SpokeChainKey, readonly XToken[]>;
export type GetSwapTokensByChainIdApiResponse = readonly XToken[];
export type GetMoneyMarketTokensApiResponse = Record<SpokeChainKey, readonly XToken[]>;
export type GetMoneyMarketTokensByChainIdApiResponse = readonly XToken[];
export type GetRelayChainIdMapApiResponse = IntentRelayChainIdMap;
export type GetSpokeChainConfigApiResponse = SpokeChainConfigMap;
export type GetMoneyMarketReserveAssetsApiResponse = readonly Address[];

export type GetAllConfigApiResponse = {
  version?: number;
  config: SodaxConfig;
};

export interface IConfigApi {
  getChains(): Promise<Result<GetChainsApiResponse>>;
  getSwapTokens(): Promise<Result<GetSwapTokensApiResponse>>;
  getSwapTokensByChainId(chainId: SpokeChainKey): Promise<Result<GetSwapTokensByChainIdApiResponse>>;
  getMoneyMarketTokens(): Promise<Result<GetMoneyMarketTokensApiResponse>>;
  getMoneyMarketTokensByChainId(chainId: SpokeChainKey): Promise<Result<GetMoneyMarketTokensByChainIdApiResponse>>;
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
  srcChainKey: string;
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
  srcChainKey?: string;
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
  srcChainKey: string;
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
