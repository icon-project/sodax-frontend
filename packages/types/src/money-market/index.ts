import type { RelayErrorCode } from '../relay/index.js';
import type { EvmAddress, PartnerFeeConfig, RelayerApiConfig } from '../shared/index.js';
import type { Prettify, Optional } from '../util/index.js';

export type MoneyMarketConfig = {
  uiPoolDataProvider: EvmAddress;
  lendingPool: EvmAddress;
  poolAddressesProvider: EvmAddress;
  bnUSD: EvmAddress;
  bnUSDVault: EvmAddress;
};

export type MoneyMarketServiceConfig = Prettify<MoneyMarketConfig & PartnerFeeConfig & RelayerApiConfig>;

export type MoneyMarketConfigParams =
  | Prettify<MoneyMarketConfig & Optional<PartnerFeeConfig, 'partnerFee'>>
  | Optional<PartnerFeeConfig, 'partnerFee'>;

export type AggregatedReserveData = {
  underlyingAsset: EvmAddress;
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
  aTokenAddress: EvmAddress;
  variableDebtTokenAddress: EvmAddress;
  interestRateStrategyAddress: EvmAddress;
  availableLiquidity: bigint;
  totalScaledVariableDebt: bigint;
  priceInMarketReferenceCurrency: bigint;
  priceOracle: EvmAddress;
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
  asset: EvmAddress; // The address of the asset to supply.
  amount: bigint; // The amount of the asset to supply.
  onBehalfOf: EvmAddress; // The address on whose behalf the asset is supplied.
  referralCode: number; // The referral code for the transaction.
};

export type MoneyMarketEncodeWithdrawParams = {
  asset: EvmAddress; // The address of the asset to withdraw.
  amount: bigint; // The amount of the asset to withdraw.
  to: EvmAddress; // The address that will receive the withdrawn assets.
};

export type MoneyMarketEncodeBorrowParams = {
  asset: EvmAddress; // The address of the asset to borrow.
  amount: bigint; // The amount of the asset to borrow.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  referralCode: number; // The referral code for the borrow transaction.
  onBehalfOf: EvmAddress; // The address that will receive the borrowed assets.
};

export type MoneyMarketEncodeRepayParams = {
  asset: EvmAddress; // The address of the asset to repay.
  amount: bigint; // The amount of the asset to repay.
  interestRateMode: bigint; // The interest rate mode (2 for Variable).
  onBehalfOf: EvmAddress; // The address that will get their debt reduced/removed.
};

export type MoneyMarketEncodeRepayWithATokensParams = {
  asset: EvmAddress; // The address of the asset to repay.
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
