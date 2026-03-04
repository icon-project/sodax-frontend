import { isLegacybnUSDChainId, isLegacybnUSDToken, isNewbnUSDChainId, isNewbnUSDToken } from '../shared/constants.js';
import invariant from 'tiny-invariant';
import {
  type EvmHubProvider,
  type IconSpokeProvider,
  IcxMigrationService,
  SpokeService,
  type IcxMigrateParams,
  type Result,
  type TxReturnType,
  relayTxAndWaitPacket,
  DEFAULT_RELAY_TX_TIMEOUT,
  type SonicSpokeProvider,
  SonicSpokeService,
  type IcxCreateRevertMigrationParams,
  type SpokeProvider,
  type SpokeProviderType,
  Erc20Service,
  encodeAddress,
  type RelayError,
  isIconAddress,
  BnUSDMigrationService,
  type GetSpokeDepositParamsType,
  BalnSwapService,
  type BalnMigrateParams,
  type UnifiedBnUSDMigrateParams,
  isIcxMigrateParams,
  isBalnMigrateParams,
  isUnifiedBnUSDMigrateParams,
  isIcxCreateRevertMigrationParams,
  type RelayExtraData,
  SolanaSpokeProvider,
  deriveUserWalletAddress,
  waitUntilIntentExecuted,
  type IconContractAddress,
  type EvmSpokeProviderType,
  type SonicSpokeProviderType,
  type StellarSpokeProviderType,
  type IconSpokeProviderType,
  type GetAddressType,
} from '../index.js';
import {
  isEvmSpokeProviderType,
  isSonicSpokeProviderType,
  isStellarSpokeProviderType,
  isIconSpokeProviderType,
} from '../shared/guards.js';
import {
  ICON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  type Address,
  getIntentRelayChainId,
  type Hex,
  type HttpUrl,
  type IconAddress,
} from '@sodax/types';
import { isAddress } from 'viem';
import { StellarSpokeService } from '../shared/services/spoke/StellarSpokeService.js';
import type { ConfigService } from '../shared/config/ConfigService.js';

export type GetMigrationFailedPayload<T extends MigrationErrorCode> = T extends 'CREATE_MIGRATION_INTENT_FAILED'
  ? IcxMigrateParams | UnifiedBnUSDMigrateParams | BalnMigrateParams
  : T extends 'CREATE_REVERT_MIGRATION_INTENT_FAILED'
    ? IcxCreateRevertMigrationParams
    : T extends 'REVERT_MIGRATION_FAILED'
      ? IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams
      : T extends 'MIGRATION_FAILED'
        ? IcxMigrateParams | UnifiedBnUSDMigrateParams | BalnMigrateParams
        : never;

export type MigrationFailedErrorData<T extends MigrationErrorCode> = {
  payload: GetMigrationFailedPayload<T>;
  error: unknown;
};

export type MigrationErrorCode =
  | 'MIGRATION_FAILED'
  | 'CREATE_MIGRATION_INTENT_FAILED'
  | 'CREATE_REVERT_MIGRATION_INTENT_FAILED'
  | 'REVERT_MIGRATION_FAILED';

export type MigrationErrorData<T extends MigrationErrorCode> = T extends 'CREATE_MIGRATION_INTENT_FAILED'
  ? MigrationFailedErrorData<T>
  : T extends 'CREATE_REVERT_MIGRATION_INTENT_FAILED'
    ? MigrationFailedErrorData<T>
    : T extends 'REVERT_MIGRATION_FAILED'
      ? MigrationFailedErrorData<T>
      : T extends 'MIGRATION_FAILED'
        ? MigrationFailedErrorData<T>
        : never;

export type MigrationError<T extends MigrationErrorCode> = {
  code: T;
  data: MigrationErrorData<T>;
};

export type MigrationAction = 'migrate' | 'revert';

export type MigrationParams = IcxMigrateParams | UnifiedBnUSDMigrateParams | BalnMigrateParams;
export type MigrationRevertParams = IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams;

