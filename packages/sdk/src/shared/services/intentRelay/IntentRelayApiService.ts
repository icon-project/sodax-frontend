import { type HttpUrl, type SpokeChainId, getIntentRelayChainId } from '@sodax/types';
import type { Result } from '../../types.js';
import invariant from 'tiny-invariant';
import { retry } from '../../utils/shared-utils.js';
import type { IntentError } from '../../../swap/SwapService.js';
import { DEFAULT_RELAY_TX_TIMEOUT } from '../../constants.js';
import type { SpokeProvider } from '../../entities/Providers.js';
import type { Hex } from 'viem';

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

export type RelayErrorCode = 'SUBMIT_TX_FAILED' | 'RELAY_TIMEOUT';

export type RelayError = {
  code: RelayErrorCode;
  error: unknown;
};

export type SubmitTxParams = {
  chain_id: string; // The ID of the chain where the transaction was submitted
  tx_hash: string; // The transaction hash of the submitted transaction
  data?: { address: Hex; payload: Hex };
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

export type IntentDeliveryInfo = {
  srcChainId: SpokeChainId; // The chain ID where the transaction was submitted
  srcTxHash: string; // The transaction hash of the submitted transaction
  srcAddress: string; // The wallet address which submitted the transaction
  dstChainId: SpokeChainId; // The destination chain ID
  dstTxHash: string; // The transaction hash of the submitted transaction on the destination chain
  dstAddress: string; // The destination wallet address on the destination chain
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

async function postRequest<T extends RelayAction>(
  payload: IntentRelayRequest<T>,
  apiUrl: string,
): Promise<GetRelayResponse<T>> {
  const response = await retry(() =>
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }),
  );

  return response.json();
}

/**
 * Submits a transaction to the intent relay service.
 * @param payload - The request payload containing the 'submit' action type and parameters.
 * @param apiUrl - The URL of the intent relay service.
 * @returns The response from the intent relay service.
 */
export async function submitTransaction(
  payload: IntentRelayRequest<'submit'>,
  apiUrl: HttpUrl,
): Promise<GetRelayResponse<'submit'>> {
  invariant(payload.params.chain_id.length > 0, 'Invalid input parameters. source_chain_id empty');
  invariant(payload.params.tx_hash.length > 0, 'Invalid input parameters. tx_hash empty');

  return postRequest(payload, apiUrl);
}

/**
 * Retrieves transaction packets from the intent relay service.
 * @param payload - The request payload containing the 'get_transaction_packets' action type and parameters.
 * @param apiUrl - The URL of the intent relay service.
 * @returns The response from the intent relay service.
 */
export async function getTransactionPackets(
  payload: IntentRelayRequest<'get_transaction_packets'>,
  apiUrl: HttpUrl,
): Promise<GetRelayResponse<'get_transaction_packets'>> {
  invariant(payload.params.chain_id.length > 0, 'Invalid input parameters. source_chain_id empty');
  invariant(payload.params.tx_hash.length > 0, 'Invalid input parameters. tx_hash empty');

  return postRequest(payload, apiUrl);
}

/**
 * Retrieves a packet from the intent relay service.
 * @param payload - The request payload containing the 'get_packet' action type and parameters.
 * @param apiUrl - The URL of the intent relay service.
 * @returns The response from the intent relay service.
 */
export async function getPacket(
  payload: IntentRelayRequest<'get_packet'>,
  apiUrl: HttpUrl,
): Promise<GetRelayResponse<'get_packet'>> {
  invariant(payload.params.chain_id.length > 0, 'Invalid input parameters. source_chain_id empty');
  invariant(payload.params.tx_hash.length > 0, 'Invalid input parameters. tx_hash empty');
  invariant(payload.params.conn_sn.length > 0, 'Invalid input parameters. conn_sn empty');

  return postRequest(payload, apiUrl);
}

export async function waitUntilIntentExecuted(
  payload: WaitUntilIntentExecutedPayload,
): Promise<Result<PacketData, IntentError<'RELAY_TIMEOUT'>>> {
  try {
    const startTime = Date.now();

    while (Date.now() - startTime < payload.timeout) {
      try {
        const txPackets = await getTransactionPackets(
          {
            action: 'get_transaction_packets',
            params: {
              chain_id: payload.intentRelayChainId,
              tx_hash: payload.spokeTxHash,
            },
          },
          payload.apiUrl,
        );

        if (txPackets.success && txPackets.data.length > 0) {
          const packet = txPackets.data.find(
            packet => packet.src_tx_hash.toLowerCase() === payload.spokeTxHash.toLowerCase(),
          );

          if (txPackets.success && txPackets.data.length > 0 && packet && packet.status === 'executed') {
            return {
              ok: true,
              value: packet,
            };
          }
        }
      } catch (e) {
        console.error('Error getting transaction packets', e);
      }
      // wait two seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      ok: false,
      error: {
        code: 'RELAY_TIMEOUT',
        data: {
          payload: payload,
          error: {
            payload: payload,
            error: undefined,
          },
        },
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'RELAY_TIMEOUT',
        data: {
          payload: payload,
          error: e,
        },
      },
    };
  }
}

/**
 * Submit the transaction to the Solver API and wait for it to be executed
 * @param spokeTxHash - The transaction hash to submit.
 * @param data - The additional data to submit when relaying the transaction on Solana. Due to Solana's 1232 byte transaction
 *               size limit, Solana transactions are split: the on-chain tx contains only a verification hash, while the full
 *               data is submitted off-chain via the relayer. Contains the to address on Hub chain and instruction data.
 * @param spokeProvider - The spoke provider.
 * @param timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
 * @returns The transaction hash.
 */
export async function relayTxAndWaitPacket<S extends SpokeProvider>(
  spokeTxHash: string,
  data: { address: Hex; payload: Hex } | undefined,
  spokeProvider: S,
  relayerApiEndpoint: HttpUrl,
  timeout = DEFAULT_RELAY_TX_TIMEOUT,
): Promise<Result<PacketData, RelayError>> {
  try {
    const intentRelayChainId = getIntentRelayChainId(spokeProvider.chainConfig.chain.id).toString();

    const submitPayload: IntentRelayRequest<'submit'> = {
      action: 'submit',
      params: data
        ? {
            chain_id: intentRelayChainId,
            tx_hash: spokeTxHash,
            data,
          }
        : {
            chain_id: intentRelayChainId,
            tx_hash: spokeTxHash,
          },
    };

    const submitResult = await submitTransaction(submitPayload, relayerApiEndpoint);

    if (!submitResult.success) {
      return {
        ok: false,
        error: {
          code: 'SUBMIT_TX_FAILED',
          error: submitResult.message,
        },
      };
    }

    const packet = await waitUntilIntentExecuted({
      intentRelayChainId,
      spokeTxHash,
      timeout,
      apiUrl: relayerApiEndpoint,
    });

    if (!packet.ok) {
      return {
        ok: false,
        error: {
          code: 'RELAY_TIMEOUT',
          error: packet.error,
        },
      };
    }

    return {
      ok: true,
      value: packet.value,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'SUBMIT_TX_FAILED',
        error: error,
      },
    };
  }
}
