import { type Hex, encodeFunctionData, isAddress } from 'viem';
import { poolAbi } from '../shared/abis/pool.abi.js';
import type { EvmHubProvider, SpokeProvider, SpokeProviderType } from '../shared/entities/index.js';
import {
  DEFAULT_RELAYER_API_ENDPOINT,
  SpokeService,
  relayTxAndWaitPacket,
  type RelayErrorCode,
  DEFAULT_RELAY_TX_TIMEOUT,
  SolanaSpokeProvider,
  type RelayError,
  type ConfigService,
} from '../index.js';
import {
  isConfiguredMoneyMarketConfig,
  isEvmSpokeProviderType,
  isStellarSpokeProviderType,
  isSolanaSpokeProviderType,
  isSonicSpokeProviderType,
} from '../shared/guards.js';
import type {
  EvmContractCall,
  EvmSpokeProviderType,
  GetAddressType,
  GetEstimateGasReturnType,
  GetSpokeDepositParamsType,
  HubTxHash,
  MoneyMarketConfigParams,
  MoneyMarketServiceConfig,
  Result,
  SonicSpokeProviderType,
  SpokeTxHash,
  StellarSpokeProviderType,
  TxReturnType,
} from '../shared/types.js';
import { calculateFeeAmount, encodeAddress, encodeContractCalls, isHubSpokeProvider } from '../shared/utils/index.js';
import { EvmAssetManagerService, EvmVaultTokenService, HubService } from '../shared/services/hub/index.js';
import { Erc20Service } from '../shared/services/erc-20/index.js';
import invariant from 'tiny-invariant';
import {
  SONIC_MAINNET_CHAIN_ID,
  type SpokeChainId,
  type Token,
  type Address,
  type HttpUrl,
  getMoneyMarketConfig,
  type GetMoneyMarketTokensApiResponse,
  STELLAR_MAINNET_CHAIN_ID,
} from '@sodax/types';
import { wrappedSonicAbi } from '../shared/abis/wrappedSonic.abi.js';
import { MoneyMarketDataService } from './MoneyMarketDataService.js';
import { StellarSpokeService } from '../shared/services/spoke/StellarSpokeService.js';
import { SonicSpokeService } from '../shared/services/spoke/SonicSpokeService.js';

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

/**
 * Parameters for a Money Market supply operation.
 *
 * @property token - The source chain token address to supply.
 * @property amount - The amount of the asset to supply.
 * @property action - The action type ('supply').
 * @property toChainId - (Optional) Target spoke chain ID to receive the supplied assets.
 *   Note: If omitted, assets are supplied to the sender's default spoke account.
 * @property toAddress - (Optional) The address on the target chain that will receive the supplied assets.
 *   Note: If omitted, assets are supplied to the sender's default spoke account.
 */
export type MoneyMarketSupplyParams = {
  token: string;
  amount: bigint;
  action: 'supply';
  toChainId?: SpokeChainId;
  toAddress?: string;
};

/**
 * Parameters for a Money Market borrow operation.
 *
 * @property token - The target chain token address to borrow.
 * @property amount - The amount of the asset to borrow.
 * @property action - Action type ('borrow').
 * @property toChainId - (Optional) Target chain ID to receive the borrowed assets.
 *   Note: If omitted, borrowed assets are sent to the sender's default spoke account.
 * @property toAddress - (Optional) Target address on the taret chain to receive the borrowed assets.
 *   Note: If omitted, borrowed assets are sent to the sender's default spoke account.
 * @property fromChainId - (Optional) Source chain ID to borrow from.
 *   Note: If omitted, borrowed assets are borrowed from the sender's default spoke account.
 * @property fromAddress - (Optional) Source address on the source chain to borrow from.
 *   Note: If omitted, borrowed assets are borrowed from the sender's default spoke account.
 */
export type MoneyMarketBorrowParams = {
  token: string;
  amount: bigint;
  action: 'borrow';
  fromChainId?: SpokeChainId;
  fromAddress?: string;
  toChainId?: SpokeChainId;
  toAddress?: string;
};

