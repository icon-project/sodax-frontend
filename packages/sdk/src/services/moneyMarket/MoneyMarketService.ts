import { type Address, type Hex, encodeFunctionData } from 'viem';
import { poolAbi } from '../../abis/pool.abi.js';
import type { EvmHubProvider, EvmWalletProvider } from '../../entities/index.js';
import { hubAssets, uiPoolDataAbi } from '../../index.js';
import type { EvmContractCall, MoneyMarketConfig, SpokeChainId, PartnerFee } from '../../types.js';
import { calculateFeeAmount, encodeContractCalls } from '../../utils/index.js';
import { EvmAssetManagerService, EvmVaultTokenService } from '../hub/index.js';
import { Erc20Service } from '../shared/index.js';

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

export type MoneyMarketSupplyParams = {
  asset: Address; // The address of the asset to supply.
  amount: bigint; // The amount of the asset to supply.
  onBehalfOf: Address; // The address on whose behalf the asset is supplied.
  referralCode: number; // The referral code for the transaction.
};

export type MoneyMarketWithdrawParams = {
  asset: Address; // The address of the asset to withdraw.
  amount: bigint; // The amount of the asset to withdraw.
  to: Address; // The address that will receive the withdrawn assets.
};

export type MoneyMarketBorrowParams = {
  asset: Address; // The address of the asset to borrow.
  amount: bigint; // The amount of the asset to borrow.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  referralCode: number; // The referral code for the borrow transaction.
  onBehalfOf: Address; // The address that will receive the borrowed assets.
};

export type MoneyMarketRepayParams = {
  asset: Address; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  onBehalfOf: Address; // The address that will get their debt reduced/removed.
};

export type MoneyMarketRepayWithATokensParams = {
  asset: Address; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
};


export class MoneyMarketService {
  /**
   * Deposit tokens to the spoke chain and supply to the money market pool
   * @param token The address of the token to deposit
   * @param to The user wallet address on the hub chain
   * @param amount The amount to deposit
   * @param spokeChainId The chain ID of the spoke chain
   * @param moneyMarketConfig The money market configuration
   * @returns Transaction object
   */
  public static supplyData(
    token: Address | string,
    to: Address,
    amount: bigint,
    spokeChainId: SpokeChainId,
    moneyMarketConfig: MoneyMarketConfig,
  ): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = hubAssets[spokeChainId][token];
    const assetAddress = assetConfig?.asset;
    const vaultAddress = assetConfig?.vault;
    const lendingPool = moneyMarketConfig.lendingPool;
    if (!assetAddress || !vaultAddress || !lendingPool) {
      throw new Error('Address not found');
    }

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
   * @param hubProvider The hub chain provider
   * @param moneyMarketConfig The money market configuration
   * @param fee The fee for the transaction
   * @returns Transaction object
   */
  public static borrowData(
    from: Address,
    to: Address | Hex,
    token: Address | string,
    amount: bigint,
    spokeChainId: SpokeChainId,
    hubProvider: EvmHubProvider,
    moneyMarketConfig: MoneyMarketConfig,
    fee?: PartnerFee,
  ): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = hubAssets[spokeChainId][token];
    const assetAddress = assetConfig?.asset;
    const vaultAddress = assetConfig?.vault;
    const bnUSDVault = moneyMarketConfig.bnUSDVault;
    const bnUSD = moneyMarketConfig.bnUSD;
    if (!assetAddress || !vaultAddress) {
      throw new Error('Address not found');
    }

    const feeAmount = calculateFeeAmount(amount, fee);

    if (bnUSDVault && bnUSD && bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      calls.push(
        MoneyMarketService.encodeBorrow(
          { asset: bnUSD, amount: amount, interestRateMode: 2n, referralCode: 0, onBehalfOf: from },
          moneyMarketConfig.lendingPool,
        ),
      );
      calls.push(Erc20Service.encodeApprove(bnUSD, bnUSDVault, amount));
      calls.push(EvmVaultTokenService.encodeDeposit(bnUSDVault, bnUSD, amount));

      if (fee && feeAmount) {
        calls.push(Erc20Service.encodeTansfer(bnUSDVault, fee.address, feeAmount))
      }
    } else {
      calls.push(
        MoneyMarketService.encodeBorrow(
          { asset: vaultAddress, amount: amount, interestRateMode: 2n, referralCode: 0, onBehalfOf: from },
          moneyMarketConfig.lendingPool,
        ),
      );

      if (fee && feeAmount) {
        calls.push(Erc20Service.encodeTansfer(vaultAddress, fee.address, feeAmount))
      }
    }

    calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, amount - feeAmount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(assetConfig.decimal, amount - feeAmount);

    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetAddress,
        to,
        translatedAmountOut,
        hubProvider.chainConfig.addresses.assetManager,
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
   * @param {EvmHubProvider} hubProvider
   * @param {MoneyMarketConfig} moneyMarketConfig
   * @returns Transaction object
   */
  public static withdrawData(
    from: Address,
    to: Address,
    token: Address | string,
    amount: bigint,
    spokeChainId: SpokeChainId,
    hubProvider: EvmHubProvider,
    moneyMarketConfig: MoneyMarketConfig,
  ): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = hubAssets[spokeChainId][token];
    const assetAddress = assetConfig?.asset;
    const vaultAddress = assetConfig?.vault;

