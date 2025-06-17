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
  EvmContractCall,
  FeeAmount,
  GetSpokeDepositParamsType,
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
  TxReturnType,
} from '../../types.js';
import { EvmWalletAbstraction } from '../hub/EvmWalletAbstraction.js';
import { EvmSolverService } from './EvmSolverService.js';
import { SolverApiService } from './SolverApiService.js';
import {
  SONIC_MAINNET_CHAIN_ID,
  type SpokeChainId,
  type Address,
  type Hex,
  type EvmRawTransactionReceipt,
  type Hash,
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
   * const payload = {
   *     "token_src":"0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // BSC ETH token address
   *     "token_dst":"0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // ARB WBTC token address
   *     "token_src_blockchain_id":"0x38.bsc",
   *     "token_dst_blockchain_id":"0xa4b1.arbitrum",
   *     "amount":1000000000000000n,
   *     "quote_type": "exact_input"
   * } satisfies IntentQuoteRequest
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
  public async getQuote(payload: IntentQuoteRequest): Promise<Result<IntentQuoteResponse, IntentErrorResponse>> {
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
   * @param {IntentStatusRequest} intentStatusRequest - The intent status request
   * @returns {Promise<Result<IntentStatusResponse, IntentErrorResponse>>} The intent status response
   *
   * @example
   * const intentStatusRequest = {
   *     "intentHash": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
   * } satisfies IntentStatusRequest
   *
   * const response = await solverService.getStatus(intentStatusRequest);
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
    intentStatusRequest: IntentStatusRequest,
  ): Promise<Result<IntentStatusResponse, IntentErrorResponse>> {
    return SolverApiService.getStatus(intentStatusRequest, this.config);
  }

  /**
   * Post execution of intent order transaction executed on hub chain to Solver API
   * @param {IntentExecutionRequest} intentExecutionRequest - The intent execution request
   * @returns {Promise<Result<IntentExecutionResponse, IntentErrorResponse>>} The intent execution response
   *
   * @example
   * const intentExecutionRequest = {
   *     "intent_tx_hash": "0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af",
   * } satisfies IntentExecutionRequest
   *
   * const response = await solverService.postExecution(intentExecutionRequest);
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
    intentExecutionRequest: IntentExecutionRequest,
  ): Promise<Result<IntentExecutionResponse, IntentErrorResponse>> {
    return SolverApiService.postExecution(intentExecutionRequest, this.config);
  }

  /**
   * Creates an intent and submits it to the Solver API and Relayer API
   * @param {CreateIntentParams} payload - The intent to create
   * @param {ISpokeProvider} spokeProvider - The spoke provider
   * @param {number} timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[IntentExecutionResponse, Intent, PacketData], IntentSubmitError<IntentSubmitErrorCode>>>} The intent execution response, intent, and packet data
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
   *     "srcAddress": "0x..", // Source address in bytes (original address on spoke chain)
   *     "dstAddress": "0x...", // Destination address in bytes (original address on spoke chain)
   *     "solver": "0x..", // Optional specific solver address (address(0) = any solver)
   *     "data": "0x..", // Additional arbitrary data
   * } satisfies CreateIntentParams;
   *
   * const createAndSubmitIntentResult = await solverService.createAndSubmitIntent(payload, spokeProvider);
   *
   * if (createAndSubmitIntentResult.ok) {
   *   const [intentExecutionResponse, intent, packetData] = createAndSubmitIntentResult.value;
   *   console.log('Intent execution response:', intentExecutionResponse);
   *   console.log('Intent:', intent);
   *   console.log('Packet data:', packetData);
   * } else {
   *   // handle error
   * }
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
   *     "srcAddress": "0x..", // Source address in bytes (original address on spoke chain)
   *     "dstAddress": "0x...", // Destination address in bytes (original address on spoke chain)
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
   * Approve amount spending (currently required for EVM only)
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param spender - Spender address
   * @param spokeProvider - Spoke provider
   * @returns {Promise<Result<EvmRawTransactionReceipt>>} - Returns the transaction receipt
   *
   * @example
   * const approveResult = await approve(
   *   '0x...', // ERC20 token address
   *   1000n, // Amount to approve (in token decimals)
   *   '0x...', // Spender address (usually the asset manager contract: spokeProvider.chainConfig.addresses.assetManager)
   *   spokeProvider
   * );
   *
   * if (!approveResult.ok) {
   *   // Handle error
   * }
   *
   * const txReceipt = approveResult.value;
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
   * @returns {Promise<Result<[TxReturnType<S, R>, Intent & FeeAmount], IntentSubmitError<'CREATION_FAILED'>>>} The encoded contract call
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
   *     "srcAddress": "0x..", // Source address in bytes (original address on spoke chain)
   *     "dstAddress": "0x...", // Destination address in bytes (original address on spoke chain)
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
