import * as IconSdkRaw from 'icon-sdk-js';
const IconSdk = ('default' in IconSdkRaw.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
const { Converter, CallTransactionBuilder, CallBuilder } = IconSdk;
import type { IconService } from 'icon-sdk-js';
import * as rlp from 'rlp';
import type {
  SendMessageParams,
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../types/spoke-types.js';
import type { ConfigService } from '../../config/ConfigService.js';
import { sleep, BigIntToHex, encodeAddress } from '../../utils/shared-utils.js';
import {
  type HttpUrl,
  type HubAddress,
  type HubChainKey,
  type IconAddress,
  type IconChainKey,
  type IconTransactionResult,
  type Result,
  getIntentRelayChainId,
  spokeChainConfig,
  isNativeToken,
  ChainKeys,
  type Hex,
  type Address,
  type GetAddressType,
  type WalletProviderSlot,
  type IconGasEstimate,
  type TxReturnType,
} from '@sodax/types';
import { estimateStepCost } from '../../utils/icon-utils.js';

export type IconSpokeDepositParams = {
  from: IconAddress; // The address of the user on the spoke chain
  srcChain: IconChainKey; // The chain ID of the source spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type IconTransferToHubParams = {
  token: string;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export type IconCallParams<Raw extends boolean> = {
  srcChainKey: IconChainKey;
  srcAddress: GetAddressType<IconChainKey>;
  dstChainId: HubChainKey;
  dstAddress: HubAddress;
  payload: Hex;
} & WalletProviderSlot<IconChainKey, Raw>;

export class IconSpokeService {
  public readonly iconService: IconService;
  public readonly debugRpcUrl: HttpUrl;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  constructor(config: ConfigService) {
    // since we only support mainnet for now, we can hardcode the single icon chain config
    const chainConfig = config.sodaxConfig.chains[ChainKeys.ICON_MAINNET];
    this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(chainConfig.rpcUrl));
    this.debugRpcUrl = chainConfig.debugRpcUrl;
    this.pollingIntervalMs = chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.pollingConfig.maxTimeoutMs;
  }

  public async estimateGas({ tx }: EstimateGasParams<IconChainKey>): Promise<IconGasEstimate> {
    return estimateStepCost(tx, this.debugRpcUrl);
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {IconSpokeDepositParams} params - The parameters for the deposit
   * @param {IconSpokeProviderType} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<Result<string>>} A promise that resolves to the transaction hash
   */
  public async deposit<R extends boolean = false>(
    params: DepositParams<IconChainKey, R>,
  ): Promise<TxReturnType<IconChainKey, R>> {
    const { srcAddress: from, srcChainKey: fromChainId, to: recipient, token, amount, data } = params;

    const rlpInput: rlp.Input = [data, recipient];
    const rlpEncodedData = rlp.encode(rlpInput);
    const hexData = `0x${Buffer.from(rlpEncodedData).toString('hex')}`;
    const txParams = {
      _to: spokeChainConfig[fromChainId].addresses.assetManager,
      _value: BigIntToHex(amount),
      _data: hexData,
    };

    const isNative = isNativeToken(fromChainId, token);
    const value: Hex = isNative ? BigIntToHex(amount) : '0x0';
    const to = isNative ? spokeChainConfig[fromChainId].addresses.wICX : token;

    const rawTransaction = Converter.toRawTransaction(
      new CallTransactionBuilder()
        .from(from)
        .to(to)
        .stepLimit(Converter.toBigNumber('2000000'))
        .nid(spokeChainConfig[fromChainId].nid)
        .version('0x3')
        .timestamp(new Date().getTime() * 1000)
        .value(value)
        .method('transfer')
        .params(txParams)
        .build(),
    );

    if (params.raw === true) {
      return rawTransaction satisfies TxReturnType<IconChainKey, true> as TxReturnType<IconChainKey, R>;
    }

    return params.walletProvider.sendTransaction({
      from: from,
      to: to,
      value: value,
      nid: spokeChainConfig[fromChainId].nid,
      method: 'transfer',
      params: txParams,
    }) satisfies Promise<TxReturnType<IconChainKey, false>> as Promise<TxReturnType<IconChainKey, R>>;
  }

  /**
   * Get the balance of the token in the spoke chain asset manager.
   * @param {string} token - The address of the token to get the balance of
   * @param {IconSpokeProviderType} spokeProvider - The spoke provider
   * @returns {Promise<bigint>} The balance of the token
   */
  public async getDeposit(params: GetDepositParams<IconChainKey>): Promise<bigint> {
    const { token, srcChainKey: fromChainId } = params;
    const transaction = new CallBuilder()
      .to(token)
      .method('balanceOf')
      .params({ _owner: spokeChainConfig[fromChainId].addresses.assetManager })
      .build();
    const result = await this.iconService.call(transaction).execute();
    return BigInt(result.value);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the destination chain.
   */
  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<IconChainKey, Raw>,
  ): Promise<TxReturnType<IconChainKey, Raw>> {
    const { srcAddress: from, srcChainKey: fromChainId, dstChainKey: dstChainId, dstAddress, payload } = params;
    const relayId = getIntentRelayChainId(dstChainId);

    const txParams = {
      dstChainId: relayId,
      dstAddress: dstAddress,
      payload: payload,
    };

    const transaction = new CallTransactionBuilder()
      .from(from)
      .to(spokeChainConfig[fromChainId].addresses.connection)
      .stepLimit(Converter.toBigNumber('2000000'))
      .nid(spokeChainConfig[fromChainId].nid)
      .version('0x3')
      .timestamp(new Date().getTime() * 1000)
      .method('sendMessage')
      .params(txParams)
      .build();

    if (params.raw === true) {
      return Converter.toRawTransaction(transaction) satisfies TxReturnType<IconChainKey, true> as TxReturnType<
        IconChainKey,
        Raw
      >;
    }

    return params.walletProvider.sendTransaction({
      from: from,
      to: spokeChainConfig[fromChainId].addresses.connection,
      nid: spokeChainConfig[fromChainId].nid,
      value: '0x0',
      method: 'sendMessage',
      params: txParams,
    }) satisfies Promise<TxReturnType<IconChainKey, false>> as Promise<TxReturnType<IconChainKey, Raw>>;
  }

  public encodeSimulationParams(token: string, assetManager: string): { encodedToken: Hex; encodedSrcAddress: Hex } {
    // Native ICX must be substituted with wICX — the wrapped form registered in the hub's asset manager.
    // The deposit() method performs the same substitution when sending the real transaction.
    const resolvedToken = isNativeToken(ChainKeys.ICON_MAINNET, token)
      ? spokeChainConfig[ChainKeys.ICON_MAINNET].addresses.wICX
      : token;
    return {
      encodedToken: encodeAddress(ChainKeys.ICON_MAINNET, resolvedToken),
      encodedSrcAddress: encodeAddress(ChainKeys.ICON_MAINNET, assetManager),
    };
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<IconChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<IconChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const deadline = Date.now() + maxTimeoutMs;

    while (Date.now() < deadline) {
      try {
        const result = await this.iconService.getTransactionResult(txHash).execute();
        if (result.status === 1) {
          return { ok: true, value: { status: 'success', receipt: result as unknown as IconTransactionResult } };
        }
        return {
          ok: true,
          value: { status: 'failure', error: new Error(`Transaction failed: ${JSON.stringify(result)}`) },
        };
      } catch {
        // Transaction pending or not found — retry after delay
        await sleep(pollingIntervalMs);
      }
    }

    return {
      ok: true,
      value: {
        status: 'timeout',
        error: new Error(`Timed out after ${maxTimeoutMs}ms waiting for ICON transaction ${txHash}`),
      },
    };
  }
}
