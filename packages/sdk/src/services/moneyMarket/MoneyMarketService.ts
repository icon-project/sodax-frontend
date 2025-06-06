import { type Address, type Hex, encodeFunctionData } from 'viem';
import { poolAbi } from '../../abis/pool.abi.js';
import type { EvmHubProvider, SpokeProvider } from '../../entities/index.js';
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
  uiPoolDataAbi,
  type RelayErrorCode,
  SONIC_MAINNET_CHAIN_ID,
  DEFAULT_RELAY_TX_TIMEOUT,
  EvmSpokeProvider,
  isMoneyMarketSupportedToken,
} from '../../index.js';
import type {
  EvmContractCall,
  EvmRawTransactionReceipt,
  GetSpokeDepositParamsType,
  HttpUrl,
  MoneyMarketConfigParams,
  MoneyMarketServiceConfig,
  Result,
  SpokeChainId,
  Token,
  TxReturnType,
} from '../../types.js';
import { calculateFeeAmount, encodeContractCalls } from '../../utils/index.js';
import { EvmAssetManagerService, EvmVaultTokenService, EvmWalletAbstraction } from '../hub/index.js';
import { Erc20Service } from '../shared/index.js';
import invariant from 'tiny-invariant';

export type AggregatedReserveData = {
  underlyingAsset: Address;
  name: string;
  symbol: string;
  decimals: bigint;
  baseLTVasCollateral: bigint;
  reserveLiquidationThreshold: bigint;
  reserveLiquidationBonus: bigint;
  reserveFactor: bigint;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  liquidityIndex: bigint;
  variableBorrowIndex: bigint;
  liquidityRate: bigint;
  variableBorrowRate: bigint;
  lastUpdateTimestamp: number;
  aTokenAddress: Address;
  variableDebtTokenAddress: Address;
  interestRateStrategyAddress: Address;
  availableLiquidity: bigint;
  totalScaledVariableDebt: bigint;
  priceInMarketReferenceCurrency: bigint;
  priceOracle: Address;
  variableRateSlope1: bigint;
  variableRateSlope2: bigint;
  baseVariableBorrowRate: bigint;
  optimalUsageRatio: bigint;
  isPaused: boolean;
  isSiloedBorrowing: boolean;
  accruedToTreasury: bigint;
  unbacked: bigint;
  isolationModeTotalDebt: bigint;
  flashLoanEnabled: boolean;
  debtCeiling: bigint;
  debtCeilingDecimals: bigint;
  borrowCap: bigint;
  supplyCap: bigint;
  borrowableInIsolation: boolean;
  virtualAccActive: boolean;
  virtualUnderlyingBalance: bigint;
};

export type BaseCurrencyInfo = {
  marketReferenceCurrencyUnit: bigint;
  marketReferenceCurrencyPriceInUsd: bigint;
  networkBaseTokenPriceInUsd: bigint;
  networkBaseTokenPriceDecimals: number;
};

export type UserReserveData = {
  underlyingAsset: string;
  scaledATokenBalance: bigint;
  usageAsCollateralEnabledOnUser: boolean;
  scaledVariableDebt: bigint;
};

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

export type MoneyMarketSupplyParams = {
  token: string;
  amount: bigint;
};

export type MoneyMarketBorrowParams = {
  token: string;
  amount: bigint;
};

export type MoneyMarketWithdrawParams = {
  token: string;
  amount: bigint;
};

export type MoneyMarketRepayParams = {
  token: string;
  amount: bigint;
};

export type MoneyMarketErrorCode =
  | RelayErrorCode
  | 'UNKNOWN'
  | 'SUPPLY_FAILED'
  | 'BORROW_FAILED'
  | 'WITHDRAW_FAILED'
  | 'REPAY_FAILED';

export type MoneyMarketError = {
  code: MoneyMarketErrorCode;
  error: unknown;
};

export class MoneyMarketService {
  private readonly config: MoneyMarketServiceConfig;
  private readonly hubProvider: EvmHubProvider;

  constructor(config: MoneyMarketConfigParams | undefined, hubProvider: EvmHubProvider, relayerApiEndpoint?: HttpUrl) {
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
  }

