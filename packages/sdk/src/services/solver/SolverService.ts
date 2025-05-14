import invariant from 'tiny-invariant';
import type { Address, Hash } from 'viem';
import {
  CWSpokeProvider,
  EvmHubProvider,
  EvmSpokeProvider,
  EvmWalletAbstraction,
  getIntentRelayChainId,
  type HubProvider,
  IconSpokeProvider,
  type IntentRelayRequest,
  type ISpokeProvider,
  isValidOriginalAssetAddress,
  isValidSpokeChainId,
  SolanaSpokeProvider,
  spokeChainConfig,
  StellarSpokeProvider,
  submitTransaction,
  SuiSpokeProvider,
  waitUntilIntentExecuted,
  type WaitUntilIntentExecutedPayload,
} from '../../index.js';
import type {
  Hex,
  HttpUrl,
  IntentErrorResponse,
  IntentExecutionRequest,
  IntentExecutionResponse,
  IntentQuoteRequest,
  IntentQuoteResponse,
  IntentRelayChainId,
  IntentStatusRequest,
  IntentStatusResponse,
  Result,
  SolverConfig,
  SpokeChainId,
  TxReturnType,
} from '../../types.js';
import { EvmSolverService } from './EvmSolverService.js';
import { SolverApiService } from './SolverApiService.js';
import { SolanaSolverService } from './SolanaSolverService.js';
import { IconSolverService } from './IconSolverService.js';
import { StellarSolverService } from './StellarSolverService.js';
import { CWSolverService } from './CWSolverService.js';
import { SuiSolverService } from './SuiSolverService.js';

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
  solver: Address; // Optional specific solver address (address(0) = any solver)
  data: Hex; // Additional arbitrary data
};

