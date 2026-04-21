import invariant from 'tiny-invariant';
import {
  submitTransaction,
  waitUntilIntentExecuted,
  SonicSpokeService,
  type SpokeService,
  adjustAmountByFee,
  calculateFeeAmount,
  calculatePercentageFeeAmount,
  encodeContractCalls,
  SolverApiService,
  EvmSolverService,
  isSonicChainKeyType,
  type EstimateGasParams,
  type ConfigService,
  type HubProvider,
  type DepositParams,
  type GetRelayResponse,
  type IntentDeliveryInfo,
  type IntentRelayRequest,
  type PacketData,
  type RelayErrorCode,
  type SubmitTxExtraData,
  type WaitUntilIntentExecutedPayload,
  isBitcoinChainKeyType,
  HubService,
  isHubChainKeyType,
  type CreateSonicSwapIntentParams,
  reverseEncodeAddress,
  type SendMessageParams,
  type SpokeIsAllowanceValidParams,
  type SpokeIsAllowanceValidParamsEvmSpoke,
  type SpokeIsAllowanceValidParamsHub,
  type SpokeIsAllowanceValidParamsStellar,
  isEvmSpokeOnlyChainKeyType,
  isStellarChainKeyType,
  type WalletProviderSlot,
  isBitcoinWalletProvider,
  isValidWalletProviderForChainKey,
  relayTxAndWaitPacket,
  isSolanaChainKeyType,
  type SpokeApproveParams,
} from '../index.js';
import {
  type SpokeChainKey,
  type Address,
  type Hex,
  type Hash,
  type HttpUrl,
  type IntentRelayChainId,
  getIntentRelayChainId,
  isBitcoinChainKey,
  type FeeAmount,
  type GetWalletProviderType,
  type PartnerFee,
  type SolverErrorResponse,
  type SolverExecutionRequest,
  type SolverExecutionResponse,
  type SolverIntentQuoteRequest,
  type SolverIntentQuoteResponse,
  type SolverIntentStatusRequest,
  type SolverIntentStatusResponse,
  type Result,
  type TxReturnType,
  type GetEstimateGasReturnType,
  type SolverConfig,
  type XToken,
  type IEvmWalletProvider,
  HUB_CHAIN_KEY,
  isHubChainKey,
  DEFAULT_RELAY_TX_TIMEOUT,
  DEFAULT_DEADLINE_OFFSET,
  type GetAddressType,
  type GetTokenAddressType,
  type HubChainKey,
  type EvmSpokeOnlyChainKey,
  type StellarChainKey,
  spokeChainConfig,
} from '@sodax/types';

// `srcChain: K` is the generic anchor. When the caller supplies a literal (e.g. `'ethereum'`)
// TypeScript infers `K = 'ethereum'` and downstream `WalletProviderSlot<K, R>` narrows the
// required walletProvider to the matching chain-specific provider interface. When the caller
// passes a value typed as the broad `SpokeChainKey`, K stays unconstrained and the wallet
// provider gracefully falls back to the full `IWalletProvider` union.
export type CreateIntentParams<K extends SpokeChainKey = SpokeChainKey> = {
  inputToken: string; // The address of the input token on spoke chain
  outputToken: string; // The address of the output token on spoke chain
  inputAmount: bigint; // The amount of input tokens
  minOutputAmount: bigint; // The minimum amount of output tokens to accept
  deadline: bigint; // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: boolean; // Whether the intent can be partially filled
  srcChain: K; // Chain ID where input tokens originate (drives type narrowing of walletProvider)
  dstChain: SpokeChainKey; // Chain ID where output tokens should be delivered
  srcAddress: string; // Source address (original address on spoke chain)
  dstAddress: string; // Destination address (original address on spoke chain)
  solver: Address; // Optional specific solver address (address(0) = any solver)
  data: Hex; // Additional arbitrary data
};

export type CreateLimitOrderParams<K extends SpokeChainKey = SpokeChainKey> = Omit<CreateIntentParams<K>, 'deadline'>;

/**
 * Parameters for creating a limit order intent.
 * Similar to CreateIntentParams but without the deadline field (deadline is automatically set to 0n for limit orders).
 *
 * @property inputToken - The address of the input token on the spoke chain.
 * @property outputToken - The address of the output token on the spoke chain.
 * @property inputAmount - The amount of input tokens to provide, denominated in the input token's decimals.
 * @property minOutputAmount - The minimum amount of output tokens to accept, denominated in the output token's decimals.
 * @property allowPartialFill - Whether the intent can be partially filled.
 * @property srcChain - Chain ID where input tokens originate.
 * @property dstChain - Chain ID where output tokens should be delivered.
 * @property srcAddress - Sender address on source chain.
 * @property dstAddress - Receiver address on destination chain.
 * @property solver - Optional specific solver address (use address(0) for any solver).
 * @property data - Additional arbitrary data (opaque, for advanced integrations/fees etc).
 */
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
  // The user-facing input could be either a regular intent (with deadline) or a limit order
  // (without). The error data preserves whichever shape the caller passed; downstream consumers
  // narrow if they need the deadline.
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

