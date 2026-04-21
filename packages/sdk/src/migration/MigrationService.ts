import invariant from 'tiny-invariant';
import {
  IcxMigrationService,
  type SpokeService,
  type IcxMigrateParams,
  relayTxAndWaitPacket,
  SonicSpokeService,
  type IcxCreateRevertMigrationParams,
  encodeAddress,
  type RelayError,
  isIconAddress,
  BnUSDMigrationService,
  BalnSwapService,
  type BalnMigrateParams,
  type UnifiedBnUSDMigrateParams,
  isIcxMigrateParams,
  isBalnMigrateParams,
  isUnifiedBnUSDMigrateParams,
  isIcxCreateRevertMigrationParams,
  type RelayExtraData,
  waitUntilIntentExecuted,
  type HubProvider,
  type BalnMigrateAction,
  type DepositParams,
  type BalnMigrateActionRaw,
  type IcxMigrateAction,
  type IcxMigrateActionRaw,
  HubService,
  type IcxRevertMigrationAction,
  isIconChainKeyType,
  type UnifiedBnUSDMigrateAction,
  type UnifiedBnUSDMigrateActionRaw,
  isSolanaChainKeyType,
  isBitcoinChainKeyType,
  isEvmChainKeyType,
  isHubChainKeyType,
  isStellarChainKeyType,
  type SpokeIsAllowanceValidParamsStellar,
  type SpokeIsAllowanceValidParams,
  type SpokeIsAllowanceValidParamsHub,
  type SpokeApproveParams,
} from '../index.js';
import {
  ChainKeys,
  type Address,
  getIntentRelayChainId,
  type Hex,
  type HttpUrl,
  type IconAddress,
  type Result,
  type TxReturnType,
  type IconChainKey,
  type SonicChainKey,
  isLegacybnUSDToken,
  isLegacybnUSDChainId,
  isNewbnUSDChainId,
  type SpokeChainKey,
  isNewbnUSDToken,
  type GetAddressType,
  type GetTokenAddressType,
  type EvmChainKey,
  type GetWalletProviderType,
  type StellarChainKey,
  type HubChainKey,
} from '@sodax/types';
import { isAddress } from 'viem';
import type { ConfigService } from '../shared/config/ConfigService.js';

export type GetMigrationFailedPayload<T extends MigrationErrorCode> = T extends 'CREATE_MIGRATION_INTENT_FAILED'
  ? IcxMigrateParams | UnifiedBnUSDMigrateParams<SpokeChainKey> | BalnMigrateParams
  : T extends 'CREATE_REVERT_MIGRATION_INTENT_FAILED'
    ? IcxCreateRevertMigrationParams
    : T extends 'REVERT_MIGRATION_FAILED'
      ? IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams<SpokeChainKey>
      : T extends 'MIGRATION_FAILED'
        ? IcxMigrateParams | UnifiedBnUSDMigrateParams<SpokeChainKey> | BalnMigrateParams
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

export type MigrationParams<K extends SpokeChainKey> =
  | IcxMigrateParams
  | UnifiedBnUSDMigrateParams<K>
  | BalnMigrateParams;
export type MigrationRevertParams<K extends SpokeChainKey> =
  | IcxCreateRevertMigrationParams
  | UnifiedBnUSDMigrateParams<K>;

export const SupportedMigrationTokens = ['ICX', 'bnUSD', 'BALN'] as const;
export type MigrationTokens = (typeof SupportedMigrationTokens)[number];

export type MigrationServiceConstructorParams = {
  hubProvider: HubProvider;
  config: ConfigService;
  spoke: SpokeService;
};

/**
 * MigrationService is a service that provides functionalities for migrating tokens between spoke chains.
 * @namespace SodaxFeatures
 */
export class MigrationService {
  readonly icxMigration: IcxMigrationService;
  readonly bnUSDMigrationService: BnUSDMigrationService;
  readonly balnSwapService: BalnSwapService;
  readonly hubProvider: HubProvider;
  readonly relayerApiEndpoint: HttpUrl;
  readonly config: ConfigService;
  readonly spoke: SpokeService;

