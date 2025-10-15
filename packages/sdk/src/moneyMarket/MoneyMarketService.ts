import { type Hex, encodeFunctionData, isAddress } from 'viem';
import type { HttpUrl } from '@sodax/types';
import { poolAbi } from '../abis/pool.abi.js';
import type { EvmHubProvider, SpokeProvider } from '../entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  getHubAssetInfo,
  getMoneyMarketConfig,
  getSupportedMoneyMarketTokens,
  isConfiguredMoneyMarketConfig,
  isValidOriginalAssetAddress,
  isValidSpokeChainId,
  moneyMarketReserveAssets,
  SpokeService,
  relayTxAndWaitPacket,
  type RelayErrorCode,
  DEFAULT_RELAY_TX_TIMEOUT,
  EvmSpokeProvider,
  isMoneyMarketSupportedToken,
  spokeChainConfig,
  SonicSpokeProvider,
  SonicSpokeService,
  SolanaSpokeProvider,
  type RelayError,
  StellarSpokeProvider,
} from '../index.js';
import type {
  EvmContractCall,
  EvmReturnType,
  GetAddressType,
  GetEstimateGasReturnType,
  GetSpokeDepositParamsType,
  HubTxHash,
  MoneyMarketConfigParams,
  MoneyMarketServiceConfig,
  PromiseTxReturnType,
  Result,
  SpokeTxHash,
  TxReturnType,
} from '../types.js';
import { calculateFeeAmount, deriveUserWalletAddress, encodeAddress, encodeContractCalls } from '../utils/index.js';
import { EvmAssetManagerService, EvmVaultTokenService } from '../services/hub/index.js';
import { Erc20Service } from '../services/shared/index.js';
import invariant from 'tiny-invariant';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, type Token, type Address } from '@sodax/types';
import { wrappedSonicAbi } from '../abis/wrappedSonic.abi.js';
import { MoneyMarketDataService } from './MoneyMarketDataService.js';
import { StellarSpokeService } from '../services/spoke/StellarSpokeService.js';

export type MoneyMarketEncodeSupplyParams = {
  asset: Address; // The address of the asset to supply.
  amount: bigint; // The amount of the asset to supply.
  onBehalfOf: Address; // The address on whose behalf the asset is supplied.
  referralCode: number; // The referral code for the transaction.
};

export type MoneyMarketEncodeWithdrawParams = {
  asset: Address; // The address of the asset to withdraw.
  amount: bigint; // The amount of the asset to withdraw.
  to: Address; // The address that will receive the withdrawn assets.
};

export type MoneyMarketEncodeBorrowParams = {
  asset: Address; // The address of the asset to borrow.
  amount: bigint; // The amount of the asset to borrow.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  referralCode: number; // The referral code for the borrow transaction.
  onBehalfOf: Address; // The address that will receive the borrowed assets.
};

export type MoneyMarketEncodeRepayParams = {
  asset: Address; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  onBehalfOf: Address; // The address that will get their debt reduced/removed.
};

export type MoneyMarketEncodeRepayWithATokensParams = {
  asset: Address; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
};

export type MoneyMarketAction = 'supply' | 'borrow' | 'withdraw' | 'repay';

export type MoneyMarketSupplyParams = {
  token: string; // spoke chain token address
  amount: bigint; // The amount of the asset to supply.
  action: 'supply';
};

export type MoneyMarketBorrowParams = {
  token: string; // spoke chain token address
  amount: bigint; // The amount of the asset to borrow.
  action: 'borrow';
};

export type MoneyMarketWithdrawParams = {
  token: string; // spoke chain token address
  amount: bigint; // The amount of the asset to withdraw.
  action: 'withdraw';
};

export type MoneyMarketRepayParams = {
  token: string; // spoke chain token address
  amount: bigint; // The amount of the asset to repay.
  action: 'repay';
};

export type MoneyMarketParams =
  | MoneyMarketSupplyParams
  | MoneyMarketBorrowParams
  | MoneyMarketWithdrawParams
  | MoneyMarketRepayParams;

export type MoneyMarketUnknownErrorCode =
  | 'SUPPLY_UNKNOWN_ERROR'
  | 'BORROW_UNKNOWN_ERROR'
  | 'WITHDRAW_UNKNOWN_ERROR'
  | 'REPAY_UNKNOWN_ERROR';

export type GetMoneyMarketParams<T extends MoneyMarketUnknownErrorCode> = T extends 'SUPPLY_UNKNOWN_ERROR'
  ? MoneyMarketSupplyParams
  : T extends 'BORROW_UNKNOWN_ERROR'
    ? MoneyMarketBorrowParams
    : T extends 'WITHDRAW_UNKNOWN_ERROR'
      ? MoneyMarketWithdrawParams
      : T extends 'REPAY_UNKNOWN_ERROR'
        ? MoneyMarketRepayParams
        : never;

