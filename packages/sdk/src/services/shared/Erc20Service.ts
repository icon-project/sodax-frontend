import { encodeFunctionData, erc20Abi, type Address } from 'viem';
import type { EvmContractCall, Result } from '../../types.js';
import type { EvmSpokeProvider } from '../../entities/Providers.js';
import type { EvmRawTransactionReceipt } from '@sodax/types';

export class Erc20Service {
  private constructor() { }

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
    spokeProvider: EvmSpokeProvider,
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
  static async approve(
    token: Address,
    amount: bigint,
    spender: Address,
    spokeProvider: EvmSpokeProvider,
  ): Promise<Result<EvmRawTransactionReceipt>> {
    try {
      const walletAddress = (await spokeProvider.walletProvider.getWalletAddress()) as Address;
      const hash = await spokeProvider.walletProvider.sendTransaction({
        from: walletAddress,
        to: token,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [spender, amount],
        }),
      });

      return {
        ok: true,
        value: await spokeProvider.walletProvider.waitForTransactionReceipt(hash),
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Encodes a transfer transaction for a token.
   * @param token - The address of the token.
   * @param to - The address to transfer the token to.
   * @param amount - The amount of the token to transfer.
   * @returns The encoded contract call.
   */
  public static encodeTansfer(token: Address, to: Address, amount: bigint): EvmContractCall {
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
