import { type Address, type Hex, fromHex } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import type { StellarSpokeProvider } from '../../entities/stellar/StellarSpokeProvider.js';
import { type PromiseStellarTxReturnType, getIntentRelayChainId } from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';

export type StellarSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  to?: Hex; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type TransferToHubParams = {
  token: string;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export class StellarSpokeService {
  private constructor() {}

  public static async deposit<R extends boolean = false>(
    params: StellarSpokeDepositParams,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    const userWallet: Address =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        params.from,
        hubProvider,
      ));

    return StellarSpokeService.transfer(
      {
        token: params.token,
        recipient: userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
      raw,
    );
  }

  public static async getDeposit(token: string, spokeProvider: StellarSpokeProvider): Promise<bigint> {
    return BigInt(await spokeProvider.getBalance(token));
  }

  public static async callWallet<R extends boolean = false>(
    from: Hex,
    payload: Hex,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    const userWallet: Address = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      from,
      hubProvider,
    );

    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return StellarSpokeService.call(BigInt(relayId), userWallet, payload, spokeProvider, raw);
  }

  private static async transfer<R extends boolean = false>(
    { token, recipient, amount, data = '0x' }: TransferToHubParams,
    spokeProvider: StellarSpokeProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    return await spokeProvider.deposit(
      token,
      amount.toString(),
      fromHex(recipient, 'bytes'),
      fromHex(data, 'bytes'),
      raw,
    );
  }

  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: StellarSpokeProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    return await spokeProvider.sendMessage(
      dstChainId.toString(),
      fromHex(dstAddress, 'bytes'),
      fromHex(payload, 'bytes'),
      raw,
    );
  }
}
