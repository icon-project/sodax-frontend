import {
  type Address,
  type GetLogsReturnType,
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  isAddress,
  keccak256,
  parseEventLogs,
} from 'viem';
import {
  type EvmContractCall,
  type EvmHubProvider,
  type EvmSpokeProvider,
  type Hash,
  type Hex,
  IntentsAbi,
  type SolverConfig,
  type TxReturnType,
  encodeContractCalls,
  getHubAssetInfo,
  getIntentRelayChainId,
  isIntentRelayChainId,
  randomUint256,
} from '../../index.js';
import { type CreateIntentParams, Erc20Service, type Intent, SpokeService } from '../index.js';
import invariant from 'tiny-invariant';

export const IntentCreatedEventAbi = getAbiItem({ abi: IntentsAbi, name: 'IntentCreated' });
export type IntentCreatedEventLog = GetLogsReturnType<typeof IntentCreatedEventAbi>[number];

export class EvmSolverService {
  private constructor() {}

  public static constructCreateIntentData(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    intentConfig: SolverConfig,
  ): [Hex, Intent] {
    const inputToken = getHubAssetInfo(createIntentParams.srcChain, createIntentParams.inputToken)?.asset;
    const outputToken = getHubAssetInfo(createIntentParams.dstChain, createIntentParams.outputToken)?.asset;

    invariant(
      inputToken,
      `hub asset not found for spoke chain token (intent.inputToken): ${createIntentParams.inputToken}`,
    );
    invariant(
      outputToken,
      `hub asset not found for spoke chain token (intent.outputToken): ${createIntentParams.outputToken}`,
    );

    const calls: EvmContractCall[] = [];
    const intentsContract = intentConfig.intentsContract;
    const intent = {
      ...createIntentParams,
      inputToken,
      outputToken,
      srcChain: getIntentRelayChainId(createIntentParams.srcChain),
      dstChain: getIntentRelayChainId(createIntentParams.dstChain),
      intentId: randomUint256(),
      creator: creatorHubWalletAddress,
    } satisfies Intent;

    calls.push(Erc20Service.encodeApprove(intent.inputToken, intentsContract, intent.inputAmount));
    calls.push(EvmSolverService.encodeCreateIntent(intent, intentsContract));
    return [encodeContractCalls(calls), intent];
  }