  /**
   * Check whether assetManager contract is allowed to move the given payload amount
   * @param {MoneyMarketRepayParams | MoneyMarketSupplyParams} params - Money market params
   * @param {SpokeProvider} spokeProvider - The spoke provider
   * @return {Promise<Result<boolean>>} - valid = true, invalid = false
   */
  public async isAllowanceValid<S extends SpokeProvider>(
    params: MoneyMarketRepayParams | MoneyMarketSupplyParams,
    spokeProvider: S,
  ): Promise<Result<boolean>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider) {
        return Erc20Service.isAllowanceValid(
          params.token as Address,
          params.amount,
          spokeProvider.walletProvider.getWalletAddress(),
          spokeProvider.chainConfig.addresses.assetManager,
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
   * Approve ERC20 amount spending
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param address - Address to approve spending for
   * @param spokeProvider - Spoke provider
   */
  public async approve<S extends SpokeProvider>(
    token: Address,
    amount: bigint,
    address: Address,
    spokeProvider: S,
  ): Promise<Result<EvmRawTransactionReceipt>> {
    try {
      if (spokeProvider instanceof EvmSpokeProvider) {
        return Erc20Service.approve(token, amount, address, spokeProvider);
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
   * Supply tokens to the money market pool and submit the intent to the Solver API
   * @param params - The parameters for the supply transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
   * @returns [spokeTxHash, hubTxHash]
   */
  public async supplyAndSubmit<S extends SpokeProvider>(
    params: MoneyMarketSupplyParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[Hex, Hex], MoneyMarketError>> {
    try {
      const txResult = await this.supply(params, spokeProvider);

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'SUPPLY_FAILED',
            error: txResult.error,
          },
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
          code: 'UNKNOWN',
          error: error,
        },
      };
    }
  }

  /**
   * Supply tokens to the money market pool
   * NOTE: This method does not submit the intent to the Solver API
   * @param params - The parameters for the supply transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result.
   */
  async supply<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketSupplyParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MoneyMarketError>> {
    try {
      invariant(params.token.length > 0, 'Token is required');
      invariant(params.amount > 0n, 'Amount must be greater than 0');
      invariant(
        isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
        `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
      );

      const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
        spokeProvider.chainConfig.chain.id,
        spokeProvider.walletProvider.getWalletAddressBytes(),
        this.hubProvider,
      );

      const data: Hex = this.supplyData(params.token, hubWallet, params.amount, spokeProvider.chainConfig.chain.id);

      const txResult = await SpokeService.deposit(
        {
          from: spokeProvider.walletProvider.getWalletAddress(),
          to: hubWallet,
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
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN',
          error,
        },
      };
    }
  }

  /**
   * Borrow tokens from the money market pool and submit the intent to the Solver API
   * @param params - The parameters for the borrow transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
   * @returns [spokeTxHash, hubTxHash]
   */
  public async borrowAndSubmit<S extends SpokeProvider>(
    params: MoneyMarketSupplyParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[Hex, Hex], MoneyMarketError>> {
    try {
      const txResult = await this.borrow(params, spokeProvider);

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'BORROW_FAILED',
            error: txResult.error,
          },
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
          code: 'UNKNOWN',
          error: error,
        },
      };
    }
  }

  /**
   * Borrow tokens from the money market pool
   * NOTE: This method does not submit the intent to the Solver API
   * @param params - The parameters for the borrow transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result (raw transaction data or transaction hash).
   */
  async borrow<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketBorrowParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>> {
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');
    invariant(
      isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
      `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
    );

    const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      spokeProvider.walletProvider.getWalletAddressBytes(),
      this.hubProvider,
    );

    const data: Hex = this.borrowData(
      hubWallet,
      spokeProvider.walletProvider.getWalletAddressBytes(),
      params.token,
      params.amount,
      spokeProvider.chainConfig.chain.id,
    );

    const txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

    return { ok: true, value: txResult as TxReturnType<S, R> };
  }

  /**
   * Withdraw tokens from the money market pool and submit the intent to the Solver API
   * @param params - The parameters for the withdraw transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
   * @returns [spokeTxHash, hubTxHash]
   */
  public async withdrawAndSubmit<S extends SpokeProvider>(
    params: MoneyMarketWithdrawParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[Hex, Hex], MoneyMarketError>> {
    try {
      const txResult = await this.withdraw(params, spokeProvider);

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'WITHDRAW_FAILED',
            error: txResult.error,
          },
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
          code: 'UNKNOWN',
          error: error,
        },
      };
    }
  }

  /**
   * Withdraw tokens from the money market pool
   * NOTE: This method does not submit the intent to the Solver API
   * @param params - The parameters for the withdraw transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result (raw transaction data or transaction hash).
   */
  async withdraw<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketWithdrawParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>> {
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');
    invariant(
      isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
      `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
    );

    const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      spokeProvider.walletProvider.getWalletAddressBytes(),
      this.hubProvider,
    );

    const data: Hex = this.withdrawData(
      hubWallet,
      spokeProvider.walletProvider.getWalletAddressBytes(),
      params.token,
      params.amount,
      spokeProvider.chainConfig.chain.id,
    );

    const txResult = await SpokeService.callWallet(hubWallet, data, spokeProvider, this.hubProvider, raw);

    return { ok: true, value: txResult };
  }

  /**
   * Repay tokens to the money market pool and submit the intent to the Solver API
   * @param params - The parameters for the repay transaction.
   * @param spokeProvider - The spoke provider.
   * @param timeout - The timeout in milliseconds for the transaction. Default is 20 seconds.
   * @returns [spokeTxHash, hubTxHash]
   */
  public async repayAndSubmit<S extends SpokeProvider>(
    params: MoneyMarketRepayParams,
    spokeProvider: S,
    timeout = DEFAULT_RELAY_TX_TIMEOUT,
  ): Promise<Result<[Hex, Hex], MoneyMarketError>> {
    try {
      const txResult = await this.repay(params, spokeProvider);

      if (!txResult.ok) {
        return {
          ok: false,
          error: {
            code: 'REPAY_FAILED',
            error: txResult.error,
          },
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
          code: 'UNKNOWN',
          error: error,
        },
      };
    }
  }

  /**
   * Repay tokens to the money market pool
   * NOTE: This method does not submit the intent to the Solver API
   * @param params - The parameters for the repay transaction.
   * @param spokeProvider - The spoke provider.
   * @param raw - Whether to return the raw transaction data.
   * @returns The transaction result (raw transaction data or transaction hash).
   */
  async repay<S extends SpokeProvider = SpokeProvider, R extends boolean = false>(
    params: MoneyMarketRepayParams,
    spokeProvider: S,
    raw?: R,
  ): Promise<Result<TxReturnType<S, R>, MoneyMarketErrorCode>> {
    invariant(params.token.length > 0, 'Token is required');
    invariant(params.amount > 0n, 'Amount must be greater than 0');
    invariant(
      isMoneyMarketSupportedToken(spokeProvider.chainConfig.chain.id, params.token),
      `Unsupported spoke chain (${spokeProvider.chainConfig.chain.id}) token: ${params.token}`,
    );

    const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
      spokeProvider.chainConfig.chain.id,
      spokeProvider.walletProvider.getWalletAddressBytes(),
      this.hubProvider,
    );
    const data: Hex = this.repayData(params.token, hubWallet, params.amount, spokeProvider.chainConfig.chain.id);

    const txResult = await SpokeService.deposit(
      {
        from: spokeProvider.walletProvider.getWalletAddress(),
        to: hubWallet,
        token: params.token,
        amount: params.amount,
        data,
      } as GetSpokeDepositParamsType<S>,
      spokeProvider,
      this.hubProvider,
      raw,
    );

    return { ok: true, value: txResult as TxReturnType<S, R> };
  }

  /**
   * Deposit tokens to the spoke chain and supply to the money market pool
   * @param token - The address of the token on spoke chain
   * @param to The user wallet address on the hub chain
   * @param amount The amount to deposit
   * @param spokeChainId The chain ID of the spoke chain
   * @returns The transaction result (raw transaction data or transaction hash).
   */
  public supplyData(token: string, to: Address, amount: bigint, spokeChainId: SpokeChainId): Hex {
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
   * Borrow tokens from the money market pool
   * @param from The user wallet address on the hub chain
   * @param to The user wallet address on the spoke chain
   * @param token The address of the token to borrow
   * @param amount The amount to borrow in hub chain decimals
   * @param spokeChainId The chain ID of the spoke chain
   * @returns Transaction object
   */
  public borrowData(from: Address, to: Address | Hex, token: string, amount: bigint, spokeChainId: SpokeChainId): Hex {
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
        calls.push(Erc20Service.encodeTansfer(bnUSDVault, this.config.partnerFee.address, feeAmount));
      }
    } else {
      calls.push(
        MoneyMarketService.encodeBorrow(
          { asset: vaultAddress, amount: amount, interestRateMode: 2n, referralCode: 0, onBehalfOf: from },
          this.config.lendingPool,
        ),
      );

      if (this.config.partnerFee && feeAmount) {
        calls.push(Erc20Service.encodeTansfer(vaultAddress, this.config.partnerFee.address, feeAmount));
      }
    }

    calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, amount - feeAmount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(assetConfig.decimal, amount - feeAmount);

    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetAddress,
        to,
        translatedAmountOut,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );

    return encodeContractCalls(calls);
  }

  /**
   * Withdraw tokens from the money market pool
   * @param from The user wallet address on the hub chain
   * @param to The user wallet address on the spoke chain
   * @param token The address of the token to borrow
   * @param amount The amount to borrow in hub chain decimals
   * @param spokeChainId The chain ID of the spoke chain
   * @returns Transaction object
   */
  public withdrawData(from: Address, to: Address, token: string, amount: bigint, spokeChainId: SpokeChainId): Hex {
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
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetAddress,
        to,
        translatedAmountOut,
        this.hubProvider.chainConfig.addresses.assetManager,
      ),
    );
    return encodeContractCalls(calls);
  }

  /**
   * Repay tokens to the money market pool
   * @param token The address of the token to repay
   * @param to The user wallet address on the hub chain
   * @param amount The amount to repay
   * @param spokeChainId The chain ID of the spoke chain
   * @param moneyMarketConfig The money market config
   * @returns Transaction object
   */
  public repayData(token: string, to: Address, amount: bigint, spokeChainId: SpokeChainId): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = getHubAssetInfo(spokeChainId, token);

    if (!assetConfig) {
      throw new Error('[repayData] Hub asset not found');
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
   * Get the list of all reserves in the pool
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @returns Array of reserve addresses
   */
  async getReservesList(uiPoolDataProvider: Address, poolAddressesProvider: Address): Promise<readonly Address[]> {
    return this.hubProvider.publicClient.readContract({
      address: uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesList',
      args: [poolAddressesProvider],
    });
  }

  /**
   * Get detailed data for all reserves in the pool
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @returns Tuple containing array of reserve data and base currency info
   */
  async getReservesData(
    uiPoolDataProvider: Address,
    poolAddressesProvider: Address,
  ): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> {
    return this.hubProvider.publicClient.readContract({
      address: uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesData',
      args: [poolAddressesProvider],
    });
  }

  /**
   * Get user-specific reserve data
   * @param userAddress Address of the user
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @returns Tuple containing array of user reserve data and eMode category ID
   */
  async getUserReservesData(
    userAddress: Address,
    uiPoolDataProvider: Address,
    poolAddressesProvider: Address,
  ): Promise<readonly [readonly UserReserveData[], number]> {
    return this.hubProvider.publicClient.readContract({
      address: uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getUserReservesData',
      args: [poolAddressesProvider, userAddress],
    });
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
   * @returns Array of supported tokens
   */
  public getSupportedTokens(chainId: SpokeChainId): readonly Token[] {
    return getSupportedMoneyMarketTokens(chainId);
  }

  /**
   * Get the list of all supported money market reserves (supply / borrow reserves)
   * NOTE: reserve addresses are on the hub chain and can be of type vault, erc20, etc.
   * @returns Array of supported reserves
   */
  public getSupportedReserves(): readonly Address[] {
    return [...moneyMarketReserveAssets];
  }
}
