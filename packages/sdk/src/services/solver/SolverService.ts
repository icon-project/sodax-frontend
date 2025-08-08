import invariant from 'tiny-invariant';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  DEFAULT_RELAY_TX_TIMEOUT,
  Erc20Service,
  type EvmHubProvider,
  EvmSpokeProvider,
  type GetRelayResponse,
  type IntentRelayRequest,
  type RelayErrorCode,
  SonicSpokeProvider,
  type SpokeProvider,
  SpokeService,
  type WaitUntilIntentExecutedPayload,
  WalletAbstractionService,
  calculateFeeAmount,
  encodeAddress,
  encodeContractCalls,
  getIntentRelayChainId,
  getSolverConfig,
  isConfiguredSolverConfig,
  isValidIntentRelayChainId,
  isValidOriginalAssetAddress,
  isValidSpokeChainId,
  submitTransaction,
  waitUntilIntentExecuted,
} from '../../index.js';
import type {
  EvmContractCall,
  FeeAmount,
  GetSpokeDepositParamsType,
  HttpUrl,
  SolverErrorResponse,
  SolverExecutionRequest,
  SolverExecutionResponse,
  SolverIntentQuoteRequest,
  SolverIntentQuoteResponse,
  IntentRelayChainId,
  SolverIntentStatusRequest,
  SolverIntentStatusResponse,
  PartnerFee,
  Result,
  SolverConfigParams,
  SolverServiceConfig,
  TxReturnType,
  GetEstimateGasReturnType,
} from '../../types.js';
import { EvmSolverService } from './EvmSolverService.js';
import { SolverApiService } from './SolverApiService.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type SpokeChainId,
  type Address,
  type Hex,
  type Hash,
  SOLANA_MAINNET_CHAIN_ID,
} from '@sodax/types';

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

export type IntentErrorCode = RelayErrorCode | 'UNKNOWN' | 'CREATION_FAILED' | 'POST_EXECUTION_FAILED';
export type IntentErrorData<T extends IntentErrorCode> = T extends 'RELAY_TIMEOUT'
  ? IntentWaitUntilIntentExecutedFailedErrorData
  : T extends 'CREATION_FAILED'
    ? IntentCreationFailedErrorData
    : T extends 'SUBMIT_TX_FAILED'
      ? IntentSubmitTxFailedErrorData
      : T extends 'POST_EXECUTION_FAILED'
        ? SolverErrorResponse
        : T extends 'UNKNOWN'
          ? IntentCreationFailedErrorData
          : never;

export type IntentError<T extends IntentErrorCode = IntentErrorCode> = {
  code: T;
  data: IntentErrorData<T>;
};

export class SolverService {
  readonly config: SolverServiceConfig;
  readonly hubProvider: EvmHubProvider;

  public constructor(
    config: SolverConfigParams | undefined,
    hubProvider: EvmHubProvider,
    relayerApiEndpoint?: HttpUrl,
  ) {
    if (!config) {
      // default to mainnet config
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
   * } satisfies SolverIntentQuoteRequest
   *
   * const response = await solverService.getQuote(payload);
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
    return SolverApiService.getQuote(payload, this.config);
  }

