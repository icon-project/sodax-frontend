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
  isSonicChainKeyType,
  type EstimateGasParams,
  type ConfigService,
  type HubProvider,
  type GetRelayResponse,
  type IntentDeliveryInfo,
  type IntentRelayRequest,
  type PacketData,
  isBitcoinChainKeyType,
  HubService,
  isHubChainKeyType,
  reverseEncodeAddress,
  type SendMessageParams,
  type SpokeIsAllowanceValidParams,
  type SpokeIsAllowanceValidParamsEvmSpoke,
  type SpokeIsAllowanceValidParamsHub,
  type SpokeIsAllowanceValidParamsStellar,
  isEvmSpokeOnlyChainKeyType,
  isStellarChainKeyType,
  isUndefinedOrValidWalletProviderForChainKey,
  relayTxAndWaitPacket,
  isSolanaChainKeyType,
  isOptionalEvmWalletProviderType,
  isOptionalStellarWalletProviderType,
  isBitcoinWalletProviderType,
  type RelayExtraData,
} from '../shared/index.js';
import { SolverApiService } from './SolverApiService.js';
import { EvmSolverService } from './EvmSolverService.js';
export type {
  CreateIntentParams,
  CreateLimitOrderParams,
  Intent,
  FeeData,
  IntentData,
  IntentState,
} from '../shared/types/intent-types.js';
export { IntentDataType } from '../shared/types/intent-types.js';
import type { CreateIntentParams, CreateLimitOrderParams, Intent, IntentState } from '../shared/types/intent-types.js';
import {
  type SpokeChainKey,
  type Hex,
  type Hash,
  type HttpUrl,
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
  type SpokeExecActionParams,
  type WalletProviderSlot,
  type SonicChainKey,
} from '@sodax/types';

export type GetIntentSubmitTxExtraDataParams = { txHash: Hash } | { intent: Intent };

// Exec-mode params: walletProvider is required and K-narrowed. Consumed by `createIntent`,
// `createLimitOrder`, `createLimitOrderIntent`, `approve` — methods that send a transaction
// and return an executed tx hash.
export type SwapActionParams<K extends SpokeChainKey, Raw extends boolean> = SpokeExecActionParams<
  K,
  Raw,
  CreateIntentParams<K>,
  { fee?: PartnerFee }
>;

export type LimitOrderActionParams<K extends SpokeChainKey, Raw extends boolean> = Omit<
  SwapActionParams<K, Raw>,
  'params'
> & {
  params: CreateLimitOrderParams<K>;
};

/**
 * Params for `cancelIntent`.
 * Because `Intent.srcChain` is an `IntentRelayChainId` (bigint) whose literal type cannot
 * narrow to a specific ChainKey, the user passes `srcChainKey: K` explicitly. At runtime we
 * assert that `getIntentRelayChainId(srcChainKey) === intent.srcChain` and throw if not.
 */
export type CancelIntentParams<K extends SpokeChainKey, Raw extends boolean> = {
  srcChainKey: K;
  intent: Intent;
  skipSimulation?: boolean;
  fee?: PartnerFee;
  timeout?: number;
} & WalletProviderSlot<K, Raw>;