export type MoneyMarketErrorCode =
  | MoneyMarketUnknownErrorCode
  | RelayErrorCode
  | 'CREATE_SUPPLY_INTENT_FAILED'
  | 'CREATE_BORROW_INTENT_FAILED'
  | 'CREATE_WITHDRAW_INTENT_FAILED'
  | 'CREATE_REPAY_INTENT_FAILED';

export type MoneyMarketUnknownError<T extends MoneyMarketUnknownErrorCode> = {
  error: unknown;
  payload: GetMoneyMarketParams<T>;
};

export type MoneyMarketSubmitTxFailedError = {
  error: RelayError;
  payload: SpokeTxHash;
};

export type MoneyMarketSupplyFailedError = {
  error: unknown;
  payload: MoneyMarketSupplyParams;
};

export type MoneyMarketBorrowFailedError = {
  error: unknown;
  payload: MoneyMarketBorrowParams;
};

export type MoneyMarketWithdrawFailedError = {
  error: unknown;
  payload: MoneyMarketWithdrawParams;
};

export type MoneyMarketRepayFailedError = {
  error: unknown;
  payload: MoneyMarketRepayParams;
};

export type GetMoneyMarketError<T extends MoneyMarketErrorCode> = T extends 'SUBMIT_TX_FAILED'
  ? MoneyMarketSubmitTxFailedError
  : T extends 'RELAY_TIMEOUT'
    ? MoneyMarketSubmitTxFailedError
    : T extends 'CREATE_SUPPLY_INTENT_FAILED'
      ? MoneyMarketSupplyFailedError
      : T extends 'CREATE_BORROW_INTENT_FAILED'
        ? MoneyMarketBorrowFailedError
        : T extends 'CREATE_WITHDRAW_INTENT_FAILED'
          ? MoneyMarketWithdrawFailedError
          : T extends 'CREATE_REPAY_INTENT_FAILED'
            ? MoneyMarketRepayFailedError
            : T extends MoneyMarketUnknownErrorCode
              ? MoneyMarketUnknownError<T>
              : never;

export type MoneyMarketError<T extends MoneyMarketErrorCode> = {
  code: T;
  data: GetMoneyMarketError<T>;
};

export type MoneyMarketExtraData = { address: Hex; payload: Hex };
export type MoneyMarketOptionalExtraData = { data?: MoneyMarketExtraData };

export class MoneyMarketService {
  public readonly config: MoneyMarketServiceConfig;
  private readonly hubProvider: EvmHubProvider;
  public readonly data: MoneyMarketDataService;

