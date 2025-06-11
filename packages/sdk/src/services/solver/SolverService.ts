import invariant from 'tiny-invariant';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  DEFAULT_RELAY_TX_TIMEOUT,
  Erc20Service,
  type EvmHubProvider,
  EvmSpokeProvider,
  type IntentRelayRequest,
  type PacketData,
  type RelayErrorCode,
  SONIC_MAINNET_CHAIN_ID,
  type SpokeProvider,
  SpokeService,
  type WaitUntilIntentExecutedPayload,
  calculateFeeAmount,
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
  Address,
  EvmContractCall,
  EvmRawTransactionReceipt,
  FeeAmount,
  GetSpokeDepositParamsType,
  Hash,
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
  SolverConfigParams,
  SolverServiceConfig,
  SpokeChainId,
  TxReturnType,
} from '../../types.js';
import { EvmWalletAbstraction } from '../hub/EvmWalletAbstraction.js';
import { EvmSolverService } from './EvmSolverService.js';
import { SolverApiService } from './SolverApiService.js';

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

export type IntentSubmitErrorCode = RelayErrorCode | 'UNKNOWN' | 'CREATION_FAILED';
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
  private readonly config: SolverServiceConfig;
  private readonly hubProvider: EvmHubProvider;

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
  public async createAndSubmitIntent<S extends SpokeProvider>(
    payload: CreateIntentParams,
    spokeProvider: S,
    fee?: PartnerFee,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[IntentExecutionResponse, Intent, PacketData], IntentSubmitError<IntentSubmitErrorCode>>> {
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
        value: [result.value, intent, packet.value],
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
   * Check whether assetManager contract is allowed to move the given payload amount
   * @param {CreateIntentParams} params - The intent to create
   * @param {SpokeProvider} spokeProvider - The spoke provider
   * @return {Promise<Result<boolean>>} - valid = true, invalid = false
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: CreateIntentParams,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider) {
        const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as `0x${string}`;
        return Erc20Service.isAllowanceValid(
          params.inputToken as Address,
          params.inputAmount,
          walletAddress,
          spokeProvider.chainConfig.addresses.assetManager,
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
   * Approve ERC20 amount spending
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param address - Address to approve spending for
   * @param spokeProvider - Spoke provider
   */
  public async approve<S extends SpokeProvider>(
    token: Address,
    amount: bigint,
    address: Address,
    spokeProvider: S,
  ): Promise<Result<EvmRawTransactionReceipt>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider) {
        return Erc20Service.approve(token, amount, address, spokeProvider);
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
   * @param {CreateIntentParams} params - The intent to create
   * @param {SpokeProvider} spokeProvider - The spoke provider
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
      const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
      // derive users hub wallet address
      const creatorHubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
        params.srcChain,
        walletAddressBytes,
        this.hubProvider,
      );

      // construct the intent data
      const [data, intent, feeAmount] = EvmSolverService.constructCreateIntentData(
        params,
        creatorHubWalletAddress,
        this.config,
        fee,
      );

      const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as `0x${string}`;
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
        value: [txResult as TxReturnType<S, R>, { ...intent, feeAmount }] as [TxReturnType<S, R>, Intent & FeeAmount],
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

    const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
    // derive users hub wallet address
    const creatorHubWalletAddress = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      walletAddressBytes,
      this.hubProvider,
    );

    const calls: EvmContractCall[] = [];
    const intentsContract = this.config.intentsContract;
    calls.push(EvmSolverService.encodeCancelIntent(intent, intentsContract));
    const data = encodeContractCalls(calls);
    return SpokeService.callWallet(creatorHubWalletAddress, data, spokeProvider, this.hubProvider, raw);
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