  /**
   * Get the fee for a given input amount
   * @param {bigint} inputAmount - The amount of input tokens
   * @returns {Promise<bigint>} The fee amount (denominated in input tokens)
   *
   * @example
   * const fee: bigint = await solverService.getFee(1000000000000000n);
   * console.log('Fee:', fee);
   */
  public async getFee(inputAmount: bigint): Promise<bigint> {
    if (!this.config.partnerFee) {
      return 0n;
    }

    return calculateFeeAmount(inputAmount, this.config.partnerFee);
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
   * const response = await solverService.getStatus(request);
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
   * const response = await solverService.postExecution(request);
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
   * const submitResult = await solverService.submitIntent(submitPayload);
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
   * Swap is a syntatic sugar for createAndSubmitIntent that creates an intent and submits it to the Solver API and Relayer API
   * @param {CreateIntentParams} payload - The intent to create
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {number} timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, PacketData], IntentError<IntentErrorCode>>>} The solver execution response, intent, and packet data
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
   * const swapResult = await solverService.swap(payload, spokeProvider);
   *
   * if (swapResult.ok) {
   *   const [solverExecutionResponse, intent, packetData] = swapResult.value;
   *   console.log('Intent execution response:', solverExecutionResponse);
   *   console.log('Intent:', intent);
   *   console.log('Packet data:', packetData);
   * } else {
   *   // handle error
   * }
   */
  public async swap<S extends SpokeProvider>(
    payload: CreateIntentParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SolverExecutionResponse, Intent, Hex], IntentError<IntentErrorCode>>> {
    return this.createAndSubmitIntent(payload, spokeProvider, this.config.partnerFee, timeout);
  }

  /**
   * Creates an intent and submits it to the Solver API and Relayer API
   * @param {CreateIntentParams} payload - The intent to create
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {number} timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, Hex], IntentError<IntentErrorCode>>>} The solver execution response, intent, and packet data
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
   * const createAndSubmitIntentResult = await solverService.createAndSubmitIntent(payload, spokeProvider);
   *
   * if (createAndSubmitIntentResult.ok) {
   *   const [solverExecutionResponse, intent, packetData] = createAndSubmitIntentResult.value;
   *   console.log('Intent execution response:', solverExecutionResponse);
   *   console.log('Intent:', intent);
   *   console.log('Packet data:', packetData);
   * } else {
   *   // handle error
   * }
   */
  public async createAndSubmitIntent<S extends SpokeProvider>(
    payload: CreateIntentParams,
    spokeProvider: S,
    fee= this.config.partnerFee,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SolverExecutionResponse, Intent, Hex], IntentError<IntentErrorCode>>> {
    try {
      // first create the deposit with intent data on spoke chain
      const createIntentResult = await this.createIntent(payload, spokeProvider, fee, false);

      if (!createIntentResult.ok) {
        return createIntentResult;
      }

      // then submit the deposit tx hash of spoke chain to the intent relay
      const [spokeTxHash, intent, data] = createIntentResult.value;

      let intentTxHash: string | null = null;

      if (spokeProvider.chainConfig.chain.id !== SONIC_MAINNET_CHAIN_ID) {
        const intentRelayChainId = getIntentRelayChainId(payload.srcChain).toString();
        const submitPayload: IntentRelayRequest<'submit'> =
          payload.srcChain === SOLANA_MAINNET_CHAIN_ID && data
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
        intentTxHash = packet.value.dst_tx_hash;
      } else {
        intentTxHash = spokeTxHash;
      }

      // then post execution of intent order transaction executed on hub chain to Solver API
      const result = await this.postExecution({
        intent_tx_hash: intentTxHash as `0x${string}`,
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
        value: [result.value, intent, intentTxHash as `0x${string}`],
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
        } satisfies IntentError<'UNKNOWN'>,
      };
    }
  }

  /**
   * Check whether assetManager contract is allowed to move the given payload amount
   * @param {CreateIntentParams} params - The intent to create
   * @param {SpokeProvider} spokeProvider - The spoke provider
   * @return {Promise<Result<boolean>>} - valid = true, invalid = false
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
   * const isAllowanceValid = await solverService.isAllowanceValid(payload, spokeProvider);
   *
   * if (!allowanceValid.ok) {
   *   // Handle error
   * }
   *
   * if (!allowanceValid.value) {
   *   // Need to approve
   * }
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: CreateIntentParams,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
        const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
        return Erc20Service.isAllowanceValid(
          params.inputToken as Address,
          params.inputAmount,
          walletAddress,
          spokeProvider instanceof EvmSpokeProvider
            ? spokeProvider.chainConfig.addresses.assetManager
            : spokeProvider.chainConfig.addresses.walletRouter,
          spokeProvider,
        );
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
   * Approve amount spending (currently required for EVM only)
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param spender - Spender address
   * @param spokeProvider - Spoke provider
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const approveResult = await approve(
   *   '0x...', // ERC20 token address
   *   1000n, // Amount to approve (in token decimals)
   *   '0x...', // Spender address (usually the asset manager contract: spokeProvider.chainConfig.addresses.assetManager)
   *   spokeProvider,
   *   true // if true, returns raw transaction hash instead of raw transaction
   * );
   *
   * if (!approveResult.ok) {
   *   // Handle error
   * }
   *
   * const txReceipt = approveResult.value;
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    token: Address,
    amount: bigint,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider) {
        const result = await Erc20Service.approve(
          token,
          amount,
          spokeProvider.chainConfig.addresses.assetManager as Address,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result satisfies TxReturnType<EvmSpokeProvider | SonicSpokeProvider, R> as TxReturnType<S, R>,
        };
      }

      return {
        ok: false,
        error: new Error('Approve only supported for EVM spoke chains'),
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
   * @param {Omit<CreateIntentParams, 'srcAddress'>} params - The intent to create
   * @param {SpokeProvider} spokeProvider - The spoke provider
   * @param {boolean} raw - Whether to return the raw transaction
   * @param {PartnerFee} fee - The fee to apply to the intent
   * @returns {Promise<Result<[TxReturnType<S, R>, Intent & FeeAmount], IntentError<'CREATION_FAILED'>>>} The encoded contract call
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
   * const createIntentResult = await solverService.createIntent(payload, spokeProvider);
   *
   * if (createIntentResult.ok) {
   *   const [txResult, intent] = createIntentResult.value;
   *   console.log('Intent:', intent);
   *
   */
  public async createIntent<S extends SpokeProvider, R extends boolean = false>(
    params: CreateIntentParams,
    spokeProvider: S,
    fee?: PartnerFee,
    raw?: R,
  ): Promise<Result<[TxReturnType<S, R>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>> {
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
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      invariant(
        params.srcAddress.toLowerCase() === walletAddress.toLowerCase(),
        'srcAddress must be the same as wallet address',
      );

      const walletAddressBytes = encodeAddress(params.srcChain, walletAddress);

      // derive users hub wallet address
      const creatorHubWalletAddress =
        spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id // on hub chain, use real user wallet address
          ? walletAddressBytes
          : await WalletAbstractionService.getUserHubWalletAddress(walletAddress, spokeProvider, this.hubProvider);

      // construct the intent data
      const [data, intent, feeAmount] = EvmSolverService.constructCreateIntentData(
        {
          ...params,
          srcAddress: walletAddress,
        },
        creatorHubWalletAddress,
        this.config,
        fee,
      );

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          to: creatorHubWalletAddress,
          token: params.inputToken,
          amount: params.inputAmount + feeAmount,
          data: data,
        } as GetSpokeDepositParamsType<S>,
        spokeProvider satisfies S,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: [txResult as TxReturnType<S, R>, { ...intent, feeAmount } as Intent & FeeAmount, data],
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
  public async cancelIntent<S extends SpokeProvider, R extends boolean = false>(
    intent: Intent,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      invariant(isValidIntentRelayChainId(intent.srcChain), `Invalid intent.srcChain: ${intent.srcChain}`);
      invariant(isValidIntentRelayChainId(intent.dstChain), `Invalid intent.dstChain: ${intent.dstChain}`);

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const walletAddressBytes = encodeAddress(spokeProvider.chainConfig.chain.id, walletAddress);
      // derive users hub wallet address
      const creatorHubWalletAddress =
        spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id // on hub chain, use real user wallet address
          ? walletAddressBytes
          : await WalletAbstractionService.getUserHubWalletAddress(walletAddress, spokeProvider, this.hubProvider);

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
   * Gets the keccak256 hash of an intent. Hash serves as the intent id on Hub chain.
   * @param {Intent} intent - The intent
   * @returns {Hex} The keccak256 hash of the intent
   */
  public getIntentHash(intent: Intent): Hex {
    return EvmSolverService.getIntentHash(intent);
  }
}
