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
  type Prettify,
  type RelayError,
} from '../../index.js';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/types';
import { isAddress } from 'viem';

export type GetMigrationFailedPayload<T extends MigrationErrorCode> = T extends 'CREATE_MIGRATION_INTENT_FAILED'
  ? IcxMigrateParams
  : T extends 'CREATE_REVERT_MIGRATION_INTENT_FAILED'
    ? IcxCreateRevertMigrationParams
    : T extends 'REVERT_MIGRATION_FAILED'
      ? IcxCreateRevertMigrationParams
      : T extends 'MIGRATION_FAILED'
        ? IcxMigrateParams
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

export type MigrationParams = Prettify<
  {
    token: 'ICX';
  } & IcxMigrateParams
>;

export type MigrationTokens = 'ICX';

export type GetMigrateParams<T extends MigrationTokens> = T extends 'ICX' ? IcxMigrateParams : never;

export type GetRevertMigrationParams<T extends MigrationTokens> = T extends 'ICX'
  ? IcxCreateRevertMigrationParams
  : never;

export class MigrationService {
  private readonly icxMigration: IcxMigrationService;
  private readonly hubProvider: EvmHubProvider;
  private readonly config: MigrationServiceConfig;

  constructor(hubProvider: EvmHubProvider, config?: MigrationServiceConfig) {
    this.hubProvider = hubProvider;
    this.icxMigration = new IcxMigrationService(hubProvider);
    this.config = config ?? {
      relayerApiEndpoint: DEFAULT_RELAYER_API_ENDPOINT,
    };
  }

  public async migrateData(params: IcxMigrateParams): Promise<Hex> {
    return this.icxMigration.migrateData(params);
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
   *     action: 'migrate', // Action to perform (migrate or revert)
   *   },
   *   spokeProvider, // IconSpokeProvider instance
   * );
   *
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: MigrationParams | IcxCreateRevertMigrationParams,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      if (params.action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.to.length > 0, 'To address is required');
        invariant(
          spokeProvider instanceof IconSpokeProvider,
          'Spoke provider must be an instance of IconSpokeProvider',
        );
        invariant(
          params.icx.toLowerCase() === spokeProvider.chainConfig.addresses.wICX.toLowerCase() ||
            params.icx.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase(),
          'Token must be wICX or native ICX token',
        );
        invariant(params.token === 'ICX', 'Token must be ICX');

        // ICX does not require allowance for migration, thus just check invariants and return true
        return {
          ok: true,
          value: true,
        };
      }

      if (params.action === 'revert') {
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
   *     to: 'hx...', // Icon Address to receive the reverted SODA tokens as wICX
   *     action: 'revert',
   *   },
   *   spokeProvider, // SonicSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    params: IcxCreateRevertMigrationParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      if (params.action === 'revert') {
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
   * Creates a migration intent and submits (relays) it to the hub chain.
   * @param params - The parameters for the migration transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[Hex, Hex], MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError>>}
   * Returns a Result containing a tuple of [spokeTxHash, hubTxHash] if successful,
   * or an error describing why the migration or relay failed.
   *
   * @example
   * const result = await migrationService.createAndSubmitMigrateIntent(
   *   {
   *     token: 'ICX', // Token to migrate
   *     icx: 'cx...', // Address of the ICX or wICX token to migrate
   *     amount: 1000n, // Amount to migrate (in ICX decimals, usually 18)
   *     to: '0x...', // Address to receive the migrated SODA tokens
   *     action: 'migrate',
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
  async createAndSubmitMigrateIntent(
    params: MigrationParams,
    spokeProvider: IconSpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createMigrateIntent(params, spokeProvider);

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
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
   * Creates a revert migration (SODA to wICX) intent and submits (relays) it to the spoke chain.
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
   * const result = await migrationService.createAndSubmitRevertMigrationIntent(
   *   {
   *     amount: 1000n, // Amount of SODA tokens to revert
   *     to: 'hx...', // Icon Address to receive the reverted SODA tokens as wICX
   *     action: 'revert',
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
  async createAndSubmitRevertMigrationIntent(
    params: IcxCreateRevertMigrationParams,
    spokeProvider: SonicSpokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'REVERT_MIGRATION_FAILED'> | MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    try {
      const txResult = await this.createRevertMigrationIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
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
   * Migrates wICX tokens from ICON to the hub chain.
   * This function handles the migration of wICX tokens to SODA tokens on the hub chain.
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
   * const result = await migrationService.createMigrateIntent(
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
  async createMigrateIntent<R extends boolean = false>(
    params: MigrationParams,
    spokeProvider: IconSpokeProvider,
    raw?: boolean,
  ): Promise<Result<TxReturnType<IconSpokeProvider, R>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    try {
      invariant(params.amount > 0, 'Amount must be greater than 0');
      invariant(isAddress(params.to), 'Recipient address is required');
      invariant(
        params.icx.toLowerCase() === spokeProvider.chainConfig.addresses.wICX.toLowerCase() ||
          params.icx.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase(),
        'Token must be wICX or native ICX token',
      );
      invariant(spokeProvider instanceof IconSpokeProvider, 'Spoke provider must be an instance of IconSpokeProvider');
      invariant(params.token === 'ICX', 'Token must be ICX');

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
          token: params.icx,
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
   * const result = await migrationService.createRevertMigrationIntent(
   *   {
   *     amount: 1000n, // Amount of SODA tokens to revert
   *     to: 'hx...', // Icon Address to receive the reverted SODA tokens as wICX
   *     action: 'revert',
   *   },
   */
  async createRevertMigrationIntent<R extends boolean = false>(
    params: IcxCreateRevertMigrationParams,
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
