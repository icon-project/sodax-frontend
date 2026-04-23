import type { Address, Hex, SpokeChainKey, IntentRelayChainId, SolverErrorResponse } from '@sodax/types';
import type { IntentDeliveryInfo, IntentRelayRequest, RelayErrorCode, WaitUntilIntentExecutedPayload } from './relay-types.js';

export type CreateIntentParams<K extends SpokeChainKey = SpokeChainKey> = {
  inputToken: string;
  outputToken: string;
  inputAmount: bigint;
  minOutputAmount: bigint;
  deadline: bigint;
  allowPartialFill: boolean;
  srcChain: K;
  dstChain: SpokeChainKey;
  srcAddress: string;
  dstAddress: string;
  solver: Address;
  data: Hex;
};

export type CreateLimitOrderParams<K extends SpokeChainKey = SpokeChainKey> = Omit<CreateIntentParams<K>, 'deadline'>;

export type Intent = {
  intentId: bigint;
  creator: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  minOutputAmount: bigint;
  deadline: bigint;
  allowPartialFill: boolean;
  srcChain: IntentRelayChainId;
  dstChain: IntentRelayChainId;
  srcAddress: Hex;
  dstAddress: Hex;
  solver: Address;
  data: Hex;
};

export enum IntentDataType {
  FEE = 1,
}

export type FeeData = {
  fee: bigint;
  receiver: Address;
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
  payload: CreateIntentParams | CreateLimitOrderParams;
  error: unknown;
};

export type IntentSubmitTxFailedErrorData = {
  payload: IntentRelayRequest<'submit'>;
  error: unknown;
};

export type IntentWaitUntilIntentExecutedFailedErrorData = {
  payload: WaitUntilIntentExecutedPayload;
  error: unknown;
};

export type IntentPostExecutionFailedErrorData = SolverErrorResponse & {
  intent: Intent;
  intentDeliveryInfo: IntentDeliveryInfo;
};

export type IntentCancelFailedErrorData = {
  payload: Intent;
  error: unknown;
};

export type IntentErrorCode = RelayErrorCode | 'UNKNOWN' | 'CREATION_FAILED' | 'POST_EXECUTION_FAILED' | 'CANCEL_FAILED';

export type IntentErrorData<T extends IntentErrorCode> = T extends 'RELAY_TIMEOUT'
  ? IntentWaitUntilIntentExecutedFailedErrorData
  : T extends 'CREATION_FAILED'
    ? IntentCreationFailedErrorData
    : T extends 'SUBMIT_TX_FAILED'
      ? IntentSubmitTxFailedErrorData
      : T extends 'POST_EXECUTION_FAILED'
        ? IntentPostExecutionFailedErrorData
        : T extends 'UNKNOWN'
          ? IntentCreationFailedErrorData
          : T extends 'CANCEL_FAILED'
            ? IntentCancelFailedErrorData
            : never;

export type IntentError<T extends IntentErrorCode = IntentErrorCode> = {
  code: T;
  data: IntentErrorData<T>;
};
