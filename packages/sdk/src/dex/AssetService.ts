import type { SpokeTxHash } from './../shared/types.js';
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
} from '../index.js';
import {
  SodaTokens,
  SONIC_MAINNET_CHAIN_ID,
  type ConcentratedLiquidityConfig,
  type HttpUrl,
  type OriginalAssetAddress,
  type SpokeChainId,
} from '@sodax/types';
import { erc20Abi, isAddress } from 'viem';
import invariant from 'tiny-invariant';
import { getConcentratedLiquidityConfig } from '../shared/constants.js';
import { stataTokenFactoryAbi } from '../shared/abis/stataTokenFactory.abi.js';
import { type EvmHubProvider, EvmSpokeProvider, type SonicSpokeProvider } from '../shared/entities/Providers.js';
import type { GetAddressType, GetSpokeDepositParamsType, HubTxHash } from '../shared/types.js';

// Local type definitions
export type AssetServiceConfig = {
  concentratedLiquidityConfig: ConcentratedLiquidityConfig;
};

type AssetServiceConfigParams = AssetServiceConfig;

export type AssetWithdrawParams = {
  poolToken: Address;
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of asset to withdraw
  dstProvider?: SpokeProvider;
};

export type DepositParams = {
  asset: OriginalAssetAddress; // asset address
  amount: bigint; // amount of token to deposit
  poolToken: Address;
  dstProvider?: SpokeProvider;
};

export type AssetServiceUnknownErrorCode = 'DEPOSIT_UNKNOWN_ERROR' | 'ALLOWANCE_CHECK_FAILED' | 'APPROVAL_FAILED';

export type GetAssetServiceParams<T extends AssetServiceUnknownErrorCode> = T extends 'DEPOSIT_UNKNOWN_ERROR'
  ? DepositParams
  : T extends 'ALLOWANCE_CHECK_FAILED'
    ? DepositParams
    : T extends 'APPROVAL_FAILED'
      ? DepositParams
      : never;

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
  payload: DepositParams;
};

export type AssetServiceWithdrawFailedError = {
  error: unknown;
  payload: AssetWithdrawParams;
};

export type AssetServiceAllowanceCheckFailedError = {
  error: unknown;
  payload: DepositParams;
};

export type AssetServiceApprovalFailedError = {
  error: unknown;
  payload: DepositParams;
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
   * Checks if the allowance is valid for deposit actions.
   * @param params - The parameters for the asset transaction.
   * @param spokeProvider - The spoke provider.
   * @returns {Promise<Result<boolean>>} - Returns the result of the allowance check or error
   *
   * @example
   * const result = await assetService.isAllowanceValid(
   *   {
   *     asset: '0x...', // asset address
   *     amount: 1000n, // amount to deposit
   *   },
   *   spokeProvider, // EvmSpokeProvider or SonicSpokeProvider instance
   * );
   *
   */
  public async isAllowanceValid(
    params: DepositParams,
    spokeProvider: SpokeProvider,
  ): Promise<Result<boolean, AssetServiceError<'ALLOWANCE_CHECK_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      // For regular EVM chains (non-Sonic), check ERC20 allowance against assetManager
      if (!(spokeProvider instanceof EvmSpokeProvider)) {
        return {
          ok: true,
          value: true,
        };
      }

      invariant(isAddress(params.asset), 'Invalid source asset address for EVM chain');

      const allowanceResult = await Erc20Service.isAllowanceValid(
        params.asset,
        params.amount,
        walletAddress as GetAddressType<EvmSpokeProvider>,
        spokeProvider.chainConfig.addresses.assetManager as Address,
        spokeProvider as EvmSpokeProvider | SonicSpokeProvider,
      );

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
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    params: DepositParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, AssetServiceError<'APPROVAL_FAILED'>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.asset.length > 0, 'Source asset is required');

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
          value: result as TxReturnType<S, R>,
        };
      }

      // For non-EVM chains, approval is not needed
      return {
        ok: true,
        value: null as unknown as TxReturnType<S, R>,
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
  public async executeDeposit<S extends SpokeProvider, R extends boolean = false>(
    params: DepositParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, AssetServiceError<'CREATE_DEPOSIT_INTENT_FAILED'>>> {
    try {
      //TODO invariants
      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
      const hubwallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);
      let recipient = hubwallet;
      if (params.dstProvider) {
        recipient = await deriveUserWalletAddress(params.dstProvider, this.hubProvider, walletAddress);
      }
      const calls = await this.getTokenWrapAction(
        params.asset,
        spokeProvider.chainConfig.chain.id,
        params.amount,
        params.poolToken,
        recipient,
      );

      const txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          token: params.asset,
          amount: params.amount,
          data: encodeContractCalls(calls),
        } satisfies GetSpokeDepositParamsType<SpokeProvider> as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return { ok: true, value: txResult as TxReturnType<S, R> };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'CREATE_DEPOSIT_INTENT_FAILED',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Execute withdraw action - withdraws tokens from a position
   */
  public async executeWithdraw<S extends SpokeProvider, R extends boolean = false>(
    params: AssetWithdrawParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, AssetServiceError<'CREATE_WITHDRAW_LIQUIDITY_INTENT_FAILED'>>> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const hubwallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);
    let recipient = hubwallet;
    let dstChainId = spokeProvider.chainConfig.chain.id;
    if (params.dstProvider) {
      recipient = await deriveUserWalletAddress(params.dstProvider, this.hubProvider, walletAddress);
      dstChainId = params.dstProvider.chainConfig.chain.id;
    }

    const calls = await this.getTokenUnwrapAction(
      dstChainId,
      params.asset,
      params.amount,
      hubwallet,
      encodeAddress(dstChainId, recipient),
    );

    const data = encodeContractCalls(calls);

    const txResult = await SpokeService.callWallet(hubwallet, data, spokeProvider, this.hubProvider, raw);
    return { ok: true, value: txResult as TxReturnType<S, R> };
  }

  /**
   * Deposit and wait for the transaction to be relayed to the hub
   * This method wraps executeDeposit and relays the transaction to the hub
   *
   * @example
   * const result = await assetService.deposit(
   *   {
   *     asset: '0x...', // asset address
   *     amount: 1000n, // amount to deposit
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
   * console.log('Deposit transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async deposit<S extends SpokeProvider>(
    params: DepositParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>> {
    try {
      const txResult = await this.executeDeposit(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? undefined : undefined,
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

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DEPOSIT_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
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
  public async withdraw<S extends SpokeProvider>(
    params: AssetWithdrawParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>> {
    try {
      const txResult = await this.executeWithdraw(params, spokeProvider, false);

      if (!txResult.ok) {
        return txResult as Result<[SpokeTxHash, HubTxHash], AssetServiceError<AssetServiceErrorCode>>;
      }

      const packetResult = await relayTxAndWaitPacket(
        txResult.value,
        spokeProvider instanceof SolanaSpokeProvider ? undefined : undefined,
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

      return { ok: true, value: [txResult.value, packetResult.value.dst_tx_hash] };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DEPOSIT_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
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
      // TODO add sonic support
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
    const hubwallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

    return await this.hubProvider.publicClient.readContract({
      address: poolToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [hubwallet],
    });
  }
}