  /**
   * Creates an intent by handling token approval and intent creation
   * @param {Intent} intent - The intent to create
   * @param {Address} creatorHubWalletAddress - The address of the intent creator on the hub chain
   * @param {SolverConfig} intentConfig - The intent configuration
   * @param {EvmSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<[TxReturnType<EvmSpokeProvider, R>, Intent]} The transaction return type
   */
  public static async createIntent<R extends boolean = false>(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    intentConfig: SolverConfig,
    spokeProvider: EvmSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<[TxReturnType<EvmSpokeProvider, R>, Intent]> {
    invariant(
      isAddress(createIntentParams.inputToken),
      `Invalid spoke chain token (intent.inputToken): ${createIntentParams.inputToken}`,
    );

    const [data, intent] = EvmSolverService.constructCreateIntentData(
      createIntentParams,
      creatorHubWalletAddress,
      intentConfig,
    );

    return [
      await SpokeService.deposit(
        {
          from: spokeProvider.getWalletAddress(),
          to: creatorHubWalletAddress,
          token: createIntentParams.inputToken,
          amount: createIntentParams.inputAmount,
          data: data,
        },
        spokeProvider,
        hubProvider,
        raw,
      ),
      intent,
    ];
  }
  /**
   * Cancels an intent
   * @param {Intent} intent - The intent to cancel
   * @param {SolverConfig} intentConfig - The intent configuration
   * @param {EvmSpokeProvider} spokeProvider - The spoke provider
   * @param {EvmHubProvider} hubProvider - The hub provider
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<[TxReturnType<EvmSpokeProvider, R>, Intent]} The transaction return type
   */
  public static async cancelIntent<R extends boolean = false>(
    intent: Intent,
    intentConfig: SolverConfig,
    spokeProvider: EvmSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<EvmSpokeProvider, R>> {
    const calls: EvmContractCall[] = [];
    const intentsContract = intentConfig.intentsContract;
    calls.push(EvmSolverService.encodeCancelIntent(intent, intentsContract));
    const data = encodeContractCalls(calls);
    return SpokeService.callWallet(spokeProvider.getWalletAddress(), data, spokeProvider, hubProvider, raw);
  }

  /**
   * Gets an intent from a transaction hash
   * @param {Hash} txHash - The transaction hash
   * @param {EvmHubProvider} hubProvider - The EVM hub provider
   * @param {SolverConfig} solverConfig - The solver configuration
   * @returns {Promise<Intent>} The intent
   */
  public static async getIntent(
    txHash: Hash,
    hubProvider: EvmHubProvider,
    solverConfig: SolverConfig,
  ): Promise<Intent> {
    const receipt = await hubProvider.walletProvider.publicClient.waitForTransactionReceipt({ hash: txHash });
    const logs: IntentCreatedEventLog[] = parseEventLogs({
      abi: IntentsAbi,
      eventName: 'IntentCreated',
      logs: receipt.logs,
      strict: true,
    });

    for (const log of logs) {
      if (log.address.toLowerCase() === solverConfig.intentsContract.toLowerCase()) {
        if (!log.args.intent) {
          continue;
        }

        if (!isIntentRelayChainId(log.args.intent.srcChain) || !isIntentRelayChainId(log.args.intent.dstChain)) {
          throw new Error(`Invalid intent relay chain id: ${log.args.intent.srcChain} or ${log.args.intent.dstChain}`);
        }

        return {
          intentId: log.args.intent.intentId,
          creator: log.args.intent.creator,
          inputToken: log.args.intent.inputToken,
          outputToken: log.args.intent.outputToken,
          inputAmount: log.args.intent.inputAmount,
          minOutputAmount: log.args.intent.minOutputAmount,
          deadline: log.args.intent.deadline,
          data: log.args.intent.data,
          allowPartialFill: log.args.intent.allowPartialFill,
          srcChain: log.args.intent.srcChain,
          dstChain: log.args.intent.dstChain,
          srcAddress: log.args.intent.srcAddress,
          dstAddress: log.args.intent.dstAddress,
          solver: log.args.intent.solver,
        } satisfies Intent;
      }
    }

    throw new Error(`No intent found for ${txHash}`);
  }

  /**
   * Gets the keccak256 hash of an intent. Hash serves as the intent id on Hub chain.
   * @param {Intent} intent - The intent
   * @returns {Hex} The keccak256 hash of the intent
   */
  public static getIntentHash(intent: Intent): Hex {
    return keccak256(encodeAbiParameters(getAbiItem({ abi: IntentsAbi, name: 'createIntent' }).inputs, [intent]));
  }

  /**
   * Encodes a createIntent transaction
   * @param {Intent} intent - The intent to create
   * @param {Address} intentsContract - The address of the intents contract
   * @returns {EvmContractCall} The encoded contract call
   */
  public static encodeCreateIntent(intent: Intent, intentsContract: Address): EvmContractCall {
    return {
      address: intentsContract,
      value: 0n,
      data: encodeFunctionData({
        abi: IntentsAbi,
        functionName: 'createIntent',
        args: [intent],
      }),
    };
  }

  /**
   * Encodes a cancelIntent transaction
   * @param {Intent} intent - The intent to cancel
   * @param {Address} intentsContract - The address of the intents contract
   * @returns {EvmContractCall} The encoded contract call
   */
  public static encodeCancelIntent(intent: Intent, intentsContract: Address): EvmContractCall {
    return {
      address: intentsContract,
      value: 0n,
      data: encodeFunctionData({
        abi: IntentsAbi,
        functionName: 'cancelIntent',
        args: [intent],
      }),
    };
  }
}