export type IntentErrorCode =
  | RelayErrorCode
  | 'UNKNOWN'
  | 'CREATION_FAILED'
  | 'POST_EXECUTION_FAILED'
  | 'CANCEL_FAILED';

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

export type GetIntentSubmitTxExtraDataParams = { txHash: Hash } | { intent: Intent };

// Exec-mode params: walletProvider is required and K-narrowed. Consumed by `createIntent`,
// `createLimitOrder`, `createLimitOrderIntent`, `approve` — methods that send a transaction
// and return an executed tx hash.
export type SwapActionParams<K extends SpokeChainKey> = {
  params: CreateIntentParams<K>;
  walletProvider: GetWalletProviderType<K>;
  skipSimulation?: boolean;
  timeout?: number;
  fee?: PartnerFee;
};

// Raw-mode params: no walletProvider, caller signs/broadcasts the returned raw tx themselves.
// Consumed by the `*Raw` twin of each action method.
export type SwapActionParamsRaw<K extends SpokeChainKey> = {
  params: CreateIntentParams<K>;
  skipSimulation?: boolean;
  timeout?: number;
  fee?: PartnerFee;
};

export type LimitOrderActionParams<K extends SpokeChainKey> = Omit<SwapActionParams<K>, 'params'> & {
  params: CreateLimitOrderParams<K>;
};

export type LimitOrderActionParamsRaw<K extends SpokeChainKey> = Omit<SwapActionParamsRaw<K>, 'params'> & {
  params: CreateLimitOrderParams<K>;
};

export type SwapAllowanceParams<K extends SpokeChainKey> = {
  params: CreateIntentParams<K> | CreateLimitOrderParams<K>;
  walletProvider: GetWalletProviderType<K>;
};

/**
 * Params for `cancelIntent`.
 * Because `Intent.srcChain` is an `IntentRelayChainId` (bigint) whose literal type cannot
 * narrow to a specific ChainKey, the user passes `srcChainKey: K` explicitly. At runtime we
 * assert that `getIntentRelayChainId(srcChainKey) === intent.srcChain` and throw if not.
 */
export type CancelIntentParams<K extends SpokeChainKey, R extends boolean> = {
  srcChainKey: K;
  intent: Intent;
  raw?: R;
  skipSimulation?: boolean;
  fee?: PartnerFee;
  timeout?: number;
} & WalletProviderSlot<K, R>;

export type SwapServiceConstructorParams = {
  configService: ConfigService;
  spokeService: SpokeService;
  hubProvider: HubProvider;
};

/**
 * SwapService is a main class that provides functionalities for swapping tokens between spoke chains.
 * @namespace SodaxFeatures
 */
export class SwapService {
  // dependent services
  readonly hubProvider: HubProvider;
  readonly config: ConfigService;
  readonly spokeService: SpokeService;

  // swap config
  readonly solver: SolverConfig;
  readonly partnerFee: PartnerFee | undefined;
  readonly relayerApiEndpoint: HttpUrl;

  public constructor({ configService, hubProvider, spokeService }: SwapServiceConstructorParams) {
    this.solver = configService.solver;
    this.partnerFee = configService.swaps.partnerFee;
    this.relayerApiEndpoint = configService.relay.relayerApiEndpoint;
    this.config = configService;
    this.hubProvider = hubProvider;
    this.spokeService = spokeService;
  }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public async estimateGas<C extends SpokeChainKey>(
    params: EstimateGasParams<C>,
  ): Promise<GetEstimateGasReturnType<C>> {
    return this.spokeService.estimateGas(params) as Promise<GetEstimateGasReturnType<C>>;
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
      amount: adjustAmountByFee(payload.amount, this.partnerFee, payload.quote_type),
    } satisfies SolverIntentQuoteRequest;
    return SolverApiService.getQuote(payload, this.solver, this.config);
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
    if (!this.partnerFee) {
      return 0n;
    }

