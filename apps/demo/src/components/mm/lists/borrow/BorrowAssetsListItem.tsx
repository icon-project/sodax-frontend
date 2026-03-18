import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import type { ChainId, XToken } from '@sodax/types';
import { BorrowButton } from '../BorrowButton';
import { formatDecimalForDisplay } from '@/lib/utils';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import type { FormatReserveUSDResponse, FormatUserSummaryResponse, UserReserveData } from '@sodax/sdk';
import { useAToken } from '@sodax/dapp-kit';
import { Button } from '@/components/ui/button';
import { MAX_BORROW_SAFETY_MARGIN, ZERO_ADDRESS } from '../../constants';
import { isUserReserveDataArray, isValidEvmAddress } from '../../typeGuards';

interface BorrowAssetsListItemProps {
  token: XToken;
  walletBalance: string;
  asset: {
    symbol: string;
    decimals: number;
    address: string;
    chainId: ChainId;
    vault: string;
  };
  disabled?: boolean;
  formattedReserves: FormatReserveUSDResponse[];
  userReserves: readonly UserReserveData[];
  onBorrowClick: (token: XToken, maxBorrow: string, priceUSD: number) => void;
  onRepayClick: (token: XToken, maxDebt: string) => void;
  userSummary?: FormatUserSummaryResponse;
}

