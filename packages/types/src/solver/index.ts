import type { IntentRelayChainId, SpokeChainId } from '../chain/index.js';
import type { IntentRelayRequest, WaitUntilIntentExecutedPayload, RelayErrorCode } from '../relay/index.js';
import type { EvmAddress, Hex, HttpUrl, PartnerFeeConfig, RelayerApiConfig } from '../shared/index.js';
import type { Optional, Prettify } from '../util/index.js';

/**
 * Solver types
 */

export type SolverConfig = {
  intentsContract: EvmAddress; // Intents Contract (Hub)
  solverApiEndpoint: HttpUrl;
};

export type SolverConfigParams =
  | Prettify<SolverConfig & Optional<PartnerFeeConfig, 'partnerFee'>>
  | Optional<PartnerFeeConfig, 'partnerFee'>;

export type SolverServiceConfig = Prettify<SolverConfig & PartnerFeeConfig & RelayerApiConfig>;

export type QuoteType = 'exact_input' | 'exact_output';

export type IntentQuoteRequest = {
  token_src: string; // Token address on the source chain
  token_src_blockchain_id: SpokeChainId; // Source chain id
  token_dst: string; // Token address on the destination chain
  token_dst_blockchain_id: SpokeChainId; // Destination chain id
  amount: bigint; // Amount to swap
  quote_type: QuoteType; // Quote type
};

export type IntentQuoteResponseRaw = {
  quoted_amount: string;
};

export type IntentQuoteResponse = {
  quoted_amount: bigint;
};

export type IntentErrorResponse = {
  detail: {
    code: IntentErrorCode;
    message: string;
  };
};

export type IntentExecutionRequest = {
  intent_tx_hash: Hex; // Intent hash of the execution on Sonic
};

export type IntentExecutionResponse = {
  answer: 'OK';
  intent_hash: Hex; // Here, the solver returns the intent_hash, might be helpful for front-end
};

export type IntentStatusRequest = {
  intent_tx_hash: Hex;
};

export type IntentStatusResponse = {
  status: IntentStatusCode;
  fill_tx_hash?: string; // defined only if status is 3
};

export enum IntentStatusCode {
  NOT_FOUND = -1,
  NOT_STARTED_YET = 1, // It's in the task pool, but not started yet
  STARTED_NOT_FINISHED = 2,
  SOLVED = 3,
  FAILED = 4,
}

export enum IntentErrorCode {
  NO_PATH_FOUND = -4, // No path to swap Token X to Token Y
  NO_PRIVATE_LIQUIDITY = -5, // Path found, but we have no private liquidity on the dest chain
  NOT_ENOUGH_PRIVATE_LIQUIDITY = -8, // Path found, but not enough private liquidity on the dst chain
  NO_EXECUTION_MODULE_FOUND = -7, // Path found, private liquidity, but execution modules unavailable
  QUOTE_NOT_FOUND = -8, // When executing, given quote_uuid does not exist
  QUOTE_NOT_MATCH = -9, // When executing, given quote_uuid does not match the quote
  INTENT_DATA_NOT_MATCH_QUOTE = -10,
  NO_GAS_HANDLER_FOR_BLOCKCHAIN = -11,
  INTENT_NOT_FOUND = -12,
  QUOTE_EXPIRED = -13,
  MAX_INPUT_AMOUNT = -14,
  MAX_DIFF_OUTPUT = -15,
  STOPPED = -16,
  NO_ORACLE_MODULE_FOUND = -17,
  NEGATIVE_INPUT_AMOUNT = -18,
  INTENT_ALREADY_IN_ORDERBOOK = -19,
  CREATE_INTENT_ORDER_FAILED = -998,
  UNKNOWN = -999,
}

export type CreateIntentParams = {
  inputToken: string; // The address of the input token on spoke chain
  outputToken: string; // The address of the output token on spoke chain
  inputAmount: bigint; // The amount of input tokens
  minOutputAmount: bigint; // The minimum amount of output tokens to accept
  deadline: bigint; // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: boolean; // Whether the intent can be partially filled
  srcChain: SpokeChainId; // Chain ID where input tokens originate
  dstChain: SpokeChainId; // Chain ID where output tokens should be delivered
  srcAddress: Hex; // Source address in bytes (original address on spoke chain)
  dstAddress: Hex; // Destination address in bytes (original address on spoke chain)
  solver: EvmAddress; // Optional specific solver address (address(0) = any solver)
  data: Hex; // Additional arbitrary data
};

export type Intent = {
  intentId: bigint; // Unique identifier for the intent
  creator: EvmAddress; // Address that created the intent (Wallet abstraction address on hub chain)
  inputToken: EvmAddress; // Token the user is providing (hub asset address on hub chain)
  outputToken: EvmAddress; // Token the user wants to receive (hub asset address on hub chain)
  inputAmount: bigint; // Amount of input tokens
  minOutputAmount: bigint; // Minimum amount of output tokens to accept
  deadline: bigint; // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: boolean; // Whether the intent can be partially filled
  srcChain: IntentRelayChainId; // Chain ID where input tokens originate
  dstChain: IntentRelayChainId; // Chain ID where output tokens should be delivered
  srcAddress: Hex; // Source address in bytes (original address on spoke chain)
  dstAddress: Hex; // Destination address in bytes (original address on spoke chain)
  solver: EvmAddress; // Optional specific solver address (address(0) = any solver)
  data: Hex; // Additional arbitrary data
};

// Data types for arbitrary data
export enum IntentDataType {
  FEE = 1,
}

export type FeeData = {
  fee: bigint;
  receiver: EvmAddress;
};

export type IntentData = {
  type: IntentDataType;
  data: Hex;
};

export type IntentState = {
  exists: boolean;
  remainingInput: bigint;
  receivedOutput: bigint;
  pendingPayment: boolean;
};

export type IntentCreationFailedErrorData = {
  payload: CreateIntentParams;
  error: unknown;
};

export type IntentSubmitTxFailedErrorData = {
  payload: IntentRelayRequest<'submit'>;
  apiUrl: HttpUrl;
};

export type IntentWaitUntilIntentExecutedFailedErrorData = {
  payload: WaitUntilIntentExecutedPayload;
  error: unknown;
};

export type IntentSubmitErrorCode = RelayErrorCode | 'UNKNOWN' | 'CREATION_FAILED';
export type IntentSubmitErrorData<T extends IntentSubmitErrorCode> = T extends 'TIMEOUT'
  ? IntentWaitUntilIntentExecutedFailedErrorData
  : T extends 'CREATION_FAILED'
    ? IntentCreationFailedErrorData
    : T extends 'SUBMIT_TX_FAILED'
      ? IntentSubmitTxFailedErrorData
      : T extends 'POST_EXECUTION_FAILED'
        ? IntentErrorResponse
        : never;

export type IntentSubmitError<T extends IntentSubmitErrorCode> = {
  code: T;
  data: IntentSubmitErrorData<T>;
};
