import type {
  Hex,
  HttpUrl,
  Result,
  IntentRelayRequest,
  GetRelayResponse,
  RelayAction,
  PacketData,
  RelayError,
  WaitUntilIntentExecutedPayload,
  IntentSubmitError,
} from '@sodax/types';
import invariant from 'tiny-invariant';
import { retry } from '../../utils/shared-utils.js';
import { DEFAULT_RELAY_TX_TIMEOUT, getIntentRelayChainId } from '../../constants.js';
import type { SpokeProvider } from '../../entities/Providers.js';

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
): Promise<Result<PacketData, IntentSubmitError<'TIMEOUT'>>> {
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
      // wait one second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      ok: false,
      error: {
        code: 'TIMEOUT',
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
        code: 'TIMEOUT',
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
 * @param spokeProvider - The spoke provider.
 * @param timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
 * @returns The transaction hash.
 */
export async function relayTxAndWaitPacket<S extends SpokeProvider>(
  spokeTxHash: Hex,
  spokeProvider: S,
  relayerApiEndpoint: HttpUrl,
  timeout = DEFAULT_RELAY_TX_TIMEOUT,
): Promise<Result<PacketData, RelayError>> {
  try {
    const intentRelayChainId = getIntentRelayChainId(spokeProvider.chainConfig.chain.id).toString();

    const submitPayload: IntentRelayRequest<'submit'> = {
      action: 'submit',
      params: {
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
          code: 'TIMEOUT',
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
        code: 'UNKNOWN',
        error: error,
      },
    };
  }
}
