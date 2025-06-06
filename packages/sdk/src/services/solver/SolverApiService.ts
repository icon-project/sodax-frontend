import invariant from 'tiny-invariant';
import {
  getHubAssetInfo,
  IntentErrorCode,
  isValidOriginalAssetAddress,
  retry,
  type IntentErrorResponse,
  type IntentExecutionRequest,
  type IntentExecutionResponse,
  type IntentQuoteRequest,
  type IntentQuoteResponse,
  type IntentQuoteResponseRaw,
  type IntentStatusRequest,
  type IntentStatusResponse,
  type Result,
  type SolverConfig,
} from '../../index.js';

export class SolverApiService {
  private constructor() {}

  /**
   * Request a quote from the solver API
   * @example
   * {
   *     "token_src":"0x13b70564b1ec12876b20fab5d1bb630311312f4f", // Asset BSC
   *     "token_dst":"0xdcd9578b51ef55239b6e68629d822a8d97c95b86", // Asset ETH Arbitrum
   *     "token_src_blockchain_id":"56",
   *     "token_dst_blockchain_id":"42161",
   *     "amount":1000000000000000n,
   *     "quote_type": "exact_input"
   * }
   */
  public static async getQuote(
    payload: IntentQuoteRequest,
    config: SolverConfig,
  ): Promise<Result<IntentQuoteResponse, IntentErrorResponse>> {
    invariant(payload.token_src.length > 0, 'Empty token_src');
    invariant(payload.token_src_blockchain_id.length > 0, 'Empty token_src_blockchain_id');
    invariant(payload.token_dst.length > 0, 'Empty token_dst');
    invariant(payload.token_dst_blockchain_id.length > 0, 'Empty token_dst_blockchain_id');
    invariant(payload.amount > 0n, 'amount must be greater than 0');
    invariant(
      isValidOriginalAssetAddress(payload.token_src_blockchain_id, payload.token_src),
      'unsupported token_src for src chain',
    );
    invariant(
      isValidOriginalAssetAddress(payload.token_dst_blockchain_id, payload.token_dst),
      'unsupported token_dst for dst chain',
    );

    const tokenSrc = getHubAssetInfo(payload.token_src_blockchain_id, payload.token_src)?.asset;
    const tokenDst = getHubAssetInfo(payload.token_dst_blockchain_id, payload.token_dst)?.asset;

    invariant(tokenSrc, 'hub asset not found for token_src');
    invariant(tokenDst, 'hub asset not found for token_dst');

    try {
      const response = await fetch(`${config.solverApiEndpoint}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_src: tokenSrc,
          token_dst: tokenDst,
          amount: payload.amount.toString(),
          quote_type: payload.quote_type,
        }),
      });

      if (!response.ok) {
        return {
          ok: false,
          error: await response.json(),
        };
      }

      const quoteResponse: IntentQuoteResponseRaw = await response.json();

      return {
        ok: true,
        value: {
          quoted_amount: BigInt(quoteResponse.quoted_amount),
        } satisfies IntentQuoteResponse,
      };
    } catch (e: unknown) {
      console.error(`[SolverApiService.getQuote] failed. Details: ${JSON.stringify(e)}`);
      return {
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: e ? JSON.stringify(e) : 'Unknown error',
          },
        },
      };
    }
  }

  /**
   * Post execution of intent order to Solver API
   * @example
   * // request
   * {
   *     "intent_tx_hash": "0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af",
   *     "quote_uuid": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
   * }
   *
   * // response
   * {
   *   "ok": true,
   *   "value": {
   *      "output": {
   *        "answer":"OK",
   *        "task_id":"a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
   *      }
   *   }
   * }
   */
  public static async postExecution(
    intentExecutionRequest: IntentExecutionRequest,
    config: SolverConfig,
  ): Promise<Result<IntentExecutionResponse, IntentErrorResponse>> {
    try {
      const response = await retry(() =>
        fetch(`${config.solverApiEndpoint}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(intentExecutionRequest),
        }),
      );

      if (!response.ok) {
        return {
          ok: false,
          error: await response.json(),
        };
      }

      return {
        ok: true,
        value: await response.json(),
      };
    } catch (e: unknown) {
      console.error(`[SolverApiService.postExecution] failed. Details: ${JSON.stringify(e)}`);
      return {
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: e ? JSON.stringify(e) : 'Unknown error',
          },
        },
      };
    }
  }

  public static async getStatus(
    intentStatusRequest: IntentStatusRequest,
    config: SolverConfig,
  ): Promise<Result<IntentStatusResponse, IntentErrorResponse>> {
    invariant(intentStatusRequest.intent_tx_hash.length > 0, 'Empty intent_tx_hash');
    try {
      const response = await fetch(`${config.solverApiEndpoint}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intentStatusRequest),
      });

      if (!response.ok) {
        return {
          ok: false,
          error: await response.json(),
        };
      }

      return {
        ok: true,
        value: await response.json(),
      };
    } catch (e: unknown) {
      console.error(`[SolverApiService.getStatus] failed. Details: ${JSON.stringify(e)}`);
      return {
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: e ? JSON.stringify(e) : 'Unknown error',
          },
        },
      };
    }
  }
}
