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
import type { GetAddressType, GetSpokeDepositParamsType, IconAddress, PromiseTxReturnType } from '../../types.js';
import { CWSpokeService } from './CWSpokeService.js';
import { EvmSpokeService } from './EvmSpokeService.js';
import { IconSpokeService } from './IconSpokeService.js';
import { SolanaSpokeService } from './SolanaSpokeService.js';
import {StellarSpokeService } from './StellarSpokeService.js';
import { SuiSpokeService } from './SuiSpokeService.js';

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
  ): Promise<PromiseTxReturnType<T, R>> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.callWallet(
        from as GetAddressType<EvmSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof CWSpokeProvider) {
      return CWSpokeService.callWallet(
        from as GetAddressType<CWSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }
    if (spokeProvider instanceof IconSpokeProvider) {
      return IconSpokeService.callWallet(
        from as IconAddress,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof SuiSpokeProvider) {
      return SuiSpokeService.callWallet(
        from as GetAddressType<SuiSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof SolanaSpokeProvider) {
      return SolanaSpokeService.callWallet(
        from as GetAddressType<SolanaSpokeProvider>,
        payload,
        spokeProvider,
        hubProvider,
        raw,
      ) as PromiseTxReturnType<T, R>;
    }

    if (spokeProvider instanceof StellarSpokeProvider) {
      return StellarSpokeService.callWallet(from as Hex, payload, spokeProvider, hubProvider) as PromiseTxReturnType<
        T,
        R
      >;
    }

    throw new Error('Invalid spoke provider');
  }
}
