import type { Address, Hex } from 'viem';
import { EvmWalletAbstraction } from '../hub/index.js';
import type { EvmHubProvider, StacksSpokeProvider } from '../../entities/index.js';
import { Cl, noneCV, parseContractId, PostConditionMode, someCV, uintCV, type ContractIdString } from '@stacks/transactions';
import { serializeAddressData } from '../../utils/stacks-utils.js';
import { getIntentRelayChainId } from '../../constants.js';

export type StacksSpokeDepositParams = {
  from: string; // The address of the user on the spoke chain
  token: string; // The address of the token to deposit
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
   * @param {StacksSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit(
    params: StacksSpokeDepositParams,
    spokeProvider: StacksSpokeProvider,
    hubProvider: EvmHubProvider,
    raw?: boolean,
  ): Promise<string> {
    const userWallet: Address = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      serializeAddressData(params.from),
      hubProvider,
    );

    return StacksSpokeService.transfer(
      {
        from: params.from,
        token: params.token,
        recipient: userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {StacksSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: string, spokeProvider: StacksSpokeProvider): Promise<bigint> {
    const assetManager = spokeProvider.chainConfig.addresses.assetManager;
    if (token.toLowerCase() === 'native') {
      return spokeProvider.getSTXBalance(assetManager);
    }
    return spokeProvider.readTokenBalance(token, assetManager);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {Hex} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {StacksSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet(
    from: Hex,
    payload: Hex,
    spokeProvider: StacksSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<string> {
    const relayId = getIntentRelayChainId(hubProvider.chainConfig.chain.id);
    return StacksSpokeService.call(BigInt(relayId), from, payload, spokeProvider);
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {EvmTransferToHubParams} params - The parameters for the transfer, including:
   *   - {Address} token: The address of the token to transfer (use address(0) for native token).
   *   - {Address} recipient: The recipient address on the hub chain.
   *   - {bigint} amount: The amount to transfer.
   *   - {Hex} [data="0x"]: Additional data for the transfer.
   * @param {StacksSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  private static async transfer(
    { from, token, recipient, amount, data = '0x' }: TransferToHubParams,
    spokeProvider: StacksSpokeProvider,
  ): Promise<string> {
    const reqData = {
      contractAddress: parseContractId(spokeProvider.chainConfig.addresses.assetManager as ContractIdString)[0] as string,
      contractName: parseContractId(spokeProvider.chainConfig.addresses.assetManager as ContractIdString)[1] as string,
      functionName: 'transfer',
      functionArgs: [
        token === 'native' ? noneCV() : someCV(Cl.principal(token)),
        Cl.bufferFromHex(recipient),
        uintCV(amount),
        Cl.bufferFromHex(data),
        Cl.contractPrincipal(
          parseContractId(spokeProvider.chainConfig.addresses.connection as ContractIdString)[0] as string,
          parseContractId(spokeProvider.chainConfig.addresses.connection as ContractIdString)[1] as string,
        ),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
    const txId = await spokeProvider.walletProvider.sendTransaction(reqData);
    return txId;
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {StacksSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  private static async call(
    dstChainId: bigint,
    dstAddress: Address,
    payload: Hex,
    spokeProvider: StacksSpokeProvider,
  ): Promise<string> {
    const reqData = {
      contractAddress: parseContractId(spokeProvider.chainConfig.addresses.connection as ContractIdString)[0] as string,
      contractName: parseContractId(spokeProvider.chainConfig.addresses.connection as ContractIdString)[1] as string,
      functionName: 'send-message',
      functionArgs: [uintCV(dstChainId), Cl.bufferFromHex(dstAddress), Cl.bufferFromHex(payload)],
      postConditionMode: PostConditionMode.Allow,
    };
    const txId = await spokeProvider.walletProvider.sendTransaction(reqData);
    return txId;
  }
}
