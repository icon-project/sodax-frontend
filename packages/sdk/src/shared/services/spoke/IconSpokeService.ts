import * as IconSdkRaw from 'icon-sdk-js';
const IconSdk = ('default' in IconSdkRaw.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
const { Converter, CallTransactionBuilder, CallBuilder } = IconSdk;
import * as rlp from 'rlp';
import type { Address, Hex } from 'viem';
import { getIconAddressBytes } from '../../entities/icon/utils.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { BigIntToHex, type ConfigService, encodeAddress, isIconRawSpokeProvider } from '../../../index.js';
import type {
  DepositSimulationParams,
  IconGasEstimate,
  IconRawTransaction,
  IconSpokeProviderType,
  TxReturnType,
} from '../../types.js';
import { type HubAddress, type IconAddress, getIntentRelayChainId } from '@sodax/types';
import { EvmWalletAbstraction } from '../hub/index.js';
import { estimateStepCost } from '../../utils/icon-utils.js';

export type IconSpokeDepositParams = {
  from: IconAddress; // The address of the user on the spoke chain
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

export class IconSpokeService {
  private constructor() {}

  public static async estimateGas(
    rawTx: IconRawTransaction,
    spokeProvider: IconSpokeProviderType,
  ): Promise<IconGasEstimate> {
    return estimateStepCost(rawTx, spokeProvider.debugRpcUrl);
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {IconSpokeDepositParams} params - The parameters for the deposit
   * @param {IconSpokeProviderType} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<Result<string>>} A promise that resolves to the transaction hash
   */
  public static async deposit<R extends boolean = false>(
    params: IconSpokeDepositParams,
    spokeProvider: IconSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<IconSpokeProviderType, R>> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        getIconAddressBytes(params.from),
        hubProvider,
      ));

    return IconSpokeService.transfer(
      {
        token: params.token,
        recipient: userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
      hubProvider.configService,
      raw,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {string} token - The address of the token to get the balance of
   * @param {IconSpokeProviderType} spokeProvider - The spoke provider
   * @returns {Promise<bigint>} The balance of the token
   */
  public static async getDeposit(token: string, spokeProvider: IconSpokeProviderType): Promise<bigint> {
    const transaction = new CallBuilder()
      .to(token)
      .method('balanceOf')
      .params({ _owner: spokeProvider.chainConfig.addresses.assetManager })
      .build();
    const result = await spokeProvider.iconService.call(transaction).execute();
    return BigInt(result.value);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {HubAddress} from - The address of the user on the hub chain
   * @param {Hex} payload - The payload to send to the contract
   * @param {IconSpokeProviderType} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<Result<string>>} A promise that resolves to the transaction hash
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: IconSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<IconSpokeProviderType, R>> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return IconSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
  }

  /**
   * Generate simulation parameters for deposit from IconSpokeDepositParams.
   * @param {IconSpokeDepositParams} params - The deposit parameters.
   * @param {IconSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: IconSpokeDepositParams,
    spokeProvider: IconSpokeProviderType,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        getIconAddressBytes(params.from),
        hubProvider,
      ));

    const token = hubProvider.configService.isNativeToken(spokeProvider.chainConfig.chain.id, params.token)
      ? spokeProvider.chainConfig.addresses.wICX
      : params.token;
    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: encodeAddress(spokeProvider.chainConfig.chain.id, token),
      from: encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      to,
      amount: params.amount,
      data: params.data,
      srcAddress: encodeAddress(
        spokeProvider.chainConfig.chain.id,
        spokeProvider.chainConfig.addresses.assetManager as `0x${string}`,
      ),
    };
  }

  /**
   * Transfers tokens to the hub chain.
   */
  private static async transfer<S extends IconSpokeProviderType, R extends boolean = false>(
    { token, recipient, amount, data }: IconTransferToHubParams,
    spokeProvider: S,
    configService: ConfigService,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const rlpInput: rlp.Input = [data, recipient];
    const rlpEncodedData = rlp.encode(rlpInput);
    const hexData = `0x${Buffer.from(rlpEncodedData).toString('hex')}`;
    const params = {
      _to: spokeProvider.chainConfig.addresses.assetManager,
      _value: BigIntToHex(amount),
      _data: hexData,
    };

    const value: Hex = configService.isNativeToken(spokeProvider.chainConfig.chain.id, token)
      ? BigIntToHex(amount)
      : '0x0';
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const to = configService.isNativeToken(spokeProvider.chainConfig.chain.id, token)
      ? spokeProvider.chainConfig.addresses.wICX
      : token;

    const rawTransaction = Converter.toRawTransaction(
      new CallTransactionBuilder()
        .from(walletAddress)
        .to(to)
        .stepLimit(Converter.toBigNumber('2000000'))
        .nid(spokeProvider.chainConfig.nid)
        .version('0x3')
        .timestamp(new Date().getTime() * 1000)
        .value(value)
        .method('transfer')
        .params(params)
        .build(),
    );

    if (raw || isIconRawSpokeProvider(spokeProvider)) {
      return rawTransaction satisfies TxReturnType<IconSpokeProviderType, true> as TxReturnType<S, R>;
    }

    return spokeProvider.walletProvider.sendTransaction({
      from: walletAddress,
      to: to,
      value: value,
      nid: spokeProvider.chainConfig.nid,
      method: 'transfer',
      params: params,
    }) satisfies Promise<TxReturnType<IconSpokeProviderType, false>> as Promise<TxReturnType<S, R>>;
  }

  /**
   * Sends a message to the hub chain.
   */
  private static async call<S extends IconSpokeProviderType, R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: HubAddress,
    payload: Hex,
    spokeProvider: IconSpokeProviderType,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const params = {
      dstChainId: dstChainId.toString(),
      dstAddress: dstAddress,
      payload: payload,
    };

    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const transaction = new CallTransactionBuilder()
      .from(walletAddress)
      .to(spokeProvider.chainConfig.addresses.connection)
      .stepLimit(Converter.toBigNumber('2000000'))
      .nid(spokeProvider.chainConfig.nid)
      .version('0x3')
      .timestamp(new Date().getTime() * 1000)
      .method('sendMessage')
      .params(params)
      .build();

    if (raw || isIconRawSpokeProvider(spokeProvider)) {
      return Converter.toRawTransaction(transaction) satisfies TxReturnType<
        IconSpokeProviderType,
        true
      > as TxReturnType<S, R>;
    }

    return spokeProvider.walletProvider.sendTransaction({
      from: walletAddress,
      to: spokeProvider.chainConfig.addresses.connection,
      nid: spokeProvider.chainConfig.nid,
      value: '0x0',
      method: 'sendMessage',
      params: params,
    }) satisfies Promise<TxReturnType<IconSpokeProviderType, false>> as Promise<TxReturnType<S, R>>;
  }
}
