import type { Address, Hex } from 'viem';
import { CWSpokeProvider } from '../../entities/cosmos/CWSpokeProvider.js';
import { IconSpokeProvider } from '../../entities/icon/IconSpokeProvider.js';
import {
  type EvmHubProvider,
  EvmSpokeProvider,
  SolanaSpokeProvider,
  type SpokeProvider,
  StellarSpokeProvider,
  SuiSpokeProvider,
} from '../../entities/index.js';
import type { GetAddressType, GetSpokeDepositParamsType, PromiseTxReturnType, TxReturnType } from '../../types.js';
import { CWSpokeService } from './CWSpokeService.js';
import { EvmSpokeService } from './EvmSpokeService.js';
import { IconSpokeService } from './IconSpokeService.js';
import { SolanaSpokeService } from './SolanaSpokeService.js';
import { StellarSpokeService } from './StellarSpokeService.js';
import { SuiSpokeService } from './SuiSpokeService.js';
import {
  isCWSpokeProvider,
  isEvmSpokeProvider,
  isIconSpokeProvider,
  isSolanaSpokeProvider,
  isStellarSpokeProvider,
  isSuiSpokeProvider,
} from '../../guards.js';

/**
 * SpokeService is a main class that provides functionalities for dealing with spoke chains.
 * It uses command pattern to execute different spoke chain operations.
 */

// biome-ignore lint/complexity/noStaticOnlyClass:
export class SpokeService {
  /**
   * Deposit tokens to the spoke chain.
   * @param {GetSpokeDepositParamsType<T extends SpokeProvider>} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit<T extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: GetSpokeDepositParamsType<T>,
    spokeProvider: T,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<PromiseTxReturnType<T, R>> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.deposit(
        params as GetSpokeDepositParamsType<EvmSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof CWSpokeProvider) {
      return CWSpokeService.deposit(
        params as GetSpokeDepositParamsType<CWSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof IconSpokeProvider) {
      return IconSpokeService.deposit(
        params as GetSpokeDepositParamsType<IconSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.deposit(
        params as GetSpokeDepositParamsType<SuiSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof SolanaSpokeProvider) {
      return SolanaSpokeService.deposit(
        params as GetSpokeDepositParamsType<SolanaSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof StellarSpokeProvider) {
      return StellarSpokeService.deposit(
        params as GetSpokeDepositParamsType<StellarSpokeProvider>,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static getDeposit(token: Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof CWSpokeProvider) {
      return CWSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof StellarSpokeProvider) {
      return StellarSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof IconSpokeProvider) {
      return IconSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof SolanaSpokeProvider) {
      return SolanaSpokeService.getDeposit(token, spokeProvider);
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {Address} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet<T extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    from: GetAddressType<T>,
    payload: Hex,
    spokeProvider: T,
    hubProvider: EvmHubProvider,
    raw?: R,
  ): Promise<TxReturnType<T, R>> {
    if (isEvmSpokeProvider(spokeProvider)) {
      return (await EvmSpokeService.callWallet(
        from as GetAddressType<EvmSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
      )) satisfies TxReturnType<EvmSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isCWSpokeProvider(spokeProvider)) {
      return (await CWSpokeService.callWallet(
        from as GetAddressType<CWSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<CWSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isIconSpokeProvider(spokeProvider)) {
      return (await IconSpokeService.callWallet(
        from as GetAddressType<IconSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<IconSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isSuiSpokeProvider(spokeProvider)) {
      return (await SuiSpokeService.callWallet(
        from as GetAddressType<SuiSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<SuiSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isSolanaSpokeProvider(spokeProvider)) {
      return (await SolanaSpokeService.callWallet(
        from as GetAddressType<SolanaSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      )) satisfies TxReturnType<SolanaSpokeProvider, R> as TxReturnType<T, R>;
    }
    if (isStellarSpokeProvider(spokeProvider)) {
      return (await StellarSpokeService.callWallet(
        from as Hex,
        payload,
        spokeProvider,
        hubProvider,
      )) satisfies TxReturnType<StellarSpokeProvider, R> as TxReturnType<T, R>;
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Get max withdrawable balance for token.
   * @param {string| Address} token - The address of the token to get the balance of.
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The max limit allowed for token.
   */
  public static getLimit(token: string | Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.getLimit(token as string, spokeProvider);
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Get available withdrawable amount.
   * @param {string| Address} token - The address of the token to get the balance of.
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The available withdrawable amount for token.
   */
  public static getAvailable(token: string | Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.getAvailable(token as string, spokeProvider);
    }

    throw new Error('Invalid spoke provider');
  }
}
