import { encodeFunctionData, erc20Abi, type Address, type PublicClient } from 'viem';
import type {
  EvmContractCall,
  EvmReturnType,
  EvmSpokeProviderType,
  GetAddressType,
  Result,
  SonicSpokeProviderType,
  TxReturnType,
} from '../../types.js';
import type { Erc20Token } from '@sodax/types';
import { isEvmRawSpokeProvider, isSonicRawSpokeProvider } from '../../guards.js';

export class Erc20Service {
  private constructor() {}

  public static async getErc20Token(token: Address, publicClient: PublicClient): Promise<Erc20Token> {
    /**
     * Fetches the ERC20 token name, symbol, and decimals using a single multicall via viem.
     * @param token - Token contract address
     * @param publicClient - Viem PublicClient instance
     * @returns Erc20Token object containing name, symbol, and decimals
     */
    const [name, symbol, decimals] = await publicClient.multicall({
      contracts: [
        {
          address: token,
          abi: erc20Abi,
          functionName: 'name',
        },
        {
          address: token,
          abi: erc20Abi,
          functionName: 'symbol',
        },
        {
          address: token,
          abi: erc20Abi,
          functionName: 'decimals',
        },
      ],
      allowFailure: false,
    });

    return { name, symbol, decimals, address: token };
  }

  /**
   * Check if spender has enough ERC20 allowance for given amount
   * @param token - ERC20 token address
   * @param amount - Amount to check allowance for
   * @param owner - User wallet address
   * @param spender - Spender address
   * @param spokeProvider - EVM Spoke provider
   * @return - True if spender is allowed to spend amount on behalf of owner
   */
  static async isAllowanceValid(
    token: Address,
    amount: bigint,
    owner: Address,
    spender: Address,
    spokeProvider: EvmSpokeProviderType | SonicSpokeProviderType,
  ): Promise<Result<boolean>> {
    try {
      if (token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase()) {
        return {
          ok: true,
          value: true,
        };
      }

      const allowedAmount = await spokeProvider.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, spender],
      });

      return {
        ok: true,
        value: allowedAmount >= amount,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Approve ERC20 amount spending
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param spender - Spender address
   * @param provider - EVM Provider
   */
  static async approve<R extends boolean = false>(
    token: Address,
    amount: bigint,
    spender: Address,
    spokeProvider: EvmSpokeProviderType | SonicSpokeProviderType,
    raw?: R,
  ): Promise<TxReturnType<EvmSpokeProviderType | SonicSpokeProviderType, R>> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const rawTx = {
      from: walletAddress as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
      to: token,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      }),
    } satisfies EvmReturnType<true>;

    if (raw || isEvmRawSpokeProvider(spokeProvider) || isSonicRawSpokeProvider(spokeProvider)) {
      return rawTx as EvmReturnType<R>;
    }

    return spokeProvider.walletProvider.sendTransaction(rawTx) satisfies Promise<
      TxReturnType<EvmSpokeProviderType | SonicSpokeProviderType, false>
    > as Promise<TxReturnType<EvmSpokeProviderType | SonicSpokeProviderType, R>>;
  }

  /**
   * Encodes a transfer transaction for a token.
   * @param token - The address of the token.
   * @param to - The address to transfer the token to.
   * @param amount - The amount of the token to transfer.
   * @returns The encoded contract call.
   */
  public static encodeTransfer(token: Address, to: Address, amount: bigint): EvmContractCall {
    return {
      address: token,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to, amount],
      }),
    };
  }

  /**
   * Encodes a transferFrom transaction for a token.
   * @param token - The address of the token.
   * @param from - The address to transfer the token from.
   * @param to - The address to transfer the token to.
   * @param amount - The amount of the token to transfer.
   * @returns The encoded contract call.
   */
  public static encodeTransferFrom(token: Address, from: Address, to: Address, amount: bigint): EvmContractCall {
    return {
      address: token,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transferFrom',
        args: [from, to, amount],
      }),
    };
  }

  /**
   * Encodes an approval transaction for a token.
   * @param token - The address of the token.
   * @param to - The address to approve the token to.
   * @param amount - The amount of the token to approve.
   * @returns The encoded contract call.
   */
  public static encodeApprove(token: Address, to: Address, amount: bigint): EvmContractCall {
    return {
      address: token,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [to, amount],
      }),
    };
  }
}
