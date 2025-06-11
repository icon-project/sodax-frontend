import type { HttpUrl } from '../shared/index.js';

/**
 * The action type for the intent relay service.
 * submit - submit a transaction to the intent relay service
 * get_transaction_packets - get transaction packets from the intent relay service
 * get_packet - get a packet from the intent relay service
 */
export type RelayAction = 'submit' | 'get_transaction_packets' | 'get_packet';

/**
 * The status of the relay transaction.
 * pending - no signatures
 * validating - not enough signatures
 * executing - enough signatures,no confirmed txn-hash
 * executed - has confirmed transaction-hash
 */
export type RelayTxStatus = 'pending' | 'validating' | 'executing' | 'executed';

export type RelayErrorCode = 'UNKNOWN' | 'SUBMIT_TX_FAILED' | 'POST_EXECUTION_FAILED' | 'TIMEOUT';

export type RelayError = {
  code: RelayErrorCode;
  error: unknown;
};

export type SubmitTxParams = {
  chain_id: string; // The ID of the chain where the transaction was submitted
  tx_hash: string; // The transaction hash of the submitted transaction
};

export type GetTransactionPacketsParams = {
  chain_id: string; // The ID of the chain where the transaction was submitted
  tx_hash: string; // The transaction hash of the submitted transaction
};

export type GetPacketParams = {
  chain_id: string; // The ID of the chain where the transaction was submitted
  tx_hash: string; // The transaction hash of the submitted transaction
  conn_sn: string; // The connection sequence number of the submitted transaction
};

export type SubmitTxResponse = {
  success: boolean;
  message: string;
};

export type PacketData = {
  src_chain_id: number;
  src_tx_hash: string;
  src_address: string;
  status: RelayTxStatus;
  dst_chain_id: number;
  conn_sn: number;
  dst_address: string;
  dst_tx_hash: string;
  signatures: string[];
  payload: string;
};

export type GetTransactionPacketsResponse = {
  success: boolean;
  data: PacketData[];
};

export type GetPacketResponse =
  | {
      success: true;
      data: PacketData;
    }
  | {
      success: false;
      message: string;
    };

export type GetRelayRequestParamType<T extends RelayAction> = T extends 'submit'
  ? SubmitTxParams
  : T extends 'get_transaction_packets'
    ? GetTransactionPacketsParams
    : T extends 'get_packet'
      ? GetPacketParams
      : never;

export type GetRelayResponse<T extends RelayAction> = T extends 'submit'
  ? SubmitTxResponse
  : T extends 'get_transaction_packets'
    ? GetTransactionPacketsResponse
    : T extends 'get_packet'
      ? GetPacketResponse
      : never;

export type IntentRelayRequestParams = SubmitTxParams | GetTransactionPacketsParams | GetPacketParams;

export type WaitUntilIntentExecutedPayload = {
  intentRelayChainId: string;
  spokeTxHash: string;
  timeout: number;
  apiUrl: HttpUrl;
};

/**
 * Represents the request payload for submitting a transaction to the intent relay service.
 * Contains the action type and parameters including chain ID and transaction hash.
 */
export type IntentRelayRequest<T extends RelayAction> = {
  action: T;
  params: GetRelayRequestParamType<T>;
};