export const SupportedMigrationTokens = ['ICX', 'bnUSD', 'BALN'] as const;
export type MigrationTokens = (typeof SupportedMigrationTokens)[number];

export type MigrationServiceConstructorParams = {
  hubProvider: EvmHubProvider;
  configService: ConfigService;
  relayerApiEndpoint: HttpUrl;
};

export class MigrationService {
  readonly icxMigration: IcxMigrationService;
  readonly bnUSDMigrationService: BnUSDMigrationService;
  readonly balnSwapService: BalnSwapService;
  readonly hubProvider: EvmHubProvider;
  readonly relayerApiEndpoint: HttpUrl;
  readonly configService: ConfigService;

  constructor({ relayerApiEndpoint, hubProvider, configService }: MigrationServiceConstructorParams) {
    this.hubProvider = hubProvider;
    this.icxMigration = new IcxMigrationService({ hubProvider, configService });
    this.bnUSDMigrationService = new BnUSDMigrationService({ hubProvider, configService });
    this.balnSwapService = new BalnSwapService({ hubProvider });
    this.relayerApiEndpoint = relayerApiEndpoint;
    this.configService = configService;
  }

  /**
   * Checks if the allowance is valid for the migration transaction.
   * @param params - The parameters for the migration transaction.
   * @param spokeProvider - The spoke provider.
   * @returns {Promise<Result<boolean>>} - Returns the result of the allowance check or error
   *
   * @example
   * const result = await migrationService.isAllowanceValid(
   *   {
   *     token: 'ICX', // Token to migrate
   *     icx: 'cx...', // Address of the ICX or wICX token to migrate
   *     amount: 1000n, // Amount to migrate (in ICX decimals, usually 18)
   *     to: '0x...', // Address to receive the migrated SODA tokens
   *   },
   *   'migrate',
   *   spokeProvider, // IconSpokeProvider instance
   * );
   *
   */
  public async isAllowanceValid<S extends SpokeProviderType>(
    params: MigrationParams | MigrationRevertParams,
    action: MigrationAction,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      if (action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(isAddress(params.to) || isIconAddress(params.to), 'To address is required');
        invariant(
          isIcxMigrateParams(params) || isBalnMigrateParams(params) || isUnifiedBnUSDMigrateParams(params),
          'Invalid params',
        );

        if (isIconSpokeProviderType(spokeProvider) && (isIcxMigrateParams(params) || isBalnMigrateParams(params))) {
          // icx and baln migration does not require allowance check since they originate from icon, thus just return true
          return {
            ok: true,
            value: true,
          };
        }

        // bnUSD only requires allowance check for EVM spoke chains
        if (isUnifiedBnUSDMigrateParams(params) && isEvmSpokeProviderType(spokeProvider)) {
          const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
          return await Erc20Service.isAllowanceValid(
            params.srcbnUSD as Address,
            params.amount,
            walletAddress as GetAddressType<EvmSpokeProviderType>,
            isSonicSpokeProviderType(spokeProvider)
              ? (spokeProvider.chainConfig.bnUSD as Address)
              : spokeProvider.chainConfig.addresses.assetManager,
            spokeProvider,
          );
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarSpokeProviderType(spokeProvider)) {
          return {
            ok: true,
            value: await StellarSpokeService.hasSufficientTrustline(params.srcbnUSD, params.amount, spokeProvider),
          };
        }

        return {
          ok: true,
          value: true,
        };
      }
      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'To address is required');
        invariant(isIcxCreateRevertMigrationParams(params) || isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmSpokeProviderType(spokeProvider)) {
          let spender: Address;
          const wallet = await spokeProvider.walletProvider.getWalletAddress();
          if (isSonicSpokeProviderType(spokeProvider)) {
            spender = await SonicSpokeService.getUserRouter(
              wallet as GetAddressType<SonicSpokeProviderType>,
              spokeProvider,
            );
          } else {
            spender = spokeProvider.chainConfig.addresses.assetManager as Address;
          }
          return await Erc20Service.isAllowanceValid(
            params.srcbnUSD as Address,
            params.amount,
            wallet as GetAddressType<EvmSpokeProviderType>,
            spender,
            spokeProvider,
          );
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarSpokeProviderType(spokeProvider)) {
          return {
            ok: true,
            value: await StellarSpokeService.hasSufficientTrustline(params.srcbnUSD, params.amount, spokeProvider),
          };
        }

