import invariant from 'tiny-invariant';
import type { Address, Hash } from 'viem';
import {
  CWSpokeProvider,
  type EvmHubProvider,
  EvmSpokeProvider,
  IconSpokeProvider,
  type IntentRelayRequest,
  SolanaSpokeProvider,
  type SpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
  type WaitUntilIntentExecutedPayload,
  calculateFeeAmount,
  getIntentRelayChainId,
  getSpokeChainIdFromIntentRelayChainId,
  isValidIntentRelayChainId,
  isValidOriginalAssetAddress,
  isValidSpokeChainId,
  spokeChainConfig,
  submitTransaction,
  waitUntilIntentExecuted,
} from '../../index.js';
import type {
  FeeAmount,
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
  PartnerFee,
  Result,
  SolverConfig,
  SpokeChainId,
  TxReturnType,
} from '../../types.js';
import { EvmWalletAbstraction } from '../hub/EvmWalletAbstraction.js';
import { CWSolverService } from './CWSolverService.js';
import { EvmSolverService } from './EvmSolverService.js';
import { IconSolverService } from './IconSolverService.js';
import { SolanaSolverService } from './SolanaSolverService.js';
import { SolverApiService } from './SolverApiService.js';
import { StellarSolverService } from './StellarSolverService.js';
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

