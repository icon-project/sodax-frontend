import type { OptionalRaw, OptionalTimeout, Prettify, RelayOptionalExtraData, SpokeTxHash } from './../shared/types.js';
import type { Address, Hex } from 'viem';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  type RelayErrorCode,
  type RelayError,
  EvmAssetManagerService,
  type Result,
  type TxReturnType,
  type SpokeProvider,
  SpokeService,
  deriveUserWalletAddress,
  encodeAddress,
  Erc20Service,
  Erc4626Service,
  EvmVaultTokenService,
  encodeContractCalls,
  relayTxAndWaitPacket,
  DEFAULT_RELAY_TX_TIMEOUT,
  SolanaSpokeProvider,
  type EvmContractCall,
  type ConfigService,
  StellarSpokeProvider,
  StellarSpokeService,
  SonicSpokeService,
} from '../index.js';
import {
  SodaTokens,
  SONIC_MAINNET_CHAIN_ID,
  type HttpUrl,
  type OriginalAssetAddress,
  type SpokeChainId,
} from '@sodax/types';
import type { ConcentratedLiquidityConfig } from '../shared/types.js';
import { erc20Abi, isAddress } from 'viem';
import invariant from 'tiny-invariant';
import { getConcentratedLiquidityConfig } from '../shared/constants.js';
import { stataTokenFactoryAbi } from '../shared/abis/stataTokenFactory.abi.js';
import { type EvmHubProvider, EvmSpokeProvider, SonicSpokeProvider } from '../shared/entities/Providers.js';
import type {
  GetAddressType,
  GetSpokeDepositParamsType,
  HubTxHash,
  EvmSpokeProviderType,
  StellarSpokeProviderType,
  SonicSpokeProviderType,
} from '../shared/types.js';

// Local type definitions
export type AssetServiceConfig = {
  concentratedLiquidityConfig: ConcentratedLiquidityConfig;
};

type AssetServiceConfigParams = AssetServiceConfig;

export type CreateAssetWithdrawParams = {
  poolToken: Address;
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of asset to withdraw
  dstProvider?: SpokeProvider;
};

export type CreateDepositParams = {
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of token to deposit
  poolToken: Address;
  dstProvider?: SpokeProvider;
};

export type AssetWithdrawParams<S extends SpokeProvider = SpokeProvider> = {
  withdrawParams: CreateAssetWithdrawParams;
  spokeProvider: S;
};

export type DepositParams<S extends SpokeProvider = SpokeProvider> = {
  depositParams: CreateDepositParams;
  spokeProvider: S;
};

export type AssetServiceUnknownErrorCode = 'DEPOSIT_UNKNOWN_ERROR' | 'ALLOWANCE_CHECK_FAILED' | 'APPROVAL_FAILED';

export type GetAssetServiceParams<T extends AssetServiceUnknownErrorCode> = T extends 'DEPOSIT_UNKNOWN_ERROR'
  ? CreateDepositParams
  : T extends 'ALLOWANCE_CHECK_FAILED'
    ? CreateDepositParams
    : T extends 'APPROVAL_FAILED'
      ? CreateDepositParams
      : CreateDepositParams;

export type AssetServiceErrorCode =
  | AssetServiceUnknownErrorCode
  | RelayErrorCode
  | 'CREATE_DEPOSIT_INTENT_FAILED'
  | 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED';

export type AssetServiceUnknownError<T extends AssetServiceUnknownErrorCode> = {
  error: unknown;
  payload: GetAssetServiceParams<T>;
};

export type AssetServiceSubmitTxFailedError = {
  error: RelayError;
  payload: string;
};

export type AssetServiceDepositFailedError = {
  error: unknown;
  payload: CreateDepositParams;
};

export type AssetServiceWithdrawFailedError = {
  error: unknown;
  payload: AssetWithdrawParams;
};

export type AssetServiceAllowanceCheckFailedError = {
  error: unknown;
  payload: CreateDepositParams;
};

