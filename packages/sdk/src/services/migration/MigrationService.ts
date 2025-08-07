import invariant from 'tiny-invariant';
import {
  type EvmHubProvider,
  IconSpokeProvider,
  IcxMigrationService,
  SpokeService,
  type Hex,
  type IcxMigrateParams,
  type Result,
  type TxReturnType,
  type MigrationServiceConfig,
  DEFAULT_RELAYER_API_ENDPOINT,
  relayTxAndWaitPacket,
  DEFAULT_RELAY_TX_TIMEOUT,
  SonicSpokeProvider,
  SonicSpokeService,
  spokeChainConfig,
  type IcxCreateRevertMigrationParams,
  type SpokeProvider,
  Erc20Service,
  encodeAddress,
  type RelayError,
  isIconAddress,
  type BnUSDMigrateParams,
  BnUSDMigrationService,
  migrationConfig,
  type GetSpokeDepositParamsType,
  type bnUSDLegacyMigrationProviders,
  type BnUSDRevertMigrationParams,
  SuiSpokeProvider,
  StellarSpokeProvider,
  BalnSwapService,
  type BalnMigrateParams,
} from '../../index.js';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { isAddress } from 'viem';

export type GetMigrationFailedPayload<T extends MigrationErrorCode> = T extends 'CREATE_MIGRATION_INTENT_FAILED'
  ? IcxMigrateParams | BnUSDMigrateParams | BalnMigrateParams
  : T extends 'CREATE_REVERT_MIGRATION_INTENT_FAILED'
    ? IcxCreateRevertMigrationParams | BnUSDRevertMigrationParams
    : T extends 'REVERT_MIGRATION_FAILED'
      ? IcxCreateRevertMigrationParams | BnUSDRevertMigrationParams
      : T extends 'MIGRATION_FAILED'
        ? IcxMigrateParams | BnUSDMigrateParams | BalnMigrateParams
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

export type MigrationParams = IcxMigrateParams | BnUSDMigrateParams | BalnMigrateParams;
export type MigrationRevertParams = IcxCreateRevertMigrationParams | BnUSDRevertMigrationParams;

export const SupportedMigrationTokens = ['ICX', 'bnUSD', 'BALN'] as const;
export type MigrationTokens = (typeof SupportedMigrationTokens)[number];

export class MigrationService {
  private readonly icxMigration: IcxMigrationService;
  private readonly bnUSDMigrationService: BnUSDMigrationService;
  private readonly balnSwapService: BalnSwapService;
  private readonly hubProvider: EvmHubProvider;
  private readonly config: MigrationServiceConfig;

  constructor(hubProvider: EvmHubProvider, config?: MigrationServiceConfig) {
    this.hubProvider = hubProvider;
    this.icxMigration = new IcxMigrationService(hubProvider);
    this.bnUSDMigrationService = new BnUSDMigrationService(hubProvider);
    this.balnSwapService = new BalnSwapService(hubProvider);
    this.config = config ?? {
      relayerApiEndpoint: DEFAULT_RELAYER_API_ENDPOINT,
    };
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
  public async isAllowanceValid<S extends SpokeProvider>(
    params: MigrationParams | MigrationRevertParams,
    action: MigrationAction,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      if (action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(isAddress(params.to) || isIconAddress(params.to), 'To address is required');
        invariant(
          spokeProvider instanceof IconSpokeProvider ||
            spokeProvider instanceof SuiSpokeProvider ||
            spokeProvider instanceof StellarSpokeProvider,
          'Spoke provider must be an instance of IconSpokeProvider, SuiSpokeProvider, or StellarSpokeProvider',
        );

        // migrate action chains does not require allowance check, thus just return true
        return {
          ok: true,
          value: true,
        };
      }

      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'To address is required');
        invariant(
          spokeProvider instanceof SonicSpokeProvider,
          'Spoke provider must be an instance of SonicSpokeProvider',
        );

        const wallet = await spokeProvider.walletProvider.getWalletAddress();
        const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);

