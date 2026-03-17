import type { Address, Hex } from 'viem';
import { EvmWalletAbstraction } from '../hub/index.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { StacksRawSpokeProvider } from '../../entities/stacks/StacksSpokeProvider.js';
import {
  Cl,
  noneCV,
  parseContractId,
  PostConditionMode,
  someCV,
  uintCV,
  type ContractIdString,
} from '@stacks/transactions';
import { getIntentRelayChainId } from '@sodax/types';
import type { HubAddress, StacksTransactionParams } from '@sodax/types';
import type {
  DepositSimulationParams,
  PromiseStacksTxReturnType,
  StacksReturnType,
  StacksSpokeProviderType,
} from '../../types.js';
import { encodeAddress } from '../../utils/shared-utils.js';

export type StacksSpokeDepositParams = {
  from: Hex; // The address of the user on the spoke chain
  token: string; // The address of the token to deposit
  to?: HubAddress;
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

type TransferToHubParams = {
  from: string;
  token: string;
  amount: bigint;
  recipient: Hex;
  data: Hex;
};

export class StacksSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {StacksSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {StacksSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit<R extends boolean = false>(
    params: StacksSpokeDepositParams,
    spokeProvider: StacksSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStacksTxReturnType<R> {
    const userWallet: Address = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      hubProvider,
    );

    return StacksSpokeService.transfer(
      {
        from: params.from,
        token: params.token,
        recipient: params.to ? params.to : userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
      raw,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {StacksSpokeProviderType} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: string, spokeProvider: StacksSpokeProviderType): Promise<bigint> {
    const assetManager = spokeProvider.chainConfig.addresses.assetManager;
    if (token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase()) {
      return spokeProvider.getSTXBalance(assetManager);
    }
    return spokeProvider.readTokenBalance(token, assetManager);
  }

  /**
   * Get the simulation parameters for a deposit.
   * @param {StacksSpokeDepositParams} params - The deposit parameters.
   * @param {StacksSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<DepositSimulationParams>} The simulation parameters.
   */
  public static async getSimulateDepositParams(
    params: StacksSpokeDepositParams,
    spokeProvider: StacksSpokeProviderType,
    hubProvider: EvmHubProvider,
  ): Promise<DepositSimulationParams> {
    const to =
      params.to ??
      (await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
        hubProvider,
      ));

    return {
      spokeChainID: spokeProvider.chainConfig.chain.id,
      token: encodeAddress(spokeProvider.chainConfig.chain.id, params.token),
      from: encodeAddress(spokeProvider.chainConfig.chain.id, params.from),
      to,
      amount: params.amount,
      data: params.data,
      srcAddress: encodeAddress(spokeProvider.chainConfig.chain.id, spokeProvider.chainConfig.addresses.assetManager),
    };
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {Hex} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {StacksSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<R extends boolean = false>(
    from: Hex,
    payload: Hex,
    spokeProvider: StacksSpokeProviderType,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): PromiseStacksTxReturnType<R> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return StacksSpokeService.call(BigInt(relayId), from, payload, spokeProvider, raw);
  }

  /**
   * Transfers tokens to the hub chain.
   */
  private static async transfer<R extends boolean = false>(
    { from, token, recipient, amount, data = '0x' }: TransferToHubParams,
    spokeProvider: StacksSpokeProviderType,
    raw?: R,
  ): PromiseStacksTxReturnType<R> {
    const assetManagerImpl = await spokeProvider.getImplContractAddress(
      spokeProvider.chainConfig.addresses.assetManager,
    );
    const [implAddress, implName] = parseContractId(assetManagerImpl as ContractIdString);
    const [connectionAddress, connectionName] = parseContractId(
      spokeProvider.chainConfig.addresses.connection as ContractIdString,
    );
    const reqData = {
      contractAddress: implAddress as string,
      contractName: implName as string,
      functionName: 'transfer',
      functionArgs: [
        token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase()
          ? noneCV()
          : someCV(Cl.principal(token)),
        Cl.bufferFromHex(recipient),
        uintCV(amount),
        Cl.bufferFromHex(data),
        Cl.contractPrincipal(connectionAddress as string, connectionName as string),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
    if (raw || spokeProvider instanceof StacksRawSpokeProvider) {
      return reqData satisfies StacksReturnType<true> as unknown as StacksReturnType<R>;
    }
    const txId = await spokeProvider.walletProvider.sendTransaction(reqData);
    return txId as StacksReturnType<R>;
  }

  /**
   * Sends a message to the hub chain.
   */
  private static async call<R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Address,
    payload: Hex,
    spokeProvider: StacksSpokeProviderType,
    raw?: R,
  ): PromiseStacksTxReturnType<R> {
    const [connectionAddress, connectionName] = parseContractId(
      spokeProvider.chainConfig.addresses.connection as ContractIdString,
    );
    const reqData: StacksTransactionParams = {
      contractAddress: connectionAddress as string,
      contractName: connectionName as string,
      functionName: 'send-message',
      functionArgs: [uintCV(dstChainId), Cl.bufferFromHex(dstAddress), Cl.bufferFromHex(payload)],
      postConditionMode: PostConditionMode.Allow,
    };

    if (raw || spokeProvider instanceof StacksRawSpokeProvider) {
      return reqData satisfies StacksReturnType<true> as unknown as StacksReturnType<R>;
    }
    const txId = await spokeProvider.walletProvider.sendTransaction(reqData);

    return txId as StacksReturnType<R>;
  }
}
