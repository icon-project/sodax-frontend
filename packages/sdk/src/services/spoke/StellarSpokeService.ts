import { type Address, type Hex, fromHex } from 'viem';
import type { EvmHubProvider } from '../../entities/index.js';
import type { StellarSpokeProvider } from '../../entities/stellar/StellarSpokeProvider.js';
import {
  type DepositSimulationParams,
  type HubAddress,
  type PromiseStellarTxReturnType,
  type StellarGasEstimate,
  type StellarRawTransaction,
  encodeAddress,
  getIntentRelayChainId,
} from '../../index.js';
import { EvmWalletAbstraction } from '../hub/index.js';
import { FeeBumpTransaction, type Transaction, TransactionBuilder, rpc } from '@stellar/stellar-sdk';

export type StellarSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  to?: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
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

  /**
   * Estimate the gas for a transaction.
   * @param rawTx - The raw transaction to estimate the gas for.
   * @param spokeProvider - The spoke provider.
   * @returns The estimated gas (minResourceFee) for the transaction.
   */
  public static async estimateGas(
    rawTx: StellarRawTransaction,
    spokeProvider: StellarSpokeProvider,
  ): Promise<StellarGasEstimate> {
    const network = await spokeProvider.sorobanServer.getNetwork();
    let tx: Transaction | FeeBumpTransaction = TransactionBuilder.fromXDR(rawTx.data, network.passphrase);

    if (tx instanceof FeeBumpTransaction) {
      tx = tx.innerTransaction;
    }

    const simulationForFee = await spokeProvider.sorobanServer.simulateTransaction(tx);

    if (!rpc.Api.isSimulationSuccess(simulationForFee)) {
      throw new Error(`Simulation error: ${JSON.stringify(simulationForFee)}`);
    }

    return BigInt(simulationForFee.minResourceFee);
  }

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

  /**
   * Get the balance of the token in the spoke chain asset manager.
   * @param token - The address of the token to get the balance of.
   * @param spokeProvider - The spoke provider.
   * @returns The balance of the token.
   */
  public static async getDeposit(token: string, spokeProvider: StellarSpokeProvider): Promise<bigint> {
    return BigInt(await spokeProvider.getBalance(token));
  }

  /**
   * Generate simulation parameters for deposit from StellarSpokeDepositParams.
   * @param {StellarSpokeDepositParams} params - The deposit parameters.
   * @param {StellarSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: StellarSpokeDepositParams,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        params.from,
        hubProvider,
      ));

    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: encodeAddress(spokeProvider.chainConfig.chain.id, params.token),
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
   * Calls a contract on the spoke chain using the user's wallet.
   * @param from - The address of the user on the hub chain.
   * @param payload - The payload to send to the contract.
   * @param spokeProvider - The spoke provider.
   * @param hubProvider - The hub provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result.
   */
  public static async callWallet<R extends boolean = false>(
    from: HubAddress,
    payload: Hex,
    spokeProvider: StellarSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStellarTxReturnType<R> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return StellarSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
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
    dstAddress: HubAddress,
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