        return await Erc20Service.isAllowanceValid(
          this.hubProvider.chainConfig.addresses.sodaToken,
          params.amount,
          wallet,
          userRouter,
          spokeProvider,
        );
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
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    params: IcxCreateRevertMigrationParams | BnUSDRevertMigrationParams,
    action: MigrationAction,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'To address is required');
        invariant(
          spokeProvider instanceof SonicSpokeProvider,
          'Spoke provider must be an instance of SonicSpokeProvider',
        );

        const wallet = await spokeProvider.walletProvider.getWalletAddress();
        const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);

        const result = await Erc20Service.approve(
          this.hubProvider.chainConfig.addresses.sodaToken,
          params.amount,
          userRouter,
          spokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result satisfies TxReturnType<SonicSpokeProvider, R> as TxReturnType<S, R>,
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
   * Migrates legacy bnUSD tokens to new bnUSD tokens on the hub chain (sonic).
   * This function handles the migration of legacy bnUSD tokens to new bnUSD tokens.
   *
   * @param params - The parameters for the migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[string, Hex], MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError>>}
   * Returns a Result containing a tuple of [spokeTxHash, hubTxHash] if successful,
   * or an error describing why the migration or relay failed.
   *
   *
   * @example
   * // Example: Migrate legacy bnUSD tokens to new bnUSD tokens on the hub chain (sonic)
   * const result = await sodax.migration.migratebnUSD({
   *   address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // mock legacy bnUSD address
   *   srcChainID: '0x1.icon', // source chain ID (e.g., ICON_MAINNET_CHAIN_ID)
   *   amount: 1000000000000000000n,
   *   to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // recipient address
   *   dstChainID: 'sonic', // destination hub chain ID (e.g., SONIC_MAINNET_CHAIN_ID)
   * }, iconSpokeProvider);
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
    params: BnUSDMigrateParams,
    spokeProvider: bnUSDLegacyMigrationProviders,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [string, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createMigratebnUSDIntent(params, spokeProvider);

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
        this.config.relayerApiEndpoint,
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
   * Reverses the migration of legacy bnUSD tokens to new bnUSD tokens on the hub chain (sonic).
   * This function handles the reversal of the migration of legacy bnUSD tokens to new bnUSD tokens.
   *
   * @param params - The parameters for the migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[string, Hex], MigrationError<'REVERT_MIGRATION_FAILED'> | MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> | RelayError>>}
   * Returns a Result containing a tuple of [spokeTxHash, hubTxHash] if successful,
   * or an error describing why the revert migration or relay failed.
   *
   *
   * @example
   * // Example: Reverse the migration of legacy bnUSD tokens to new bnUSD tokens on the hub chain (sonic)
   * const result = await sodax.migration.reverseMigratebnUSD({
   *   srcChainID: 'sonic', // source chain ID (e.g., SONIC_MAINNET_CHAIN_ID)
   *   amount: 1000000000000000000n,
   *   to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // The spoke chain address that will receive the migrated legacy bnUSD tokens
   *   dstChainID: '0x1.icon', // destination chain ID of type bnUSDLegacySpokeChainId (e.g., ICON_MAINNET_CHAIN_ID)
   * }, iconSpokeProvider);
   *
   * if (result.ok) {
   *   // result.value is a tuple: [spokeTxHash, hubTxHash]
   *   const [spokeTxHash, hubTxHash] = result.value;
   *   console.log('[reverseMigrateBnUSD] hubTxHash', hubTxHash);
   *   console.log('[reverseMigrateBnUSD] spokeTxHash', spokeTxHash);
   * } else {
   *   // Handle revert migration error
   *   console.error('[reverseMigrateBnUSD] error', result.error);
   * }
   */
  async reverseMigratebnUSD(
    params: BnUSDRevertMigrationParams,
    spokeProvider: SonicSpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [string, Hex],
      MigrationError<'REVERT_MIGRATION_FAILED'> | MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createRevertMigratebnUSDIntent(params, spokeProvider);

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
        this.config.relayerApiEndpoint,
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
      const txResult = await this.createMigrateIcxToSodaIntent(params, spokeProvider);

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
        this.config.relayerApiEndpoint,
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
      const txResult = await this.createRevertSodaToIcxMigrationIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        spokeProvider,
        this.config.relayerApiEndpoint,
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
      const txResult = await this.createMigrateBalnIntent(params, spokeProvider);

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
        this.config.relayerApiEndpoint,
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
   * Creates a revert migration intent and submits (relays) it to the spoke chain.
   * @param params - The parameters for the revert migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<bnUSDLegacyMigrationProviders, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await migrationService.createRevertMigratebnUSDIntent(
   *   {
   *     srcChainID: 'sonic', // The source chain ID where the new bnUSD token exists (hub chain)
   *     amount: 1000n,     // The amount of new bnUSD tokens to migrate back
   *     to: '0x...',       // The spoke chain address that will receive the migrated legacy bnUSD tokens
   *     dstChainID: '0x1.icon',  // The destination chain ID for the migration (spoke chain)
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  async createRevertMigratebnUSDIntent<R extends boolean = false>(
    params: BnUSDRevertMigrationParams,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): Promise<Result<TxReturnType<SonicSpokeProvider, R>, MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'>>> {
    try {
      const { legacybnUSD, newbnUSD } = migrationConfig.bnUSD[params.dstChainID];

      const migrationData = this.bnUSDMigrationService.revertMigrationData({
        ...params,
        legacybnUSD: legacybnUSD.address,
        newbnUSD,
      });

      const txResult = await SpokeService.deposit(
        {
          from: await spokeProvider.walletProvider.getWalletAddressBytes(),
          token: newbnUSD,
          amount: params.amount,
          data: migrationData,
        } as GetSpokeDepositParamsType<SonicSpokeProvider>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<SonicSpokeProvider, R>,
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
  async createMigrateBalnIntent<R extends boolean = false>(
    params: BalnMigrateParams,
    spokeProvider: IconSpokeProvider,
    raw?: R,
  ): Promise<Result<TxReturnType<IconSpokeProvider, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      const balnToken = spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.BALN.address;

      const migrationData = await this.balnSwapService.swapData(balnToken, params);

      const txResult = await SpokeService.deposit(
        {
          from: await spokeProvider.walletProvider.getWalletAddress(),
          token: balnToken,
          amount: params.amount,
          data: migrationData,
        } as GetSpokeDepositParamsType<IconSpokeProvider>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<IconSpokeProvider, R>,
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
   * Creates a bnUSD migration intent on spoke chain (icon).
   *
   * @param params - The parameters for the bnUSD migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<bnUSDLegacyMigrationProviders, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await migrationService.createMigratebnUSDIntent(
   *   {
   *     srcChainID: 'sonic', // The source chain ID where the legacy bnUSD token exists (spoke chain)
   *     amount: 1000n,     // The amount of legacy bnUSD tokens to migrate
   *     to: '0x...',       // The hub (sonic) chain address that will receive the migrated new bnUSD tokens
   *     dstChainID: '0x1.icon',  // The destination chain ID for the migration (hub chain)
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  async createMigratebnUSDIntent<R extends boolean = false>(
    params: BnUSDMigrateParams,
    spokeProvider: bnUSDLegacyMigrationProviders,
    raw?: R,
  ): Promise<Result<TxReturnType<bnUSDLegacyMigrationProviders, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      const { legacybnUSD, newbnUSD } = migrationConfig.bnUSD[params.srcChainID];

      const migrationData = this.bnUSDMigrationService.migrateData({
        ...params,
        to: encodeAddress(this.hubProvider.chainConfig.chain.id, params.to),
        legacybnUSD: legacybnUSD.address,
        newbnUSD,
      });

      const txResult = await SpokeService.deposit(
        {
          from: await spokeProvider.walletProvider.getWalletAddress(),
          token: legacybnUSD.address,
          amount: params.amount,
          data: migrationData,
        } as GetSpokeDepositParamsType<bnUSDLegacyMigrationProviders>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<bnUSDLegacyMigrationProviders, R>,
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
  async createMigrateIcxToSodaIntent<R extends boolean = false>(
    params: IcxMigrateParams,
    spokeProvider: IconSpokeProvider,
    raw?: boolean,
  ): Promise<Result<TxReturnType<IconSpokeProvider, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      invariant(params.amount > 0, 'Amount must be greater than 0');
      invariant(isAddress(params.to), 'Recipient address is required');
      invariant(
        params.address.toLowerCase() === spokeProvider.chainConfig.addresses.wICX.toLowerCase() ||
          params.address.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase(),
        'Token must be wICX or native ICX token',
      );
      invariant(spokeProvider instanceof IconSpokeProvider, 'Spoke provider must be an instance of IconSpokeProvider');

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
        },
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<IconSpokeProvider, R>,
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
  async createRevertSodaToIcxMigrationIntent<R extends boolean = false>(
    params: Omit<IcxCreateRevertMigrationParams, 'wICX'>,
    spokeProvider: SonicSpokeProvider,
    raw?: R,
  ): Promise<Result<TxReturnType<SonicSpokeProvider, R>, MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'>>> {
    try {
      const wallet = await spokeProvider.walletProvider.getWalletAddress();
      const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);

      const data = this.icxMigration.revertMigration({
        wICX: spokeChainConfig[ICON_MAINNET_CHAIN_ID].addresses.wICX,
        amount: params.amount,
        to: encodeAddress(ICON_MAINNET_CHAIN_ID, params.to),
        userWallet: userRouter,
      });

      const txResult = await SonicSpokeService.deposit(
        {
          from: wallet,
          token: this.hubProvider.chainConfig.addresses.sodaToken,
          amount: params.amount,
          data,
        },
        spokeProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<SonicSpokeProvider, R>,
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
