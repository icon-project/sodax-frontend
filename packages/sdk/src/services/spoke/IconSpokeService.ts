import IconService from 'icon-sdk-js';
import * as rlp from 'rlp';
import type { Address, Hash, Hex } from 'viem';
import type { IconSpokeProvider } from '../../entities/icon/IconSpokeProvider.js';
import { getIconAddressBytes } from '../../entities/icon/utils.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { getIntentRelayChainId } from '../../index.js';
import type { IconAddress, IconReturnType, PromiseIconTxReturnType } from '../../types.js';
import { EvmWalletAbstraction } from '../hub/index.js';

export type IconSpokeDepositParams = {
  from: IconAddress; // The address of the user on the spoke chain
  to?: Hex; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type TransferToHubParams = {
  token: string;
  recipient: Address;
  amount: string;
  data: Hex;
};

export class IconSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {IconSpokeDepositParams} params - The parameters for the deposit
   * @param {IconWalletProvider} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<Result<string>>} A promise that resolves to the transaction hash
   */
  public static async deposit<R extends boolean = false>(
    params: IconSpokeDepositParams,
    spokeProvider: IconSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseIconTxReturnType<R> {
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
        amount: params.amount.toString(),
        data: params.data,
      },
      spokeProvider,
      raw,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {string} token - The address of the token to get the balance of
   * @param {IconWalletProvider} spokeProvider - The spoke provider
   * @returns {Promise<bigint>} The balance of the token
   */
  public static async getDeposit(token: string, spokeProvider: IconSpokeProvider): Promise<bigint> {
    const transaction = new IconService.CallBuilder()
      .to(token)
      .method('balanceOf')
      .params({ _owner: spokeProvider.chainConfig.addresses.assetManager })
      .build();
    const result = await spokeProvider.walletProvider.iconService.call(transaction).execute();
    return BigInt(result.value);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {string} from - The address of the user on the spoke chain
   * @param {Hex} payload - The payload to send to the contract
   * @param {IconWalletProvider} spokeProvider - The provider for the spoke chain
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain
   * @param {boolean} raw - The return type raw or just transaction hash
   * @returns {Promise<Result<string>>} A promise that resolves to the transaction hash
   */
  public static async callWallet<R extends boolean = false>(
    from: IconAddress,
    payload: Hex,
    spokeProvider: IconSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<Hash> {
    const userWallet: Address = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      getIconAddressBytes(from),
      hubProvider,
    );

    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return IconSpokeService.call(BigInt(relayId), userWallet, payload, spokeProvider);
  }

  /**
   * Transfers tokens to the hub chain.
   */
  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data }: TransferToHubParams,
    spokeProvider: IconSpokeProvider,
    raw?: R,
  ): PromiseIconTxReturnType<R> {
    const rlpInput: rlp.Input = [data, recipient];
    const rlpEncodedData = rlp.encode(rlpInput);
    const hexData = `0x${Buffer.from(rlpEncodedData).toString('hex')}`;
    const params = {
      _to: spokeProvider.chainConfig.addresses.assetManager,
      _value: amount,
      _data: hexData,
    };

    let value = '0x0';
    if (token === spokeProvider.chainConfig.nativeToken) {
      value = amount;
    }

    const transaction = new IconService.CallTransactionBuilder()
      .from(spokeProvider.walletProvider.getWalletAddress())
      .to(token)
      .stepLimit(IconService.Converter.toBigNumber('2000000'))
      .nid(spokeProvider.chainConfig.nid)
      .version('0x3')
      .timestamp(new Date().getTime() * 1000)
      .value(value)
      .method('transfer')
      .params(params)
      .build();

    if (raw) {
      return IconService.Converter.toRawTransaction(transaction) as IconReturnType<R>;
    }
    return spokeProvider.walletProvider.sendTransaction(transaction) as PromiseIconTxReturnType<R>;
  }

  /**
   * Sends a message to the hub chain.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: IconSpokeProvider,
    raw?: R,
  ): PromiseIconTxReturnType<R> {
    const params = {
      dstChainId: dstChainId.toString(),
      dstAddress: dstAddress,
      payload: payload,
    };

    const transaction = new IconService.CallTransactionBuilder()
      .from(spokeProvider.walletProvider.getWalletAddressBytes())
      .to(spokeProvider.chainConfig.addresses.connection)
      .stepLimit(IconService.Converter.toBigNumber('2000000'))
      .nid(spokeProvider.chainConfig.nid)
      .version('0x3')
      .timestamp(new Date().getTime() * 1000)
      .method('sendMessage')
      .params(params)
      .build();
    if (raw) {
      return IconService.Converter.toRawTransaction(transaction) as IconReturnType<R>;
    }
    return spokeProvider.walletProvider.sendTransaction(transaction) as PromiseIconTxReturnType<R>;
  }
}
