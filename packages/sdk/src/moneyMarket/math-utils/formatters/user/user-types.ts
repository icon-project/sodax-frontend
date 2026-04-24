import type { FormatReserveUSDResponse } from '../reserve/index.js';

export interface UserReserveDataString {
  underlyingAsset: string;
  scaledATokenBalance: string;
  usageAsCollateralEnabledOnUser: boolean;
  scaledVariableDebt: string;
}

export interface CombinedReserveData<T extends FormatReserveUSDResponse = FormatReserveUSDResponse>
  extends UserReserveDataString {
  reserve: T;
}

export interface ComputedUserReserve<T extends FormatReserveUSDResponse = FormatReserveUSDResponse>
  extends CombinedReserveData<T> {
  underlyingBalance: string;
  underlyingBalanceMarketReferenceCurrency: string;
  underlyingBalanceUSD: string;
  variableBorrows: string;
  variableBorrowsMarketReferenceCurrency: string;
  variableBorrowsUSD: string;
  totalBorrows: string;
  totalBorrowsMarketReferenceCurrency: string;
  totalBorrowsUSD: string;
}