    return calculateFeeAmount(inputAmount, this.partnerFee);
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
    return SolverApiService.getStatus(request, this.solver);
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
    return SolverApiService.postExecution(request, this.solver);
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
      const submitResult = await submitTransaction(submitPayload, this.relayerApiEndpoint);

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
  public async swap<K extends SpokeChainKey>(
    _params: SwapActionParams<K>,
  ): Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>> {
    const { params } = _params;
    const srcChainKey = params.srcChain;
    try {
      const timeout = _params.timeout;
      // first create the deposit with intent data on spoke chain
      const createIntentResult = await this.createIntent(_params);

      if (!createIntentResult.ok) {
        return createIntentResult;
      }

      const [spokeTxHash, intent, data] = createIntentResult.value;

      // then verify the spoke tx hash exists on chain
      const verifyTxHashResult = await this.spokeService.verifyTxHash({
        txHash: spokeTxHash,
        chainKey: srcChainKey,
      });

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

      let dstIntentTxHash: string;
      if (isHubChainKeyType(srcChainKey)) {
        // on hub chain, the spoke tx hash is the same as the intent tx hash
        dstIntentTxHash = spokeTxHash;
      } else {
        const packet = await relayTxAndWaitPacket(
          spokeTxHash,
          isSolanaChainKeyType(srcChainKey) || isBitcoinChainKeyType(srcChainKey)
            ? ({
                address: intent.creator,
                payload: data,
              } satisfies SubmitTxExtraData)
            : undefined,
          srcChainKey,
          this.relayerApiEndpoint,
          timeout,
        );

        if (!packet.ok) {
          return {
            ok: false,
            error: {
              code: packet.error.code,
              data: {
                payload: params,
                error: packet.error,
              },
            },
          };
        }

        dstIntentTxHash = packet.value.dst_tx_hash;
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
                srcChainId: srcChainKey,
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
            srcChainId: srcChainKey,
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
   * Check whether the spender contract is allowed to spend the specified amount of tokens.
   * For EVM chains, checks ERC20 allowance against the asset manager (spoke) or intents contract (hub).
   * For Stellar, checks trustline sufficiency.
   * For all other chains, returns true (no allowance concept).
   *
   * @param {CreateIntentParams<C> | CreateLimitOrderParams<C>} params - The intent or limit order parameters.
   * @returns {Promise<Result<boolean>>} - Returns true if allowance is sufficient, false if approval is needed.
   * Implementation delegates to {@link SpokeService.isAllowanceValid} with mapped {@link SpokeIsAllowanceValidParams}.
   *
   * @example
   * const isValid = await sodax.swaps.isAllowanceValid(swapParams);
   *
   * if (!isValid.ok) {
   *   console.error('Failed to check allowance:', isValid.error);
   * } else if (!isValid.value) {
   *   console.log('Approval required');
   * }
   */
  public async isAllowanceValid<K extends SpokeChainKey>(_params: SwapActionParams<K>): Promise<Result<boolean>> {
    try {
      const { params } = _params;
      const srcChainKey = params.srcChain;

      if (isHubChainKeyType(srcChainKey)) {
        return await this.spokeService.isAllowanceValid({
          srcChainKey,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress,
          spender: this.solver.intentsContract,
        } satisfies SpokeIsAllowanceValidParamsHub);
      }

      if (isEvmSpokeOnlyChainKeyType(srcChainKey)) {
        return await this.spokeService.isAllowanceValid({
          srcChainKey,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress,
          spender: spokeChainConfig[srcChainKey].addresses.assetManager,
        } satisfies SpokeIsAllowanceValidParamsEvmSpoke);
      }

      if (isStellarChainKeyType(srcChainKey)) {
        return await this.spokeService.isAllowanceValid({
          srcChainKey,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress,
        } satisfies SpokeIsAllowanceValidParamsStellar);
      }

      return { ok: true, value: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async approveRaw<K extends SpokeChainKey>(
    _params: SwapActionParamsRaw<K>,
  ): Promise<Result<TxReturnType<K, true>>> {
    try {
      const { params } = _params;

      // NOTE: SpokeService.approve currently only exposes the exec shape in its type signature;
      // returning a raw-tx variant will come after the spoke approve layer grows raw support.
      // For now the unknown cast below is a stop-gap so the public API shape is right even
      // though the runtime still executes.
      if (isHubChainKeyType(params.srcChain)) {
        const result = await this.spokeService.approve({
          srcChainKey: params.srcChain,
          token: params.inputToken as GetTokenAddressType<HubChainKey>,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<HubChainKey>,
          spender: this.solver.intentsContract,
          raw: true,
        } satisfies SpokeApproveParams<HubChainKey, true> as SpokeApproveParams<HubChainKey, true>);

        return result satisfies Result<TxReturnType<HubChainKey, true>> as Result<TxReturnType<K, true>>;
      }

      if (isEvmSpokeOnlyChainKeyType(params.srcChain)) {
        const result = await this.spokeService.approve({
          srcChainKey: params.srcChain,
          token: params.inputToken as GetTokenAddressType<EvmSpokeOnlyChainKey>,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<EvmSpokeOnlyChainKey>,
          spender: spokeChainConfig[params.srcChain].addresses.assetManager,
          raw: true,
        } satisfies SpokeApproveParams<EvmSpokeOnlyChainKey, true> as SpokeApproveParams<EvmSpokeOnlyChainKey, true>);
        return result satisfies Result<TxReturnType<EvmSpokeOnlyChainKey, true>> as Result<TxReturnType<K, true>>;
      }

      if (isStellarChainKeyType(params.srcChain)) {
        const result = await this.spokeService.approve<StellarChainKey, true>({
          srcChainKey: params.srcChain,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<StellarChainKey>,
          raw: true,
        } satisfies SpokeApproveParams<StellarChainKey, true> as SpokeApproveParams<StellarChainKey, true>);

        if (!result.ok) {
          return result;
        }
        return {
          ok: true,
          value: result.value satisfies TxReturnType<StellarChainKey, true> as TxReturnType<K, true>,
        };
      }

      return {
        ok: false,
        error: new Error('Approve only supported for hub (Sonic), EVM spokes, and Stellar'),
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  public async approve<K extends SpokeChainKey>(_params: SwapActionParams<K>): Promise<Result<TxReturnType<K, false>>> {
    try {
      const { params } = _params;

      if (isHubChainKeyType(params.srcChain)) {
        const result = await this.spokeService.approve<HubChainKey, false>({
          srcChainKey: params.srcChain,
          token: params.inputToken as GetTokenAddressType<HubChainKey>,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<HubChainKey>,
          spender: this.solver.intentsContract,
          raw: false,
          walletProvider: _params.walletProvider as GetWalletProviderType<HubChainKey>,
        } satisfies SpokeApproveParams<HubChainKey, false> as SpokeApproveParams<HubChainKey, false>);

        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          value: result.value satisfies TxReturnType<HubChainKey, false> as TxReturnType<K, false>,
        };
      }

      if (isEvmSpokeOnlyChainKeyType(params.srcChain)) {
        const result = await this.spokeService.approve<EvmSpokeOnlyChainKey, false>({
          srcChainKey: params.srcChain,
          token: params.inputToken as GetTokenAddressType<EvmSpokeOnlyChainKey>,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<EvmSpokeOnlyChainKey>,
          spender: spokeChainConfig[params.srcChain].addresses.assetManager,
          raw: false,
          walletProvider: _params.walletProvider as GetWalletProviderType<EvmSpokeOnlyChainKey>,
        } satisfies SpokeApproveParams<EvmSpokeOnlyChainKey, false> as SpokeApproveParams<EvmSpokeOnlyChainKey, false>);

        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          value: result.value satisfies TxReturnType<EvmSpokeOnlyChainKey, false> as TxReturnType<K, false>,
        };
      }

      if (isStellarChainKeyType(params.srcChain)) {
        const result = await this.spokeService.approve<StellarChainKey, false>({
          srcChainKey: params.srcChain,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<StellarChainKey>,
          raw: false,
          walletProvider: _params.walletProvider as GetWalletProviderType<StellarChainKey>,
        });

        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          value: result.value satisfies TxReturnType<StellarChainKey, false> as TxReturnType<K, false>,
        };
      }

      return {
        ok: false,
        error: new Error('Approve only supported for hub (Sonic), EVM spokes, and Stellar'),
      };
    } catch (error) {
      return { ok: false, error };
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

  /**
   * Creates an intent on the user's source spoke chain.
   *
   * Strongly typed: `K` narrows `walletProvider` to the chain-specific provider interface,
   * `R` decides whether a walletProvider is required at all.
   *
   * - When `raw: true`, returns raw transaction data (user signs/broadcasts themselves).
   *   walletProvider MUST be absent (compile-time error if passed).
   * - When `raw: false`, walletProvider is REQUIRED and must match the chain type
   *   implied by `srcChainKey` (e.g. `srcChainKey: 'ethereum'` → walletProvider: IEvmWalletProvider).
   */
  public async createIntentRaw<K extends SpokeChainKey>(
    _params: SwapActionParamsRaw<K>,
  ): Promise<Result<[TxReturnType<K, true>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>> {
    const { params } = _params;
    const srcChainKey = params.srcChain;

    // default values
    const fee = _params.fee ?? this.config.swaps.partnerFee;
    const skipSimulation = _params.skipSimulation ?? false;

    invariant(
      this.config.isValidOriginalAssetAddress(srcChainKey, params.inputToken),
      `Unsupported spoke chain token (srcChainKey): ${srcChainKey}, params.inputToken): ${params.inputToken}`,
    );
    invariant(
      this.config.isValidOriginalAssetAddress(params.dstChain, params.outputToken),
      `Unsupported spoke chain token (params.dstChain): ${params.dstChain}, params.outputToken): ${params.outputToken}`,
    );
    invariant(this.config.isValidSpokeChainKey(srcChainKey), `Invalid spoke chain (srcChainKey): ${srcChainKey}`);
    invariant(
      this.config.isValidSpokeChainKey(params.dstChain),
      `Invalid spoke chain (params.dstChain): ${params.dstChain}`,
    );

    try {
      // derive users hub wallet address
      const creatorHubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        srcChainKey,
        this.hubProvider,
      );

      if (isHubChainKeyType(srcChainKey) && isSonicChainKeyType(srcChainKey)) {
        const sonicParams = {
          createIntentParams: params,
          creatorHubWalletAddress,
          solverConfig: this.solver,
          fee,
          hubProvider: this.hubProvider,
          raw: true,
        } satisfies CreateSonicSwapIntentParams<true>;

        const [txResult, intent, feeAmount, data] = await SonicSpokeService.createRawSwapIntent(sonicParams);

        return {
          ok: true,
          value: [txResult as TxReturnType<K, true>, { ...intent, feeAmount } as Intent & FeeAmount, data],
        };
      }

      // construct the intent data
      const [data, intent, feeAmount] = EvmSolverService.constructCreateIntentData(
        {
          ...params,
          srcAddress: params.srcAddress,
        },
        creatorHubWalletAddress,
        this.config,
        fee,
      );

      const txResult = await this.spokeService.deposit<K, true>({
        srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        to: creatorHubWalletAddress,
        token: params.inputToken as GetTokenAddressType<K>,
        amount: params.inputAmount,
        data: data,
        skipSimulation,
        raw: true,
      } satisfies DepositParams<K, true>);

      return {
        ok: true,
        value: [txResult as TxReturnType<K, true>, { ...intent, feeAmount } as Intent & FeeAmount, data],
      };
    } catch (error) {
      console.error('[SwapService.createIntent] FAILED', error);
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

  public async createIntent<K extends SpokeChainKey>(
    _params: SwapActionParams<K>,
  ): Promise<Result<[TxReturnType<K, false>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>> {
    const { params, walletProvider } = _params;
    const srcChainKey = params.srcChain;
    const fee = _params.fee ?? this.config.swaps.partnerFee;
    const skipSimulation = _params.skipSimulation ?? false;

    invariant(
      isValidWalletProviderForChainKey(srcChainKey, walletProvider),
      `Invalid wallet provider for chain key: ${srcChainKey}, walletProvider.chainType: ${walletProvider.chainType}`,
    );
    invariant(
      this.config.isValidOriginalAssetAddress(srcChainKey, params.inputToken),
      `Unsupported spoke chain token (srcChainKey): ${srcChainKey}, params.inputToken): ${params.inputToken}`,
    );
    invariant(
      this.config.isValidOriginalAssetAddress(params.dstChain, params.outputToken),
      `Unsupported spoke chain token (params.dstChain): ${params.dstChain}, params.outputToken): ${params.outputToken}`,
    );
    invariant(this.config.isValidSpokeChainKey(srcChainKey), `Invalid spoke chain (srcChainKey): ${srcChainKey}`);
    invariant(
      this.config.isValidSpokeChainKey(params.dstChain),
      `Invalid spoke chain (params.dstChain): ${params.dstChain}`,
    );
    //if dstChain is Bitcoin and token is BTC, check minOutputToken should be higher than 546 sats
    if (isBitcoinChainKey(params.dstChain) && params.outputToken === 'BTC') {
      invariant(
        params.minOutputAmount >= 546n,
        `Invalid minOutputAmount (params.minOutputAmount): ${params.minOutputAmount}`,
      );
    }

    try {
      const personalAddress = params.srcAddress;

      // Bitcoin TRADING mode: use trading wallet for hub wallet derivation (see getEffectiveWalletAddress)
      // NOTE: bitcoin is only enabled in non-raw execution mode == walletProvider is required
      let walletAddress: string = personalAddress;
      if (isBitcoinChainKeyType(params.srcChain)) {
        invariant(
          isBitcoinWalletProvider(_params.walletProvider),
          `Invalid wallet provider for chain key: ${params.srcChain}`,
        );
        walletAddress = await this.spokeService.bitcoinSpokeService.getEffectiveWalletAddress(personalAddress);
        await this.spokeService.bitcoinSpokeService.radfi.ensureRadfiAccessToken(_params.walletProvider);
      }

      // derive users hub wallet address
      const creatorHubWalletAddress = await HubService.getUserHubWalletAddress(
        walletAddress,
        srcChainKey,
        this.hubProvider,
      );

      if (isHubChainKeyType(srcChainKey) && isSonicChainKeyType(srcChainKey)) {
        // on hub chain create intent directly

        // K is narrowed to SonicChainKey inside this branch, but the outer generic `K` doesn't
        // propagate that narrowing back into `GetWalletProviderType<K>` here. Sonic is EVM by
        // definition, so cast to the concrete provider type expected by the sonic params shape.
        const sonicParams = {
          createIntentParams: params,
          creatorHubWalletAddress,
          solverConfig: this.config.solver,
          fee: this.config.swaps.partnerFee,
          hubProvider: this.hubProvider,
          raw: false,
          walletProvider: walletProvider as IEvmWalletProvider,
        } satisfies CreateSonicSwapIntentParams<false>;

        const [txResult, intent, feeAmount, data] = await SonicSpokeService.createAndExecuteSwapIntent(sonicParams);

        return {
          ok: true,
          value: [txResult as TxReturnType<K, false>, { ...intent, feeAmount } as Intent & FeeAmount, data],
        };
      }

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

      const txResult = await this.spokeService.deposit({
        srcChainKey,
        srcAddress: walletAddress as GetAddressType<K>,
        to: creatorHubWalletAddress,
        token: params.inputToken as GetTokenAddressType<K>,
        amount: params.inputAmount,
        data: data,
        skipSimulation,
        raw: false,
        walletProvider: _params.walletProvider,
      } satisfies DepositParams<K, false>);

      return {
        ok: true,
        value: [txResult as TxReturnType<K, false>, { ...intent, feeAmount } as Intent & FeeAmount, data],
      };
    } catch (error) {
      console.error('[SwapService.createIntent] FAILED', error);
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
   * Creates a limit order intent (no deadline, must be cancelled manually by user).
   * Similar to swap but enforces deadline=0n (no deadline).
   * Limit orders remain active until manually cancelled by the user.
   *
   * @param {Prettify<LimitOrderParams<S> & OptionalTimeout>} params - Object containing:
   *   - intentParams: The parameters for creating the limit order (deadline is automatically set to 0n, deadline field should be omitted).
   *   - spokeProvider: The spoke provider instance.
   *   - fee: (Optional) Partner fee configuration.
   *   - timeout: (Optional) Timeout in milliseconds for the transaction (default: 60 seconds).
   *   - skipSimulation: (Optional) Whether to skip transaction simulation (default: false).
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>>} A promise resolving to a Result containing a tuple of SolverExecutionResponse, Intent, and intent delivery info, or an IntentError if the operation fails.
   *
   * @example
   * const payload = {
   *     "inputToken": "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // BSC ETH token address
   *     "outputToken": "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // ARB WBTC token address
   *     "inputAmount": 1000000000000000n, // The amount of input tokens
   *     "minOutputAmount": 900000000000000n, // min amount you are expecting to receive
   *     // deadline is omitted - will be automatically set to 0n
   *     "allowPartialFill": false, // Whether the intent can be partially filled
   *     "srcChain": "0x38.bsc", // Chain ID where input tokens originate
   *     "dstChain": "0xa4b1.arbitrum", // Chain ID where output tokens should be delivered
   *     "srcAddress": "0x..", // Source address (original address on spoke chain)
   *     "dstAddress": "0x...", // Destination address (original address on spoke chain)
   *     "solver": "0x..", // Optional specific solver address (address(0) = any solver)
   *     "data": "0x..", // Additional arbitrary data
   * } satisfies CreateLimitOrderParams;
   *
   * const createLimitOrderResult = await swapService.createLimitOrder({
   *   intentParams: payload,
   *   spokeProvider,
   *   fee, // optional
   *   timeout, // optional
   * });
   *
   * if (createLimitOrderResult.ok) {
   *   const [solverExecutionResponse, intent, intentDeliveryInfo] = createLimitOrderResult.value;
   *   console.log('Intent execution response:', solverExecutionResponse);
   *   console.log('Intent:', intent);
   *   console.log('Intent delivery info:', intentDeliveryInfo);
   *   // Limit order is now active and will remain until cancelled manually
   * } else {
   *   // handle error
   * }
   */
  public async createLimitOrder<K extends SpokeChainKey>(
    _params: LimitOrderActionParams<K>,
  ): Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo], IntentError<IntentErrorCode>>> {
    const { fee = this.config.swaps.partnerFee, timeout = DEFAULT_RELAY_TX_TIMEOUT, skipSimulation = false } = _params;
    // Force deadline to 0n (no deadline) for limit orders. K is preserved on the resulting
    // CreateIntentParams<K> so swap() infers the same chain narrowing.
    const params: CreateIntentParams<K> = {
      ..._params.params,
      deadline: 0n,
    } as CreateIntentParams<K>;

    return this.swap<K>({
      params,
      fee,
      timeout,
      skipSimulation,
      walletProvider: _params.walletProvider,
    });
  }

  /**
   * Creates a limit order intent (no deadline, must be cancelled manually by user).
   * Similar to createIntent but enforces deadline=0n (no deadline) and uses LimitOrderParams.
   * Limit orders remain active until manually cancelled by the user.
   * NOTE: This method does not submit the intent to the Solver API
   *
   * @param {Prettify<LimitOrderParams<S> & OptionalRaw<R>>} params - Object containing:
   *   - intentParams: The parameters for creating the limit order (deadline is automatically set to 0n, deadline field should be omitted).
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
   *     // deadline is omitted - will be automatically set to 0n
   *     "allowPartialFill": false, // Whether the intent can be partially filled
   *     "srcChain": "0x38.bsc", // Chain ID where input tokens originate
   *     "dstChain": "0xa4b1.arbitrum", // Chain ID where output tokens should be delivered
   *     "srcAddress": "0x..", // Source address (original address on spoke chain)
   *     "dstAddress": "0x...", // Destination address (original address on spoke chain)
   *     "solver": "0x..", // Optional specific solver address (address(0) = any solver)
   *     "data": "0x..", // Additional arbitrary data
   * } satisfies CreateLimitOrderParams;
   *
   * const createLimitOrderIntentResult = await swapService.createLimitOrderIntent({
   *   intentParams: payload,
   *   spokeProvider,
   *   fee, // optional
   *   raw, // optional
   * });
   *
   * if (createLimitOrderIntentResult.ok) {
   *   const [txResult, intent, intentData] = createLimitOrderIntentResult.value;
   *   console.log('Transaction result:', txResult);
   *   console.log('Intent:', intent);
   *   console.log('Intent data:', intentData);
   * } else {
   *   // handle error
   * }
   */
  public async createLimitOrderIntent<K extends SpokeChainKey>(
    _params: LimitOrderActionParams<K>,
  ): Promise<Result<[TxReturnType<K, false>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>> {
    const { params } = _params;
    const fee = _params.fee ?? this.config.swaps.partnerFee;
    const skipSimulation = _params.skipSimulation ?? false;

    // Force deadline to 0n for limit orders. srcChain is preserved on params so K narrowing
    // flows through to createIntent unchanged.
    const limitOrderParams: CreateIntentParams<K> = {
      ...params,
      deadline: 0n,
    } as CreateIntentParams<K>;

    return this.createIntent<K>({
      ..._params,
      params: limitOrderParams,
      fee,
      skipSimulation,
    });
  }

  public async createLimitOrderIntentRaw<K extends SpokeChainKey>(
    _params: LimitOrderActionParamsRaw<K>,
  ): Promise<Result<[TxReturnType<K, true>, Intent & FeeAmount, Hex], IntentError<'CREATION_FAILED'>>> {
    const { params } = _params;
    const fee = _params.fee ?? this.config.swaps.partnerFee;
    const skipSimulation = _params.skipSimulation ?? false;

    const limitOrderParams: CreateIntentParams<K> = {
      ...params,
      deadline: 0n,
    } as CreateIntentParams<K>;

    return this.createIntentRaw<K>({
      ..._params,
      params: limitOrderParams,
      fee,
      skipSimulation,
    });
  }

  /**
   * Syntactic sugar for cancelAndSubmitIntent: cancels a limit order intent and submits it to the Relayer API.
   * Similar to swap function that wraps createAndSubmitIntent.
   *
   * @param params - Object containing:
   * @param params.intent - The limit order intent to cancel.
   * @param params.spokeProvider - The spoke provider instance.
   * @param params.timeout - (Optional) Timeout in milliseconds for the transaction (default: 60 seconds).
   * @returns
   *   A promise resolving to a Result containing a tuple of cancel transaction hash and destination transaction hash,
   *   or an IntentError if the operation fails.
   *
   * @example
   * // Get intent first (or use intent from createLimitOrder response)
   * const intent: Intent = await swapService.getIntent(txHash);
   *
   * // Cancel the limit order
   * const result = await swapService.cancelLimitOrder({
   *   intent,
   *   spokeProvider,
   *   timeout, // optional
   * });
   *
   * if (result.ok) {
   *   const [cancelTxHash, dstTxHash] = result.value;
   *   console.log('Cancel transaction hash:', cancelTxHash);
   *   console.log('Destination transaction hash:', dstTxHash);
   * } else {
   *   // handle error
   *   console.error('[cancelLimitOrder] error:', result.error);
   * }
   */
  public async cancelLimitOrder<K extends SpokeChainKey>({
    srcChainKey,
    intent,
    walletProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: {
    srcChainKey: K;
    intent: Intent;
    walletProvider: GetWalletProviderType<K>;
    timeout?: number;
  }): Promise<Result<[string, string], IntentError<IntentErrorCode>>> {
    return this.cancelIntent<K>({
      srcChainKey,
      intent,
      walletProvider,
      timeout,
    });
  }

  /**
   * Cancels an intent on the user's source spoke chain.
   *
   * Because `Intent.srcChain` is an `IntentRelayChainId` (bigint) whose literal type cannot
   * narrow to a specific ChainKey, the caller must pass `srcChainKey: K` explicitly. At
   * runtime we assert `getIntentRelayChainId(srcChainKey) === intent.srcChain` to catch
   * mismatches. The generic `K` then drives `walletProvider` narrowing just like createIntent.
   */
  public async createCancelIntent<K extends SpokeChainKey, R extends boolean = false>(
    params: CancelIntentParams<K, R>,
  ): Promise<Result<TxReturnType<K, R>, IntentError<'CANCEL_FAILED'>>> {
    const { srcChainKey, intent } = params;
    const raw = (params.raw ?? false) as R;

    try {
      invariant(this.config.isValidIntentRelayChainId(intent.srcChain), `Invalid intent.srcChain: ${intent.srcChain}`);
      invariant(this.config.isValidIntentRelayChainId(intent.dstChain), `Invalid intent.dstChain: ${intent.dstChain}`);
      invariant(
        getIntentRelayChainId(srcChainKey) === intent.srcChain,
        `srcChainKey (${srcChainKey}) does not match intent.srcChain (${intent.srcChain}). Expected relay chain id ${getIntentRelayChainId(srcChainKey)}.`,
      );

      const intentsContract = this.solver.intentsContract;

      const sendMessageParams = {
        srcChainKey,
        srcAddress: reverseEncodeAddress(srcChainKey, intent.srcAddress),
        dstChainKey: HUB_CHAIN_KEY,
        dstAddress: intent.creator,
        payload: encodeContractCalls([EvmSolverService.encodeCancelIntent(intent, intentsContract)]),
        raw,
        skipSimulation: params.skipSimulation,
        ...(raw === false ? { walletProvider: (params as CancelIntentParams<K, false>).walletProvider } : {}),
      } as unknown as SendMessageParams<K, R>;

      const txResult = (await this.spokeService.sendMessage<K, R>(sendMessageParams)) satisfies TxReturnType<K, R>;

      return {
        ok: true,
        value: txResult,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CANCEL_FAILED',
          data: {
            payload: intent,
            error,
          },
        },
      };
    }
  }

  /**
   * Cancels an intent on the spoke chain, submits the cancel intent to the relayer API,
   * and waits until the intent cancel is executed (on the destination/hub chain).
   * Follows a similar workflow to createAndSubmitIntent, but for cancelling.
   *
   * @param params.srcChainKey - The source spoke chain for this intent (must match intent.srcChain at runtime).
   * @param params.intent - The intent to be canceled.
   * @param params.walletProvider - The chain-specific wallet provider (narrowed via K).
   * @param params.timeout - Optional timeout in milliseconds (default: 60 seconds).
   */
  public async cancelIntent<K extends SpokeChainKey>({
    srcChainKey,
    intent,
    walletProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: {
    srcChainKey: K;
    intent: Intent;
    walletProvider: GetWalletProviderType<K>;
    timeout?: number;
  }): Promise<Result<[string, string], IntentError<IntentErrorCode>>> {
    try {
      // 1. Cancel the intent on the spoke chain
      const cancelResult = await this.createCancelIntent<K, false>({
        srcChainKey,
        intent,
        raw: false,
        walletProvider,
      } as CancelIntentParams<K, false>);

      if (!cancelResult.ok) {
        return cancelResult;
      }

      const cancelTxHash = cancelResult.value;

      // 2. Verify the cancel tx hash exists on chain
      const verifyTxHashResult = await this.spokeService.verifyTxHash({
        txHash: cancelTxHash,
        chainKey: srcChainKey,
      });

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CANCEL_FAILED',
            data: {
              payload: intent,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      // then submit the deposit tx hash of spoke chain to the intent relay
      let dstIntentTxHash: string;

      // 3. Submit the cancel tx hash of spoke chain to the intent relay
      if (!isHubChainKey(srcChainKey)) {
        const intentRelayChainId = intent.srcChain.toString();
        const submitPayload: IntentRelayRequest<'submit'> = {
          action: 'submit',
          params: {
            chain_id: intentRelayChainId,
            tx_hash: cancelTxHash,
          },
        };

        const submitResult = await this.submitIntent(submitPayload);

        if (!submitResult.ok) {
          return submitResult;
        }

        // then wait until the intent is executed on the intent relay
        const packet = await waitUntilIntentExecuted({
          intentRelayChainId,
          spokeTxHash: cancelTxHash,
          timeout,
          apiUrl: this.relayerApiEndpoint,
        });

        if (!packet.ok) {
          return {
            ok: false,
            error: packet.error,
          };
        }
        dstIntentTxHash = packet.value.dst_tx_hash;
      } else {
        dstIntentTxHash = cancelTxHash;
      }

      return {
        ok: true,
        value: [cancelTxHash, dstIntentTxHash],
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CANCEL_FAILED',
          data: {
            payload: intent,
            error,
          },
        },
      };
    }
  }

  /**
   * Gets the submit tx extra data for an intent
   * NOTE: Currently this is only required when source chain is Solana
   * @param {GetIntentSubmitTxExtraDataParams} params - The txHash or intent parameters
   * @param {Hash} params.txHash - The transaction hash on Hub chain
   * @param {Intent} params.intent - The intent
   * @returns {Promise<SubmitTxExtraData>} The submit tx extra data
   */
  public async getIntentSubmitTxExtraData(params: GetIntentSubmitTxExtraDataParams): Promise<SubmitTxExtraData> {
    let intent: Intent;
    if ('txHash' in params) {
      intent = await this.getIntent(params.txHash);
    } else {
      intent = params.intent;
    }

    const txData = EvmSolverService.encodeCreateIntent(intent, this.solver.intentsContract);

    return {
      address: intent.creator,
      payload: txData.data,
    };
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
    return EvmSolverService.getFilledIntent(txHash, this.solver, this.hubProvider);
  }

  /**
   * Get the intent delivery info about solved intent from the Relayer API.
   * Packet data contains info about the intent execution on the destination chain.
   * @param {SpokeChainKey} chainId - The destination spoke chain ID
   * @param {string} fillTxHash - The fill transaction hash (received from getStatus when status is 3 - SOLVED)
   * @param {number} timeout - The timeout in milliseconds (default: 120 seconds)
   * @returns {Promise<Result<PacketData, IntentError<'RELAY_TIMEOUT'>>>} A Result containing either the packet data or an IntentError with code 'RELAY_TIMEOUT'
   */
  public async getSolvedIntentPacket({
    chainId,
    fillTxHash,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: { chainId: SpokeChainKey; fillTxHash: string; timeout?: number }): Promise<
    Result<PacketData, IntentError<'RELAY_TIMEOUT'>>
  > {
    return waitUntilIntentExecuted({
      intentRelayChainId: getIntentRelayChainId(chainId).toString(),
      spokeTxHash: fillTxHash,
      timeout,
      apiUrl: this.relayerApiEndpoint,
    });
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
   * @param {SpokeChainKey} chainId - The chain ID
   * @returns {readonly Token[]} - Array of supported tokens
   */
  public getSupportedSwapTokensByChainId(chainId: SpokeChainKey): readonly XToken[] {
    return this.config.getSupportedSwapTokensByChainId(chainId);
  }

  /**
   * Get the list of all supported swap tokens
   * @returns {Record<SpokeChainKey, readonly Token[]>} - Object containing all supported swap tokens
   */
  public getSupportedSwapTokens(): Record<SpokeChainKey, readonly XToken[]> {
    return this.config.getSupportedSwapTokens();
  }
}