    if (!assetAddress || !vaultAddress) {
      throw new Error('Address not found');
    }
    calls.push(
      MoneyMarketService.encodeWithdraw(
        { asset: vaultAddress, amount: amount, to: from },
        moneyMarketConfig.lendingPool,
      ),
    );

    calls.push(EvmVaultTokenService.encodeWithdraw(vaultAddress, assetAddress, amount));
    const translatedAmountOut = EvmVaultTokenService.translateOutgoingDecimals(assetConfig.decimal, amount);
    calls.push(
      EvmAssetManagerService.encodeTransfer(
        assetAddress,
        to,
        translatedAmountOut,
        hubProvider.chainConfig.addresses.assetManager,
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
  public static repayData(
    token: Address | string,
    to: Address,
    amount: bigint,
    spokeChainId: SpokeChainId,
    moneyMarketConfig: MoneyMarketConfig,
  ): Hex {
    const calls: EvmContractCall[] = [];
    const assetConfig = hubAssets[spokeChainId][token];
    const assetAddress = assetConfig?.asset;
    const vaultAddress = assetConfig?.vault;
    const bnUSDVault = moneyMarketConfig.bnUSDVault;
    const bnUSD = moneyMarketConfig.bnUSD;

    if (!assetAddress || !vaultAddress) {
      throw new Error('Asset or vault address not found');
    }

    calls.push(Erc20Service.encodeApprove(assetAddress, vaultAddress, amount));
    calls.push(EvmVaultTokenService.encodeDeposit(vaultAddress, assetAddress, amount));
    const translatedAmount = EvmVaultTokenService.translateIncomingDecimals(assetConfig.decimal, amount);

    let repayToken = vaultAddress;
    if (bnUSDVault && bnUSD && bnUSDVault.toLowerCase() === vaultAddress.toLowerCase()) {
      repayToken = bnUSD;
      calls.push(EvmVaultTokenService.encodeWithdraw(bnUSDVault, bnUSD, translatedAmount));
    }

    calls.push(Erc20Service.encodeApprove(repayToken, moneyMarketConfig.lendingPool, translatedAmount));
    calls.push(
      MoneyMarketService.encodeRepay(
        { asset: repayToken, amount: translatedAmount, interestRateMode: 2n, onBehalfOf: to },
        moneyMarketConfig.lendingPool,
      ),
    );
    return encodeContractCalls(calls);
  }

  /**
   * Get the list of all reserves in the pool
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @param {EvmWalletProvider} provider
   * @returns Array of reserve addresses
   */
  async getReservesList(
    uiPoolDataProvider: Address,
    poolAddressesProvider: Address,
    provider: EvmWalletProvider,
  ): Promise<readonly Address[]> {
    return provider.publicClient.readContract({
      address: uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesList',
      args: [poolAddressesProvider],
    });
  }

  /**
   * Get detailed data for all reserves in the pool
   * @returns Tuple containing array of reserve data and base currency info
   */
  async getReservesData(
    uiPoolDataProvider: Address,
    poolAddressesProvider: Address,
    provider: EvmWalletProvider,
  ): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> {
    return provider.publicClient.readContract({
      address: uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesData',
      args: [poolAddressesProvider],
    });
  }

  /**
   * Get user-specific reserve data
   * @param userAddress Address of the user
   * @returns Tuple containing array of user reserve data and eMode category ID
   */
  async getUserReservesData(
    userAddress: Address,
    uiPoolDataProvider: Address,
    poolAddressesProvider: Address,
    provider: EvmWalletProvider,
  ): Promise<readonly [readonly UserReserveData[], number]> {
    return provider.publicClient.readContract({
      address: uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getUserReservesData',
      args: [poolAddressesProvider, userAddress],
    });
  }

  /**
   * Encodes a supply transaction for a money market pool.
   * @param {MoneyMarketWithdrawParams} params - The parameters for the supply transaction.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeSupply(params: MoneyMarketSupplyParams, lendingPool: Address): EvmContractCall {
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
   * @param {MoneyMarketWithdrawParams} params - The parameters for the withdraw transaction.
   * @param {Address} params.asset - The address of the asset to withdraw.
   * @param {bigint} params.amount - The amount of the asset to withdraw.
   * @param {Address} params.to - The address that will receive the withdrawn assets.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeWithdraw(params: MoneyMarketWithdrawParams, lendingPool: Address): EvmContractCall {
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
   * @param {MoneyMarketBorrowParams} params - The parameters for the borrow transaction.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeBorrow(params: MoneyMarketBorrowParams, lendingPool: Address): EvmContractCall {
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
   * @param {MoneyMarketRepayParams} params - The parameters for the repay transaction.
   * @param {Address} params.asset - The address of the borrowed asset to repay.
   * @param {bigint} params.amount - The amount to repay. Use type(uint256).max to repay the entire debt.
   * @param {number} params.interestRateMode - The interest rate mode (2 for Variable).
   * @param {Address} params.onBehalfOf - The address of the user who will get their debt reduced/removed.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeRepay(params: MoneyMarketRepayParams, lendingPool: Address): EvmContractCall {
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
   * @param {MoneyMarketRepayWithATokensParams} params - The parameters for the repayWithATokens transaction.
   * @param {Address} lendingPool - The address of the lending pool contract.
   * @returns {EvmContractCall} The encoded contract call.
   */
  public static encodeRepayWithATokens(
    params: MoneyMarketRepayWithATokensParams,
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
}