  constructor({ hubProvider, config, spoke: spokeService }: MigrationServiceConstructorParams) {
    this.hubProvider = hubProvider;
    this.icxMigration = new IcxMigrationService({ hubProvider, config });
    this.bnUSDMigrationService = new BnUSDMigrationService({ hubProvider, config });
    this.balnSwapService = new BalnSwapService({ hubProvider });
    this.relayerApiEndpoint = config.relay.relayerApiEndpoint;
    this.config = config;
    this.spoke = spokeService;
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
  public async isAllowanceValid<K extends SpokeChainKey>(
    params: MigrationParams<K> | MigrationRevertParams<K>,
    action: MigrationAction,
  ): Promise<Result<boolean>> {
    try {
      if (action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(isAddress(params.dstAddress) || isIconAddress(params.dstAddress), 'To address is required');
        invariant(
          isIcxMigrateParams(params) || isBalnMigrateParams(params) || isUnifiedBnUSDMigrateParams(params),
          'Invalid params',
        );

        if (isIconChainKeyType(params.srcChainKey) && (isIcxMigrateParams(params) || isBalnMigrateParams(params))) {
          // icx and baln migration does not require allowance check since they originate from icon, thus just return true
          return {
            ok: true,
            value: true,
          };
        }

        // bnUSD only requires allowance check for EVM spoke chains
        if (isUnifiedBnUSDMigrateParams(params) && isEvmChainKeyType(params.srcChainKey)) {
          return await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress,
            spender: isHubChainKeyType(params.srcChainKey)
              ? (this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.bnUSD.address as Address)
              : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager,
          });
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarChainKeyType(params.srcChainKey)) {
          return await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress,
          } satisfies SpokeIsAllowanceValidParamsStellar);
        }

