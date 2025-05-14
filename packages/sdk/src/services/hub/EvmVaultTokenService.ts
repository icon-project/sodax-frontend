import { type Address, type Hash, encodeFunctionData } from 'viem';
import { vaultTokenAbi } from '../../abis/index.js';
import type { EvmWalletProvider } from '../../entities/index.js';
import type { EvmContractCall, TokenInfo, VaultReserves } from '../../types.js';

export class EvmVaultTokenService {
  private constructor() {}

  /**
   * Fetches token information for a specific token in the vault.
   * @param vault - The address of the vault.
   * @param token - The address of the token.
   * @param provider - EvmWalletProvider
   * @returns Token information as a TokenInfo object.
   */
  public static async getTokenInfo(vault: Address, token: Address, provider: EvmWalletProvider): Promise<TokenInfo> {
    const [decimals, depositFee, withdrawalFee, maxDeposit, isSupported] = await provider.publicClient.readContract({
      address: vault,
      abi: vaultTokenAbi,
      functionName: 'tokenInfo',
      args: [token],
    });

    return { decimals, depositFee, withdrawalFee, maxDeposit, isSupported };
  }

  /**
   * Retrieves the reserves of the vault.
   * @param vault - The address of the vault.
   * @param provider - EvmWalletProvider
   * @returns An object containing tokens and their balances.
   */
  public static async getVaultReserves(vault: Address, provider: EvmWalletProvider): Promise<VaultReserves> {
    const [tokens, balances] = await provider.publicClient.readContract({
      address: vault,
      abi: vaultTokenAbi,
      functionName: 'getVaultReserves',
      args: [],
    });

    return {
      tokens,
      balances,
    };
  }

  /**
   * Retrieves all token information for the vault.
   * @param vault - The address of the vault.
   * @param provider - EvmWalletProvider
   * @returns A promise that resolves to an object containing tokens, their infos, and reserves.
   */
  async getAllTokenInfo(
    vault: Address,
    provider: EvmWalletProvider,
  ): Promise<{
    tokens: readonly Address[];
    infos: readonly TokenInfo[];
    reserves: readonly bigint[];
  }> {
    const [tokens, infos, reserves] = await provider.publicClient.readContract({
      address: vault,
      abi: vaultTokenAbi,
      functionName: 'getAllTokenInfo',
      args: [],
    });

    return {
      tokens,
      infos,
      reserves,
    };
  }

  /**
   * Deposits a specified amount of a token into the vault.
   * @param vault - The address of the vault.
   * @param token - The address of the token to deposit.
   * @param amount - The amount of the token to deposit.
   * @param provider - EvmWalletProvider
   * @returns Transaction hash
   */
  public static async deposit(
    vault: Address,
    token: Address,
    amount: bigint,
    provider: EvmWalletProvider,
  ): Promise<Hash> {
    return provider.walletClient.writeContract({
      address: vault,
      abi: vaultTokenAbi,
      functionName: 'deposit',
      args: [token, amount],
    });
  }

  /**
   * Withdraws a specified amount of a token from the vault.
   * @param vault - The address of the vault.
   * @param token - The address of the token to withdraw.
   * @param amount - The amount of the token to withdraw.
   * @param provider - EvmWalletProvider
   * @returns Transaction hash
   */
  public static async withdraw(
    vault: Address,
    token: Address,
    amount: bigint,
    provider: EvmWalletProvider,
  ): Promise<Hash> {
    return provider.walletClient.writeContract({
      address: vault,
      abi: vaultTokenAbi,
      functionName: 'withdraw',
      args: [token, amount],
    });
  }

  /**
   * Encodes the deposit transaction data for the vault.
   * @param vault - The address of the vault.
   * @param token - The address of the token to deposit.
   * @param amount - The amount of the token to deposit.
   * @returns The encoded contract call data.
   */
  static encodeDeposit(vault: Address, token: Address, amount: bigint): EvmContractCall {
    return {
      address: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: vaultTokenAbi,
        functionName: 'deposit',
        args: [token, amount],
      }),
    };
  }

  /**
   * Encodes the withdraw transaction data for the vault.
   * @param vault - The address of the vault.
   * @param token - The address of the token to withdraw.
   * @param amount - The amount of the token to withdraw.
   * @returns The encoded contract call data.
   */
  static encodeWithdraw(vault: Address, token: Address, amount: bigint): EvmContractCall {
    return {
      address: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: vaultTokenAbi,
        functionName: 'withdraw',
        args: [token, amount],
      }),
    };
  }

  /**
   * Translates token amounts from their native decimals to 18 decimals
   * @param decimals - The number of decimals of the token
   * @param amount - The amount to translate
   * @returns The translated amount
   */
  public static translateIncomingDecimals(decimals: number, amount: bigint): bigint {
    if (decimals <= 18) {
      return amount * BigInt(10 ** (18 - decimals));
    }
    return amount / BigInt(10 ** (decimals - 18));
  }

  /**
   * Translates token amounts from 18 decimals back to their native decimals
   * @param decimals - The number of decimals of the token
   * @param amount - The amount to translate
   * @returns The translated amount
   */
  public static translateOutgoingDecimals(decimals: number, amount: bigint): bigint {
    if (decimals <= 18) {
      return amount / BigInt(10 ** (18 - decimals));
    }
    return amount * BigInt(10 ** (decimals - 18));
  }
}