export type AssetServiceApprovalFailedError = {
  error: unknown;
  payload: CreateDepositParams;
};

export type GetAssetServiceError<T extends AssetServiceErrorCode> = T extends 'SUBMIT_TX_FAILED'
  ? AssetServiceSubmitTxFailedError
  : T extends 'RELAY_TIMEOUT'
    ? AssetServiceSubmitTxFailedError
    : T extends 'CREATE_DEPOSIT_INTENT_FAILED'
      ? AssetServiceDepositFailedError
      : T extends 'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'
        ? AssetServiceWithdrawFailedError
        : T extends 'ALLOWANCE_CHECK_FAILED'
          ? AssetServiceAllowanceCheckFailedError
          : T extends 'APPROVAL_FAILED'
            ? AssetServiceApprovalFailedError
            : T extends AssetServiceUnknownErrorCode
              ? AssetServiceUnknownError<T>
              : never;

export type AssetServiceError<T extends AssetServiceErrorCode> = {
  code: T;
  data: GetAssetServiceError<T>;
};

export type AssetServiceConstructorParams = {
  config?: AssetServiceConfigParams;
  hubProvider: EvmHubProvider;
  relayerApiEndpoint?: HttpUrl;
  configService: ConfigService;
};

export class AssetService {
  public readonly config: AssetServiceConfig;
  private readonly relayerApiEndpoint: HttpUrl;
  private readonly hubProvider: EvmHubProvider;
  private readonly configService: ConfigService;

  constructor({ config, hubProvider, relayerApiEndpoint, configService }: AssetServiceConstructorParams) {
    this.configService = configService;
    this.relayerApiEndpoint = relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT;
    this.hubProvider = hubProvider;
    // Use default config if none provided
    if (!config) {
      this.config = {
        concentratedLiquidityConfig: getConcentratedLiquidityConfig(),
      };
    } else {
      this.config = {
        concentratedLiquidityConfig: config.concentratedLiquidityConfig,
      };
    }
  }

