import invariant from 'tiny-invariant';
import {
  type Address,
  type GetLogsReturnType,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAbiItem,
  keccak256,
  parseEventLogs,
} from 'viem';
import {
  type EvmContractCall,
  type EvmHubProvider,
  FEE_PERCENTAGE_SCALE,
  type Hash,
  type Hex,
  IntentsAbi,
  type PartnerFee,
  type SolverConfig,
  calculatePercentageFeeAmount,
  encodeAddress,
  encodeContractCalls,
  getHubAssetInfo,
  getIntentRelayChainId,
  isIntentRelayChainId,
  isPartnerFeeAmount,
  isPartnerFeePercentage,
  randomUint256,
} from '../../index.js';
import {
  type CreateIntentParams,
  Erc20Service,
  type FeeData,
  type Intent,
  type IntentData,
  IntentDataType,
} from '../index.js';

export const IntentCreatedEventAbi = getAbiItem({ abi: IntentsAbi, name: 'IntentCreated' });
export type IntentCreatedEventLog = GetLogsReturnType<typeof IntentCreatedEventAbi>[number];

export class EvmSolverService {
  private constructor() {}

  /**
   * Constructs the create intent data for EVM Hub chain
   * @param {CreateIntentParams} createIntentParams - The create intent parameters
   * @param {Address} creatorHubWalletAddress - The creator hub wallet address
   * @param {SolverConfig} solverConfig - The intent configuration
   * @param {PartnerFee} fee - The partner fee configuration
   * @returns {Promise<[Hex, Intent, bigint]>} The encoded contract call, intent and fee amount
   */
  public static constructCreateIntentData(
    createIntentParams: CreateIntentParams,
    creatorHubWalletAddress: Address,
    solverConfig: SolverConfig,
    fee: PartnerFee | undefined,
    hubProvider: EvmHubProvider,
  ): [Hex, Intent, bigint] {
    let inputToken = getHubAssetInfo(createIntentParams.srcChain, createIntentParams.inputToken)?.asset;

    if (
      createIntentParams.srcChain === hubProvider.chainConfig.chain.id &&
      createIntentParams.inputToken.toLowerCase() === hubProvider.chainConfig.nativeToken.toLowerCase()
    ) {
      inputToken = hubProvider.chainConfig.wrappedNativeToken;
    }

    const outputToken = getHubAssetInfo(createIntentParams.dstChain, createIntentParams.outputToken)?.asset;

    invariant(
      inputToken,
      `hub asset not found for spoke chain token (intent.inputToken): ${createIntentParams.inputToken}`,
    );
    invariant(
      outputToken,
      `hub asset not found for spoke chain token (intent.outputToken): ${createIntentParams.outputToken}`,
    );

    const [feeData, feeAmount] = EvmSolverService.createIntentFeeData(fee, createIntentParams.inputAmount);

    const calls: EvmContractCall[] = [];
    const intentsContract = solverConfig.intentsContract;
    const intent = {
      ...createIntentParams,
      inputToken,
      outputToken,
      inputAmount: createIntentParams.inputAmount - feeAmount,
      srcChain: getIntentRelayChainId(createIntentParams.srcChain),
      dstChain: getIntentRelayChainId(createIntentParams.dstChain),
      srcAddress: encodeAddress(createIntentParams.srcChain, createIntentParams.srcAddress),
      dstAddress: encodeAddress(createIntentParams.dstChain, createIntentParams.dstAddress),
      intentId: randomUint256(),
      creator: creatorHubWalletAddress,
      data: feeData, // fee amount will be deducted from the input amount
    } satisfies Intent;

    calls.push(Erc20Service.encodeApprove(intent.inputToken, intentsContract, createIntentParams.inputAmount));
    calls.push(EvmSolverService.encodeCreateIntent(intent, intentsContract));
    return [encodeContractCalls(calls), intent, feeAmount];
  }

  /**
   * Creates encoded fee data for an intent
   * @param fee The partner fee configuration
   * @param inputAmount The input amount to calculate percentage-based fee from
   * @returns A tuple containing [encoded fee data, fee amount]. Fee amount will be 0n if no fee.
   */
  public static createIntentFeeData(fee: PartnerFee | undefined, inputAmount: bigint): [Hex, bigint] {
    invariant(inputAmount > 0n, 'Input amount must be greater than 0');
    if (!fee) {
      return ['0x', 0n];
    }

    let feeAmount: bigint;
    if (isPartnerFeeAmount(fee)) {
      feeAmount = fee.amount;
    } else if (isPartnerFeePercentage(fee)) {
      invariant(
        fee.percentage >= 0 && fee.percentage <= FEE_PERCENTAGE_SCALE,
        `Fee percentage must be between 0 and ${FEE_PERCENTAGE_SCALE}}`,
      );

      feeAmount = calculatePercentageFeeAmount(inputAmount, fee.percentage);
    } else {
      return ['0x', 0n];
    }

    // Create the fee data struct
    const feeData = {
      fee: feeAmount,
      receiver: fee.address,
    } satisfies FeeData;

    // Encode the fee data
    const encodedFeeData = encodeAbiParameters(
      [
        { name: 'fee', type: 'uint256' },
        { name: 'receiver', type: 'address' },
      ],
      [feeData.fee, feeData.receiver],
    );

    // Create the intent data struct
    const intentData = {
      type: IntentDataType.FEE,
      data: encodedFeeData,
    } satisfies IntentData;

    // Encode the intent data
    return [encodePacked(['uint8', 'bytes'], [intentData.type, intentData.data]), feeAmount];
  }

  /**
   * Gets an intent from a transaction hash
   * @param {Hash} txHash - The transaction hash
   * @param {SolverConfig} solverConfig - The solver configuration
   * @param {EvmHubProvider} hubProvider - The EVM hub provider
   * @returns {Promise<Intent>} The intent
   */
  public static async getIntent(
    txHash: Hash,
    solverConfig: SolverConfig,
    hubProvider: EvmHubProvider,
  ): Promise<Intent> {
    const receipt = await hubProvider.publicClient.waitForTransactionReceipt({ hash: txHash });
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