  constructor(
    config: MoneyMarketConfigParams | undefined,
    hubProvider: EvmHubProvider,
    relayerApiEndpoint?: HttpUrl,
  ) {
    if (!config) {
      this.config = {
        ...getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID), // default to mainnet config
        partnerFee: undefined,
        relayerApiEndpoint: relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT,
      };
    } else if (isConfiguredMoneyMarketConfig(config)) {
      this.config = {
        ...config,
        partnerFee: config.partnerFee,
        relayerApiEndpoint: relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT,
      };
    } else {
      this.config = {
        ...getMoneyMarketConfig(hubProvider.chainConfig.chain.id), // default to mainnet config
        partnerFee: config.partnerFee,
        relayerApiEndpoint: relayerApiEndpoint ?? DEFAULT_RELAYER_API_ENDPOINT,
      };
    }
    this.hubProvider = hubProvider;
    this.data = new MoneyMarketDataService(hubProvider);
  }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public static async estimateGas<T extends SpokeProvider = SpokeProvider>(
    params: TxReturnType<T, true>,
    spokeProvider: T,
  ): Promise<GetEstimateGasReturnType<T>> {
    return SpokeService.estimateGas(params, spokeProvider) as Promise<GetEstimateGasReturnType<T>>;
  }

  /**
   * Check if allowance is sufficient for actions on the money market pool
   * @param {MoneyMarketParams} params - Money market params containing token address and amount
   * @param {SpokeProvider} spokeProvider - The spoke provider instance
   * @return {Promise<Result<boolean>>} - Returns true if allowance is sufficient, false otherwise
   *
   * @example
   * const allowanceValid = await isAllowanceValid({
   *   token: '0x...', // Address of the token (spoke chain) to supply
   *   amount: 1000n, // Amount to supply (in token decimals)
   *   action: 'supply',
   * }, spokeProvider);
   *
   * if (!allowanceValid.ok) {
   *   // Handle error
   * }
   *
   * if (!allowanceValid.value) {
   *   // Need to approve
   * }
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: MoneyMarketParams,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.token.length > 0, 'Token is required');
      invariant(
        isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
        `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
      );

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (spokeProvider instanceof StellarSpokeProvider && (params.action === 'supply' || params.action === 'repay')) {
        return {
          ok: true,
          value: await StellarSpokeService.hasSufficientTrustline(params.token, params.amount, spokeProvider),
        };
      }
      if (spokeProvider instanceof EvmSpokeProvider && (params.action === 'supply' || params.action === 'repay')) {
        return await Erc20Service.isAllowanceValid(
          params.token as GetAddressType<EvmSpokeProvider>,
          params.amount,
          walletAddress as GetAddressType<EvmSpokeProvider>,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
        );
      }
      if (
        spokeProvider instanceof SonicSpokeProvider &&
        spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id
      ) {
        if (params.action === 'withdraw') {
          const withdrawInfo = await SonicSpokeService.getWithdrawInfo(
            params.token as GetAddressType<SonicSpokeProvider>,
            params.amount,
            spokeProvider,
            this.data,
          );
          return await SonicSpokeService.isWithdrawApproved(
            walletAddress as GetAddressType<SonicSpokeProvider>,
            withdrawInfo,
            spokeProvider,
          );
        }
        if (params.action === 'borrow') {
          const borrowInfo = await SonicSpokeService.getBorrowInfo(
            params.token as GetAddressType<SonicSpokeProvider>,
            params.amount,
            spokeProvider.chainConfig.chain.id,
            this.data,
          );
          return await SonicSpokeService.isBorrowApproved(
            walletAddress as GetAddressType<SonicSpokeProvider>,
            borrowInfo,
            spokeProvider,
          );
        }
        if (params.action === 'supply' || params.action === 'repay') {
          const userRouter = await SonicSpokeService.getUserRouter(
            walletAddress as GetAddressType<SonicSpokeProvider>,
            spokeProvider,
          );

          return await Erc20Service.isAllowanceValid(
            params.token as GetAddressType<SonicSpokeProvider>,
            params.amount,
            walletAddress as GetAddressType<SonicSpokeProvider>,
            userRouter,
            spokeProvider,
          );
        }
      }

      return {
        ok: true,
        value: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Approve amount spending if isAllowanceValid returns false.
   * For evm spoke chains, the spender is the asset manager contract while
   * for sonic spoke (hub) chain, the spender is the user router contract.
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param spender - Spender address
   * @param spokeProvider - Spoke provider
   * @returns {Promise<Result<TxReturnType<S, R>>>} - Returns the transaction receipt
   *
   * @example
   * const approveResult = await approve(
   *   {
   *     token: '0x...', // ERC20 token address
   *     amount: 1000n, // Amount to approve (in token decimals)
   *     action: 'supply', // Action to perform
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = execute and return the transaction hash (default: false)
   * );
   *
   * if (!approveResult.ok) {
   *   // Handle error
   * }
   *
   * const txReceipt = approveResult.value;
   */
  public async approve<S extends SpokeProvider, R extends boolean = false>(
    params: MoneyMarketParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.token.length > 0, 'Token is required');
      invariant(
        isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
        `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
      );

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (spokeProvider instanceof StellarSpokeProvider) {
        invariant(
          params.action === 'supply' || params.action === 'repay',
          'Invalid action (only supply and repay are supported on stellar)',
        );

        const result = await StellarSpokeService.requestTrustline(params.token, params.amount, spokeProvider, raw);
        return {
          ok: true,
          value: result satisfies TxReturnType<StellarSpokeProvider, R> as TxReturnType<S, R>,
        };
      }

      if (spokeProvider instanceof EvmSpokeProvider) {
        invariant(
          params.action === 'supply' || params.action === 'repay',
          'Invalid action (only supply and repay are supported on evm)',
        );
        invariant(isAddress(params.token), 'Invalid token address');

        const result = (await Erc20Service.approve(
          params.token,
          params.amount,
          spokeProvider.chainConfig.addresses.assetManager,
          spokeProvider,
          raw,
        )) satisfies TxReturnType<EvmSpokeProvider, R> as TxReturnType<S, R>;

        return {
          ok: true,
          value: result,
        };
      }

      if (
        spokeProvider instanceof SonicSpokeProvider &&
        spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id
      ) {
        invariant(
          params.action === 'withdraw' ||
            params.action === 'borrow' ||
            params.action === 'supply' ||
            params.action === 'repay',
          'Invalid action (only withdraw, borrow, supply and repay are supported on sonic)',
        );
        invariant(isAddress(params.token), 'Invalid token address');

        if (params.action === 'withdraw') {
          const withdrawInfo = await SonicSpokeService.getWithdrawInfo(
            params.token,
            params.amount,
            spokeProvider,
            this.data,
          );

          const result = (await SonicSpokeService.approveWithdraw(
            walletAddress as GetAddressType<SonicSpokeProvider>,
            withdrawInfo,
            spokeProvider,
            raw,
          )) satisfies TxReturnType<SonicSpokeProvider, R> as TxReturnType<S, R>;

          return {
            ok: true,
            value: result,
          };
        }
        if (params.action === 'borrow') {
          const borrowInfo = await SonicSpokeService.getBorrowInfo(
            params.token,
            params.amount,
            spokeProvider.chainConfig.chain.id,
            this.data,
          );

          const result = (await SonicSpokeService.approveBorrow(
            walletAddress as GetAddressType<SonicSpokeProvider>,
            borrowInfo,
            spokeProvider,
            raw,
          )) satisfies TxReturnType<SonicSpokeProvider, R> as TxReturnType<S, R>;

          return {
            ok: true,
            value: result,
          };
        }
        if (params.action === 'supply' || params.action === 'repay') {
          const userRouter = await SonicSpokeService.getUserRouter(
            walletAddress as GetAddressType<SonicSpokeProvider>,
            spokeProvider,
          );

          const result = (await Erc20Service.approve(
            params.token,
            params.amount,
            userRouter,
            spokeProvider,
            raw,
          )) satisfies TxReturnType<EvmSpokeProvider, R> as TxReturnType<S, R>;

          return {
            ok: true,
            value: result,
          };
        }
      }

      return {
        ok: false,
        error: new Error('Approve only supported for EVM spoke chains'),
      };
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  /**
   * Supply tokens to the money market pool, relay the transaction to the hub and submit the intent to the Solver API
   * @param params - The parameters for the supply transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SpokeTxHash, HubTxHash], MoneyMarketError>>} - Returns the transaction result and the hub transaction hash or error
   *
   * @example
   * const result = await moneyMarketService.supply(
   *   {
   *     token: '0x...', // Address of the token (spoke chain address) to supply
   *     amount: 1000n, // Amount to supply (in token decimals)
   *   },
   *   spokeProvider,
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
   * console.log('Supply transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async supply<S extends SpokeProvider>(
    params: MoneyMarketSupplyParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED' | 'SUPPLY_UNKNOWN_ERROR' | RelayErrorCode>
    >
  > {
    try {
      const txResult = await this.createSupplyIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== SONIC_MAINNET_CHAIN_ID) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
          spokeProvider,
          this.config.relayerApiEndpoint,
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
              },
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
          code: 'SUPPLY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create supply intent only (without relay submit to Solver API)
   * NOTE: This method does not submit the intent to the Solver API, it only executes the transaction on the spoke chain
   * In order to successfully supply tokens, you need to:
   * 1. Check if the allowance is sufficient
   * 2. Approve the asset manager contract to spend the tokens
   * 3. Supply the tokens
   * 4. Submit the intent to the Solver API and await it using relayTxAndWaitPacket method
   *
   * @param params - The parameters for the supply transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns {Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>>} - Returns the transaction result.
   *
   * @example
   * const moneyMarketService = new MoneyMarketService(config);
   * const result = await moneyMarketService.createSupplyIntent(
   *   {
   *     token: "0x123...", // token address
   *     amount: 1000000000000000000n // 1 token in wei
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = exeute and return the transaction hash (default: false)
   * );
   *
   * if (result.ok) {
   *   const txHash = result.value;
   *   console.log('Supply transaction hash:', txHash);
   * } else {
   *   console.error('Supply failed:', result.error);
   * }
   */
  async createSupplyIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketSupplyParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_SUPPLY_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    try {
      invariant(params.action === 'supply', 'Invalid action');
      invariant(params.token.length > 0, 'Token is required');
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(
        isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
        `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
      );

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      const abstractedWalletAddress = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

      const data: Hex = this.buildSupplyData(
        params.token,
        abstractedWalletAddress,
        params.amount,
        spokeProvider.chainConfig.chain.id,
      );

      let txResult: Awaited<PromiseTxReturnType<S, R>> | EvmReturnType<R>;
      if (
        spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id &&
        spokeProvider instanceof SonicSpokeProvider
      ) {
        txResult = await SonicSpokeService.deposit(
          {
            from: walletAddress as GetAddressType<SonicSpokeProvider>,
            token: params.token as GetAddressType<SonicSpokeProvider>,
            amount: params.amount,
            data,
          },
          spokeProvider,
          raw,
        );
      } else {
        txResult = await SpokeService.deposit(
          {
            from: walletAddress,
            to: abstractedWalletAddress,
            token: params.token,
            amount: params.amount,
            data,
          } as GetSpokeDepositParamsType<S>,
          spokeProvider,
          this.hubProvider,
          raw,
        );
      }

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
          code: 'CREATE_SUPPLY_INTENT_FAILED',
          data: {
            error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Borrow tokens from the money market pool, relay the transaction to the hub and submit the intent to the Solver API
   * @param params - The parameters for the borrow transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SpokeTxHash, HubTxHash], MoneyMarketError>>} - Returns the transaction result and the hub transaction hash or error
   *
   * @example
   * const result = await moneyMarketService.borrow(
   *   {
   *     token: '0x...', // Address of the token (spoke chain address) to borrow
   *     amount: 1000n, // Amount to borrow (in token decimals)
   *   },
   *   spokeProvider,
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
   * console.log('Borrow transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async borrow<S extends SpokeProvider>(
    params: MoneyMarketBorrowParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      MoneyMarketError<'CREATE_BORROW_INTENT_FAILED' | 'BORROW_UNKNOWN_ERROR' | RelayErrorCode>
    >
  > {
    try {
      const txResult = await this.createBorrowIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== SONIC_MAINNET_CHAIN_ID) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
          spokeProvider,
          this.config.relayerApiEndpoint,
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
              },
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
          code: 'BORROW_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create borrow intent only (without relay and submit to Solver API)
   * NOTE: This method does not submit the intent to the Solver API, it only executes the transaction on the spoke chain
   * In order to successfully borrow tokens, you need to:
   * 1. Execute the borrow transaction on the spoke chain
   * 2. Submit the intent to the Solver API and await it using relayTxAndWaitPacket method
   *
   * @param params - The parameters for the borrow transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns {Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>>} - Returns the transaction result (raw transaction data or transaction hash).
   *
   * @example
   * const moneyMarketService = new MoneyMarketService(config);
   * const result = await moneyMarketService.createBorrowIntent(
   *   {
   *     token: "0x123...", // token address
   *     amount: 1000000000000000000n // 1 token in wei
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = execute and return the transaction hash (default: false)
   * );
   *
   * if (result.ok) {
   *   const txHash = result.value;
   *   console.log('Borrow transaction hash:', txHash);
   * } else {
   *   console.error('Borrow failed:', result.error);
   * }
   */
  async createBorrowIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketBorrowParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_BORROW_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    invariant(params.action === 'borrow', 'Invalid action');
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');
    invariant(
      isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
      `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
    );

    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const encodedAddress = encodeAddress(spokeProvider.chainConfig.chain.id, walletAddress);
    const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

    const data: Hex = this.buildBorrowData(
      hubWallet,
      encodedAddress,
      params.token,
      params.amount,
      spokeProvider.chainConfig.chain.id,
    );

    let txResult: TxReturnType<S, R>;
    if (spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id) {
      txResult = await SonicSpokeService.callWallet(data, spokeProvider, raw);
    } else {
      txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);
    }

    return {
      ok: true,
      value: txResult satisfies TxReturnType<S, R>,
      data: {
        address: hubWallet,
        payload: data,
      },
    };
  }

  /**
   * Withdraw tokens from the money market pool, relay the transaction to the hub and submit the intent to the Solver API
   *
   * @param params - The parameters for the withdraw transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SpokeTxHash, HubTxHash], MoneyMarketError>>} - Returns the spoke and hub transaction hashes or error
   *
   * @example
   * const result = await moneyMarketService.withdraw(
   *   {
   *     token: '0x...', // Address of the token (spoke chain address) to withdraw
   *     amount: 1000n, // Amount to withdraw (in token decimals)
   *   },
   *   spokeProvider,
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
   * console.log('Withdraw transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async withdraw<S extends SpokeProvider>(
    params: MoneyMarketWithdrawParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED' | 'WITHDRAW_UNKNOWN_ERROR' | RelayErrorCode>
    >
  > {
    try {
      const txResult = await this.createWithdrawIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== SONIC_MAINNET_CHAIN_ID) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
          spokeProvider,
          this.config.relayerApiEndpoint,
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
              },
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
          code: 'WITHDRAW_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create withdraw intent only (without relay and submit to Solver API)
   * NOTE: This method does not submit the intent to the Solver API, it only executes the transaction on the spoke chain
   * In order to successfully withdraw tokens, you need to:
   * 1. Execute the withdraw transaction on the spoke chain
   * 2. Submit the intent to the Solver API and await it using relayTxAndWaitPacket method
   *
   * @param params - The parameters for the withdraw transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns {Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>>} - Returns the transaction result (raw transaction data or transaction hash).
   *
   * @example
   * const moneyMarketService = new MoneyMarketService(config);
   * const result = await moneyMarketService.createWithdrawIntent(
   *   {
   *     token: "0x123...", // token address
   *     amount: 1000000000000000000n // 1 token in wei
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = exeute and return the transaction hash (default: false)
   * );
   *
   * if (result.ok) {
   *   const txHash = result.value;
   *   console.log('Withdraw transaction hash:', txHash);
   * } else {
   *   console.error('Withdraw failed:', result.error);
   * }
   */
  async createWithdrawIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketWithdrawParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    invariant(params.action === 'withdraw', 'Invalid action');
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');
    invariant(
      isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
      `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
    );

    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const encodedAddress = encodeAddress(spokeProvider.chainConfig.chain.id, walletAddress);
    const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);

    let data: Hex;
    if (spokeProvider instanceof SonicSpokeProvider) {
      const withdrawInfo = await SonicSpokeService.getWithdrawInfo(
        params.token as GetAddressType<SonicSpokeProvider>,
        params.amount,
        spokeProvider,
        this.data,
      );

      data = await SonicSpokeService.buildWithdrawData(
        walletAddress as GetAddressType<SonicSpokeProvider>,
        withdrawInfo,
        params.amount,
        spokeProvider,
        this,
        hubWallet,
      );
    } else {
      data = this.buildWithdrawData(
        hubWallet,
        encodedAddress,
        params.token,
        params.amount,
        spokeProvider.chainConfig.chain.id,
      );
    }

    const txResult =
      spokeProvider instanceof SonicSpokeProvider
        ? await SonicSpokeService.callWallet(data, spokeProvider, raw)
        : await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

    return {
      ok: true,
      value: txResult,
      data: {
        address: hubWallet,
        payload: data,
      },
    };
  }

  /**
   * Repay tokens to the money market pool, relay the transaction to the hub and submit the intent to the Solver API
   *
   * @param params - The parameters for the repay transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 60 seconds.
   * @returns {Promise<Result<[SpokeTxHash, HubTxHash], MoneyMarketError>>} - Returns the spoke and hub transaction hashes or error
   *
   * @example
   * const result = await moneyMarketService.repay(
   *   {
   *     token: '0x...', // Address of the token (spoke chain address) to repay
   *     amount: 1000n, // Amount to repay (in token decimals)
   *   },
   *   spokeProvider,
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
   * console.log('Repay transaction hashes:', { spokeTxHash, hubTxHash });
   */
  public async repay<S extends SpokeProvider>(
    params: MoneyMarketRepayParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<
    Result<
      [SpokeTxHash, HubTxHash],
      MoneyMarketError<'CREATE_REPAY_INTENT_FAILED' | 'REPAY_UNKNOWN_ERROR' | RelayErrorCode>
    >
  > {
    try {
      const txResult = await this.createRepayIntent(params, spokeProvider);

      if (!txResult.ok) {
        return txResult;
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id !== SONIC_MAINNET_CHAIN_ID) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          spokeProvider instanceof SolanaSpokeProvider ? txResult.data : undefined,
          spokeProvider,
          this.config.relayerApiEndpoint,
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
              },
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
          code: 'REPAY_UNKNOWN_ERROR',
          data: {
            error: error,
            payload: params,
          },
        },
      };
    }
  }

  /**
   * Create repay intent only (without relay and submit to Solver API)
   * NOTE: This method does not submit the intent to the Solver API, it only executes the transaction on the spoke chain
   * In order to successfully repay tokens, you need to:
   * 1. Check if the allowance is sufficient
   * 2. Approve the asset manager contract to spend the tokens
   * 3. Execute the repay transaction on the spoke chain
   * 4. Submit the intent to the Solver API and await it using relayTxAndWaitPacket method
   *
   * @param params - The parameters for the repay transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns {Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>>} The transaction result (raw transaction data or transaction hash) or error.
   *
   * @example
   * const moneyMarketService = new MoneyMarketService(config);
   * const result = await moneyMarketService.createRepayIntent(
   *   {
   *     token: "0x123...", // token address
   *     amount: 1000000000000000000n // 1 token in wei
   *   },
   *   spokeProvider,
   *   raw // Optional: true = return the raw transaction data, false = exeute and return the transaction hash (default: false)
   * );
   *
   * if (result.ok) {
   *   const txHash = result.value;
   *   console.log('Repay transaction hash:', txHash);
   * } else {
   *   console.error('Repay failed:', result.error);
   * }
   */
  async createRepayIntent<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketRepayParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_REPAY_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    invariant(params.action === 'repay', 'Invalid action');
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');
    invariant(
      isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
      `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
    );

    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
    const hubWallet = await deriveUserWalletAddress(spokeProvider, this.hubProvider, walletAddress);
    const data: Hex = this.buildRepayData(params.token, hubWallet, params.amount, spokeProvider.chainConfig.chain.id);

    let txResult: Awaited<PromiseTxReturnType<S, R>> | EvmReturnType<R>;
    if (
      spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id &&
      spokeProvider instanceof SonicSpokeProvider
    ) {
      txResult = await SonicSpokeService.deposit(
        {
          from: walletAddress as GetAddressType<SonicSpokeProvider>,
          token: params.token as GetAddressType<SonicSpokeProvider>,
          amount: params.amount,
          data,
        },
        spokeProvider,
        raw,
      );
    } else {
      txResult = await SpokeService.deposit(
        {
          from: walletAddress,
          to: hubWallet,
          token: params.token,
          amount: params.amount,
          data,
        } as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );
    }

    return {
      ok: true,
      value: txResult as TxReturnType<S, R>,
      data: {
        address: hubWallet,
        payload: data,
      },
    };
  }

  /**
   * Build transaction data for supplying to the money market pool
   * @param token - The address of the token on spoke chain
   * @param to - The user wallet address on the hub chain
   * @param amount - The amount to deposit
   * @param spokeChainId - The chain ID of the spoke chain
   * @returns {Hex} The transaction data.
   */
  public buildSupplyData(token: string, to: Address, amount: bigint, spokeChainId: SpokeChainId): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(spokeChainId, token);

    invariant(assetConfig, `hub asset not found for spoke chain token (token): ${token}`);

    const assetAddress = assetConfig.asset;
    const vaultAddress = assetConfig.vault;
    const lendingPool = this.config.lendingPool;

    calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
    calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, amount);
    calls.push(Erc20Service.encodeApprove(vaultAddress, lendingPool, translatedAmount));
    calls.push(
      MoneyMarketService.encodeSupply(
        { asset: vaultAddress, amount: translatedAmount, onBehalfOf: to, referralCode: 0 },
        lendingPool,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for borrowing from the money market pool
   * @param from - The user wallet address on the hub chain
   * @param to - The user wallet address on the spoke chain
   * @param token - The address of the token to borrow
   * @param amount - The amount to borrow in hub chain decimals
   * @param spokeChainId - The chain ID of the spoke chain
   * @returns {Hex} The transaction data.
   */
  public buildBorrowData(
    from: Address,
    to: Address | Hex,
    token: string,
    amount: bigint,
    spokeChainId: SpokeChainId,
  ): Hex {
    invariant(isValidSpokeChainId(spokeChainId), `Invalid spokeChainId: ${spokeChainId}`);
    invariant(
      isValidOriginalAssetAddress(spokeChainId, token),
      `Unsupported spoke chain (${spokeChainId}) token: ${token}`,
    );

    const assetConfig = getHubAssetInfo(spokeChainId, token);

    invariant(assetConfig, `hub asset not found for spoke chain token (token): ${token}`);

    const assetAddress = assetConfig.asset;
    const vaultAddress = assetConfig.vault;
    const bnUSDVault = this.config.bnUSDVault;
    const bnUSD = this.config.bnUSD;

    const feeAmount = calculateFeeAmount(amount, this.config.partnerFee);
    const calls: EvmContractCall[] = [];

    if (bnUSDVault && bnUSD && bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      calls.push(
        MoneyMarketService.encodeBorrow(
          { asset: bnUSD, amount: amount, interestRateMode: 2n, referralCode: 0, onBehalfOf: from },
          this.config.lendingPool,
        ),
      );
      calls.push(Erc20Service.encodeApprove(bnUSD, bnUSDVault, amount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, bnUSD, amount));

      if (this.config.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTransfer(bnUSDVault, this.config.partnerFee.address, feeAmount));
      }
    } else {
      calls.push(
        MoneyMarketService.encodeBorrow(
          { asset: vaultAddress, amount: amount, interestRateMode: 2n, referralCode: 0, onBehalfOf: from },
          this.config.lendingPool,
        ),
      );

      if (this.config.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTransfer(vaultAddress, this.config.partnerFee.address, feeAmount));
      }
    }

    calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, amount - feeAmount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(assetConfig.decimal, amount - feeAmount);

    if (spokeChainId === this.hubProvider.chainConfig.chain.id) {
      if (token.toLowerCase() === spokeChainConfig[this.hubProvider.chainConfig.chain.id].nativeToken.toLowerCase()) {
        const withdrawToCall = {
          address: assetAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [to, translatedAmountOut],
          }),
        };

        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetAddress, to, translatedAmountOut));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetAddress,
          to,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for withdrawing from the money market pool
   * @param from - The user wallet address on the hub chain
   * @param to - The user wallet address on the spoke chain
   * @param token - The address of the token to borrow
   * @param amount - The amount to borrow in hub chain decimals
   * @param spokeChainId - The chain ID of the spoke chain
   * @returns {Hex} The transaction data.
   */
  public buildWithdrawData(from: Address, to: Address, token: string, amount: bigint, spokeChainId: SpokeChainId): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(spokeChainId, token);

    if (!assetConfig) {
      throw new Error('[withdrawData] Hub asset not found');
    }

    const assetAddress = assetConfig.asset;
    const vaultAddress = assetConfig.vault;

    if (!assetAddress || !vaultAddress) {
      throw new Error('Address not found');
    }
    calls.push(
      MoneyMarketService.encodeWithdraw({ asset: vaultAddress, amount: amount, to: from }, this.config.lendingPool),
    );

    calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, amount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(assetConfig.decimal, amount);

    if (spokeChainId === this.hubProvider.chainConfig.chain.id) {
      if (token.toLowerCase() === spokeChainConfig[this.hubProvider.chainConfig.chain.id].nativeToken.toLowerCase()) {
        const withdrawToCall = {
          address: assetAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [to, translatedAmountOut],
          }),
        };
        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetAddress, to, translatedAmountOut));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetAddress,
          to,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for repaying to the money market pool
   * @param token - The address of the token to repay
   * @param to - The user wallet address on the hub chain
   * @param amount - The amount to repay
   * @param spokeChainId - The chain ID of the spoke chain
   * @returns {Hex} The transaction data.
   */
  public buildRepayData(token: string, to: Address, amount: bigint, spokeChainId: SpokeChainId): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(spokeChainId, token);

    if (!assetConfig) {
      throw new Error('[buildRepayData] Hub asset not found');
    }

    const assetAddress = assetConfig.asset;
    const vaultAddress = assetConfig.vault;
    const bnUSDVault = this.config.bnUSDVault;
    const bnUSD = this.config.bnUSD;

    calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
    calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, amount);

    let repayToken = vaultAddress;
    if (bnUSDVault && bnUSD && bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      repayToken = bnUSD;
      calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, bnUSD, translatedAmount));
    }

    calls.push(Erc20Service.encodeApprove(repayToken, this.config.lendingPool, translatedAmount));
    calls.push(
      MoneyMarketService.encodeRepay(
        { asset: repayToken, amount: translatedAmount, interestRateMode: 2n, onBehalfOf: to },
        this.config.lendingPool,
      ),
    );
    return encodeContractCalls(calls);
  }

  /**
   * Calculate aToken amount from actual amount using liquidityIndex
   * @param amount - The actual amount
   * @param normalizedIncome - The current normalized income from reserve data
   * @returns {bigint} The equivalent aToken amount
   */
  static calculateATokenAmount(amount: bigint, normalizedIncome: bigint): bigint {
    return (amount * 10n ** 27n) / normalizedIncome + 1n;
  }

  /**
   * Encodes a supply transaction for a money market pool.
   * @param {MoneyMarketEncodeWithdrawParams} params - The parameters for the supply transaction.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeSupply(params: MoneyMarketEncodeSupplyParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'supply',
        args: [params.asset, params.amount, params.onBehalfOf, params.referralCode],
      }),
    };
  }

  /**
   * Encodes a withdraw transaction from a pool.
   * @param {MoneyMarketEncodeWithdrawParams} params - The parameters for the withdraw transaction.
   * @param {Address} params.asset - The address of the asset to withdraw.
   * @param {bigint} params.amount - The amount of the asset to withdraw.
   * @param {Address} params.to - The address that will receive the withdrawn assets.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeWithdraw(params: MoneyMarketEncodeWithdrawParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'withdraw',
        args: [params.asset, params.amount, params.to],
      }),
    };
  }

  /**
   * Encodes a borrow transaction from a pool.
   * @param {MoneyMarketEncodeBorrowParams} params - The parameters for the borrow transaction.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeBorrow(params: MoneyMarketEncodeBorrowParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'borrow',
        args: [params.asset, params.amount, params.interestRateMode, params.referralCode, params.onBehalfOf],
      }),
    };
  }

  /**
   * Encodes a repay transaction for a pool.
   * @param {MoneyMarketEncodeRepayParams} params - The parameters for the repay transaction.
   * @param {Address} params.asset - The address of the borrowed asset to repay.
   * @param {bigint} params.amount - The amount to repay. Use type(uint256).max to repay the entire debt.
   * @param {number} params.interestRateMode - The interest rate mode (2 for Variable).
   * @param {Address} params.onBehalfOf - The address of the user who will get their debt reduced/removed.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeRepay(params: MoneyMarketEncodeRepayParams, lendingPool: Address): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'repay',
        args: [params.asset, params.amount, params.interestRateMode, params.onBehalfOf],
      }),
    };
  }

  /**
   * Encodes a repayWithATokens transaction for a pool.
   * @param {MoneyMarketEncodeRepayWithATokensParams} params - The parameters for the repayWithATokens transaction.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeRepayWithATokens(
    params: MoneyMarketEncodeRepayWithATokensParams,
    lendingPool: Address,
  ): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'repayWithATokens',
        args: [params.asset, params.amount, params.interestRateMode],
      }),
    };
  }

  /**
   * Encodes a setUserUseReserveAsCollateral transaction.
   * @param asset - The address of the underlying asset to be used as collateral.
   * @param useAsCollateral - True to enable the asset as collateral, false to disable.
   * @param lendingPool - The address of lending pool contract
   * @returns The encoded contract call.
   */
  public static encodeSetUserUseReserveAsCollateral(
    asset: Address,
    useAsCollateral: boolean,
    lendingPool: Address,
  ): EvmContractCall {
    return {
      address: lendingPool,
      value: 0n,
      data: encodeFunctionData({
        abi: poolAbi,
        functionName: 'setUserUseReserveAsCollateral',
        args: [asset, useAsCollateral],
      }),
    };
  }

  /**
   * Get the list of all supported money market tokens (supply / borrow tokens) for a given spoke chain ID
   * @param chainId The chain ID
   * @returns {readonly Token[]} - Array of supported tokens
   */
  public getSupportedTokens(chainId: SpokeChainId): readonly Token[] {
    return getSupportedMoneyMarketTokens(chainId);
  }

  /**
   * Get the list of all supported money market reserves (supply / borrow reserves)
   * NOTE: reserve addresses are on the hub chain and can be of type vault, erc20, etc.
   * @returns {readonly Address[]} - Array of supported reserves
   */
  public getSupportedReserves(): readonly Address[] {
    return [...moneyMarketReserveAssets];
  }
}