        return {
          ok: true,
          value: true,
        };
      }
      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'To address is required');
        invariant(isIcxCreateRevertMigrationParams(params) || isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmChainKeyType(params.srcChainKey)) {
          const spender: Address = isHubChainKeyType(params.srcChainKey)
            ? await HubService.getUserRouter(params.srcAddress as Address, this.hubProvider)
            : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

          return await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress,
            spender,
          } satisfies SpokeIsAllowanceValidParams<EvmChainKey>);
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarChainKeyType(params.srcChainKey)) {
          return await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress,
          } satisfies SpokeIsAllowanceValidParamsStellar);
        }

        if (isHubChainKeyType(params.srcChainKey) && isIcxCreateRevertMigrationParams(params)) {
          const userRouter = await HubService.getUserHubWalletAddress(
            params.srcAddress,
            params.srcChainKey,
            this.hubProvider,
          );

          return await this.spoke.isAllowanceValid({
            srcChainKey: params.srcChainKey,
            token: this.hubProvider.chainConfig.addresses.sodaToken,
            amount: params.amount,
            owner: params.srcAddress,
            spender: userRouter,
          } satisfies SpokeIsAllowanceValidParamsHub);
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
  public async approve<K extends SpokeChainKey>(
    _params: IcxRevertMigrationAction | UnifiedBnUSDMigrateAction<K>,
    action: MigrationAction,
  ): Promise<Result<TxReturnType<K, false>>> {
    const { params, walletProvider } = _params;
    try {
      if (action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'To address is required');
        invariant(isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmChainKeyType(params.srcChainKey)) {
          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD as GetTokenAddressType<EvmChainKey>,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<EvmChainKey>,
            spender: isHubChainKeyType(params.srcChainKey)
              ? (this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.bnUSD.address as Address)
              : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager,
            raw: false,
            walletProvider: walletProvider as GetWalletProviderType<EvmChainKey>,
          } satisfies SpokeApproveParams<EvmChainKey, false> as SpokeApproveParams<
            EvmChainKey,
            false
          >)) satisfies Result<TxReturnType<EvmChainKey, false>> as Result<TxReturnType<K, false>>;
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarChainKeyType(params.srcChainKey)) {
          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<StellarChainKey>,
            raw: false,
            walletProvider: walletProvider as GetWalletProviderType<StellarChainKey>,
          } satisfies SpokeApproveParams<StellarChainKey, false> as SpokeApproveParams<
            StellarChainKey,
            false
          >)) satisfies Result<TxReturnType<StellarChainKey, false>> as Result<TxReturnType<K, false>>;
        }

        return {
          ok: false,
          error: new Error('Invalid params for migrate action'),
        };
      }
      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'To address is required');
        invariant(isIcxCreateRevertMigrationParams(params) || isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmChainKeyType(params.srcChainKey)) {
          const spender: Address = isHubChainKeyType(params.srcChainKey)
            ? await HubService.getUserRouter(params.srcAddress as Address, this.hubProvider)
            : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD as GetTokenAddressType<EvmChainKey>,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<EvmChainKey>,
            spender,
            raw: false,
            walletProvider: walletProvider as GetWalletProviderType<EvmChainKey>,
          } satisfies SpokeApproveParams<EvmChainKey, false> as SpokeApproveParams<
            EvmChainKey,
            false
          >)) satisfies Result<TxReturnType<EvmChainKey, false>> as Result<TxReturnType<K, false>>;
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarChainKeyType(params.srcChainKey)) {
          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<StellarChainKey>,
            raw: false,
            walletProvider: walletProvider as GetWalletProviderType<StellarChainKey>,
          } satisfies SpokeApproveParams<StellarChainKey, false> as SpokeApproveParams<
            StellarChainKey,
            false
          >)) satisfies Result<TxReturnType<StellarChainKey, false>> as Result<TxReturnType<K, false>>;
        }

        if (isHubChainKeyType(params.srcChainKey) && isIcxCreateRevertMigrationParams(params)) {
          const userRouter = await HubService.getUserHubWalletAddress(
            params.srcAddress,
            params.srcChainKey,
            this.hubProvider,
          );

          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: this.hubProvider.chainConfig.addresses.sodaToken,
            amount: params.amount,
            owner: params.srcAddress,
            spender: userRouter,
            raw: false,
            walletProvider: walletProvider as GetWalletProviderType<HubChainKey>,
          } satisfies SpokeApproveParams<HubChainKey, false> as SpokeApproveParams<
            HubChainKey,
            false
          >)) satisfies Result<TxReturnType<HubChainKey, false>> as Result<TxReturnType<K, false>>;
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

  public async approveRaw<K extends SpokeChainKey>(
    _params: IcxRevertMigrationAction | UnifiedBnUSDMigrateAction<K>,
    action: MigrationAction,
  ): Promise<Result<TxReturnType<K, true>>> {
    const { params, walletProvider } = _params;
    try {
      if (action === 'migrate') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'To address is required');
        invariant(isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmChainKeyType(params.srcChainKey)) {
          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD as GetTokenAddressType<EvmChainKey>,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<EvmChainKey>,
            spender: isHubChainKeyType(params.srcChainKey)
              ? (this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.bnUSD.address as Address)
              : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager,
            raw: true,
          } satisfies SpokeApproveParams<EvmChainKey, true> as SpokeApproveParams<EvmChainKey, true>)) satisfies Result<
            TxReturnType<EvmChainKey, true>
          > as Result<TxReturnType<K, true>>;
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarChainKeyType(params.srcChainKey)) {
          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<StellarChainKey>,
            raw: true,
          } satisfies SpokeApproveParams<StellarChainKey, true> as SpokeApproveParams<
            StellarChainKey,
            true
          >)) satisfies Result<TxReturnType<StellarChainKey, true>> as Result<TxReturnType<K, true>>;
        }

        return {
          ok: false,
          error: new Error('Invalid params for migrate action'),
        };
      }
      if (action === 'revert') {
        invariant(params.amount > 0n, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'To address is required');
        invariant(isIcxCreateRevertMigrationParams(params) || isUnifiedBnUSDMigrateParams(params), 'Invalid params');

        if (isUnifiedBnUSDMigrateParams(params) && isEvmChainKeyType(params.srcChainKey)) {
          const spender: Address = isHubChainKeyType(params.srcChainKey)
            ? await HubService.getUserRouter(params.srcAddress as Address, this.hubProvider)
            : this.config.sodaxConfig.chains[params.srcChainKey].addresses.assetManager;

          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD as GetTokenAddressType<EvmChainKey>,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<EvmChainKey>,
            spender,
            raw: true,
          } satisfies SpokeApproveParams<EvmChainKey, true> as SpokeApproveParams<EvmChainKey, true>)) satisfies Result<
            TxReturnType<EvmChainKey, true>
          > as Result<TxReturnType<K, true>>;
        }

        if (isUnifiedBnUSDMigrateParams(params) && isStellarChainKeyType(params.srcChainKey)) {
          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: params.srcbnUSD,
            amount: params.amount,
            owner: params.srcAddress as GetAddressType<StellarChainKey>,
            raw: true,
          } satisfies SpokeApproveParams<StellarChainKey, true> as SpokeApproveParams<
            StellarChainKey,
            true
          >)) satisfies Result<TxReturnType<StellarChainKey, true>> as Result<TxReturnType<K, true>>;
        }

        if (isHubChainKeyType(params.srcChainKey) && isIcxCreateRevertMigrationParams(params)) {
          const userRouter = await HubService.getUserHubWalletAddress(
            params.srcAddress,
            params.srcChainKey,
            this.hubProvider,
          );

          return (await this.spoke.approve({
            srcChainKey: params.srcChainKey,
            token: this.hubProvider.chainConfig.addresses.sodaToken,
            amount: params.amount,
            owner: params.srcAddress,
            spender: userRouter,
            raw: true,
          } satisfies SpokeApproveParams<HubChainKey, true> as SpokeApproveParams<HubChainKey, true>)) satisfies Result<
            TxReturnType<HubChainKey, true>
          > as Result<TxReturnType<K, true>>;
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
  async migratebnUSD<K extends SpokeChainKey>(
    _params: UnifiedBnUSDMigrateAction<K>,
  ): Promise<
    Result<
      [string, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    const { params, timeout } = _params;
    try {
      const intentResult = await this.createMigratebnUSDIntent(_params);

      if (!intentResult.ok) {
        return {
          ok: false,
          error: intentResult.error,
        };
      }

      const [spokeTxHash, extraData] = intentResult.value;

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await this.spoke.verifyTxHash({
        txHash: spokeTxHash,
        chainKey: params.srcChainKey,
      });

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
        isSolanaChainKeyType(params.srcChainKey) || isBitcoinChainKeyType(params.srcChainKey) ? extraData : undefined,
        params.srcChainKey,
        this.relayerApiEndpoint,
        timeout,
      );

      if (!packetResult.ok) {
        return packetResult;
      }

      if (!(params.srcChainKey === ChainKeys.SONIC_MAINNET || params.dstChainKey === ChainKeys.SONIC_MAINNET)) {
        await waitUntilIntentExecuted({
          intentRelayChainId: getIntentRelayChainId(ChainKeys.SONIC_MAINNET).toString(),
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
    _params: IcxMigrateAction,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    const { params, timeout } = _params;
    try {
      const txResult = await this.createMigrateIcxToSodaIntent(_params);

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        params.srcChainKey,
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
    _params: IcxRevertMigrationAction,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'REVERT_MIGRATION_FAILED'> | MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    const { timeout, params } = _params;
    try {
      const txResult = await this.createRevertSodaToIcxMigrationIntent(_params);

      if (!txResult.ok) {
        return txResult;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        ChainKeys.SONIC_MAINNET,
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
    _params: BalnMigrateAction,
  ): Promise<
    Result<
      [Hex, Hex],
      MigrationError<'MIGRATION_FAILED'> | MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> | RelayError
    >
  > {
    const { params, timeout } = _params;
    try {
      const txResult = await this.createMigrateBalnIntent(_params);

      if (!txResult.ok) {
        return {
          ok: false,
          error: txResult.error,
        };
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        undefined,
        ChainKeys.ICON_MAINNET,
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
  async createMigrateBalnIntent(
    _params: BalnMigrateAction,
  ): Promise<Result<TxReturnType<IconChainKey, false>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    const { params, skipSimulation, walletProvider } = _params;

    try {
      const balnToken = this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.BALN.address;
      invariant(balnToken, 'BALN token not found');

      const migrationData = this.balnSwapService.swapData(balnToken, params, this.config);

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const txResult = await this.spoke.deposit({
        srcChainKey: params.srcChainKey,
        srcAddress: params.srcAddress,
        to: hubWalletAddress,
        token: balnToken,
        amount: params.amount,
        data: migrationData,
        skipSimulation,
        raw: false,
        walletProvider,
      } satisfies DepositParams<IconChainKey, false>);

      return {
        ok: true,
        value: txResult satisfies TxReturnType<IconChainKey, false>,
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

  async createMigrateBalnIntentRaw(
    _params: BalnMigrateActionRaw,
  ): Promise<Result<TxReturnType<IconChainKey, true>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    const { params, skipSimulation } = _params;

    try {
      const balnToken = this.config.sodaxConfig.chains[params.srcChainKey].supportedTokens.BALN.address;
      invariant(balnToken, 'BALN token not found');

      const migrationData = this.balnSwapService.swapData(balnToken, params, this.config);

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const txResult = await this.spoke.deposit({
        srcChainKey: params.srcChainKey,
        srcAddress: params.srcAddress,
        to: hubWalletAddress,
        token: balnToken,
        amount: params.amount,
        data: migrationData,
        skipSimulation,
        raw: true,
      } satisfies DepositParams<IconChainKey, true>);

      return {
        ok: true,
        value: txResult satisfies TxReturnType<IconChainKey, true>,
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
  async createMigratebnUSDIntent<K extends SpokeChainKey>(
    _params: UnifiedBnUSDMigrateAction<K>,
  ): Promise<Result<[TxReturnType<K, false>, RelayExtraData], MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    const { params, unchecked, skipSimulation, walletProvider } = _params;
    try {
      if (!unchecked) {
        invariant(this.config.isValidSpokeChainKey(params.srcChainKey), 'Invalid spoke source chain key');
        invariant(this.config.isValidSpokeChainKey(params.dstChainKey), 'Invalid spoke destination chain key');
        invariant(params.srcbnUSD.length > 0, 'Legacy bnUSD token address is required');
        invariant(params.dstbnUSD.length > 0, 'New bnUSD token address is required');
        invariant(params.amount > 0, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'Recipient address is required');
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
            isLegacybnUSDChainId(params.srcChainKey),
            'srcChainId must be a legacy bnUSD chain (icon, sui, stellar) if srcbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDChainId(params.dstChainKey),
            'dstChainId must be a new bnUSD chain (all spoke chains besides Icon) if dstbnUSD is a legacy bnUSD token',
          );
        }

        migrationData = this.bnUSDMigrationService.migrateData({
          srcChainKey: params.srcChainKey,
          legacybnUSD: params.srcbnUSD,
          newbnUSD: params.dstbnUSD,
          dstChainKey: params.dstChainKey,
          amount: params.amount,
          dstAddress: encodeAddress(params.dstChainKey, params.dstAddress),
        });
      } else if (isLegacybnUSDToken(params.dstbnUSD)) {
        // reverse migration from new bnUSD to legacy bnUSD
        if (!unchecked) {
          invariant(
            isLegacybnUSDChainId(params.dstChainKey),
            'dstChainId must be a legacy bnUSD chain (sui, stellar, icon) if dstbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDToken(params.srcbnUSD),
            'srcbnUSD must be a new bnUSD token if dstbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDChainId(params.srcChainKey),
            'srcChainId must be a new bnUSD chain (all spoke chains besides Icon) if srcbnUSD is a new bnUSD token',
          );
        }

        migrationData = this.bnUSDMigrationService.revertMigrationData({
          srcChainId: params.srcChainKey,
          legacybnUSD: params.dstbnUSD,
          newbnUSD: params.srcbnUSD,
          dstChainKey: params.dstChainKey,
          amount: params.amount,
          dstAddress: encodeAddress(params.dstChainKey, params.dstAddress),
        });
      } else {
        throw new Error('srcbnUSD or dstbnUSD must be a legacy bnUSD token');
      }

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const txResult = await this.spoke.deposit({
        srcChainKey: params.srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        to: hubWalletAddress,
        token: params.srcbnUSD as GetTokenAddressType<K>,
        amount: params.amount,
        data: migrationData,
        skipSimulation,
        raw: false,
        walletProvider,
      });

      return {
        ok: true,
        value: [
          txResult satisfies TxReturnType<K, false> as TxReturnType<K, false>,
          {
            address: hubWalletAddress,
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

  async createMigratebnUSDIntentRaw<K extends SpokeChainKey>(
    _params: UnifiedBnUSDMigrateActionRaw<K>,
  ): Promise<Result<[TxReturnType<K, true>, RelayExtraData], MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    const { params, unchecked, skipSimulation } = _params;
    try {
      if (!unchecked) {
        invariant(this.config.isValidSpokeChainKey(params.srcChainKey), 'Invalid spoke source chain key');
        invariant(this.config.isValidSpokeChainKey(params.dstChainKey), 'Invalid spoke destination chain key');
        invariant(params.srcbnUSD.length > 0, 'Legacy bnUSD token address is required');
        invariant(params.dstbnUSD.length > 0, 'New bnUSD token address is required');
        invariant(params.amount > 0, 'Amount must be greater than 0');
        invariant(params.dstAddress.length > 0, 'Recipient address is required');
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
            isLegacybnUSDChainId(params.srcChainKey),
            'srcChainId must be a legacy bnUSD chain (icon, sui, stellar) if srcbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDChainId(params.dstChainKey),
            'dstChainId must be a new bnUSD chain (all spoke chains besides Icon) if dstbnUSD is a legacy bnUSD token',
          );
        }

        migrationData = this.bnUSDMigrationService.migrateData({
          srcChainKey: params.srcChainKey,
          legacybnUSD: params.srcbnUSD,
          newbnUSD: params.dstbnUSD,
          dstChainKey: params.dstChainKey,
          amount: params.amount,
          dstAddress: encodeAddress(params.dstChainKey, params.dstAddress),
        });
      } else if (isLegacybnUSDToken(params.dstbnUSD)) {
        // reverse migration from new bnUSD to legacy bnUSD
        if (!unchecked) {
          invariant(
            isLegacybnUSDChainId(params.dstChainKey),
            'dstChainId must be a legacy bnUSD chain (sui, stellar, icon) if dstbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDToken(params.srcbnUSD),
            'srcbnUSD must be a new bnUSD token if dstbnUSD is a legacy bnUSD token',
          );
          invariant(
            isNewbnUSDChainId(params.srcChainKey),
            'srcChainId must be a new bnUSD chain (all spoke chains besides Icon) if srcbnUSD is a new bnUSD token',
          );
        }

        migrationData = this.bnUSDMigrationService.revertMigrationData({
          srcChainId: params.srcChainKey,
          legacybnUSD: params.dstbnUSD,
          newbnUSD: params.srcbnUSD,
          dstChainKey: params.dstChainKey,
          amount: params.amount,
          dstAddress: encodeAddress(params.dstChainKey, params.dstAddress),
        });
      } else {
        throw new Error('srcbnUSD or dstbnUSD must be a legacy bnUSD token');
      }

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        params.srcChainKey,
        this.hubProvider,
      );

      const txResult = await this.spoke.deposit({
        srcChainKey: params.srcChainKey,
        srcAddress: params.srcAddress as GetAddressType<K>,
        to: hubWalletAddress,
        token: params.srcbnUSD as GetTokenAddressType<K>,
        amount: params.amount,
        data: migrationData,
        skipSimulation,
        raw: true,
      });

      return {
        ok: true,
        value: [
          txResult satisfies TxReturnType<K, true> as TxReturnType<K, true>,
          {
            address: hubWalletAddress,
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
  async createMigrateIcxToSodaIntent(
    _params: IcxMigrateAction,
  ): Promise<Result<TxReturnType<IconChainKey, false>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    const { params, skipSimulation, walletProvider } = _params;
    try {
      invariant(params.amount > 0, 'Amount must be greater than 0');
      invariant(isAddress(params.dstAddress), 'Recipient address is required');
      invariant(
        params.address.toLowerCase() ===
          this.config.sodaxConfig.chains[ChainKeys.ICON_MAINNET].addresses.wICX.toLowerCase() ||
          params.address.toLowerCase() ===
            this.config.sodaxConfig.chains[ChainKeys.ICON_MAINNET].nativeToken.toLowerCase(),
        'Token must be wICX or native ICX token',
      );
      invariant(isIconChainKeyType(params.srcChainKey), 'Source chain key must be an Icon chain');

      // Get the available amount for migration
      const availableAmount = await this.icxMigration.getAvailableAmount();

      // Check if there's enough liquidity for migration
      if (availableAmount < params.amount) {
        throw new Error(
          `Insufficient liquidity. Available: ${availableAmount.toString()}, Requested: ${params.amount.toString()}`,
        );
      }

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        ChainKeys.SONIC_MAINNET,
        this.hubProvider,
      );

      // Execute the migration transaction
      const txResult = await this.spoke.deposit({
        srcChainKey: ChainKeys.ICON_MAINNET,
        srcAddress: params.srcAddress,
        to: hubWalletAddress,
        token: params.address,
        amount: params.amount,
        data: this.icxMigration.migrateData(params),
        skipSimulation,
        raw: false,
        walletProvider,
      } satisfies DepositParams<IconChainKey, false>);

      return {
        ok: true,
        value: txResult satisfies TxReturnType<IconChainKey, false>,
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

  async createMigrateIcxToSodaIntentRaw(
    _params: IcxMigrateActionRaw,
  ): Promise<Result<TxReturnType<IconChainKey, true>, MigrationError<'CREATE_MIGRATION_INTENT_FAILED'>>> {
    const { params, skipSimulation } = _params;
    try {
      invariant(params.amount > 0, 'Amount must be greater than 0');
      invariant(isAddress(params.dstAddress), 'Recipient address is required');
      invariant(
        params.address.toLowerCase() ===
          this.config.sodaxConfig.chains[ChainKeys.ICON_MAINNET].addresses.wICX.toLowerCase() ||
          params.address.toLowerCase() ===
            this.config.sodaxConfig.chains[ChainKeys.ICON_MAINNET].nativeToken.toLowerCase(),
        'Token must be wICX or native ICX token',
      );

      // Get the available amount for migration
      const availableAmount = await this.icxMigration.getAvailableAmount();

      // Check if there's enough liquidity for migration
      if (availableAmount < params.amount) {
        throw new Error(
          `Insufficient liquidity. Available: ${availableAmount.toString()}, Requested: ${params.amount.toString()}`,
        );
      }

      const hubWalletAddress = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        ChainKeys.SONIC_MAINNET,
        this.hubProvider,
      );

      // Execute the migration transaction
      const txResult = await this.spoke.deposit({
        srcChainKey: ChainKeys.ICON_MAINNET,
        srcAddress: params.srcAddress,
        to: hubWalletAddress,
        token: params.address,
        amount: params.amount,
        data: this.icxMigration.migrateData(params),
        skipSimulation,
        raw: true,
      } satisfies DepositParams<IconChainKey, true>);

      return {
        ok: true,
        value: txResult satisfies TxReturnType<IconChainKey, true>,
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
  async createRevertSodaToIcxMigrationIntent(
    _params: IcxRevertMigrationAction,
  ): Promise<Result<TxReturnType<SonicChainKey, false>, MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'>>> {
    const { params, walletProvider, skipSimulation } = _params;
    try {
      const userRouter = await HubService.getUserHubWalletAddress(
        params.srcAddress,
        ChainKeys.SONIC_MAINNET,
        this.hubProvider,
      );
      const wICX = this.config.sodaxConfig.chains[ChainKeys.ICON_MAINNET].addresses.wICX;
      invariant(wICX, 'wICX token not found');
      const data = this.icxMigration.revertMigration({
        wICX: wICX as IconAddress,
        amount: params.amount,
        dstAddress: encodeAddress(ChainKeys.ICON_MAINNET, params.dstAddress),
        userWallet: userRouter,
      });

      const txResult = await SonicSpokeService.deposit({
        srcChainKey: ChainKeys.SONIC_MAINNET,
        srcAddress: params.srcAddress,
        to: userRouter,
        token: this.hubProvider.chainConfig.addresses.sodaToken,
        amount: params.amount,
        data,
        skipSimulation,
        raw: false,
        walletProvider,
      } satisfies DepositParams<SonicChainKey, false>);

      return {
        ok: true,
        value: txResult satisfies TxReturnType<SonicChainKey, false>,
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