export type SwapServiceConstructorParams = {
  config: ConfigService;
  spoke: SpokeService;
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
  readonly spoke: SpokeService;

  // swap config
  readonly solver: SolverConfig;
  readonly partnerFee: PartnerFee | undefined;
  readonly relayerApiEndpoint: HttpUrl;

  public constructor({ config, hubProvider, spoke }: SwapServiceConstructorParams) {
    this.solver = config.solver;
    this.partnerFee = config.swaps.partnerFee;
    this.relayerApiEndpoint = config.relay.relayerApiEndpoint;
    this.config = config;
    this.hubProvider = hubProvider;
    this.spoke = spoke;
  }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public async estimateGas<C extends SpokeChainKey>(
    params: EstimateGasParams<C>,
  ): Promise<Result<GetEstimateGasReturnType<C>>> {
    return this.spoke.estimateGas(params) as Promise<Result<GetEstimateGasReturnType<C>>>;
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
  public async submitIntent(submitPayload: IntentRelayRequest<'submit'>): Promise<Result<GetRelayResponse<'submit'>>> {
    try {
      const submitResult = await submitTransaction(submitPayload, this.relayerApiEndpoint);
      if (!submitResult.success) {
        return { ok: false, error: new Error('SUBMIT_TX_FAILED', { cause: new Error(submitResult.message) }) };
      }
      return { ok: true, value: submitResult };
    } catch (error) {
      return { ok: false, error };
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
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>>}
   *   A promise resolving to a Result containing a tuple of SolverExecutionResponse, Intent, and intent delivery info.
   *   On failure, the `.error` is an `Error` tagged with a CODE such as `CREATION_FAILED`, `SUBMIT_TX_FAILED`,
   *   `POST_EXECUTION_FAILED`, or `RELAY_TIMEOUT`; the underlying error is on `.cause`.
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
    _params: SwapActionParams<K, false>,
  ): Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>> {
    const { params } = _params;
    const srcChainKey = params.srcChainKey;
    try {
      const timeout = _params.timeout;
      const createIntentResult = await this.createIntent(_params);
      if (!createIntentResult.ok) return createIntentResult;

      const [spokeTxHash, intent, data] = createIntentResult.value;

      const verifyTxHashResult = await this.spoke.verifyTxHash({
        txHash: spokeTxHash,
        chainKey: srcChainKey,
      });
      if (!verifyTxHashResult.ok) return verifyTxHashResult;

      let dstIntentTxHash: string;
      if (isHubChainKeyType(srcChainKey)) {
        dstIntentTxHash = spokeTxHash;
      } else {
        const packet = await relayTxAndWaitPacket(
          spokeTxHash,
          isSolanaChainKeyType(srcChainKey) || isBitcoinChainKeyType(srcChainKey)
            ? {
                address: intent.creator,
                payload: data,
              }
            : undefined,
          srcChainKey,
          this.relayerApiEndpoint,
          timeout,
        );
        if (!packet.ok) return packet;
        dstIntentTxHash = packet.value.dst_tx_hash;
      }

      const result = await this.postExecution({
        intent_tx_hash: dstIntentTxHash as `0x${string}`,
      });
      if (!result.ok) {
        return { ok: false, error: new Error('POST_EXECUTION_FAILED', { cause: result.error }) };
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
            dstChainId: params.dstChainKey,
            dstTxHash: dstIntentTxHash,
            dstAddress: params.dstAddress,
          } satisfies IntentDeliveryInfo,
        ],
      };
    } catch (error) {
      return { ok: false, error };
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
  public async isAllowanceValid<K extends SpokeChainKey>(
    _params: SwapActionParams<K, boolean>,
  ): Promise<Result<boolean>> {
    try {
      const { params } = _params;
      const srcChainKey = params.srcChainKey;

      if (isHubChainKeyType(srcChainKey)) {
        return await this.spoke.isAllowanceValid({
          srcChainKey,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress,
          spender: this.solver.intentsContract,
        } satisfies SpokeIsAllowanceValidParamsHub);
      }

      if (isEvmSpokeOnlyChainKeyType(srcChainKey)) {
        return await this.spoke.isAllowanceValid({
          srcChainKey,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress,
          spender: spokeChainConfig[srcChainKey].addresses.assetManager,
        } satisfies SpokeIsAllowanceValidParamsEvmSpoke);
      }

      if (isStellarChainKeyType(srcChainKey)) {
        return await this.spoke.isAllowanceValid({
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

  public async approve<K extends SpokeChainKey, Raw extends boolean>(
    _params: SwapActionParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    const { params } = _params;

    try {
      if (isHubChainKeyType(params.srcChainKey) || isEvmSpokeOnlyChainKeyType(params.srcChainKey)) {
        invariant(
          isOptionalEvmWalletProviderType(_params.walletProvider),
          'Invalid wallet provider. Expected Evm wallet provider.',
        );
        const spender = isHubChainKeyType(params.srcChainKey)
          ? this.solver.intentsContract
          : spokeChainConfig[params.srcChainKey].addresses.assetManager;
        const coreParams = {
          srcChainKey: params.srcChainKey,
          owner: params.srcAddress as GetAddressType<HubChainKey | EvmSpokeOnlyChainKey>,
          token: params.inputToken as GetTokenAddressType<HubChainKey | EvmSpokeOnlyChainKey>,
          amount: params.inputAmount,
          spender,
        } as const;

        const result = await this.spoke.approve<HubChainKey | EvmSpokeOnlyChainKey, Raw>({
          ...coreParams,
          raw: _params.raw,
          walletProvider: _params.walletProvider,
        });

        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          value: result.value satisfies TxReturnType<EvmSpokeOnlyChainKey, Raw> as TxReturnType<K, Raw>,
        };
      }

      if (isStellarChainKeyType(params.srcChainKey)) {
        invariant(
          isOptionalStellarWalletProviderType(_params.walletProvider),
          'Invalid wallet provider. Expected Stellar wallet provider.',
        );
        const coreParams = {
          srcChainKey: params.srcChainKey,
          token: params.inputToken,
          amount: params.inputAmount,
          owner: params.srcAddress as GetAddressType<StellarChainKey>,
        } as const;

        const result = await this.spoke.approve<StellarChainKey, boolean>(
          _params.raw
            ? {
                ...coreParams,
                raw: true,
              }
            : {
                ...coreParams,
                raw: false,
                walletProvider: _params.walletProvider,
              },
        );

        if (!result.ok) return result;

        return {
          ok: true,
          value: result.value satisfies TxReturnType<StellarChainKey, boolean> as TxReturnType<K, Raw>,
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
  public async createIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: SwapActionParams<K, Raw>,
  ): Promise<Result<[TxReturnType<K, Raw>, Intent & FeeAmount, Hex]>> {
    const { params, skipSimulation } = _params;

    invariant(
      isUndefinedOrValidWalletProviderForChainKey(params.srcChainKey, _params.walletProvider),
      `Invalid wallet provider for chain key: ${params.srcChainKey}`,
    );
    invariant(
      this.config.isValidOriginalAssetAddress(params.srcChainKey, params.inputToken),
      `Unsupported spoke chain token (srcChainKey): ${params.srcChainKey}, params.inputToken): ${params.inputToken}`,
    );
    invariant(
      this.config.isValidOriginalAssetAddress(params.dstChainKey, params.outputToken),
      `Unsupported spoke chain token (params.dstChain): ${params.dstChainKey}, params.outputToken): ${params.outputToken}`,
    );
    invariant(
      this.config.isValidSpokeChainKey(params.srcChainKey),
      `Invalid spoke chain (srcChainKey): ${params.srcChainKey}`,
    );
    invariant(
      this.config.isValidSpokeChainKey(params.dstChainKey),
      `Invalid spoke chain (params.dstChain): ${params.dstChainKey}`,
    );
    //if dstChain is Bitcoin and token is BTC, check minOutputToken should be higher than 546 sats
    if (isBitcoinChainKey(params.dstChainKey) && params.outputToken === 'BTC') {
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
      if (isBitcoinChainKeyType(params.srcChainKey) && _params.raw === false) {
        invariant(
          isBitcoinWalletProviderType(_params.walletProvider),
          `Invalid wallet provider for chain key: ${params.srcChainKey}`,
        );
        walletAddress = await this.spoke.bitcoinSpokeService.getEffectiveWalletAddress(personalAddress);
        await this.spoke.bitcoinSpokeService.radfi.ensureRadfiAccessToken(_params.walletProvider);
      }

      // derive users hub wallet address
      const creatorHubWalletAddress = await HubService.getUserHubWalletAddress(
        walletAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      if (isHubChainKeyType(params.srcChainKey) && isSonicChainKeyType(params.srcChainKey)) {
        const coreSonicParams = {
          createIntentParams: params,
          creatorHubWalletAddress,
          solverConfig: this.solver,
          fee: this.config.swaps.partnerFee,
          hubProvider: this.hubProvider,
        } as const;

        // on hub chain create intent directly
        const [txResult, intent, feeAmount, data] = await SonicSpokeService.createSwapIntent(
          _params.raw
            ? { ...coreSonicParams, raw: true }
            : {
                ...coreSonicParams,
                raw: false,
                walletProvider: _params.walletProvider as GetWalletProviderType<SonicChainKey>,
              },
        );

        return {
          ok: true,
          value: [
            txResult satisfies TxReturnType<SonicChainKey, boolean> as TxReturnType<K, Raw>,
            { ...intent, feeAmount } as Intent & FeeAmount,
            data,
          ],
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
        this.config.swaps.partnerFee,
      );

      const coreDepositParams = {
        srcChainKey: params.srcChainKey,
        srcAddress: walletAddress as GetAddressType<K>,
        to: creatorHubWalletAddress,
        token: params.inputToken as GetTokenAddressType<K>,
        amount: params.inputAmount,
        data: data,
        skipSimulation,
      } as const;

      const txResult = await this.spoke.deposit(
        _params.raw
          ? {
              ...coreDepositParams,
              raw: true,
            }
          : {
              ...coreDepositParams,
              raw: false,
              walletProvider: _params.walletProvider as GetWalletProviderType<K>,
            },
      );

      if (!txResult.ok) {
        console.error('[SwapService.createIntent] FAILED', txResult.error);
        return txResult;
      }

      return {
        ok: true,
        value: [
          txResult.value satisfies TxReturnType<K, Raw> as TxReturnType<K, Raw>,
          { ...intent, feeAmount } as Intent & FeeAmount,
          data,
        ],
      };
    } catch (error) {
      console.error('[SwapService.createIntent] FAILED', error);
      return { ok: false, error };
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
   * @returns {Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>>} A promise resolving to a Result containing a tuple of SolverExecutionResponse, Intent, and intent delivery info.
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
    _params: LimitOrderActionParams<K, false>,
  ): Promise<Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>> {
    const { fee = this.config.swaps.partnerFee, timeout = DEFAULT_RELAY_TX_TIMEOUT, skipSimulation = false } = _params;
    // Force deadline to 0n (no deadline) for limit orders. K is preserved on the resulting
    // CreateIntentParams<K> so swap() infers the same chain narrowing.
    const params: CreateIntentParams<K> = {
      ..._params.params,
      deadline: 0n,
    } as CreateIntentParams<K>;

    return this.swap<K>({
      ..._params,
      params,
      fee,
      timeout,
      skipSimulation,
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
  public async createLimitOrderIntent<K extends SpokeChainKey, Raw extends boolean>(
    _params: LimitOrderActionParams<K, Raw>,
  ): Promise<Result<[TxReturnType<K, Raw>, Intent & FeeAmount, Hex]>> {
    // Force deadline to 0n for limit orders. srcChain is preserved on params so K narrowing
    // flows through to createIntent unchanged.
    const limitOrderParams: CreateIntentParams<K> = {
      ..._params.params,
      deadline: 0n,
    } as const as CreateIntentParams<K>;

    return this.createIntent({
      ..._params,
      params: limitOrderParams,
    } as SwapActionParams<K, Raw>);
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
  }): Promise<Result<[string, string]>> {
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
  public async createCancelIntent<K extends SpokeChainKey, Raw extends boolean>(
    params: CancelIntentParams<K, Raw>,
  ): Promise<Result<TxReturnType<K, Raw>>> {
    const { intent } = params;

    try {
      invariant(this.config.isValidIntentRelayChainId(intent.srcChain), `Invalid intent.srcChain: ${intent.srcChain}`);
      invariant(this.config.isValidIntentRelayChainId(intent.dstChain), `Invalid intent.dstChain: ${intent.dstChain}`);
      invariant(
        getIntentRelayChainId(params.srcChainKey) === intent.srcChain,
        `srcChainKey (${params.srcChainKey}) does not match intent.srcChain (${intent.srcChain}). Expected relay chain id ${getIntentRelayChainId(params.srcChainKey)}.`,
      );

      const intentsContract = this.solver.intentsContract;

      const coreParams = {
        srcChainKey: params.srcChainKey,
        srcAddress: reverseEncodeAddress(params.srcChainKey, intent.srcAddress) as GetAddressType<K>,
        dstChainKey: HUB_CHAIN_KEY,
        dstAddress: intent.creator,
        payload: encodeContractCalls([EvmSolverService.encodeCancelIntent(intent, intentsContract)]),
        skipSimulation: params.skipSimulation,
      } as const;

      const sendMessageParams = params.raw
        ? ({
            ...coreParams,
            raw: true,
          } satisfies SendMessageParams<K, true>)
        : ({
            ...coreParams,
            raw: false,
            walletProvider: params.walletProvider,
          } satisfies SendMessageParams<K, false>);

      const txResult = await this.spoke.sendMessage(sendMessageParams);

      if (!txResult.ok) return txResult;

      return {
        ok: true,
        value: txResult.value satisfies TxReturnType<K, boolean> as TxReturnType<K, Raw>,
      };
    } catch (error) {
      return { ok: false, error };
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
  }): Promise<Result<[string, string]>> {
    try {
      const cancelResult = await this.createCancelIntent<K, false>({
        srcChainKey,
        intent,
        raw: false,
        walletProvider,
      } as CancelIntentParams<K, false>);
      if (!cancelResult.ok) return cancelResult;

      const cancelTxHash = cancelResult.value;

      const verifyTxHashResult = await this.spoke.verifyTxHash({
        txHash: cancelTxHash,
        chainKey: srcChainKey,
      });
      if (!verifyTxHashResult.ok) return verifyTxHashResult;

      let dstIntentTxHash: string;

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
        if (!submitResult.ok) return submitResult;

        const packet = await waitUntilIntentExecuted({
          intentRelayChainId,
          spokeTxHash: cancelTxHash,
          timeout,
          apiUrl: this.relayerApiEndpoint,
        });
        if (!packet.ok) return packet;
        dstIntentTxHash = packet.value.dst_tx_hash;
      } else {
        dstIntentTxHash = cancelTxHash;
      }

      return { ok: true, value: [cancelTxHash, dstIntentTxHash] };
    } catch (error) {
      return { ok: false, error };
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
  public async getIntentSubmitTxExtraData(params: GetIntentSubmitTxExtraDataParams): Promise<Result<RelayExtraData>> {
    try {
      let intent: Intent;
      if ('txHash' in params) {
        const intentResult = await this.getIntent(params.txHash);
        if (!intentResult.ok) return intentResult;
        intent = intentResult.value;
      } else {
        intent = params.intent;
      }

      const txData = EvmSolverService.encodeCreateIntent(intent, this.solver.intentsContract);

      return {
        ok: true,
        value: {
          address: intent.creator,
          payload: txData.data,
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Gets an intent from a transaction hash (on Hub chain)
   * @param {Hash} txHash - The transaction hash on Hub chain
   * @returns {Promise<Result<Intent>>} The intent
   */
  public async getIntent(txHash: Hash): Promise<Result<Intent>> {
    try {
      const value = await EvmSolverService.getIntent(txHash, this.config, this.hubProvider.publicClient);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Gets the intent state from a transaction hash (on Hub chain)
   * @param {Hash} txHash - The transaction hash on Hub chain
   * @returns {Promise<Result<IntentState>>} The intent state
   */
  public async getFilledIntent(txHash: Hash): Promise<Result<IntentState>> {
    try {
      const value = await EvmSolverService.getFilledIntent(txHash, this.solver, this.hubProvider.publicClient);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Get the intent delivery info about solved intent from the Relayer API.
   * Packet data contains info about the intent execution on the destination chain.
   * @param {SpokeChainKey} chainId - The destination spoke chain ID
   * @param {string} fillTxHash - The fill transaction hash (received from getStatus when status is 3 - SOLVED)
   * @param {number} timeout - The timeout in milliseconds (default: 120 seconds)
   * @returns {Promise<Result<PacketData>>} A Result containing either the packet data or an Error tagged `'RELAY_TIMEOUT'`.
   */
  public async getSolvedIntentPacket({
    chainId,
    fillTxHash,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: { chainId: SpokeChainKey; fillTxHash: string; timeout?: number }): Promise<Result<PacketData>> {
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
  public async getSwapDeadline(deadline: bigint = DEFAULT_DEADLINE_OFFSET): Promise<Result<bigint>> {
    try {
      invariant(deadline > 0n, 'Deadline must be greater than 0');

      const block = await this.hubProvider.publicClient.getBlock({
        includeTransactions: false,
        blockTag: 'latest',
      });
      return { ok: true, value: block.timestamp + deadline };
    } catch (error) {
      return { ok: false, error };
    }
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