/**
 * Parameters for a Money Market withdraw operation.
 *
 * @property token - The target chain token address to withdraw.
 * @property amount - The amount of the asset to withdraw.
 * @property action - The action type ('withdraw').
 * @property toChainId - (Optional) Target spoke chain ID to receive the withdrawn assets.
 *   Note: If omitted, assets are sent to the sender's default spoke account.
 * @property toAddress - (Optional) Target address on the spoke chain to receive the withdrawn assets.
 *   Note:If omitted, assets are sent to the sender's default spoke account.
 */
export type MoneyMarketWithdrawParams = {
  token: string;
  amount: bigint;
  action: 'withdraw';
  toChainId?: SpokeChainId;
  toAddress?: string;
};

/**
 * Parameters for a Money Market repay operation.
 *
 * @property token - The source chain token address to repay.
 * @property amount - The amount of the asset to repay.
 * @property action - The action type ('repay').
 * @property toChainId - (Optional) Target spoke chain ID to receive the repaid assets.
 *   Note: If omitted, assets are repaid to the sender's default spoke account.
 * @property toAddress - (Optional) Target address on the spoke chain to receive the repaid assets.
 *   Note: If omitted, assets are repaid to the sender's default spoke account.
 */
export type MoneyMarketRepayParams = {
  token: string;
  amount: bigint;
  action: 'repay';
  toChainId?: SpokeChainId;
  toAddress?: string;
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

export type MoneyMarketServiceConstructorParams = {
  config: MoneyMarketConfigParams | undefined;
  hubProvider: EvmHubProvider;
  relayerApiEndpoint?: HttpUrl;
  configService: ConfigService;
};

export class MoneyMarketService {
  public readonly config: MoneyMarketServiceConfig;
  private readonly hubProvider: EvmHubProvider;
  public readonly data: MoneyMarketDataService;
  public readonly configService: ConfigService;

  constructor({ config, hubProvider, relayerApiEndpoint, configService }: MoneyMarketServiceConstructorParams) {
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
    this.configService = configService;
  }

  /**
   * Estimate the gas for a raw transaction.
   * @param {TxReturnType<T, true>} params - The parameters for the raw transaction.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<GetEstimateGasReturnType<T>>} A promise that resolves to the gas.
   */
  public static async estimateGas<T extends SpokeProviderType = SpokeProviderType>(
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
  public async isAllowanceValid<S extends SpokeProviderType>(
    params: MoneyMarketParams,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.token.length > 0, 'Token is required');

      if (params.action === 'withdraw' || params.action === 'borrow') {
        const toChainId = params.toChainId ?? spokeProvider.chainConfig.chain.id;
        invariant(
          this.configService.isMoneyMarketSupportedToken(toChainId, params.token),
          `Unsupported spoke chain (${toChainId}) token: ${params.token}`,
        );
      } else {
        invariant(
          this.configService.isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
          `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
        );
      }

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (params.toChainId === STELLAR_MAINNET_CHAIN_ID && params.toAddress) {
        // if target chain is stellar, check if the target wallet has sufficient trustline
        const targetHasTrustline = await StellarSpokeService.walletHasSufficientTrustline(
          params.token,
          params.amount,
          params.toAddress,
          this.configService.sharedConfig[STELLAR_MAINNET_CHAIN_ID].horizonRpcUrl,
        );

        // if source chain is stellar, check if the source wallet has sufficient trustline as well
        let srcHasTrustline = true;
        if (isStellarSpokeProviderType(spokeProvider)) {
          srcHasTrustline = await StellarSpokeService.hasSufficientTrustline(params.token, params.amount, spokeProvider);
        }

        return {
          ok: true,
          value: targetHasTrustline && srcHasTrustline,
        };
      }

      if (isStellarSpokeProviderType(spokeProvider)) {
        return {
          ok: true,
          value: await StellarSpokeService.hasSufficientTrustline(params.token, params.amount, spokeProvider),
        };
      }
      if (
        (isEvmSpokeProviderType(spokeProvider) || isSonicSpokeProviderType(spokeProvider)) &&
        (params.action === 'supply' || params.action === 'repay')
      ) {
        const spender = isHubSpokeProvider(spokeProvider, this.hubProvider)
          ? await HubService.getUserRouter(
              walletAddress as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
              this.hubProvider,
            )
          : spokeProvider.chainConfig.addresses.assetManager;
        return await Erc20Service.isAllowanceValid(
          params.token as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
          params.amount,
          walletAddress as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
          spender as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
          spokeProvider,
        );
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
   * NOTE: Stellar requires trustline when being either sender or receiver. Thus
   * you should make sure that both src and destination wallets have sufficient trustlines.
   * Make sure to invoke this method using wallet address which is about to receive the tokens!
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
  public async approve<S extends SpokeProviderType, R extends boolean = false>(
    params: MoneyMarketParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>>> {
    try {
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(params.token.length > 0, 'Token is required');
      if (params.action === 'withdraw' || params.action === 'borrow') {
        const toChainId = params.toChainId ?? spokeProvider.chainConfig.chain.id;
        invariant(
          this.configService.isMoneyMarketSupportedToken(toChainId, params.token),
          `Unsupported spoke chain (${toChainId}) token: ${params.token}`,
        );
      } else {
        invariant(
          this.configService.isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
          `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
        );
      }

      const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

      if (isStellarSpokeProviderType(spokeProvider)) {
        const result = await StellarSpokeService.requestTrustline(params.token, params.amount, spokeProvider, raw);

        return {
          ok: true,
          value: result satisfies TxReturnType<StellarSpokeProviderType, R> as TxReturnType<S, R>,
        };
      }

      if (isEvmSpokeProviderType(spokeProvider) || isSonicSpokeProviderType(spokeProvider)) {
        invariant(
          params.action === 'supply' || params.action === 'repay',
          'Invalid action (only supply and repay are supported on evm)',
        );
        invariant(isAddress(params.token), 'Invalid token address');

        const spender = isHubSpokeProvider(spokeProvider, this.hubProvider)
          ? await HubService.getUserRouter(
              walletAddress as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
              this.hubProvider,
            )
          : spokeProvider.chainConfig.addresses.assetManager;

        const result = (await Erc20Service.approve(
          params.token,
          params.amount,
          spender as GetAddressType<EvmSpokeProviderType | SonicSpokeProviderType>,
          spokeProvider,
          raw,
        )) satisfies TxReturnType<EvmSpokeProviderType, R> as TxReturnType<S, R>;

        return {
          ok: true,
          value: result,
        };
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

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(txResult.value, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATE_SUPPLY_INTENT_FAILED',
            data: {
              payload: params,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      let intentTxHash: string | null = null;
      if (spokeProvider.chainConfig.chain.id === this.hubProvider.chainConfig.chain.id) {
        intentTxHash = txResult.value;
      } else {
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
  async createSupplyIntent<S extends SpokeProviderType = SpokeProviderType, R extends boolean = false>(
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

      const fromChainId = spokeProvider.chainConfig.chain.id;
      const fromAddress = await spokeProvider.walletProvider.getWalletAddress();
      const toChainId = params.toChainId ?? fromChainId;
      const toAddress = params.toAddress ?? fromAddress;

      invariant(
        this.configService.isMoneyMarketSupportedToken(fromChainId, params.token),
        `Unsupported spoke chain (${fromChainId}) token: ${params.token}`,
      );

      const [fromHubWallet, toHubWallet] = await Promise.all([
        HubService.getUserHubWalletAddress(fromAddress, fromChainId, this.hubProvider),
        HubService.getUserHubWalletAddress(toAddress, toChainId, this.hubProvider),
      ]);

      const data: Hex = this.buildSupplyData(fromChainId, params.token, params.amount, toHubWallet);

      const txResult = await SpokeService.deposit(
        {
          from: fromAddress,
          to: fromHubWallet,
          token: params.token,
          amount: params.amount,
          data,
        } as GetSpokeDepositParamsType<S>,
        spokeProvider,
        this.hubProvider,
        raw,
      );

      return {
        ok: true,
        value: txResult as TxReturnType<S, R>,
        data: {
          address: fromHubWallet,
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

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(txResult.value, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATE_BORROW_INTENT_FAILED',
            data: {
              payload: params,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      let intentTxHash: string | null = null;
      // relay is not required only if borrow is happening on a Hub with target not being the hub chain
      if (
        spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id ||
        (params.toChainId && params.toAddress && params.toChainId !== this.hubProvider.chainConfig.chain.id)
      ) {
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
  async createBorrowIntent<S extends SpokeProviderType = SpokeProviderType, R extends boolean = false>(
    params: MoneyMarketBorrowParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_BORROW_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    invariant(params.action === 'borrow', 'Invalid action');
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');

    const fromChainId = params.fromChainId ?? spokeProvider.chainConfig.chain.id;
    const fromAddress = params.fromAddress ?? (await spokeProvider.walletProvider.getWalletAddress());
    const toChainId = params.toChainId ?? fromChainId;
    const toAddress = params.toAddress ?? fromAddress;
    const dstToken = this.configService.getMoneyMarketToken(toChainId, params.token);

    invariant(dstToken, `Money market token not found for spoke chain (${toChainId}) token: ${params.token}`);

    const encodedToAddress = encodeAddress(toChainId, toAddress);
    const fromHubWallet = await HubService.getUserHubWalletAddress(fromAddress, fromChainId, this.hubProvider);

    const data: Hex = this.buildBorrowData(fromHubWallet, encodedToAddress, dstToken.address, params.amount, toChainId);

    let txResult: TxReturnType<S, R>;
    if (fromChainId === this.hubProvider.chainConfig.chain.id && isSonicSpokeProviderType(spokeProvider)) {
      txResult = await SonicSpokeService.callWallet(data, spokeProvider, raw);
    } else {
      txResult = await SpokeService.callWallet(fromHubWallet, data, spokeProvider, this.hubProvider, raw);
    }

    return {
      ok: true,
      value: txResult satisfies TxReturnType<S, R>,
      data: {
        address: fromHubWallet,
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

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(txResult.value, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATE_WITHDRAW_INTENT_FAILED',
            data: {
              payload: params,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      let intentTxHash: string | null = null;
      // relay is not required only if action is happening on a Hub with target not being the hub chain
      if (
        spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id ||
        (params.toChainId &&
          params.toAddress &&
          params.toChainId !== this.hubProvider.chainConfig.chain.id &&
          params.toAddress !== this.hubProvider.chainConfig.addresses.walletRouter)
      ) {
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
  async createWithdrawIntent<S extends SpokeProviderType = SpokeProviderType, R extends boolean = false>(
    params: MoneyMarketWithdrawParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_WITHDRAW_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    invariant(params.action === 'withdraw', 'Invalid action');
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');

    const fromChainId = spokeProvider.chainConfig.chain.id;
    const fromAddress = await spokeProvider.walletProvider.getWalletAddress();
    const toChainId = params.toChainId ?? fromChainId;
    const toAddress = params.toAddress ?? fromAddress;

    invariant(
      this.configService.isMoneyMarketSupportedToken(toChainId, params.token),
      `Unsupported spoke chain (${toChainId}) token: ${params.token}`,
    );

    const encodedToAddress = encodeAddress(toChainId, toAddress);
    const fromHubWallet = await HubService.getUserHubWalletAddress(fromAddress, fromChainId, this.hubProvider);

    const data: Hex = this.buildWithdrawData(fromHubWallet, encodedToAddress, params.token, params.amount, toChainId);

    const txResult = isSonicSpokeProviderType(spokeProvider)
      ? await SonicSpokeService.callWallet(data, spokeProvider, raw)
      : await SpokeService.callWallet(fromHubWallet, data, spokeProvider, this.hubProvider, raw);

    return {
      ok: true,
      value: txResult,
      data: {
        address: fromHubWallet,
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

      // verify the spoke tx hash exists on chain
      const verifyTxHashResult = await SpokeService.verifyTxHash(txResult.value, spokeProvider);

      if (!verifyTxHashResult.ok) {
        return {
          ok: false,
          error: {
            code: 'CREATE_REPAY_INTENT_FAILED',
            data: {
              payload: params,
              error: verifyTxHashResult.error,
            },
          },
        };
      }

      let intentTxHash: string | null = null;
      // relay is not required only if repay is happening from a Hub chain
      if (spokeProvider.chainConfig.chain.id !== this.hubProvider.chainConfig.chain.id) {
        const packetResult = await relayTxAndWaitPacket(
          txResult.value,
          isSolanaSpokeProviderType(spokeProvider) ? txResult.data : undefined,
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
  async createRepayIntent<S extends SpokeProviderType = SpokeProviderType, R extends boolean = false>(
    params: MoneyMarketRepayParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<
    Result<TxReturnType<S, R>, MoneyMarketError<'CREATE_REPAY_INTENT_FAILED'>> & MoneyMarketOptionalExtraData
  > {
    invariant(params.action === 'repay', 'Invalid action');
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');

    const fromChainId = spokeProvider.chainConfig.chain.id;
    const fromAddress = await spokeProvider.walletProvider.getWalletAddress();
    const toChainId = params.toChainId ?? fromChainId;
    const toAddress = params.toAddress ?? fromAddress;

    invariant(
      this.configService.isMoneyMarketSupportedToken(fromChainId, params.token),
      `Unsupported spoke chain (${fromChainId}) token: ${params.token}`,
    );

    const [fromHubWallet, toHubWallet] = await Promise.all([
      HubService.getUserHubWalletAddress(fromAddress, fromChainId, this.hubProvider),
      HubService.getUserHubWalletAddress(toAddress, toChainId, this.hubProvider),
    ]);

    const data: Hex = this.buildRepayData(fromChainId, params.token, params.amount, toHubWallet);

    const txResult = await SpokeService.deposit(
      {
        from: fromAddress,
        to: fromHubWallet,
        token: params.token,
        amount: params.amount,
        data,
      } as GetSpokeDepositParamsType<S>,
      spokeProvider,
      this.hubProvider,
      raw,
    );

    return {
      ok: true,
      value: txResult as TxReturnType<S, R>,
      data: {
        address: fromHubWallet,
        payload: data,
      },
    };
  }

  /**
   * Build transaction data for supplying to the money market pool
   * @param fromChainId - The chain ID of the source chain
   * @param fromToken - The address of the token on source chain
   * @param amount - The amount to deposit
   * @param toHubAddress - The user wallet address on the hub chain
   * @returns {Hex} The transaction data.
   */
  public buildSupplyData(fromChainId: SpokeChainId, fromToken: string, amount: bigint, toHubAddress: Address): Hex {
    const calls: EvmContractCall[] = [];

    const fromHubAsset = this.configService.getHubAssetInfo(fromChainId, fromToken as Address);
    invariant(fromHubAsset, `hub asset not found for source chain token (token): ${fromToken}`);

    const lendingPool = this.config.lendingPool;

    if (!this.configService.isValidVault(fromHubAsset.asset)) {
      // deposit non-vault token into the vault
      calls.push(Erc20Service.encodeApprove(fromHubAsset.asset, fromHubAsset.vault, amount));
      calls.push(EvmVaultTokenService.encodeDeposit(fromHubAsset.vault, fromHubAsset.asset, amount));
    }

    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(fromHubAsset.decimal, amount);
    calls.push(Erc20Service.encodeApprove(fromHubAsset.vault, lendingPool, translatedAmount));
    calls.push(
      MoneyMarketService.encodeSupply(
        { asset: fromHubAsset.vault, amount: translatedAmount, onBehalfOf: toHubAddress, referralCode: 0 },
        lendingPool,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for borrowing from the money market pool
   * @param fromHubAddress - The hub address of the user to borrow from
   * @param toAddress - The user wallet address on the target chain
   * @param toToken - The address of the token on the target chain
   * @param amount - The amount to borrow in hub chain decimals
   * @param toChainId - The chain ID of the target chain
   * @returns {Hex} The transaction data.
   */
  public buildBorrowData(
    fromHubAddress: Address,
    toAddress: Address,
    toToken: string,
    amount: bigint,
    toChainId: SpokeChainId,
  ): Hex {
    const toHubAsset = this.configService.getHubAssetInfo(toChainId, toToken);
    const dstToken = this.configService.getMoneyMarketToken(toChainId, toToken);
    invariant(toHubAsset, `hub asset not found for target chain token (toToken): ${toToken}`);
    invariant(dstToken, `Money market token not found for spoke chain (${toChainId}) token: ${toToken}`);

    const assetAddress = toHubAsset.asset;
    const vaultAddress = toHubAsset.vault;
    const bnUSDVault = this.config.bnUSDVault;
    const bnUSD = this.config.bnUSD;

    const translatedInAmount = EvmVaultTokenService.translateIncomingDecimals(toHubAsset.decimal, amount);
    const feeAmount = calculateFeeAmount(translatedInAmount, this.config.partnerFee);
    const calls: EvmContractCall[] = [];

    if (bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      calls.push(
        MoneyMarketService.encodeBorrow(
          {
            asset: bnUSD,
            amount: translatedInAmount,
            interestRateMode: 2n,
            referralCode: 0,
            onBehalfOf: fromHubAddress,
          },
          this.config.lendingPool,
        ),
      );
      calls.push(Erc20Service.encodeApprove(bnUSD, bnUSDVault, translatedInAmount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, bnUSD, translatedInAmount));

      if (this.config.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTransfer(bnUSDVault, this.config.partnerFee.address, feeAmount));
      }
    } else {
      calls.push(
        MoneyMarketService.encodeBorrow(
          {
            asset: vaultAddress,
            amount: translatedInAmount,
            interestRateMode: 2n,
            referralCode: 0,
            onBehalfOf: fromHubAddress,
          },
          this.config.lendingPool,
        ),
      );

      if (this.config.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTransfer(vaultAddress, this.config.partnerFee.address, feeAmount));
      }
    }

    if (toToken.toLowerCase() !== vaultAddress.toLowerCase()) {
      // if the target token is not the vault token, we need to withdraw the tokens from the vault
      calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, translatedInAmount - feeAmount));
    }

    let translatedAmountOut: bigint;
    if (this.configService.isValidVault(toToken)) {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
        toHubAsset.decimal,
        translatedInAmount - feeAmount,
      );
    } else {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(
        dstToken.decimals,
        translatedInAmount - feeAmount,
      );
    }

    if (toChainId === this.hubProvider.chainConfig.chain.id) {
      if (
        assetAddress.toLowerCase() ===
        this.configService.spokeChainConfig[toChainId].addresses.wrappedSonic.toLowerCase()
      ) {
        const withdrawToCall = {
          address: assetAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [toAddress, translatedAmountOut],
          }),
        };

        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetAddress, toAddress, translatedAmountOut));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetAddress,
          toAddress,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for withdrawing from the money market pool
   * @param fromHubAddress - The hub address of the user to withdraw from
   * @param toAddress - The user wallet address on the target chain
   * @param toToken - The address of the token on the target chain
   * @param amount - The amount to withdraw in hub chain decimals
   * @param toChainId - The chain ID of the target chain
   * @returns {Hex} The transaction data.
   */
  public buildWithdrawData(
    fromHubAddress: Address,
    toAddress: Address,
    toToken: string,
    amount: bigint,
    toChainId: SpokeChainId,
  ): Hex {
    const calls: EvmContractCall[] = [];

    const toHubAsset = this.configService.getHubAssetInfo(toChainId, toToken as Address);
    const dstToken = this.configService.getMoneyMarketToken(toChainId, toToken);
    invariant(toHubAsset, `hub asset not found for target chain token (toToken): ${toToken}`);
    invariant(dstToken, `Money market token not found for spoke chain (${toChainId}) token: ${toToken}`);

    const assetAddress = toHubAsset.asset;
    const vaultAddress = toHubAsset.vault;

    const translatedInAmount = EvmVaultTokenService.translateIncomingDecimals(toHubAsset.decimal, amount);

    calls.push(
      MoneyMarketService.encodeWithdraw(
        { asset: vaultAddress, amount: translatedInAmount, to: fromHubAddress },
        this.config.lendingPool,
      ),
    );

    if (!this.configService.isValidVault(toToken)) {
      // if the target token is not the vault token, we need to withdraw the tokens from the vault
      calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, translatedInAmount));
    }

    let translatedAmountOut: bigint;
    if (this.configService.isValidVault(toToken)) {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(toHubAsset.decimal, translatedInAmount);
    } else {
      translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(dstToken.decimals, translatedInAmount);
    }

    if (toChainId === this.hubProvider.chainConfig.chain.id) {
      if (
        assetAddress.toLowerCase() ===
        this.configService.spokeChainConfig[toChainId].addresses.wrappedSonic.toLowerCase()
      ) {
        const withdrawToCall = {
          address: assetAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: wrappedSonicAbi,
            functionName: 'withdrawTo',
            args: [toAddress, translatedAmountOut],
          }),
        };
        calls.push(withdrawToCall);
      } else {
        calls.push(Erc20Service.encodeTransfer(assetAddress, toAddress, translatedAmountOut));
      }
    } else {
      calls.push(
        EvmAssetManagerService.encodeTransfer(
          assetAddress,
          toAddress,
          translatedAmountOut,
          this.hubProvider.chainConfig.addresses.assetManager,
        ),
      );
    }

    return encodeContractCalls(calls);
  }

  /**
   * Build transaction data for repaying to the money market pool
   * @param fromChainId - The chain ID of the source chain
   * @param fromToken - The address of the token on the source chain
   * @param amount - The amount to repay
   * @param toHubAddress - The hub address of the user to repay to
   * @returns {Hex} The transaction data.
   */
  public buildRepayData(fromChainId: SpokeChainId, fromToken: string, amount: bigint, toHubAddress: Address): Hex {
    const calls: EvmContractCall[] = [];

    const fromHubAsset = this.configService.getHubAssetInfo(fromChainId, fromToken as Address);
    invariant(fromHubAsset, `hub asset not found for source chain token (fromToken): ${fromToken}`);

    const assetAddress = fromHubAsset.asset;
    const vaultAddress = fromHubAsset.vault;
    const bnUSDVault = this.config.bnUSDVault;
    const bnUSD = this.config.bnUSD;

    const translatedAmountIn = EvmVaultTokenService.translateIncomingDecimals(fromHubAsset.decimal, amount);

    let repayToken = vaultAddress;
    if (bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      // when repaying bnUSD using vault token, bnUSD debt token gets repaid
      repayToken = bnUSD;

      if (assetAddress.toLowerCase() !== bnUSDVault.toLowerCase()) {
        // if asset address is not bnUSD vault, we need to approve and deposit the asset into the vault
        calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
        calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
      }

      // withdraw the bnUSD debt token from the vault
      calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, bnUSD, translatedAmountIn));
    } else {
      calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
      calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
    }

    calls.push(Erc20Service.encodeApprove(repayToken, this.config.lendingPool, translatedAmountIn));
    calls.push(
      MoneyMarketService.encodeRepay(
        { asset: repayToken, amount: translatedAmountIn, interestRateMode: 2n, onBehalfOf: toHubAddress },
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
  public getSupportedTokensByChainId(chainId: SpokeChainId): readonly Token[] {
    return this.configService.getSupportedMoneyMarketTokensByChainId(chainId);
  }

  /**
   * Get the list of all supported money market tokens (supply / borrow tokens)
   * @returns {GetMoneyMarketTokensApiResponse} - Object containing all supported tokens
   */
  public getSupportedTokens(): GetMoneyMarketTokensApiResponse {
    return this.configService.getSupportedMoneyMarketTokens();
  }

  /**
   * Get the list of all supported money market reserves (supply / borrow reserves)
   * NOTE: reserve addresses are on the hub chain and can be of type vault, erc20, etc.
   * @returns {readonly Address[]} - Array of supported reserves
   */
  public getSupportedReserves(): readonly Address[] {
    return this.configService.getMoneyMarketReserveAssets();
  }
}
