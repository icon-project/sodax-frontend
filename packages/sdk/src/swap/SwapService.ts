import invariant from 'tiny-invariant';
import {
  DEFAULT_DEADLINE_OFFSET,
  DEFAULT_RELAYER_API_ENDPOINT,
  DEFAULT_RELAY_TX_TIMEOUT,
  Erc20Service,
  type EvmHubProvider,
  type GetRelayResponse,
  type IntentDeliveryInfo,
  type IntentRelayRequest,
  type RelayErrorCode,
  SonicSpokeService,
  type SpokeProvider,
  SpokeService,
  type WaitUntilIntentExecutedPayload,
  adjustAmountByFee,
  calculateFeeAmount,
  calculatePercentageFeeAmount,
  deriveUserWalletAddress,
  encodeContractCalls,
  isConfiguredSolverConfig,
  submitTransaction,
  waitUntilIntentExecuted,
} from '../index.js';
import type {
  EvmContractCall,
  FeeAmount,
  GetSpokeDepositParamsType,
  SolverErrorResponse,
  SolverExecutionRequest,
  SolverExecutionResponse,
  SolverIntentQuoteRequest,
  SolverIntentQuoteResponse,
  SolverIntentStatusRequest,
  SolverIntentStatusResponse,
  Result,
  SolverConfigParams,
  SwapServiceConfig,
  TxReturnType,
  GetEstimateGasReturnType,
  GetAddressType,
  OptionalRaw,
  Prettify,
  OptionalTimeout,
  OptionalFee,
} from '../shared/types.js';
import { EvmSolverService } from './EvmSolverService.js';
import { SolverApiService } from './SolverApiService.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type SpokeChainId,
  type Address,
  type Hex,
  type Hash,
  type HttpUrl,
  SOLANA_MAINNET_CHAIN_ID,
  type IntentRelayChainId,
  getIntentRelayChainId,
  getSolverConfig,
  type Token,
} from '@sodax/types';
import { StellarSpokeService } from '../shared/services/spoke/StellarSpokeService.js';
import { EvmSpokeProvider } from '../shared/entities/Providers.js';
import type { ConfigService } from '../shared/config/ConfigService.js';
import { SonicSpokeProvider } from '../shared/entities/Providers.js';
import { StellarSpokeProvider } from '../shared/entities/stellar/StellarSpokeProvider.js';