  /**
   * Check whether sufficient allowance is available for an asset deposit action.
   * This determines whether a contract/manager can transfer the specified ERC20 asset on behalf of the user,
   * or whether approval or, for Stellar, trustlines are needed.
   *
   * For EVM-based chains, checks ERC20 allowance against the asset manager (for EvmSpokeProvider),
   * or against the user router contract (for SonicSpokeProvider on Sonic chains).
   * For Stellar, verifies if the sender's trustline is sufficient.
   * For all other chains, returns `true` (approval is not required).
   *
   * @param {DepositParams<S>} params - Object containing:
   *   - depositParams: Deposit input parameters (asset address, amount, etc.)
   *   - spokeProvider: The provider instance for the originating chain
   * @returns {Promise<Result<boolean, AssetServiceError<'ALLOWANCE_CHECK_FAILED'>>>}
   *   Resolves with Result.ok(true) if allowance/trustline is sufficient, or Result.ok(false) if not,
   *   or Result.error if allowance/trustline check failed.
   *
   * @example
   * const result = await assetService.isAllowanceValid({
   *   depositParams: { asset: '0x...', amount: 1000n },
   *   spokeProvider,
   * });
   * if (!result.ok) {
   *   // Handle error (e.g. result.error)
   * } else if (!result.value) {
   *   // Approval or trustline is needed
   * }
   */
  public async isAllowanceValid<S extends SpokeProvider = SpokeProvider>({
    depositParams: params,
    spokeProvider,
  }: DepositParams<S>): Promise<Result<boolean, AssetServiceError<'ALLOWANCE_CHECK_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (spokeProvider instanceof StellarSpokeProvider) {
        return {
          ok: true,
          value: await StellarSpokeService.hasSufficientTrustline(params.asset, params.amount, spokeProvider),
        };
      }

      // For non-EVM/non-Sonic chains, no approval is required
      if (!(spokeProvider instanceof EvmSpokeProvider || spokeProvider instanceof SonicSpokeProvider)) {
        return {
          ok: true,
          value: true,
        };
      }

      invariant(isAddress(params.asset), 'Invalid source asset address for EVM chain');

      let allowanceResult: Result<boolean> = {
        ok: false,
        error: new Error('Invalid spoke provider'),
      };
      if (spokeProvider instanceof EvmSpokeProvider) {
        allowanceResult = await Erc20Service.isAllowanceValid(
          params.asset,
          params.amount,
          walletAddress as GetAddressType<EvmSpokeProvider>,
          spokeProvider.chainConfig.addresses.assetManager as Address,
          spokeProvider as EvmSpokeProvider | SonicSpokeProvider,
        );
      }
      if (spokeProvider instanceof SonicSpokeProvider) {
        const userRouter = await SonicSpokeService.getUserRouter(
          walletAddress as GetAddressType<SonicSpokeProvider>,
          spokeProvider,
        );

        allowanceResult = await Erc20Service.isAllowanceValid(
          params.asset as GetAddressType<SonicSpokeProvider>,
          params.amount,
          walletAddress as GetAddressType<SonicSpokeProvider>,
          userRouter,
          spokeProvider,
        );
      }

      if (!allowanceResult.ok) {
        return {
          ok: false,
          error: {
            code: 'ALLOWANCE_CHECK_FAILED',
            data: {
              error: allowanceResult.error,
              payload: params,
            },
          },
        };
      }

      return {
        ok: true,
        value: allowanceResult.value,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'ALLOWANCE_CHECK_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Approves the amount spending for deposit actions.
   * @param params - The parameters for the asset transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction hash instead of the transaction receipt
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns the raw transaction payload or transaction hash
   *
   * @example
   * const result = await assetService.approve(
   *   {
   *     asset: '0x...', // asset address
   *     amount: 1000n, // amount to deposit
   *   },
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   *   true // Optional raw flag to return the raw transaction hash instead of the transaction receipt
   * );
   *
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>({
    depositParams: params,
    spokeProvider,
    raw,
  }: Prettify<DepositParams<S> & OptionalRaw<R>>): Promise<
    Result<TxReturnType<S, R>, AssetServiceError<'APPROVAL_FAILED'>>
  > {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (spokeProvider instanceof StellarSpokeProvider) {
        const result = await StellarSpokeService.requestTrustline(params.asset, params.amount, spokeProvider, raw);
        return {
          ok: true,
          value: result satisfies TxReturnType<StellarSpokeProviderType, R> as TxReturnType<S, R>,
        };
      }

      // For regular EVM chains (non-Sonic), approve against assetManager
      if (spokeProvider instanceof EvmSpokeProvider) {
        invariant(isAddress(params.asset), 'Invalid source asset address for EVM chain');

        const result = await Erc20Service.approve(
          params.asset,
          params.amount,
          spokeProvider.chainConfig.addresses.assetManager as GetAddressType<EvmSpokeProvider>,
          spokeProvider as EvmSpokeProvider,
          raw,
        );

        return {
          ok: true,
          value: result satisfies TxReturnType<EvmSpokeProviderType, R> as TxReturnType<S, R>,
        };
      }

      if (spokeProvider instanceof SonicSpokeProvider) {
        const userRouter = await SonicSpokeService.getUserRouter(
          walletAddress as GetAddressType<SonicSpokeProvider>,
          spokeProvider,
        );

        const result = (await Erc20Service.approve(
          params.asset as GetAddressType<SonicSpokeProvider>,
          params.amount,
          userRouter,
          spokeProvider,
          raw,
        )) satisfies TxReturnType<SonicSpokeProviderType, R> as TxReturnType<S, R>;

        return {
          ok: true,
          value: result,
        };
      }

      return {
        ok: false,
        error: {
          code: 'APPROVAL_FAILED',
          data: {
            error: new Error('Approve only supported for EVM spoke chains'),
            payload: params,
          },
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'APPROVAL_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Execute deposit action - wraps tokens and prepares for liquidity provision
   */
  public async executeDeposit<S extends SpokeProvider, R extends boolean = false>({
    depositParams,
    spokeProvider,
    raw,
  }: Prettify<DepositParams<S> & OptionalRaw<R>>): Promise<
    Result<TxReturnType<S, R>, AssetServiceError<'CREATE_DEPOSIT_INTENT_FAILED'>> & RelayOptionalExtraData
  > {
    try {
      invariant(depositParams.amount > 0n, 'Amount must be greater than 0');
      invariant(depositParams.asset.length > 0, 'Source asset is required');
      invariant(depositParams.poolToken.length > 0, 'Pool token is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const abstractedWalletAddress = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        walletAddress,
      );
      const hubwallet = await deriveUserWalletAddress(
        this.hubProvider,
        spokeProvider.chainConfig.chain.id,
        walletAddress,
      );
      let recipient = hubwallet;
      if (depositParams.dstProvider) {
        recipient = await deriveUserWalletAddress(
          this.hubProvider,
          depositParams.dstProvider.chainConfig.chain.id,
          walletAddress,
        );
      }
      const calls = await this.getTokenWrapAction(
        depositParams.asset,
        spokeProvider.chainConfig.chain.id,
        depositParams.amount,
        depositParams.poolToken,
        recipient,
      );
      const data: Hex = encodeContractCalls(calls);
      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          token: depositParams.asset,
          amount: depositParams.amount,
          data,
        } satisfies GetSpokeDepositParamsType<SpokeProvider> as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: abstractedWalletAddress,
          payload: data,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_DEPOSIT_INTENT_FAILED',
          data: {
            error: error,
            payload: depositParams,
          },
        },
      };
    }
  }

  /**
   * Execute withdraw action - withdraws tokens from a position
   */
  public async executeWithdraw<S extends SpokeProvider, R extends boolean = false>({
    withdrawParams,
    spokeProvider,
    raw,
  }: Prettify<AssetWithdrawParams<S> & OptionalRaw<R>>): Promise<
    Result<TxReturnType<S, R>, AssetServiceError<'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'>> & RelayOptionalExtraData
  > {
    invariant(withdrawParams.amount > 0n, 'Amount must be greater than 0');
    invariant(withdrawParams.asset.length > 0, 'Source asset is required');
    invariant(withdrawParams.poolToken.length > 0, 'Pool token is required');

    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const hubwallet = await deriveUserWalletAddress(
      this.hubProvider,
      spokeProvider.chainConfig.chain.id,
      walletAddress,
    );
    let recipient = hubwallet;
    let dstChainId = spokeProvider.chainConfig.chain.id;
    if (withdrawParams.dstProvider) {
      recipient = await deriveUserWalletAddress(
        this.hubProvider,
        withdrawParams.dstProvider.chainConfig.chain.id,
        walletAddress,
      );
      dstChainId = withdrawParams.dstProvider.chainConfig.chain.id;
    }

    const calls = await this.getTokenUnwrapAction(
      dstChainId,
      withdrawParams.asset,
      withdrawParams.amount,
      hubwallet,
      encodeAddress(dstChainId, recipient),
    );

    const data = encodeContractCalls(calls);

    const txResult = await SpokeService.callWallet(hubwallet, data, spokeProvider, this.hubProvider, raw);
    return {
      ok: true,
      value: txResult as TxReturnType<S, R>,
      data: {
        address: recipient,
        payload: data,
      },
    };
  }

  /**
   * Deposit tokens and wait for the transaction to be relayed to the hub.
   *
   * This method wraps {@link executeDeposit} and performs post-processing to relay
   * the resulting transaction to the hub. It returns both the spoke chain
   * transaction hash and the hub transaction hash (post-relay).
   *
   * @typeParam S - The type of SpokeProvider.
   * @param params - Parameters for the deposit operation:
   *   - depositParams: Parameters for the deposit intent (asset, amount, poolToken, etc).
   *   - spokeProvider: The spoke provider instance (EvmSpokeProvider or SonicSpokeProvider).
   *   - timeout (optional): Timeout in ms to wait for hub relay (default: 60000).
   *
   * @returns A promise that resolves to a {@link Result} containing a tuple with
   * [spokeTxHash, hubTxHash] as value on success, or an {@link AssetServiceError} on failure.
   *
   * @example
   * const result = await assetService.deposit({
   *   depositParams: {
   *     asset: '0x...',      // asset address
   *     amount: 1000n,       // amount to deposit
   *     poolToken: '0x...',  // pool token address
   *   },
   *   spokeProvider,          // instance of EvmSpokeProvider or SonicSpokeProvider
   *   timeout: 30000,         // optional, in ms
   * });
   *
   * if (!result.ok) {
   *   // handle error
   * } else {
   *   const [spokeTxHash, hubTxHash] = result.value;
   *   console.log('Deposit transaction hashes:', { spokeTxHash, hubTxHash });
   * }
   */
  public async deposit<S extends SpokeProvider>({
    depositParams,
    spokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<DepositParams<S> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>
  > {
    try {
      const txResult = await this.executeDeposit({ depositParams, spokeProvider, raw: false });

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
          spokeProvider,
          this.relayerApiEndpoint,
          timeout,
        );

        if (!packetResult.ok) {
          return {
            ok: false,
            error: {
              code: packetResult.error.code,
              data: {
                error: packetResult.error,
                payload: txResult.value,
              } as GetAssetServiceError<'SUBMIT_TX_FAILED'>,
            },
          };
        }

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DEPOSIT_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: depositParams,
          },
        },
      };
    }
  }

  /**
   * Withdraw and wait for the transaction to be relayed to the hub
   * This method wraps executeWithdraw and relays the transaction to the hub
   *
   * @example
   * const result = await assetService.withdraw(
   *   {
   *     asset: '0x...', // asset address
   *     amount: 1000n, // amount to withdraw
   *     poolToken: '0x...', // pool token address
   *   },
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   *   30000 // Optional timeout in milliseconds (default: 60000)
   * );
   *
   * if (!result.ok) {
   *   // Handle error
   * }
   *
   * const [spokeTxHash, hubTxHash] = result.value;
   * console.log('Withdraw transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async withdraw<S extends SpokeProvider>({
    withdrawParams,
    spokeProvider,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  }: Prettify<AssetWithdrawParams<S> & OptionalTimeout>): Promise<
    Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>
  > {
    try {
      const txResult = await this.executeWithdraw({ withdrawParams, spokeProvider, raw: false });

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
          spokeProvider,
          this.relayerApiEndpoint,
          timeout,
        );

        if (!packetResult.ok) {
          return {
            ok: false,
            error: {
              code: packetResult.error.code,
              data: {
                error: packetResult.error,
                payload: txResult.value,
              } as GetAssetServiceError<'SUBMIT_TX_FAILED'>,
            },
          };
        }

        intentTxHash = packetResult.value.dst_tx_hash;
      } else {
        intentTxHash = txResult.value;
      }

      return { ok: true, value: [txResult.value, intentTxHash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DEPOSIT_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: withdrawParams,
          },
        },
      };
    }
  }

  public async getTokenWrapAction(
    address: OriginalAssetAddress,
    spokeChainId: SpokeChainId,
    amount: bigint,
    poolToken: Address,
    recipient: Address,
  ): Promise<EvmContractCall[]> {
    const assetConfig = this.configService.getHubAssetInfo(spokeChainId, address);
    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    const calls: EvmContractCall[] = [];
    calls.push(Erc20Service.encodeApprove(assetConfig.asset, assetConfig.vault, amount));
    calls.push(EvmVaultTokenService.encodeDeposit(assetConfig.vault, assetConfig.asset, amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, amount);

    if (poolToken.toLowerCase() === assetConfig.vault.toLowerCase()) {
      return calls;
    }

    const dexToken: Address = await this.hubProvider.publicClient.readContract({
      address: this.config.concentratedLiquidityConfig.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    invariant(dexToken === poolToken, 'Dex token does not match pool token');

    calls.push(Erc20Service.encodeApprove(assetConfig.vault, dexToken, translatedAmount));
    calls.push(Erc4626Service.encodeDeposit(dexToken, translatedAmount, recipient));
    return calls;
  }

  /**
   * Get the token unwrap action for a given asset
   * @param address - The address of the asset
   * @param spokeChainId - The spoke chain id
   * @param amount - The amount of the wrapped assets
   * @param userAddress - The address of the user wallet
   * @param recipient - The address of the recipient
   * @returns The token unwrap action
   */
  public async getTokenUnwrapAction(
    spokeChainId: SpokeChainId,
    address: OriginalAssetAddress,
    amount: bigint,
    userAddress: Address,
    recipient: Hex,
  ): Promise<EvmContractCall[]> {
    const assetConfig = this.configService.getHubAssetInfo(spokeChainId, address);
    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    let dexToken: Address = await this.hubProvider.publicClient.readContract({
      address: this.config.concentratedLiquidityConfig.stataTokenFactory,
      abi: stataTokenFactoryAbi,
      functionName: 'getStataToken',
      args: [assetConfig.vault],
    });

    if (SodaTokens.bnUSD.address.toLowerCase() === assetConfig.vault.toLowerCase()) {
      dexToken = assetConfig.vault;
    }

    const calls: EvmContractCall[] = [];
    let vaultAmount = amount;
    if (
      SodaTokens.bnUSD.address.toLowerCase() !== assetConfig.vault.toLowerCase() &&
      dexToken.toLowerCase() !== '0x0000000000000000000000000000000000000000'
    ) {
      vaultAmount = await this.getUnwrappedAmount(dexToken, amount);
      calls.push(Erc4626Service.encodeRedeem(dexToken, amount, userAddress, userAddress));
    }

    calls.push(EvmVaultTokenService.encodeWithdraw(assetConfig.vault, assetConfig.asset, vaultAmount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, vaultAmount);

    if (spokeChainId === SONIC_MAINNET_CHAIN_ID) {
      calls.push(Erc20Service.encodeTransfer(assetConfig.asset, recipient, translatedAmount));
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetConfig.asset,
          recipient,
          translatedAmount,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return calls;
  }

  /**
   * Helper method to convert assets to shares (wrapped amount)
   * EX BTC -> BTC deposited in moneymarket earning intrest.
   * @param dexToken - The ERC4626 token address
   * @param assetAmount - The amount of underlying assets
   * @returns The equivalent amount of shares
   */
  public async getWrappedAmount(dexToken: Address, assetAmount: bigint): Promise<bigint> {
    const shares = await Erc4626Service.convertToShares(dexToken, assetAmount, this.hubProvider);
    if (!shares.ok) {
      throw new Error('[getWrappedAmount] Failed to convert amount to shares');
    }
    return shares.value;
  }

  /**
   * Helper method to convert shares to assets (unwrapped amount)
   * EX  BTC deposited in moneymarket earning intrest -> BTC.
   * @param dexToken - The ERC4626 token address
   * @param shareAmount - The amount of shares
   * @returns The equivalent amount of underlying assets
   */
  public async getUnwrappedAmount(dexToken: Address, shareAmount: bigint): Promise<bigint> {
    const assetAmount = await Erc4626Service.convertToAssets(dexToken, shareAmount, this.hubProvider);
    if (!assetAmount.ok) {
      throw new Error('[getUnwrappedAmount] Failed to convert amount to assets');
    }
    return assetAmount.value;
  }

  public async getDeposit(poolToken: Address, spokeProvider: SpokeProvider): Promise<bigint> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const hubwallet = await deriveUserWalletAddress(
      this.hubProvider,
      spokeProvider.chainConfig.chain.id,
      walletAddress,
    );

    return await this.hubProvider.publicClient.readContract({
      address: poolToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [hubwallet],
    });
  }
}
