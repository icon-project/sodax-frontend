import { encodeFunctionData, erc20Abi, type Address, type PublicClient } from 'viem';
import {
  spokeChainConfig,
  type EvmChainKey,
  type EvmContractCall,
  type EvmReturnType,
  type Result,
  type TxReturnType,
  type GetWalletProviderType,
} from '@sodax/types';

export type Erc20ApproveParams<Raw extends boolean> = {
  token: Address;
  amount: bigint;
  from: Address;
  spender: Address;
  walletProvider: GetWalletProviderType<EvmChainKey> | undefined;
};

export type Erc20IsAllowanceParams<ChainKey extends EvmChainKey> = {
  token: Address;
  amount: bigint;
  owner: Address;
  spender: Address;
  chainKey: ChainKey;
  publicClient: PublicClient;
};

export type Erc20Token = {
  name: string;
  symbol: string;
  decimals: number;
  address: Address;
};

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
   * Check if spender has enough ERC20 allowance for given amount.
   * @param params - Token, amount, owner, spender, chainKey, and publicClient for the chain.
   * @returns Whether allowance is sufficient for the amount.
   */
  static async isAllowanceValid<ChainKey extends EvmChainKey>(
    params: Erc20IsAllowanceParams<ChainKey>,
  ): Promise<Result<boolean>> {
    try {
      if (params.token.toLowerCase() === spokeChainConfig[params.chainKey].nativeToken.toLowerCase()) {
        return {
          ok: true,
          value: true,
        };
      }

      const allowedAmount = await params.publicClient.readContract({
        address: params.token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [params.owner, params.spender],
      });

      return {
        ok: true,
        value: allowedAmount >= params.amount,
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
  static async approve<Raw extends boolean>(params: Erc20ApproveParams<Raw>): Promise<TxReturnType<EvmChainKey, Raw>> {
    const rawTx = {
      from: params.from,
      to: params.token,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [params.spender, params.amount],
      }),
    } satisfies EvmReturnType<true>;

    if (!params.walletProvider) {
      return rawTx satisfies TxReturnType<EvmChainKey, true> as TxReturnType<EvmChainKey, Raw>;
    }

    return (await params.walletProvider.sendTransaction(rawTx)) satisfies TxReturnType<
      EvmChainKey,
      false
    > as TxReturnType<EvmChainKey, Raw>;
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