export type CreateIntentParams = {
  inputToken: string; // The address of the input token on spoke chain
  outputToken: string; // The address of the output token on spoke chain
  inputAmount: bigint; // The amount of input tokens
  minOutputAmount: bigint; // The minimum amount of output tokens to accept
  deadline: bigint; // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: boolean; // Whether the intent can be partially filled
  srcChain: SpokeChainId; // Chain ID where input tokens originate
  dstChain: SpokeChainId; // Chain ID where output tokens should be delivered
  srcAddress: string; // Source address (original address on spoke chain)
  dstAddress: string; // Destination address (original address on spoke chain)
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

export type IntentErrorCode = RelayErrorCode | 'UNKNOWN' | 'CREATION_FAILED' | 'POST_EXECUTION_FAILED';
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
          : never;

export type IntentError<T extends IntentErrorCode = IntentErrorCode> = {
  code: T;
  data: IntentErrorData<T>;
};

export type SwapParams<S extends SpokeProvider> = Prettify<
  {
    intentParams: CreateIntentParams;
    spokeProvider: S;
    skipSimulation?: boolean;
  } & OptionalFee
>;

export type SwapServiceConstructorParams = {
  config: SolverConfigParams | undefined;
  configService: ConfigService;
  hubProvider: EvmHubProvider;
  relayerApiEndpoint?: HttpUrl;
};

export class SwapService {
  readonly config: SwapServiceConfig;
  readonly hubProvider: EvmHubProvider;
  readonly configService: ConfigService;

  public constructor({ config, configService, hubProvider, relayerApiEndpoint }: SwapServiceConstructorParams) {
    if (!config) {
      this.config = {
        ...getSolverConfig(SONIC_MAINNET_CHAIN_ID), // default to mainnet config
        partnerFee: undefined,
        relayerApiEndpoint: relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT,
      };
    } else if (isConfiguredSolverConfig(config)) {
      this.config = {
        ...config,
        partnerFee: config.partnerFee,
        relayerApiEndpoint: relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT,
      };
    } else {
      this.config = {
        ...getSolverConfig(hubProvider.chainConfig.chain.id), // default to mainnet config
        partnerFee: config.partnerFee,
        relayerApiEndpoint: relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT,
      };
    }
    this.configService = configService;
    this.hubProvider = hubProvider;
  }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public static async estimateGas<T extends SpokeProvider = SpokeProvider>(
    params: TxReturnType<T, true>,
    spokeProvider: T,
  ): Promise<GetEstimateGasReturnType<T>> {
    return SpokeService.estimateGas(params, spokeProvider) as Promise<GetEstimateGasReturnType<T>>;
  }

  /**
   * Request a quote from the solver API
   * @param {SolverIntentQuoteRequest} payload - The solver intent quote request
   * @returns {Promise<Result<SolverIntentQuoteResponse, SolverErrorResponse>>} The intent quote response
   *
   * @example
   * const payload = {
   *     "token_src":"0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // BSC ETH token address
   *     "token_dst":"0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // ARB WBTC token address
   *     "token_src_blockchain_id":"0x38.bsc",
   *     "token_dst_blockchain_id":"0xa4b1.arbitrum",
   *     "amount":1000000000000000n,
   *     "quote_type": "exact_input"
   * } satisfies SolverIntentQuoteRequest & OptionalFee
   *
   * const response = await swapService.getQuote(payload);
   *
   * if (response.ok) {
   *   const quotedAmount = response.value.quoted_amount;
   *   console.log('Quoted amount:', quotedAmount);
   * } else {
   *   console.error('Quote failed:', response.error);
   * }
   */
  public async getQuote(
    payload: SolverIntentQuoteRequest,
  ): Promise<Result<SolverIntentQuoteResponse, SolverErrorResponse>> {
    payload = {
      ...payload,
      amount: adjustAmountByFee(payload.amount, payload.fee ?? this.config.partnerFee, payload.quote_type),
    } satisfies SolverIntentQuoteRequest;
    return SolverApiService.getQuote(payload, this.config, this.configService);
  }

  /**
   * Get the partner fee for a given input amount
   * @param {bigint} inputAmount - The amount of input tokens
   * @returns {bigint} The partner fee amount (denominated in input tokens)
   *
   * @example
   * const fee: bigint = swapService.getPartnerFee(1000000000000000n);
   * console.log('Partner fee:', fee);
   */
  public getPartnerFee(inputAmount: bigint): bigint {
    if (!this.config.partnerFee) {
      return 0n;
    }

    return calculateFeeAmount(inputAmount, this.config.partnerFee);
  }

  /**
   * Get the solver fee for a given input amount (0.1% fee)
   * @param {bigint} inputAmount - The amount of input tokens
   * @returns {bigint} The solver fee amount (denominated in input tokens)
   *
   * @example
   * const fee: bigint = swapService.getSolverFee(1000000000000000n);
   * console.log('Solver fee:', fee);
   */
  public getSolverFee(inputAmount: bigint): bigint {
    return calculatePercentageFeeAmount(inputAmount, 10);
  }

  /**
   * Get the status of an intent from Solver API
   * NOTE: intentHash should be retrieved from relay packet dst_tx_hash property (see createAndSubmitIntent)
   * @param {SolverIntentStatusRequest} request - The intent status request
   * @returns {Promise<Result<SolverIntentStatusResponse, SolverErrorResponse>>} The solver intent status response
   *
   * @example
   * const request = {
   *     "intent_tx_hash": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b" // destination tx hash from relay packet
   * } satisfies SolverIntentStatusRequest
   *
   * const response = await swapService.getStatus(request);
   *
   * if (response.ok) {
   *   const { status, intent_hash } = response.value;
   *   console.log('Status:', status);
   *   console.log('Intent hash:', intent_hash);
   * } else {
   *   // handle error
   * }
   */
  public async getStatus(
    request: SolverIntentStatusRequest,
  ): Promise<Result<SolverIntentStatusResponse, SolverErrorResponse>> {
    return SolverApiService.getStatus(request, this.config);
  }

  /**
   * Post execution of intent order transaction executed on hub chain to Solver API
   * @param {SolverExecutionRequest} request - The intent execution request
   * @returns {Promise<Result<SolverExecutionResponse, SolverErrorResponse>>} The intent execution response
   *
   * @example
   * const request = {
   *     "intent_tx_hash": "0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af",
   * } satisfies SolverExecutionRequest
   *
   * const response = await swapService.postExecution(request);
   *
   * if (response.ok) {
   *   const { answer, intent_hash } = response.value;
   *   console.log('Answer:', answer);
   *   console.log('Intent hash:', intent_hash);
   * } else {
   *   // handle error
   * }
   */
  public async postExecution(
    request: SolverExecutionRequest,
  ): Promise<Result<SolverExecutionResponse, SolverErrorResponse>> {
    return SolverApiService.postExecution(request, this.config);
  }

  /**
   * Submit intent transaction to the relayer API
   * @param {IntentRelayRequest<'submit'>} submitPayload - The intent relay request
   * @returns {Promise<Result<GetRelayResponse<'submit'>, IntentError<'SUBMIT_TX_FAILED'>>>} The intent relay response
   *
   * @example
   * const submitPayload = {
   *     "action": "submit",
   *     "params": {
   *         "chain_id": "0x38.bsc",
   *         "tx_hash": "0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af",
   *     },
   * } satisfies IntentRelayRequest<'submit'>;
   *
   * const submitResult = await swapService.submitIntent(submitPayload);
   *
   * if (submitResult.ok) {
   *   const { success, message } = submitResult.value;
   *   console.log('Success:', success);
   *   console.log('Message:', message);
   * } else {
   *   // handle error
   * }
   */
  public async submitIntent(
    submitPayload: IntentRelayRequest<'submit'>,
  ): Promise<Result<GetRelayResponse<'submit'>, IntentError<'SUBMIT_TX_FAILED'>>> {
    try {
      const submitResult = await submitTransaction(submitPayload, this.config.relayerApiEndpoint);

      if (!submitResult.success) {
        return {
          ok: false,
          error: {
            code: 'SUBMIT_TX_FAILED',
            data: {
              payload: submitPayload,
              error: new Error(submitResult.message),
            },
          },
        };
      }

      return {
        ok: true,
        value: submitResult,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'SUBMIT_TX_FAILED',
          data: {
            payload: submitPayload,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Syntactic sugar for createAndSubmitIntent: creates an intent and submits it to the Solver API and Relayer API.
   *
   * @param {Prettify<SwapParams<S> & OptionalTimeout>} params - Object containing:
   *   - intentParams: The parameters for creating the intent.
   *   - spokeProvider: The spoke provider instance.
   *   - fee: (Optional) Partner fee configuration.
   *   - timeout: (Optional) Timeout in milliseconds for the transaction (default: 60 seconds).
   *   - skipSimulation: (Optional) Whether to skip transaction simulation (default: false).
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>>}
   *   A promise resolving to a Result containing a tuple of SolverExecutionResponse, Intent, and intent delivery info,
   *   or an IntentError if the operation fails.
   *
   * @example
   * const swapResult = await swapService.swap({
   *   intentParams: {
   *     inputToken: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
   *     outputToken: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
   *     inputAmount: 1000000000000000n,
   *     minOutputAmount: 900000000000000n,
   *     deadline: 0n,
   *     allowPartialFill: false,
   *     srcChain: "0x38.bsc",
   *     dstChain: "0xa4b1.arbitrum",
   *     srcAddress: "0x..",
   *     dstAddress: "0x...",
   *     solver: "0x..",
   *     data: "0x..",
   *   },
   *   spokeProvider,
   *   fee, // optional
   *   timeout, // optional
   * });
   *
   * if (swapResult.ok) {
   *   const [solverExecutionResponse, intent, intentDeliveryInfo] = swapResult.value;
   *   console.log('Intent execution response:', solverExecutionResponse);
   *   console.log('Intent:', intent);
   *   console.log('Intent delivery info:', intentDeliveryInfo);
   * } else {
   *   // handle error
   * }
   */
  public async swap<S extends SpokeProvider>({
    intentParams: params,
    spokeProvider,
    fee = this.config.partnerFee,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
    skipSimulation = false,
  }: Prettify<SwapParams<S> & OptionalTimeout>): Promise<
    Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>
  > {
    return this.createAndSubmitIntent({
      intentParams: params,
      spokeProvider,
      fee,
      timeout,
      skipSimulation,
    });
  }

  /**
   * Creates an intent and submits it to the Solver API and Relayer API
   * @param {Prettify<SwapParams<S> & OptionalTimeout>} params - Object containing:
   *   - intentParams: The parameters for creating the intent.
   *   - spokeProvider: The spoke provider instance.
   *   - fee: (Optional) Partner fee configuration.
   *   - timeout: (Optional) Timeout in milliseconds for the transaction (default: 60 seconds).
   *   - skipSimulation: (Optional) Whether to skip transaction simulation (default: false).
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>>}
   *   A promise resolving to a Result containing a tuple of SolverExecutionResponse, Intent, and intent delivery info,
   *   or an IntentError if the operation fails.
   *
   * @example
   * const createAndSubmitIntentResult = await swapService.createAndSubmitIntent({
   *   intentParams: {
   *     inputToken: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
   *     outputToken: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
   *     inputAmount: 1000000000000000n,
   *     minOutputAmount: 900000000000000n,
   *     deadline: 0n,
   *     allowPartialFill: false,
   *     srcChain: "0x38.bsc",
   *     dstChain: "0xa4b1.arbitrum",
   *     srcAddress: "0x..",
   *     dstAddress: "0x...",
   *     solver: "0x..",
   *     data: "0x..",
   *   },
   *   spokeProvider,
   *   fee, // optional
   *   timeout, // optional
   * });
   *
   *
   * if (createAndSubmitIntentResult.ok) {
   *   const [solverExecutionResponse, intent, intentDeliveryInfo] = createAndSubmitIntentResult.value;
   *   console.log('Intent execution response:', solverExecutionResponse);
   *   console.log('Intent:', intent);
   *   console.log('Intent delivery info:', intentDeliveryInfo);
   * } else {
   *   // handle error
   * }
   */
  public async createAndSubmitIntent<S extends SpokeProvider>({
    intentParams: params,
    spokeProvider,
    fee = this.config.partnerFee,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
    skipSimulation = false,
  }: Prettify<SwapParams<S> & OptionalTimeout>): Promise<
    Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>
  > {
    try {
      // first create the deposit with intent data on spoke chain
      const createIntentResult = await this.createIntent({
        intentParams: params,
        spokeProvider,
        fee,
        raw: false,
        skipSimulation,
      });

      if (!createIntentResult.ok) {
        return createIntentResult;
      }

      const [spokeTxHash, intent, data] = createIntentResult.value;

      // then verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(spokeTxHash, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATION_FAILED',
            data: {
              payload: params,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      // then submit the deposit tx hash of spoke chain to the intent relay
      let dstIntentTxHash: string;

      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const intentRelayChainId = getIntentRelayChainId(params.srcChain).toString();
        const submitPayload: IntentRelayRequest<'submit'> =
          params.srcChain === SOLANA_MAINNET_CHAIN_ID && data
            ? {
                action: 'submit',
                params: {
                  chain_id: intentRelayChainId,
                  tx_hash: spokeTxHash,
                  data: {
                    address: intent.creator,
                    payload: data,
                  },
                },
              }
            : {
                action: 'submit',
                params: {
                  chain_id: intentRelayChainId,
                  tx_hash: spokeTxHash,
                },
              };

        const submitResult = await this.submitIntent(submitPayload);

        if (!submitResult.ok) {
          return submitResult;
        }

        // then wait until the intent is executed on the intent relay
        const packet = await waitUntilIntentExecuted({
          intentRelayChainId,
          spokeTxHash,
          timeout,
          apiUrl: this.config.relayerApiEndpoint,
        });

        if (!packet.ok) {
          return {
            ok: false,
            error: packet.error,
          };
        }
        dstIntentTxHash = packet.value.dst_tx_hash;
      } else {
        dstIntentTxHash = spokeTxHash;
      }

      // then post execution of intent order transaction executed on hub chain to Solver API
      const result = await this.postExecution({
        intent_tx_hash: dstIntentTxHash as `0x${string}`,
      });

      if (!result.ok) {
        return {
          ok: false,
          error: {
            code: 'POST_EXECUTION_FAILED',
            data: {
              ...result.error,
              intent,
              intentDeliveryInfo: {
                srcChainId: params.srcChain,
                srcTxHash: spokeTxHash,
                srcAddress: params.srcAddress,
                dstChainId: params.dstChain,
                dstTxHash: dstIntentTxHash,
                dstAddress: params.dstAddress,
              } satisfies IntentDeliveryInfo,
            },
          },
        };
      }

      return {
        ok: true,
        value: [
          result.value,
          intent,
          {
            srcChainId: params.srcChain,
            srcTxHash: spokeTxHash,
            srcAddress: params.srcAddress,
            dstChainId: params.dstChain,
            dstTxHash: dstIntentTxHash,
            dstAddress: params.dstAddress,
          } satisfies IntentDeliveryInfo,
        ],
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN',
          data: {
            payload: params,
            error: error,
          },
        } satisfies IntentError<'UNKNOWN'>,
      };
    }
  }

  /**
   * Check whether the Asset Manager contract is allowed to spend the specified amount of tokens
   * @param {Prettify<SwapParams<S>} params - Object containing:
   *   - intentParams: The parameters for creating the intent.
   *   - spokeProvider: The spoke provider instance.
   * @returns {Promise<Result<boolean>>} - Returns true if allowance is sufficient, false if approval is needed
   *
   * @example
   * const createIntentParams = {
   *   inputToken: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // BSC ETH token address
   *   outputToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // ARB WBTC token address
   *   inputAmount: 1000000000000000n, // The amount of input tokens
   *   minOutputAmount: 900000000000000n, // min amount you are expecting to receive
   *   deadline: 0n, // Optional timestamp after which intent expires (0 = no deadline)
   *   allowPartialFill: false, // Whether the intent can be partially filled
   *   srcChain: BSC_MAINNET_CHAIN_ID, // Chain ID where input tokens originate
   *   dstChain: ARBITRUM_MAINNET_CHAIN_ID, // Chain ID where output tokens should be delivered
   *   srcAddress: '0x..', // Source address (original address on spoke chain)
   *   dstAddress: '0x...', // Destination address (original address on spoke chain)
   *   solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address
   *   data: '0x', // Additional arbitrary data
   * } satisfies CreateIntentParams;
   *
   * const isAllowanceValid = await sodax.swaps.isAllowanceValid({
   *   intentParams: createIntentParams,
   *   spokeProvider: bscSpokeProvider,
   * });
   *
   * if (!isAllowanceValid.ok) {
   *   // Handle error
   *   console.error('Failed to check allowance:', isAllowanceValid.error);
   * } else if (!isAllowanceValid.value) {
   *   // Need to approve tokens
   *   console.log('Approval required');
   * }
   */
  public async isAllowanceValid<S extends SpokeProvider>({
    intentParams: params,
    spokeProvider,
  }: SwapParams<S>): Promise<Result<boolean>> {
    // apply fee to input amount without changing original params
    try {
      if (spokeProvider instanceof EvmSpokeProvider) {
        const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
        return await Erc20Service.isAllowanceValid(
          params.inputToken as GetAddressType<EvmSpokeProvider>,
          params.inputAmount,
          walletAddress,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
        );
      }

      if (spokeProvider instanceof SonicSpokeProvider) {
        const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
        return await Erc20Service.isAllowanceValid(
          params.inputToken as GetAddressType<SonicSpokeProvider>,
          params.inputAmount,
          walletAddress,
          getSolverConfig(SONIC_MAINNET_CHAIN_ID).intentsContract,
          spokeProvider,
        );
      }

      if (spokeProvider instanceof StellarSpokeProvider) {
        return {
          ok: true,
          value: await StellarSpokeService.hasSufficientTrustline(params.inputToken, params.inputAmount, spokeProvider),
        };
      }

      return {
        ok: true,
        value: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Approve the Asset Manager contract to spend tokens on behalf of the user (required for EVM chains)
   * @param {Prettify<SwapParams<S> & OptionalRaw<R>>} params - Object containing:
   *   - intentParams: The parameters for creating the intent.
   *   - spokeProvider: The spoke provider instance.
   *   - raw: (Optional) Whether to return the raw transaction data instead of executing it
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns transaction hash or raw transaction data
   *
   * @example
   * const createIntentParams = {
   *   inputToken: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // BSC ETH token address
   *   outputToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // ARB WBTC token address
   *   inputAmount: 1000000000000000n, // The amount of input tokens
   *   minOutputAmount: 900000000000000n, // min amount you are expecting to receive
   *   deadline: 0n, // Optional timestamp after which intent expires (0 = no deadline)
   *   allowPartialFill: false, // Whether the intent can be partially filled
   *   srcChain: BSC_MAINNET_CHAIN_ID, // Chain ID where input tokens originate
   *   dstChain: ARBITRUM_MAINNET_CHAIN_ID, // Chain ID where output tokens should be delivered
   *   srcAddress: '0x..', // Source address (original address on spoke chain)
   *   dstAddress: '0x...', // Destination address (original address on spoke chain)
   *   solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address
   *   data: '0x', // Additional arbitrary data
   * } satisfies CreateIntentParams;
   *
   * const approveResult = await sodax.swaps.approve({
   *   intentParams: createIntentParams,
   *   spokeProvider: bscSpokeProvider,
   * });
   *
   * if (!approveResult.ok) {
   *   // Handle error
   *   console.error('Failed to approve tokens:', approveResult.error);
   * } else {
   *   // Transaction hash or raw transaction data
   *   const txHash = approveResult.value;
   *   console.log('Approval transaction:', txHash);
   * }
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>({
    intentParams: params,
    spokeProvider,
    raw,
  }: Prettify<SwapParams<S> & OptionalRaw<R>>): Promise<Result<TxReturnType<S, R>>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider) {
        const result = await Erc20Service.approve(
          params.inputToken as GetAddressType<EvmSpokeProvider>,
          params.inputAmount,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result satisfies TxReturnType<EvmSpokeProvider, R> as TxReturnType<S, R>,
        };
      }

      if (spokeProvider instanceof SonicSpokeProvider) {
        const result = await Erc20Service.approve(
          params.inputToken as GetAddressType<SonicSpokeProvider>,
          params.inputAmount,
          getSolverConfig(SONIC_MAINNET_CHAIN_ID).intentsContract,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result satisfies TxReturnType<SonicSpokeProvider, R> as TxReturnType<S, R>,
        };
      }

      if (spokeProvider instanceof StellarSpokeProvider) {
        const result = await StellarSpokeService.requestTrustline(
          params.inputToken,
          params.inputAmount,
          spokeProvider,
          raw,
        );
        return {
          ok: true,
          value: result satisfies TxReturnType<StellarSpokeProvider, R> as TxReturnType<S, R>,
        };
      }

      return {
        ok: false,
        error: new Error('Approve only supported for EVM (approve) and Stellar (trustline) spoke chains'),
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Creates an intent by handling token approval and intent creation
   * NOTE: This method does not submit the intent to the Solver API
   * @param {Prettify<SwapParams<S> & OptionalRaw<R>>} params - Object containing:
   *   - intentParams: The parameters for creating the intent.
   *   - spokeProvider: The spoke provider instance.
   *   - fee: (Optional) Partner fee configuration.
   *   - raw: (Optional) Whether to return the raw transaction data instead of executing it
   *   - skipSimulation: (Optional) Whether to skip transaction simulation (default: false).
   * @returns {Promise<Result<[TxReturnType<S, R>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>>} The encoded contract call or raw transaction data, Intent and intent data as hex
   *
   * @example
   * const payload = {
   *     "inputToken": "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // BSC ETH token address
   *     "outputToken": "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // ARB WBTC token address
   *     "inputAmount": 1000000000000000n, // The amount of input tokens
   *     "minOutputAmount": 900000000000000n, // min amount you are expecting to receive
   *     "deadline": 0n, // Optional timestamp after which intent expires (0 = no deadline)
   *     "allowPartialFill": false, // Whether the intent can be partially filled
   *     "srcChain": "0x38.bsc", // Chain ID where input tokens originate
   *     "dstChain": "0xa4b1.arbitrum", // Chain ID where output tokens should be delivered
   *     "srcAddress": "0x..", // Source address (original address on spoke chain)
   *     "dstAddress": "0x...", // Destination address (original address on spoke chain)
   *     "solver": "0x..", // Optional specific solver address (address(0) = any solver)
   *     "data": "0x..", // Additional arbitrary data
   * } satisfies CreateIntentParams;
   *
   * const createIntentResult = await swapService.createIntent({
   *   intentParams: payload,
   *   spokeProvider,
   *   fee, // optional
   *   raw, // optional
   * });
   *
   * if (createIntentResult.ok) {
   *   const [txResult, intent, intentData] = createIntentResult.value;
   *   console.log('Transaction result:', txResult);
   *   console.log('Intent:', intent);
   *   console.log('Intent data:', intentData);
   * } else {
   *   // handle error
   * }
   */
  public async createIntent<S extends SpokeProvider, R extends boolean = false>({
    intentParams: params,
    spokeProvider,
    fee = this.config.partnerFee,
    raw,
    skipSimulation = false
  }: Prettify<SwapParams<S> & OptionalRaw<R>>): Promise<
    Result<[TxReturnType<S, R>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>
  > {
    invariant(
      this.configService.isValidOriginalAssetAddress(params.srcChain, params.inputToken),
      `Unsupported spoke chain token (params.srcChain): ${params.srcChain}, params.inputToken): ${params.inputToken}`,
    );
    invariant(
      this.configService.isValidOriginalAssetAddress(params.dstChain, params.outputToken),
      `Unsupported spoke chain token (params.dstChain): ${params.dstChain}, params.outputToken): ${params.outputToken}`,
    );
    invariant(
      this.configService.isValidSpokeChainId(params.srcChain),
      `Invalid spoke chain (params.srcChain): ${params.srcChain}`,
    );
    invariant(
      this.configService.isValidSpokeChainId(params.dstChain),
      `Invalid spoke chain (params.dstChain): ${params.dstChain}`,
    );

    try {
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      invariant(
        params.srcAddress.toLowerCase() === walletAddress.toLowerCase(),
        'srcAddress must be the same as wallet address',
      );

      // derive users hub wallet address
      const creatorHubWalletAddress = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

      if (spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id) {
        // on hub chain create intent directly

        const [txResult, intent, feeAmount, data] = await SonicSpokeService.createSwapIntent(
          params,
          creatorHubWalletAddress,
          this.config,
          fee,
          spokeProvider as SonicSpokeProvider,
          this.hubProvider,
          raw,
        );

        return {
          ok: true,
          value: [
            txResult satisfies TxReturnType<SonicSpokeProvider, R> as TxReturnType<S, R>,
            { ...intent, feeAmount } as Intent & FeeAmount,
            data,
          ],
        };
      }

      {
        // construct the intent data
        const [data, intent, feeAmount] = EvmSolverService.constructCreateIntentData(
          {
            ...params,
            srcAddress: walletAddress,
          },
          creatorHubWalletAddress,
          this.config,
          this.configService,
          fee,
        );

        const txResult = await SpokeService.deposit(
          {
            from: walletAddress,
            to: creatorHubWalletAddress,
            token: params.inputToken,
            amount: params.inputAmount,
            data: data,
          } as GetSpokeDepositParamsType<S>,
          spokeProvider satisfies S,
          this.hubProvider,
          raw,
          skipSimulation,
        );

        return {
          ok: true,
          value: [txResult as TxReturnType<S, R>, { ...intent, feeAmount } as Intent & FeeAmount, data],
        };
      }
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
   * @returns {Promise<TxReturnType<S, R>>} The encoded contract call
   */
  public async cancelIntent<S extends SpokeProvider, R extends boolean = false>(
    intent: Intent,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      invariant(
        this.configService.isValidIntentRelayChainId(intent.srcChain),
        `Invalid intent.srcChain: ${intent.srcChain}`,
      );
      invariant(
        this.configService.isValidIntentRelayChainId(intent.dstChain),
        `Invalid intent.dstChain: ${intent.dstChain}`,
      );

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      // derive users hub wallet address
      const creatorHubWalletAddress = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

      const calls: EvmContractCall[] = [];
      const intentsContract = this.config.intentsContract;
      calls.push(EvmSolverService.encodeCancelIntent(intent, intentsContract));
      const data = encodeContractCalls(calls);
      const txResult = await SpokeService.callWallet(
        creatorHubWalletAddress,
        data,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Gets an intent from a transaction hash (on Hub chain)
   * @param {Hash} txHash - The transaction hash on Hub chain
   * @returns {Promise<Intent>} The intent
   */
  public getIntent(txHash: Hash): Promise<Intent> {
    return EvmSolverService.getIntent(txHash, this.config, this.hubProvider);
  }

  /**
   * Gets the intent state from a transaction hash (on Hub chain)
   * @param {Hash} txHash - The transaction hash on Hub chain
   * @returns {Promise<IntentState>} The intent state
   */
  public getFilledIntent(txHash: Hash): Promise<IntentState> {
    return EvmSolverService.getFilledIntent(txHash, this.config, this.hubProvider);
  }

  /**
   * Gets the keccak256 hash of an intent. Hash serves as the intent id on Hub chain.
   * @param {Intent} intent - The intent
   * @returns {Hex} The keccak256 hash of the intent
   */
  public getIntentHash(intent: Intent): Hex {
    return EvmSolverService.getIntentHash(intent);
  }

  /**
   * Gets the deadline for a swap by querying hub chain block timestamp and adding the deadline offset
   * @param {bigint} deadline (default: 5 minutes) - The deadline offset in seconds for the swap to be cancelled
   * @returns {Promise<bigint>} The deadline for the swap as a sum of hub chain block timestamp and deadline offset
   */
  public async getSwapDeadline(deadline: bigint = DEFAULT_DEADLINE_OFFSET): Promise<bigint> {
    invariant(deadline > 0n, 'Deadline must be greater than 0');

    const block = await this.hubProvider.publicClient.getBlock({
      includeTransactions: false,
      blockTag: 'latest',
    });
    return block.timestamp + deadline;
  }

  /**
   * Get the list of all supported swap tokens for a given spoke chain ID
   * @param {SpokeChainId} chainId - The chain ID
   * @returns {readonly Token[]} - Array of supported tokens
   */
  public getSupportedSwapTokensByChainId(chainId: SpokeChainId): readonly Token[] {
    return this.configService.getSupportedSwapTokensByChainId(chainId);
  }

  /**
   * Get the list of all supported swap tokens
   * @returns {Record<SpokeChainId, readonly Token[]>} - Object containing all supported swap tokens
   */
  public getSupportedSwapTokens(): Record<SpokeChainId, readonly Token[]> {
    return this.configService.getSupportedSwapTokens();
  }
}