        if (isSonicSpokeProviderType(spokeProvider) && isIcxCreateRevertMigrationParams(params)) {
          const wallet = await spokeProvider.walletProvider.getWalletAddress();
          const userRouter = await SonicSpokeService.getUserRouter(
            wallet as GetAddressType<SonicSpokeProviderType>,
            spokeProvider,
          );

          return await Erc20Service.isAllowanceValid(
            this.hubProvider.chainConfig.addresses.sodaToken,
            params.amount,
            wallet as GetAddressType<SonicSpokeProviderType>,
            userRouter,
            spokeProvider,
          );
        }
      }

      return {
        ok: false,
        error: new Error('Invalid action'),
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Approves the amount spending for the revert migration transaction.
   * @param params - The parameters for the revert migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await migrationService.approve(
   *   {
   *     amount: 1000n, // Amount of SODA tokens to revert
   *     to: 'hx...', // Icon Address to receive the reverted SODA tokens as ICX
   *   },
   *   'revert',
   *   spokeProvider, // SonicSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  public async approve<S extends SpokeProviderType, R extends boolean = false>(
    params: IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams,
    action: MigrationAction,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      if (action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'To address is required');
        invariant(isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmSpokeProviderType(spokeProvider)) {
          const result = await Erc20Service.approve(
            params.srcbnUSD as Address,
            params.amount,
            isSonicSpokeProviderType(spokeProvider)
              ? (spokeProvider.chainConfig.bnUSD as Address)
              : spokeProvider.chainConfig.addresses.assetManager,
            spokeProvider,
            raw,
          );

          return {
            ok: true,
            value: result satisfies TxReturnType<EvmSpokeProviderType, R> as TxReturnType<S, R>,
          };
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarSpokeProviderType(spokeProvider)) {
          const result = await StellarSpokeService.requestTrustline(params.srcbnUSD, params.amount, spokeProvider, raw);
          return {
            ok: true,
            value: result satisfies TxReturnType<StellarSpokeProviderType, R> as TxReturnType<S, R>,
          };
        }

        return {
          ok: false,
          error: new Error('Invalid params for migrate action'),
        };
      }
      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'To address is required');
        invariant(isIcxCreateRevertMigrationParams(params) || isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmSpokeProviderType(spokeProvider)) {
          let spender: Address;
          const wallet = await spokeProvider.walletProvider.getWalletAddress();
          if (isSonicSpokeProviderType(spokeProvider)) {
            spender = await SonicSpokeService.getUserRouter(
              wallet as GetAddressType<SonicSpokeProviderType>,
              spokeProvider,
            );
          } else {
            spender = spokeProvider.chainConfig.addresses.assetManager as Address;
          }
          const result = await Erc20Service.approve(
            params.srcbnUSD as Address,
            params.amount,
            spender,
            spokeProvider,
            raw,
          );

          return {
            ok: true,
            value: result satisfies TxReturnType<EvmSpokeProviderType, R> as TxReturnType<S, R>,
          };
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarSpokeProviderType(spokeProvider)) {
          const result = await StellarSpokeService.requestTrustline(params.srcbnUSD, params.amount, spokeProvider, raw);
          return {
            ok: true,
            value: result satisfies TxReturnType<StellarSpokeProviderType, R> as TxReturnType<S, R>,
          };
        }

        if (isSonicSpokeProviderType(spokeProvider) && isIcxCreateRevertMigrationParams(params)) {
          const wallet = await spokeProvider.walletProvider.getWalletAddress();
          const userRouter = await SonicSpokeService.getUserRouter(
            wallet as GetAddressType<SonicSpokeProviderType>,
            spokeProvider,
          );

          const result = await Erc20Service.approve(
            this.hubProvider.chainConfig.addresses.sodaToken,
            params.amount,
            userRouter,
            spokeProvider,
            raw,
          );

          return {
            ok: true,
            value: result satisfies TxReturnType<SonicSpokeProviderType, R> as TxReturnType<S, R>,
          };
        }

        return {
          ok: false,
          error: new Error('Invalid params or chain type for revert action'),
        };
      }

      return {
        ok: false,
        error: new Error('Invalid action'),
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Migrates bnUSD tokens between legacy and new formats across supported spoke chains via the hub chain (sonic).
   * Handles both legacy-to-new and new-to-legacy bnUSD migrations, enforcing validation and relaying the transaction.
   *
   * @param params - Migration parameters, including source/destination chain IDs, token addresses, amount, and recipient.
   * @param spokeProvider - The SpokeProvider instance for the source chain.
   * @param timeout - Optional timeout in milliseconds for the relay operation (default: 60 seconds).
   * @param unchecked - Optional flag to skip validation checks (default: false).
   * @returns {Promise<Result<[string, Hex], MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError>>}
   *   Result containing a tuple: [spokeTxHash, hubTxHash] if successful, or an error describing the failure.
   *
   * @example
   * // Migrate legacy bnUSD to new bnUSD
   * const result = await sodax.migration.migratebnUSD({
   *   srcChainId: '0x1.icon', // Source chain ID (legacy)
   *   dstChainId: 'sonic',    // Destination chain ID (new)
   *   srcbnUSD: 'cx...',      // Legacy bnUSD token address
   *   dstbnUSD: '0x...',      // New bnUSD token address
   *   amount: 1000n,          // Amount to migrate
   *   to: '0x...',            // Recipient address on destination chain
   * }, iconSpokeProvider);
   *
   * // Reverse migration: new bnUSD to legacy bnUSD
   * const result = await sodax.migration.migratebnUSD({
   *   srcChainId: 'sonic',    // Source chain ID (new)
   *   dstChainId: '0x1.icon', // Destination chain ID (legacy)
   *   srcbnUSD: '0x...',      // New bnUSD token address
   *   dstbnUSD: 'cx...',      // Legacy bnUSD token address
   *   amount: 1000n,          // Amount to migrate
   *   to: 'hx...',            // Recipient address on destination chain
   * }, sonicSpokeProvider);
   *
   * if (result.ok) {
   *   // result.value is a tuple: [spokeTxHash, hubTxHash]
   *   const [spokeTxHash, hubTxHash] = result.value;
   *   console.log('[migrateBnUSD] hubTxHash', hubTxHash);
   *   console.log('[migrateBnUSD] spokeTxHash', spokeTxHash);
   * } else {
   *   // Handle migration error
   *   console.error('[migrateBnUSD] error', result.error);
   * }
   */
  async migratebnUSD(
    params: UnifiedBnUSDMigrateParams,
    spokeProvider: SpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
    unchecked = false,
  ): Promise<
    Result<
      [string, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const intentResult = await this.createMigratebnUSDIntent(params, spokeProvider, unchecked, false);

      if (!intentResult.ok) {
        return {
          ok: false,
          error: intentResult.error,
        };
      }

      const [spokeTxHash, extraData] = intentResult.value;

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(spokeTxHash, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATE_MIGRATION_INTENT_FAILED',
            data: {
              payload: params,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        spokeTxHash,
        spokeProvider instanceof SolanaSpokeProvider ? extraData : undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return packetResult;
      }

      if (!(params.srcChainId === SONIC_MAINNET_CHAIN_ID || params.dstChainId === SONIC_MAINNET_CHAIN_ID)) {
        await waitUntilIntentExecuted({
          intentRelayChainId: getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID).toString(),
          spokeTxHash: packetResult.value.dst_tx_hash,
          timeout: timeout,
          apiUrl: this.relayerApiEndpoint,
        });
      }

      return { ok: true, value: [spokeTxHash, packetResult.value.dst_tx_hash as Hex] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'MIGRATION_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Migrates ICX tokens to SODA tokens on the hub chain (sonic).
   * This function handles the migration of ICX tokens to SODA tokens.
   *
   * @param params - The parameters for the migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[Hex, Hex], MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError>>}
   * Returns a Result containing a tuple of [spokeTxHash, hubTxHash] if successful,
   * or an error describing why the migration or relay failed.
   *
   * @example
   * const result = await migrationService.migrateIcxToSoda(
   *   {
   *     address: 'cx...', // Address of the ICX or wICX token to migrate
   *     amount: 1000n, // Amount to migrate (in ICX decimals, usually 18)
   *     to: '0x...', // Address to receive the migrated SODA tokens (i.e. the hub chain address)
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   *   30000 // Optional timeout in milliseconds (default: 60000, i.e. 60 seconds)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [
   *  spokeTxHash, // transaction hash on the spoke chain
   *  hubTxHash,   // transaction hash on the hub chain (i.e. the transaction that was relayed to the hub)
   * ] = result.value;
   * console.log('Migration transaction hashes:', { spokeTxHash, hubTxHash });
   */
  async migrateIcxToSoda(
    params: IcxMigrateParams,
    spokeProvider: IconSpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createMigrateIcxToSodaIntent(params, spokeProvider, false);

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return packetResult;
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash as Hex] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'MIGRATION_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates a revert migration (SODA to ICX) intent and submits (relays) it to the spoke chain.
   * @param params - The parameters for the revert migration transaction.
   * @param spokeProvider - The SonicSpokeProvider instance.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   *
   * @returns {Promise<Result<[Hex, Hex], MigrationError<'REVERT_MIGRATION_FAILED'> | MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> | RelayError>>}
   * Returns a Result containing a tuple of [hubTxHash, spokeTxHash] if successful,
   * or an error describing why the revert migration or relay failed.
   *
   *
   * @example
   * const result = await migrationService.revertMigrateSodaToIcx(
   *   {
   *     amount: 1000n, // Amount of SODA tokens to revert
   *     to: 'hx...', // Icon Address to receive the reverted SODA tokens as ICX
   *   },
   *   spokeProvider, // SonicSpokeProvider instance
   *   30000 // Optional timeout in milliseconds (default: 60000, i.e. 60 seconds)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [
   *  hubTxHash,   // transaction hash on the hub chain
   *  spokeTxHash, // transaction hash on the spoke chain (i.e. the transaction that was relayed to the spoke)
   * ] = result.value;
   * console.log('Revert migration transaction hashes:', { hubTxHash, spokeTxHash });
   */
  async revertMigrateSodaToIcx(
    params: Omit<IcxCreateRevertMigrationParams, 'wICX'>,
    spokeProvider: SonicSpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'REVERT_MIGRATION_FAILED'> | MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createRevertSodaToIcxMigrationIntent(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return packetResult;
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash as Hex] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'REVERT_MIGRATION_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Migrates BALN tokens to SODA tokens on the hub chain (sonic).
   * This function handles the migration of BALN tokens to SODA tokens.
   *
   * @param params - The parameters for the migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[Hex, Hex], MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError>>}
   * Returns a Result containing a tuple of [spokeTxHash, hubTxHash] if successful,
   * or an error describing why the migration or relay failed.
   *
   * @example
   * const result = await migrationService.migrateBaln(
   *   {
   *     amount: 1000n,        // The amount of BALN tokens to swap
   *     lockupPeriod: SIX_MONTHS,      // The lockup period for the swap (see LockupPeriod type)
   *     to: '0x...',          // The hub (sonic) chain address that will receive the swapped BALN tokens
   *     stake: true,         // Whether to stake the BALN tokens
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   *   30000 // Optional timeout in milliseconds (default: 60000, i.e. 60 seconds)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [
   *  spokeTxHash, // transaction hash on the spoke chain
   *  hubTxHash,   // transaction hash on the hub chain (i.e. the transaction that was relayed to the hub)
   * ] = result.value;
   * console.log('Migration transaction hashes:', { spokeTxHash, hubTxHash });
   */
  async migrateBaln(
    params: BalnMigrateParams,
    spokeProvider: IconSpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createMigrateBalnIntent(params, spokeProvider, false);

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        spokeProvider,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return packetResult;
      }

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash as Hex] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'MIGRATION_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates a BALN migration intent on spoke chain (icon).
   *
   * @param params - The parameters for the BALN migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<IconSpokeProvider, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> } - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await migrationService.createMigrateBalnIntent(
   *   {
   *     amount: 1000n,        // The amount of BALN tokens to swap
   *     lockupPeriod: SIX_MONTHS,      // The lockup period for the swap (see LockupPeriod type)
   *     to: '0x...',          // The hub (sonic) chain address that will receive the swapped BALN tokens
   *     stake: true,         // Whether to stake the BALN tokens
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  async createMigrateBalnIntent<S extends IconSpokeProviderType = IconSpokeProvider, R extends boolean = false>(
    params: BalnMigrateParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      const balnToken = this.configService.spokeChainConfig[ICON_MAINNET_CHAIN_ID]?.supportedTokens.BALN?.address;
      invariant(balnToken, 'BALN token not found');

      const migrationData = this.balnSwapService.swapData(balnToken as IconContractAddress, params, this.configService);

      const txResult = await SpokeService.deposit(
        {
          from: await spokeProvider.walletProvider.getWalletAddress(),
          token: balnToken,
          amount: params.amount,
          data: migrationData,
        } as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_MIGRATION_INTENT_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates a bnUSD migration or reverse migration (legacy bnUSD to new bnUSD or vice versa) intent on a spoke chain.
   *
   * This function prepares the transaction data for migrating legacy bnUSD to new bnUSD,
   * or for reverting (migrating new bnUSD back to legacy bnUSD), depending on the provided parameters.
   * It performs validation on chain IDs and token addresses unless `unchecked` is set to true.
   *
   * @param params - The parameters for the bnUSD migration or reverse migration transaction.
   * @param spokeProvider - The spoke provider instance for the source chain.
   * @param unchecked - If true, skips input validation (use with caution).
   * @param raw - If true, returns the raw transaction hash instead of the transaction receipt.
   * @returns {Promise<Result<TxReturnType<S, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>>}
   *   Returns a Result containing the transaction payload or hash, or an error if creation failed.
   *
   * @example
   * // Migrate legacy bnUSD to new bnUSD
   * const result = await migrationService.createMigratebnUSDIntent(
   *   {
   *     srcChainId: '0x1.icon', // Source chain ID (legacy bnUSD chain)
   *     dstChainId: 'sonic',    // Destination chain ID (new bnUSD chain)
   *     srcbnUSD: 'cx...',      // Legacy bnUSD token address
   *     dstbnUSD: '0x...',      // New bnUSD token address
   *     amount: 1000n,          // Amount to migrate
   *     to: '0x...',            // Recipient address on destination chain
   *   } satisfies UnifiedBnUSDMigrateParams,
   *   spokeProvider, // SpokeProvider instance
   *   false,         // Optional unchecked flag (validation is skipped)
   *   true           // Optional raw flag
   * );
   *
   * // Reverse migration: new bnUSD to legacy bnUSD
   * const result = await migrationService.createMigratebnUSDIntent(
   *   {
   *     srcChainId: 'sonic',    // Source chain ID (new bnUSD chain)
   *     dstChainId: '0x1.icon', // Destination chain ID (legacy bnUSD chain)
   *     srcbnUSD: '0x...',      // New bnUSD token address
   *     dstbnUSD: 'cx...',      // Legacy bnUSD token address
   *     amount: 1000n,          // Amount to migrate
   *     to: 'hx...',            // Recipient address on destination chain
   *   } satisfies UnifiedBnUSDMigrateParams,
   *   spokeProvider
   * );
   */
  async createMigratebnUSDIntent<S extends SpokeProviderType = SpokeProviderType, R extends boolean = false>(
    params: UnifiedBnUSDMigrateParams,
    spokeProvider: S,
    unchecked = false,
    raw?: R,
  ): Promise<Result<[TxReturnType<S, R>, RelayExtraData], MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      if (!unchecked) {
        invariant(this.configService.isValidSpokeChainId(params.srcChainId), 'Invalid spoke source chain ID');
        invariant(this.configService.isValidSpokeChainId(params.dstChainId), 'Invalid spoke destination chain ID');
        invariant(params.srcbnUSD.length > 0, 'Legacy bnUSD token address is required');
        invariant(params.dstbnUSD.length > 0, 'New bnUSD token address is required');
        invariant(params.amount > 0, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'Recipient address is required');
        invariant(
          !(isLegacybnUSDToken(params.srcbnUSD) && isLegacybnUSDToken(params.dstbnUSD)),
          'srcbnUSD and dstbnUSD cannot both be legacy bnUSD tokens',
        );
      }

      let migrationData: Hex;
      if (isLegacybnUSDToken(params.srcbnUSD)) {
        // migration from legacy bnUSD to new bnUSD
        if (!unchecked) {
          invariant(
            isLegacybnUSDChainId(params.srcChainId),
            'srcChainId must be a legacy bnUSD chain (icon, sui, stellar) if srcbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDChainId(params.dstChainId),
            'dstChainId must be a new bnUSD chain (all spoke chains besides Icon) if dstbnUSD is a legacy bnUSD token',
          );
        }

        migrationData = this.bnUSDMigrationService.migrateData({
          srcChainId: params.srcChainId,
          legacybnUSD: params.srcbnUSD,
          newbnUSD: params.dstbnUSD,
          dstChainId: params.dstChainId,
          amount: params.amount,
          to: encodeAddress(params.dstChainId, params.to),
        });
      } else if (isLegacybnUSDToken(params.dstbnUSD)) {
        // reverse migration from new bnUSD to legacy bnUSD
        if (!unchecked) {
          invariant(
            isLegacybnUSDChainId(params.dstChainId),
            'dstChainId must be a legacy bnUSD chain (sui, stellar, icon) if dstbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDToken(params.srcbnUSD),
            'srcbnUSD must be a new bnUSD token if dstbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDChainId(params.srcChainId),
            'srcChainId must be a new bnUSD chain (all spoke chains besides Icon) if srcbnUSD is a new bnUSD token',
          );
        }

        migrationData = this.bnUSDMigrationService.revertMigrationData({
          srcChainId: params.srcChainId,
          legacybnUSD: params.dstbnUSD,
          newbnUSD: params.srcbnUSD,
          dstChainId: params.dstChainId,
          amount: params.amount,
          to: encodeAddress(params.dstChainId, params.to),
        });
      } else {
        throw new Error('srcbnUSD or dstbnUSD must be a legacy bnUSD token');
      }

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const creatorHubWalletAddress = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        walletAddress,
      );

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          token: params.srcbnUSD,
          amount: params.amount,
          data: migrationData,
        } as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: [
          txResult as TxReturnType<S, R>,
          {
            address: creatorHubWalletAddress,
            payload: migrationData,
          } satisfies RelayExtraData,
        ],
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_MIGRATION_INTENT_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates a migration of ICX to SODA intent on spoke chain (icon).
   * This function handles the migration of ICX or wICX tokens to SODA tokens on the hub chain.
   * Note: This function does not relay the transaction to the spoke chain.
   * You should call the `isAllowanceValid` function before calling this function to check if the allowance is valid.
   * You should call the `relayTxAndWaitPacket` function after calling this function to relay the transaction to the spoke chain.
   *
   * @param {MigrationParams} params - The parameters for the migration transaction.
   * @param {IconSpokeProvider} spokeProvider - The spoke provider.
   * @param {boolean} raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<IconSpokeProvider, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await migrationService.createMigrateIcxToSodaIntent(
   *   {
   *     icx: 'cx...', // Address of the ICX or wICX token to migrate
   *     amount: 1000n, // Amount to migrate (in ICX decimals, usually 18)
   *     to: '0x...', // Address to receive the migrated SODA tokens
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   */
  async createMigrateIcxToSodaIntent<
    S extends IconSpokeProviderType = IconSpokeProviderType,
    R extends boolean = false,
  >(
    params: IcxMigrateParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      invariant(params.amount > 0, 'Amount must be greater than 0');
      invariant(isAddress(params.to), 'Recipient address is required');
      invariant(
        params.address.toLowerCase() === spokeProvider.chainConfig.addresses.wICX.toLowerCase() ||
          params.address.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase(),
        'Token must be wICX or native ICX token',
      );
      invariant(isIconSpokeProviderType(spokeProvider), 'Spoke provider must be an IconSpokeProviderType');

      // Get the available amount for migration
      const availableAmount = await this.icxMigration.getAvailableAmount();

      // Check if there's enough liquidity for migration
      if (availableAmount < params.amount) {
        throw new Error(
          `Insufficient liquidity. Available: ${availableAmount.toString()}, Requested: ${params.amount.toString()}`,
        );
      }

      // Generate migration transaction data
      const migrationData = this.icxMigration.migrateData(params);

      // Get wallet address for the transaction
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // Execute the migration transaction
      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          token: params.address,
          amount: params.amount,
          data: migrationData,
        } as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_MIGRATION_INTENT_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }

  /**
   * Creates a revert migration intent transaction on the hub chain.
   * Note: This function does not relay the transaction to the spoke chain.
   * You should call the `isAllowanceValid` function before calling this function to check if the allowance is valid.
   * You should call the `relayTxAndWaitPacket` function after calling this function to relay the transaction to the spoke chain.
   * @param {IcxCreateRevertMigrationParams} - The parameters for the revert migration transaction.
   * @param {SonicSpokeProvider} spokeProvider - The spoke provider.
   * @param {boolean} raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<SonicSpokeProvider, R>, MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'>>>} - Returns the transaction hash or error
   *
   * @example
   * const result = await migrationService.createRevertSodaToIcxMigrationIntent(
   *   {
   *     amount: 1000n, // Amount of SODA tokens to revert
   *     to: 'hx...', // Icon Address to receive the reverted SODA tokens as ICX
   *     action: 'revert',
   *   },
   */
  async createRevertSodaToIcxMigrationIntent<
    S extends SonicSpokeProviderType = SonicSpokeProviderType,
    R extends boolean = false,
  >(
    params: Omit<IcxCreateRevertMigrationParams, 'wICX'>,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'>>> {
    try {
      const wallet = await spokeProvider.walletProvider.getWalletAddress();
      const userRouter = await SonicSpokeService.getUserRouter(
        wallet as GetAddressType<SonicSpokeProviderType>,
        spokeProvider,
      );
      const wICX = this.configService.spokeChainConfig[ICON_MAINNET_CHAIN_ID]?.addresses.wICX;
      invariant(wICX, 'wICX token not found');
      const data = this.icxMigration.revertMigration({
        wICX: wICX as IconAddress,
        amount: params.amount,
        to: encodeAddress(ICON_MAINNET_CHAIN_ID, params.to),
        userWallet: userRouter,
      });

      const txResult = await SonicSpokeService.deposit(
        {
          from: wallet as GetAddressType<SonicSpokeProviderType>,
          token: this.hubProvider.chainConfig.addresses.sodaToken,
          amount: params.amount,
          data,
        },
        spokeProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_REVERT_MIGRATION_INTENT_FAILED',
          data: {
            payload: params,
            error: error,
          },
        },
      };
    }
  }
}