// Data types for arbitrary data
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
  private readonly hubProvider: EvmHubProvider;

  public constructor(config: SolverConfig, hubProvider: EvmHubProvider) {
    this.config = config;
    this.hubProvider = hubProvider;
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
   * Get the fee for a given input amount
   * @param {bigint} inputAmount - The amount of input tokens
   * @returns {Promise<bigint>} The fee amount (denominated in input tokens)
   */
  public async getFee(inputAmount: bigint): Promise<bigint> {
    if (!this.config.partnerFee) {
      return 0n;
    }

    return calculateFeeAmount(inputAmount, this.config.partnerFee);
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
   * @param {number} timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
   * @returns {Promise<Result<IntentExecutionResponse, IntentErrorResponse>>} The encoded contract call
   */
  public async createAndSubmitIntent<T extends SpokeProvider>(
    payload: CreateIntentParams,
    spokeProvider: T,
    fee?: PartnerFee,
    timeout = 20000,
  ): Promise<Result<[IntentExecutionResponse, Intent], IntentSubmitError<IntentSubmitErrorCode>>> {
    try {
      const createIntentResult = await this.createIntent(payload, spokeProvider, fee, false);

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
   * @param {CreateIntentParams} params - The intent to create
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {boolean} raw - Whether to return the raw transaction
   * @param {PartnerFee} fee - The fee to apply to the intent
   * @returns {Promise<[TxReturnType<T, R>, Intent]>} The encoded contract call
   */
  public async createIntent<S extends SpokeProvider, R extends boolean = false>(
    params: CreateIntentParams,
    spokeProvider: S,
    fee?: PartnerFee,
    raw?: R,
  ): Promise<Result<[TxReturnType<S, R>, Intent & FeeAmount], IntentSubmitError<'CREATION_FAILED'>>> {
    invariant(
      isValidOriginalAssetAddress(params.srcChain, params.inputToken),
      `Unsupported spoke chain token (params.srcChain): ${params.srcChain}, params.inputToken): ${params.inputToken}`,
    );
    invariant(
      isValidOriginalAssetAddress(params.dstChain, params.outputToken),
      `Unsupported spoke chain token (params.dstChain): ${params.dstChain}, params.outputToken): ${params.outputToken}`,
    );
    invariant(isValidSpokeChainId(params.srcChain), `Invalid spoke chain (params.srcChain): ${params.srcChain}`);
    invariant(isValidSpokeChainId(params.dstChain), `Invalid spoke chain (params.dstChain): ${params.dstChain}`);

    try {
      // derive users hub wallet address
      const creatorHubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
        params.srcChain,
        spokeProvider.walletProvider.getWalletAddressBytes(),
        this.hubProvider,
      );

      // construct the intent data
      const [data, intent, feeAmount] = EvmSolverService.constructCreateIntentData(
        params,
        creatorHubWalletAddress,
        this.config,
        fee,
      );

      const srcSpokeChainConfig = spokeChainConfig[params.srcChain];
      let response: TxReturnType<SpokeProvider, R>;

      switch (srcSpokeChainConfig.chain.type) {
        case 'evm':
          if (spokeProvider instanceof EvmSpokeProvider) {
            const txResult = await EvmSolverService.createIntentDeposit(
              params,
              creatorHubWalletAddress,
              spokeProvider,
              this.hubProvider,
              feeAmount,
              data,
              raw,
            );

            response = txResult as TxReturnType<SpokeProvider, R>;
          } else {
            throw new Error('Invalid spoke provider (EvmSpokeProvider expected)');
          }

          break;
        case 'solana':
          if (spokeProvider instanceof SolanaSpokeProvider) {
            const txResult = await SolanaSolverService.createIntentDeposit(
              params,
              creatorHubWalletAddress,
              spokeProvider,
              this.hubProvider,
              feeAmount,
              data,
              raw,
            );

            response = txResult as TxReturnType<SpokeProvider, R>;
          } else {
            throw new Error('Invalid spoke provider (SolanaSpokeProvider expected)');
          }

          break;
        case 'stellar':
          if (spokeProvider instanceof StellarSpokeProvider) {
            const txResult = await StellarSolverService.createIntentDeposit(
              params,
              creatorHubWalletAddress,
              spokeProvider,
              this.hubProvider,
              feeAmount,
              data,
              raw,
            );

            response = txResult as TxReturnType<SpokeProvider, R>;
          } else {
            throw new Error('Invalid spoke provider (StellarSpokeProvider expected)');
          }

          break;
        case 'cosmos':
          if (spokeProvider instanceof CWSpokeProvider) {
            const txResult = await CWSolverService.createIntentDeposit(
              params,
              creatorHubWalletAddress,
              spokeProvider,
              this.hubProvider,
              feeAmount,
              data,
              raw,
            );

            response = txResult as TxReturnType<SpokeProvider, R>;
          } else {
            throw new Error('Invalid spoke provider (CosmosSpokeProvider expected)');
          }

          break;
        case 'icon':
          if (spokeProvider instanceof IconSpokeProvider) {
            const txResult = await IconSolverService.createIntentDeposit(
              params,
              creatorHubWalletAddress,
              spokeProvider,
              this.hubProvider,
              feeAmount,
              data,
              raw,
            );

            response = txResult as TxReturnType<SpokeProvider, R>;
          } else {
            throw new Error('Invalid spoke provider (IconSpokeProvider expected)');
          }

          break;
        case 'sui':
          if (spokeProvider instanceof SuiSpokeProvider) {
            const txResult = await SuiSolverService.createIntentDeposit(
              params,
              creatorHubWalletAddress,
              spokeProvider,
              this.hubProvider,
              feeAmount,
              data,
              raw,
            );

            response = txResult as TxReturnType<SpokeProvider, R>;
          } else {
            throw new Error('Invalid spoke provider (SuiSpokeProvider expected)');
          }

          break;
        default:
          throw new Error(`Unsupported spoke chain type for srcChain: ${params.srcChain}`);
      }

      return {
        ok: true,
        value: [response, { ...intent, feeAmount }] as [TxReturnType<S, R>, Intent & FeeAmount],
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATION_FAILED',
          data: {
            payload: params,
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
   * @param {boolean} raw - Whether to return the raw transaction
   * @returns {Promise<TxReturnType<T, R>>} The encoded contract call
   */
  public async cancelIntent<T extends SpokeProvider, R extends boolean = false>(
    intent: Intent,
    spokeProvider: T,
    raw?: R,
  ): Promise<TxReturnType<T, R>> {
    invariant(isValidIntentRelayChainId(intent.srcChain), `Invalid intent.srcChain: ${intent.srcChain}`);
    invariant(isValidIntentRelayChainId(intent.dstChain), `Invalid intent.dstChain: ${intent.dstChain}`);

    const srcSpokeChainConfig = spokeChainConfig[getSpokeChainIdFromIntentRelayChainId(intent.srcChain)];

    switch (srcSpokeChainConfig.chain.type) {
      case 'evm':
        if (spokeProvider instanceof EvmSpokeProvider) {
          return EvmSolverService.cancelIntent(intent, this.config, spokeProvider, this.hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (EvmSpokeProvider expected)');
      case 'solana':
        if (spokeProvider instanceof SolanaSpokeProvider) {
          return SolanaSolverService.cancelIntent(intent, this.config, spokeProvider, this.hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (SolanaSpokeProvider expected)');

      case 'stellar':
        if (spokeProvider instanceof StellarSpokeProvider) {
          return StellarSolverService.cancelIntent(
            intent,
            this.config,
            spokeProvider,
            this.hubProvider,
            raw,
          ) as Promise<TxReturnType<T, R>>;
        }
        throw new Error('Invalid spoke provider (StellarSpokeProvider expected)');

      case 'cosmos':
        if (spokeProvider instanceof CWSpokeProvider) {
          return CWSolverService.cancelIntent(intent, this.config, spokeProvider, this.hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (CWSpokeProvider expected)');
      case 'icon':
        if (spokeProvider instanceof IconSpokeProvider) {
          return IconSolverService.cancelIntent(intent, this.config, spokeProvider, this.hubProvider, raw) as Promise<
            TxReturnType<T, R>
          >;
        }
        throw new Error('Invalid spoke provider (IconSpokeProvider expected)');
      case 'sui':
        if (spokeProvider instanceof SuiSpokeProvider) {
          return SuiSolverService.cancelIntent(intent, this.config, spokeProvider, this.hubProvider, raw) as Promise<
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
   * @returns {Promise<Intent>} The intent
   */
  public getIntent(txHash: Hash): Promise<Intent> {
    return EvmSolverService.getIntent(txHash, this.config, this.hubProvider,);
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