export type Intent = {
  intentId: bigint; // Unique identifier for the intent
  creator: Address; // Address that created the intent (Wallet abstraction address on hub chain)
  inputToken: Address; // Token the user is providing (hub asset address on hub chain)
  outputToken: Address; // Token the user wants to receive (hub asset address on hub chain)
  inputAmount: bigint; // Amount of input tokens
  minOutputAmount: bigint; // Minimum amount of output tokens to accept
  deadline: bigint; // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: boolean; // Whether the intent can be partially filled
  srcChain: IntentRelayChainId; // Chain ID where input tokens originate
  dstChain: IntentRelayChainId; // Chain ID where output tokens should be delivered
  srcAddress: Hex; // Source address in bytes (original address on spoke chain)
  dstAddress: Hex; // Destination address in bytes (original address on spoke chain)
  solver: Address; // Optional specific solver address (address(0) = any solver)
  data: Hex; // Additional arbitrary data
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

export type IntentSubmitErrorCode =
  | 'TIMEOUT'
  | 'CREATION_FAILED'
  | 'SUBMIT_TX_FAILED'
  | 'POST_EXECUTION_FAILED'
  | 'UNKNOWN';
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

export class SolverService {
  private readonly config: SolverConfig;

  public constructor(config: SolverConfig) {
    this.config = config;
  }

  /**
   * Request a quote from the solver API
   * @param {IntentQuoteRequest} payload - The intent quote request
   * @returns {Promise<Result<IntentQuoteResponse, IntentErrorResponse>>} The intent quote response
   *
   * @example
   * // payload
   * {
   *     "token_src":"0x13b70564b1ec12876b20fab5d1bb630311312f4f", // Asset BSC
   *     "token_dst":"0xdcd9578b51ef55239b6e68629d822a8d97c95b86", // Asset ETH Arbitrum
   *     "token_src_blockchain_id":"56",
   *     "token_dst_blockchain_id":"42161",
   *     "amount":1000000000000000n,
   *     "quote_type": "exact_input"
   * } satisfies IntentQuoteRequest
   * // response
   * {
   *     "quoted_amount": "1000000000000000"
   * } satisfies IntentQuoteResponse
   */
  public async getQuote(payload: IntentQuoteRequest): Promise<Result<IntentQuoteResponse, IntentErrorResponse>> {
    return SolverApiService.getQuote(payload, this.config);
  }

  /**
   * Get the status of an intent from Solver API
   * @param {IntentStatusRequest} intentStatusRequest - The intent status request
   * @returns {Promise<Result<IntentStatusResponse, IntentErrorResponse>>} The intent status response
   *
   * @example
   * // request
   * {
   *     "intentHash": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
   * }
   * // response
   * {
   *     "status": 3,
   *     "intent_hash": "0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af"
   * }
   */
  public async getStatus(
    intentStatusRequest: IntentStatusRequest,
  ): Promise<Result<IntentStatusResponse, IntentErrorResponse>> {
    return SolverApiService.getStatus(intentStatusRequest, this.config);
  }

  /**
   * Post execution of intent order to Solver API
   * @param {IntentExecutionRequest} intentExecutionRequest - The intent execution request
   * @returns {Promise<Result<IntentExecutionResponse, IntentErrorResponse>>} The intent execution response
   *
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
  public async postExecution(
    intentExecutionRequest: IntentExecutionRequest,
  ): Promise<Result<IntentExecutionResponse, IntentErrorResponse>> {
    return SolverApiService.postExecution(intentExecutionRequest, this.config);
  }

  /**
   * Creates an intent and submits it to the Solver API and Relayer API
   * @param {CreateIntentParams} payload - The intent to create
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {HubProvider} hubProvider - The hub provider
   * @param {number} timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
   * @returns {Promise<Result<IntentExecutionResponse, IntentErrorResponse>>} The encoded contract call
   */
  public async createAndSubmitIntent<T extends ISpokeProvider>(
    payload: CreateIntentParams,
    spokeProvider: T,
    hubProvider: HubProvider,
    timeout = 20000,
  ): Promise<Result<[IntentExecutionResponse, Intent], IntentSubmitError<IntentSubmitErrorCode>>> {
    try {
      const createIntentResult = await this.createIntent(payload, spokeProvider, hubProvider, false);

      if (!createIntentResult.ok) {
        return {
          ok: false,
          error: createIntentResult.error,
        };
      }

      const [spokeTxHash, intent] = createIntentResult.value;
      const intentRelayChainId = getIntentRelayChainId(payload.srcChain).toString();
      const submitPayload: IntentRelayRequest<'submit'> = {
        action: 'submit',
        params: {
          chain_id: intentRelayChainId,
          tx_hash: spokeTxHash,
        },
      };

      const submitResult = await submitTransaction(submitPayload, this.config.relayerApiEndpoint);

      if (!submitResult.success) {
        return {
          ok: false,
          error: {
            code: 'SUBMIT_TX_FAILED',
            data: {
              payload: submitPayload,
              apiUrl: this.config.relayerApiEndpoint,
            },
          },
        };
      }

      const packet = await waitUntilIntentExecuted({
        intentRelayChainId,
        spokeTxHash,
        timeout,
        apiUrl: this.config.relayerApiEndpoint,
      });

      console.log('packet', packet);

      if (!packet.ok) {
        return {
          ok: false,
          error: packet.error,
        };
      }

      const result = await this.postExecution({
        intent_tx_hash: packet.value.dst_tx_hash as `0x${string}`,
      });

      if (!result.ok) {
        return {
          ok: false,
          error: {
            code: 'POST_EXECUTION_FAILED',
            data: result.error,
          },
        };
      }

      return {
        ok: true,
        value: [result.value, intent],
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN',
          data: {
            payload: payload,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates an intent by handling token approval and intent creation
   * NOTE: This method does not submit the intent to the Solver API
   * @param {CreateIntentParams} intent - The intent to create
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {HubProvider} hubProvider - The hub provider
   * @param {boolean} raw - Whether to return the raw transaction
   * @returns {Promise<[TxReturnType<T, R>, Intent]>} The encoded contract call
   */
  public async createIntent<T extends ISpokeProvider, R extends boolean = false>(
    intent: CreateIntentParams,
    spokeProvider: T,
    hubProvider: HubProvider,
    raw?: R,
  ): Promise<Result<[TxReturnType<T, R>, Intent], IntentSubmitError<'CREATION_FAILED'>>> {
    invariant(
      isValidOriginalAssetAddress(intent.srcChain, intent.inputToken),
      `Unsupported spoke chain token (intent.inputToken): ${intent.inputToken}`,
    );
    invariant(
      isValidOriginalAssetAddress(intent.dstChain, intent.outputToken),
      `Unsupported spoke chain token (intent.outputToken): ${intent.outputToken}`,
    );
    invariant(isValidSpokeChainId(intent.srcChain), `Invalid spoke chain (intent.srcChain): ${intent.srcChain}`);
    invariant(isValidSpokeChainId(intent.dstChain), `Invalid spoke chain (intent.dstChain): ${intent.dstChain}`);

    try {
      const creatorHubWalletAddress = await EvmWalletAbstraction.getUserWallet(
        intent.srcChain,
        spokeProvider.walletProvider.getWalletAddressBytes(),
        hubProvider,
      );

      const srcSpokeChainConfig = spokeChainConfig[intent.srcChain];
      let response: [TxReturnType<T, R>, Intent];

      switch (srcSpokeChainConfig.chain.type) {
        case 'evm':
          if (spokeProvider instanceof EvmSpokeProvider) {
            const [txResult, createdIntent] = await EvmSolverService.createIntent(
              intent,
              creatorHubWalletAddress,
              this.config,
              spokeProvider,
              hubProvider,
              raw,
            );

            response = [txResult as TxReturnType<T, R>, createdIntent];
          } else {
            throw new Error('Invalid spoke provider (EvmSpokeProvider expected)');
          }

          break;
        case 'solana':
          if (spokeProvider instanceof SolanaSpokeProvider) {
            const [txResult, createdIntent] = await SolanaSolverService.createIntent(
              intent,
              creatorHubWalletAddress,
              this.config,
              spokeProvider,
              hubProvider,
              raw,
            );

            response = [txResult as TxReturnType<T, R>, createdIntent];
          } else {
            throw new Error('Invalid spoke provider (SolanaSpokeProvider expected)');
          }

          break;
        case 'stellar':
          if (spokeProvider instanceof StellarSpokeProvider) {
            const [txResult, createIntent] = await StellarSolverService.createIntent(
              intent,
              creatorHubWalletAddress,
              this.config,
              spokeProvider,
              hubProvider,
              raw,
            );

            response = [txResult as TxReturnType<T, R>, createIntent];
          } else {
            throw new Error('Invalid spoke provider (StellarSpokeProvider expected)');
          }

          break;
        case 'cosmos':
          if (spokeProvider instanceof CWSpokeProvider) {
            const [txResult, createdIntent] = await CWSolverService.createIntent(
              intent,
              creatorHubWalletAddress,
              this.config,
              spokeProvider,
              hubProvider,
              raw,
            );

            response = [txResult as TxReturnType<T, R>, createdIntent];
          } else {
            throw new Error('Invalid spoke provider (CosmosSpokeProvider expected)');
          }

          break;
        case 'icon':
          if (spokeProvider instanceof IconSpokeProvider) {
            const [txResult, createdIntent] = await IconSolverService.createIntent(
              intent,
              creatorHubWalletAddress,
              this.config,
              spokeProvider,
              hubProvider,
              raw,
            );

            response = [txResult as TxReturnType<T, R>, createdIntent];
          } else {
            throw new Error('Invalid spoke provider (IconSpokeProvider expected)');
          }

          break;
        case 'sui':
          if (spokeProvider instanceof SuiSpokeProvider) {
            const [txResult, createdIntent] = await SuiSolverService.createIntent(
              intent,
              creatorHubWalletAddress,
              this.config,
              spokeProvider,
              hubProvider,
              raw,
            );

            response = [txResult as TxReturnType<T, R>, createdIntent];
          } else {
            throw new Error('Invalid spoke provider (SuiSpokeProvider expected)');
          }

          break;
        default:
          throw new Error(`Unsupported spoke chain type for srcChain: ${intent.srcChain}`);
      }

      return {
        ok: true,
        value: response,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATION_FAILED',
          data: {
            payload: intent,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Cancels an intent
   * @param {Intent} intent - The intent to cancel
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {HubProvider} hubProvider - The hub provider
   * @param {boolean} raw - Whether to return the raw transaction
   * @returns {Promise<TxReturnType<T, R>>} The encoded contract call
   */
  public async cancelIntent<T extends ISpokeProvider, R extends boolean = false>(
    intent: Intent,
    spokeProvider: T,
    hubProvider: HubProvider,
    raw?: R,
  ): Promise<TxReturnType<T, R>> {
    invariant(
      isValidSpokeChainId(Number(intent.srcChain)),
      `Invalid spoke chain (intent.srcChain): ${intent.srcChain}`,
    );
    invariant(
      isValidSpokeChainId(Number(intent.dstChain)),
      `Invalid spoke chain (intent.dstChain): ${intent.dstChain}`,
    );

    const srcSpokeChainConfig = spokeChainConfig[Number(intent.srcChain) as SpokeChainId];

    switch (srcSpokeChainConfig.chain.type) {
      case 'evm':
        if (spokeProvider instanceof EvmSpokeProvider) {
          return EvmSolverService.cancelIntent(intent, this.config, spokeProvider, hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (EvmSpokeProvider expected)');
      case 'solana':
        if (spokeProvider instanceof SolanaSpokeProvider) {
          return SolanaSolverService.cancelIntent(intent, this.config, spokeProvider, hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (SolanaSpokeProvider expected)');

      case 'stellar':
        if (spokeProvider instanceof StellarSpokeProvider) {
          return StellarSolverService.cancelIntent(intent, this.config, spokeProvider, hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (StellarSpokeProvider expected)');

      case 'cosmos':
        if (spokeProvider instanceof CWSpokeProvider) {
          return CWSolverService.cancelIntent(intent, this.config, spokeProvider, hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (CWSpokeProvider expected)');
      case 'icon':
        if (spokeProvider instanceof IconSpokeProvider) {
          return IconSolverService.cancelIntent(intent, this.config, spokeProvider, hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (IconSpokeProvider expected)');
      case 'sui':
        if (spokeProvider instanceof SuiSpokeProvider) {
          return SuiSolverService.cancelIntent(intent, this.config, spokeProvider, hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (SuiSpokeProvider expected)');
      default:
        throw new Error(`Unsupported spoke chain type for srcChain: ${intent.srcChain}`);
    }
  }

  /**
   * Gets an intent from a transaction hash (on Hub chain)
   * @param {Hash} txHash - The transaction hash on Hub chain
   * @param {HubProvider} hubProvider - The hub provider
   * @returns {Promise<Intent>} The intent
   */
  public getIntent<T extends HubProvider>(txHash: Hash, hubProvider: T): Promise<Intent> {
    if (hubProvider.chainConfig.chain.type === 'evm') {
      if (hubProvider instanceof EvmHubProvider) {
        return EvmSolverService.getIntent(txHash, hubProvider, this.config);
      }

      throw new Error('Invalid hub provider (EvmHubProvider expected)');
    }

    throw new Error('Unsupported hub chain type');
  }

  /**
   * Gets the keccak256 hash of an intent. Hash serves as the intent id on Hub chain.
   * @param {Intent} intent - The intent
   * @returns {Hex} The keccak256 hash of the intent
   */
  public getIntentHash(intent: Intent): Hex {
    return EvmSolverService.getIntentHash(intent);
  }
}