export function BorrowAssetsListItem({
  token,
  walletBalance,
  asset,
  disabled = false,
  formattedReserves,
  userReserves,
  onBorrowClick,
  onRepayClick,
  userSummary,
}: BorrowAssetsListItemProps) {
  // Validate userReserves array before passing to useReserveMetrics
  if (!isUserReserveDataArray(userReserves)) {
    throw new Error('Invalid type of variable userReserves: expected UserReserveData[]');
  }

  const metrics = useReserveMetrics({
    token,
    formattedReserves,
    userReserves,
  });

  // Validate aTokenAddress is a valid EVM address before using
  const rawATokenAddress = metrics.formattedReserve?.aTokenAddress;
  const aTokenAddress =
    rawATokenAddress && rawATokenAddress !== ZERO_ADDRESS && isValidEvmAddress(rawATokenAddress)
      ? rawATokenAddress
      : undefined;

  const { data: aToken } = useAToken({
    aToken: aTokenAddress ?? ZERO_ADDRESS,
    queryOptions: {
      queryKey: ['aToken', aTokenAddress],
      enabled: !!aTokenAddress,
    },
  });

  let availableLiquidity: string | undefined;

  if (metrics.formattedReserve && aToken) {
    availableLiquidity =
      metrics.formattedReserve.borrowCap === '0'
        ? formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), aToken.decimals)
        : Math.min(
            Number.parseFloat(formatUnits(BigInt(metrics.formattedReserve.availableLiquidity), aToken.decimals)),
            Number.parseInt(metrics.formattedReserve.borrowCap) -
              Number.parseFloat(metrics.formattedReserve.totalScaledVariableDebt),
          ).toFixed(6);
  }

  let maxBorrow = '0';

  if (userSummary && metrics.formattedReserve && availableLiquidity) {
    let availableBorrowsUSD = Number(userSummary.availableBorrowsUSD);
    const priceUSD = Number(metrics.formattedReserve.priceInUSD);

    // Fallback calculation if SDK returns 0 but user has collateral
    // This can happen due to rounding/precision issues with very small amounts
    // NOTE: Should use currentLoanToValue (LTV), not currentLiquidationThreshold
    // LTV is the max you can borrow, liquidation threshold is when you get liquidated
    if (availableBorrowsUSD === 0 && Number(userSummary.totalCollateralUSD) > 0) {
      const totalCollateralUSD = Number(userSummary.totalCollateralUSD);
      const totalBorrowsUSD = Number(userSummary.totalBorrowsUSD);
      const currentLoanToValue = Number(userSummary.currentLoanToValue);

      // Calculate available borrow: (collateral * LTV) - currentBorrows
      // Use currentLoanToValue (LTV), not liquidation threshold
      const maxBorrowableUSD = totalCollateralUSD * currentLoanToValue;
      availableBorrowsUSD = Math.max(0, maxBorrowableUSD - totalBorrowsUSD);
    }

    if (priceUSD > 0 && availableBorrowsUSD > 0) {
      const userLimitTokens = availableBorrowsUSD / priceUSD;
      const poolLimitTokens = Number(availableLiquidity);

      const beforeSafetyMargin = Math.min(userLimitTokens, poolLimitTokens);
      const afterSafetyMargin = beforeSafetyMargin * MAX_BORROW_SAFETY_MARGIN;
      maxBorrow = afterSafetyMargin.toFixed(6);
    }
  }

  const canBorrow = !!availableLiquidity && Number.parseFloat(availableLiquidity) > 0;

  // Calculate actual debt by applying variable borrow index (similar to how supply applies liquidity index)
  // scaledVariableDebt needs to be multiplied by variableBorrowIndex to get the actual debt amount
  let debtExact = '0';
  if (metrics.userReserve && metrics.formattedReserve) {
    const scaledDebt = metrics.userReserve.scaledVariableDebt;
    const variableBorrowIndex = BigInt(metrics.formattedReserve.variableBorrowIndex || '1e27');
    // Multiply scaled debt by borrow index and divide by ray precision (1e27)
    const actualDebtRaw = (scaledDebt * variableBorrowIndex) / BigInt(1e27);
    const tokenDecimals = Number(metrics.formattedReserve.decimals ?? 18);
    debtExact = formatUnits(actualDebtRaw, tokenDecimals);
  }

  const debtNum = Number.parseFloat(debtExact);
  // Always display debt with 4 decimals, but show "0" when debt is zero or rounds to zero
  const debtDisplay = Number.isNaN(debtNum) ? '0' : formatDecimalForDisplay(debtExact, 4);
  // Check if user has meaningful debt: must have actual debt amount > 0
  // Check if debt, when formatted to 4 decimals (same as display), is greater than 0
  // This prevents enabling repay button when debt displays as "0.0000"
  const hasDebt =
    metrics.userReserve && metrics.userReserve.scaledVariableDebt > 0n && Number.isFinite(debtNum) && debtNum > 0;

  return (
    <TableRow
      className={`border-b border-cherry-grey/10 hover:bg-cream/20 transition-colors ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Asset */}
      <TableCell className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            {/* Use token.symbol (current symbol like "POL") instead of asset.symbol (legacy like "MATIC") */}
            <span className="font-bold text-cherry-dark">{token.symbol}</span>
          </div>
        </div>
      </TableCell>

      {/* Wallet Balance */}
      <TableCell className="px-6 py-5">
        <span className="text-sm text-foreground">{walletBalance}</span>
      </TableCell>

      {/* Available Liquidity */}
      <TableCell className="px-6 py-5">
        <span className="text-sm font-medium text-foreground">{availableLiquidity ?? '--'}</span>
      </TableCell>

      {/* Borrow APY */}
      <TableCell className="px-6 py-5">
        <span className="text-sm font-medium text-cherry-dark">{metrics.borrowAPY}</span>
      </TableCell>

      {/* Borrow APR */}
      <TableCell className="px-6 py-5">
        <span className="text-sm font-medium text-cherry-dark">{metrics.borrowAPR}</span>
      </TableCell>

      {/* Total Borrow */}
      <TableCell className="px-6 py-5">
        <span className="text-sm text-foreground">{metrics.totalBorrow}</span>
      </TableCell>

      {/* Borrowed */}
      <TableCell className="px-6 py-5">
        <span className="text-sm font-medium text-foreground">{debtDisplay}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="px-6 py-5">
        <div className="flex items-center gap-2">
          <BorrowButton
            token={token}
            disabled={disabled || !canBorrow}
            onClick={() => {
              const priceUSD = metrics.formattedReserve ? Number(metrics.formattedReserve.priceInUSD) : 0;
              onBorrowClick(token, maxBorrow, priceUSD);
            }}
          />
          <Button
            variant="cherry"
            size="sm"
            onClick={() => {
              // Prevent opening modal if there's no debt
              if (!hasDebt) return;
              // Pass the full-precision raw value from formatUnits — display formatting is separate from tx amount.
              onRepayClick(token, debtExact);
            }}
            disabled={!hasDebt}
            className="flex-1 min-w-[85px]"
          >
            Repay
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
