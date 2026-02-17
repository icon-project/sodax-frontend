import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import type { ChainId, XToken } from '@sodax/types';
import { BorrowButton } from '../BorrowButton';
import { getChainLabel } from '@/lib/borrowUtils';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import type { FormatReserveUSDResponse, FormatUserSummaryResponse, UserReserveData } from '@sodax/sdk';
import { useAToken } from '@sodax/dapp-kit';
import { Button } from '@/components/ui/button';
import { DUST_THRESHOLD, MAX_BORROW_SAFETY_MARGIN, ATOKEN_DECIMALS, ZERO_ADDRESS } from '../../constants';
import { isUserReserveDataArray, isValidEvmAddress } from '../../typeGuards';
import { isAddress } from 'viem';

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
    if (availableBorrowsUSD === 0 && Number(userSummary.totalCollateralUSD) > 0) {
      const totalCollateralUSD = Number(userSummary.totalCollateralUSD);
      const totalBorrowsUSD = Number(userSummary.totalBorrowsUSD);
      const currentLiquidationThreshold = Number(userSummary.currentLiquidationThreshold);

      // Calculate available borrow: (collateral * maxLTV) - currentBorrows
      // Using liquidation threshold as max LTV (typically 80%)
      const maxBorrowableUSD = totalCollateralUSD * currentLiquidationThreshold;
      availableBorrowsUSD = Math.max(0, maxBorrowableUSD - totalBorrowsUSD);
    }

    if (priceUSD > 0 && availableBorrowsUSD > 0) {
      const userLimitTokens = availableBorrowsUSD / priceUSD;
      const poolLimitTokens = Number(availableLiquidity);

      maxBorrow = (Math.min(userLimitTokens, poolLimitTokens) * MAX_BORROW_SAFETY_MARGIN).toFixed(6);
    }
  }

  const canBorrow = !!availableLiquidity && Number.parseFloat(availableLiquidity) > 0;
  const formattedDebt = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledVariableDebt, ATOKEN_DECIMALS)).toFixed(4)
    : '0';

  // Check if user has meaningful debt: balance exists AND formatted amount is greater than DUST_THRESHOLD
  // This prevents enabling repay button for dust amounts that display as "0.0000"
  const hasDebt =
    metrics.userReserve &&
    metrics.userReserve.scaledVariableDebt > 0n &&
    formattedDebt !== '0' &&
    Number.parseFloat(formattedDebt) > DUST_THRESHOLD;

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
            <span className="text-xs text-clay">{getChainLabel(token.xChainId)}</span>
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
        <span className="text-sm font-medium text-foreground">{formattedDebt}</span>
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
            onClick={() => onRepayClick(token, formattedDebt)}
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
