import { type Address, type Hash, type HttpTransport, type PublicClient, encodeFunctionData } from 'viem';
import { vaultTokenAbi } from '../../abis/index.js';
import type { EvmContractCall, VaultReserves } from '../../types.js';
import type { IEvmWalletProvider, TokenInfo } from '@sodax/types';

export class EvmVaultTokenService {
  private constructor() {}

  /**
   * Fetches token information for a specific token in the vault.
   * @param vault - The address of the vault.
   * @param token - The address of the token.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns Token information as a TokenInfo object.
   */
  public static async getTokenInfo(
    vault: Address,
    token: Address,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<TokenInfo> {
    const [decimals, depositFee, withdrawalFee, maxDeposit, isSupported] = await publicClient.readContract({
      address: vault,
      abi: vaultTokenAbi,
      functionName: 'tokenInfo',
      args: [token],
    });

    return { decimals, depositFee, withdrawalFee, maxDeposit, isSupported };
  }

    /**
     * Fetches token information for a list of tokens in a vault using a multicall.
     * @param vault - The address of the vault contract.
     * @param tokens - An array of token addresses to fetch info for.
     * @param publicClient - The Viem PublicClient instance used to interact with the blockchain.
     * @returns A promise that resolves to an array of TokenInfo objects, one for each provided token.
     */
    public static async getTokenInfos(
      vault: Address,
      tokens: Address[],
      publicClient: PublicClient<HttpTransport>,
    ): Promise<TokenInfo[]> {
      const infos = await publicClient.multicall({
        contracts: tokens.map(token => ({
          address: vault,
          abi: vaultTokenAbi,
          functionName: 'tokenInfo',
          args: [token],
        } as const)),
        allowFailure: false,
      });

      return infos.map(info => {
        const [decimals, depositFee, withdrawalFee, maxDeposit, isSupported] = info;
        return { decimals, depositFee, withdrawalFee, maxDeposit, isSupported };
      });
    }

  /**
   * Retrieves the reserves of the vault.
   * @param vault - The address of the vault.
   * @param publicClient - PublicClient<HttpTransport>
   * @returns An object containing tokens and their balances.
   */
  public static async getVaultReserves(
    vault: Address,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<VaultReserves> {
    const [tokens, balances] = await publicClient.readContract({
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
   * @param publicClient - PublicClient<HttpTransport>
   * @returns A promise that resolves to an object containing tokens, their infos, and reserves.
   */
  async getAllTokenInfo(
    vault: Address,
    publicClient: PublicClient<HttpTransport>,
  ): Promise<{
    tokens: readonly Address[];
    infos: readonly TokenInfo[];
    reserves: readonly bigint[];
  }> {
    const [tokens, infos, reserves] = await publicClient.readContract({
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
   * @param walletProvider - IEvmWalletProvider
   * @returns Transaction hash
   */
  public static async deposit(
    vault: Address,
    token: Address,
    amount: bigint,
    walletProvider: IEvmWalletProvider,
  ): Promise<Hash> {
    const from = (await walletProvider.getWalletAddress()) as `0x${string}`;
    return walletProvider.sendTransaction({
      from,
      to: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: vaultTokenAbi,
        functionName: 'deposit',
        args: [token, amount],
      }),
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
    provider: IEvmWalletProvider,
  ): Promise<Hash> {
    const from = (await provider.getWalletAddress()) as `0x${string}`;
    return provider.sendTransaction({
      from,
      to: vault,
      value: 0n,
      data: encodeFunctionData({
        abi: vaultTokenAbi,
        functionName: 'withdraw',
        args: [token, amount],
      }),
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
