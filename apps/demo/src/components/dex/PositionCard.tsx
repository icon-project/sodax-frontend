// apps/demo/src/components/dex/PositionCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ConcentratedLiquidityPositionInfo } from '@sodax/sdk';
import type { TokenInfo, PriceRange, PositionAmounts } from '@/lib/token-utils';

interface PositionCardProps {
  positionData: ConcentratedLiquidityPositionInfo | null;
  token0Info?: TokenInfo;
  token1Info?: TokenInfo;
  priceRange?: PriceRange;
  positionAmounts?: PositionAmounts;
  unclaimedFees?: {
    unclaimedFees0: bigint;
    unclaimedFees1: bigint;
    unclaimedFees0Formatted: string;
    unclaimedFees1Formatted: string;
  };
}

export function PositionCard({
  positionData,
  token0Info,
  token1Info,
  priceRange,
  positionAmounts,
  unclaimedFees,
}: PositionCardProps) {
  // Add null checks for the position data
  if (!positionData) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">No position data available</div>
        </CardContent>
      </Card>
    );
  }

  const { poolKey, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, subscriber } =
    positionData;

  // Helper function to format bigint values
  const formatBigInt = (value: bigint | undefined | null, decimals = 18): string => {
    if (!value) return '0';
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return `${whole}.${remainderStr.slice(0, 6)}`;
  };

  // Helper function to format tick values
  const formatTick = (tick: number | undefined | null): string => {
    if (tick === undefined || tick === null) return 'N/A';
    return tick.toString();
  };

  // Helper function to format address
  const formatAddress = (address: string | undefined | null): string => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Position Details</span>
          <Badge variant="secondary">Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pool Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Pool Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Token 0:</span>
              <div className="font-mono">
                {token0Info ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token0Info.symbol}</span>
                    <span className="text-xs text-muted-foreground">({formatAddress(poolKey?.currency0)})</span>
                  </div>
                ) : (
                  formatAddress(poolKey?.currency0)
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Token 1:</span>
              <div className="font-mono">
                {token1Info ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token1Info.symbol}</span>
                    <span className="text-xs text-muted-foreground">({formatAddress(poolKey?.currency1)})</span>
                  </div>
                ) : (
                  formatAddress(poolKey?.currency1)
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Fee Tier:</span>
              <div>{poolKey?.fee?.toString() || 'N/A'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tick Spacing:</span>
              <div>{poolKey?.tickSpacing?.toString() || 'N/A'}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Position Range */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Position Range</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tick Lower:</span>
              <div className="font-mono">{formatTick(tickLower)}</div>
              {priceRange && (
                <div className="text-xs text-muted-foreground mt-1">Price: {priceRange.minPriceFormatted}</div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Tick Upper:</span>
              <div className="font-mono">{formatTick(tickUpper)}</div>
              {priceRange && (
                <div className="text-xs text-muted-foreground mt-1">Price: {priceRange.maxPriceFormatted}</div>
              )}
            </div>
          </div>

          {priceRange && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">Price Range Summary</div>

              {/* A/B Prices (Token0/Token1) */}
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {token0Info && token1Info ? `${token0Info.symbol}/${token1Info.symbol}` : 'Token0/Token1'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Min:</span>
                    <div className="font-mono">{priceRange.minPriceABFormatted}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>
                    <div className="font-mono">{priceRange.maxPriceABFormatted}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current:</span>
                    <div className="font-mono">{priceRange.currentPriceABFormatted}</div>
                  </div>
                </div>
              </div>

              {/* B/A Prices (Token1/Token0) */}
              <div className="mb-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {token0Info && token1Info ? `${token1Info.symbol}/${token0Info.symbol}` : 'Token1/Token0'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Min:</span>
                    <div className="font-mono">{priceRange.minPriceBAFormatted}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>
                    <div className="font-mono">{priceRange.maxPriceBAFormatted}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current:</span>
                    <div className="font-mono">{priceRange.currentPriceBAFormatted}</div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-2">
                💡 Prices are calculated from tick ranges using Uniswap V3 math
                <br />✅ "Current" price shown is real market price from pool state
                <br />📊 Min/Max are the position's liquidity bounds
              </div>

              {/* Price Verification */}
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                <div className="font-medium mb-1">Price Verification:</div>
                <div className="space-y-1">
                  <div>
                    Min A/B × Max B/A = {(priceRange.minPriceAB * priceRange.maxPriceBA).toFixed(6)} (should be 1.0)
                  </div>
                  <div>
                    Max A/B × Min B/A = {(priceRange.maxPriceAB * priceRange.minPriceBA).toFixed(6)} (should be 1.0)
                  </div>
                  <div>
                    Current A/B × Current B/A = {(priceRange.currentPriceAB * priceRange.currentPriceBA).toFixed(6)}{' '}
                    (should be 1.0)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Liquidity Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Liquidity</h4>
          <div className="text-sm">
            <span className="text-muted-foreground">Total Liquidity:</span>
            <div className="font-mono">{formatBigInt(liquidity)}</div>
          </div>
        </div>

        <Separator />

        {/* Position Amounts */}
        {positionAmounts && (
          <>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Position Amounts</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{token0Info ? token0Info.symbol : 'Token 0'}:</span>
                  <div className="font-mono text-lg font-semibold">{positionAmounts.amount0Formatted}</div>
                  <div className="text-xs text-muted-foreground">Raw: {positionAmounts.amount0.toString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{token1Info ? token1Info.symbol : 'Token 1'}:</span>
                  <div className="font-mono text-lg font-semibold">{positionAmounts.amount1Formatted}</div>
                  <div className="text-xs text-muted-foreground">Raw: {positionAmounts.amount1.toString()}</div>
                </div>
              </div>

              {/* Position Status */}
              <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                <div className="font-medium mb-1">Position Status:</div>
                {positionAmounts.amount0 === 0n && positionAmounts.amount1 > 0n && (
                  <div className="text-blue-600">🔵 Price above range - Only {token1Info?.symbol || 'Token1'} held</div>
                )}
                {positionAmounts.amount0 > 0n && positionAmounts.amount1 === 0n && (
                  <div className="text-orange-600">
                    🟠 Price below range - Only {token0Info?.symbol || 'Token0'} held
                  </div>
                )}
                {positionAmounts.amount0 > 0n && positionAmounts.amount1 > 0n && (
                  <div className="text-green-600">🟢 Price in range - Both tokens held</div>
                )}
                {positionAmounts.amount0 === 0n && positionAmounts.amount1 === 0n && (
                  <div className="text-gray-600">⚪ Position empty</div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Fee Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Fee Growth</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Token 0 Fee Growth:</span>
              <div className="font-mono text-xs">{formatBigInt(feeGrowthInside0LastX128, 0)}</div>
              <div className="text-xs text-muted-foreground">
                Last updated: {feeGrowthInside0LastX128 ? 'Position modified' : 'Never'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Token 1 Fee Growth:</span>
              <div className="font-mono text-xs">{formatBigInt(feeGrowthInside1LastX128, 0)}</div>
              <div className="text-xs text-muted-foreground">
                Last updated: {feeGrowthInside1LastX128 ? 'Position modified' : 'Never'}
              </div>
            </div>
          </div>

          {/* Fee Growth Explanation */}
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
            <div className="font-medium mb-1">💡 Fee Growth Info:</div>
            <div className="space-y-1">
              <div>• Fee growth only updates when YOU modify the position</div>
              <div>• Other people's trades don't update your position</div>
              <div>• To see current fees, you need to claim or modify position</div>
              <div>• Current values show fees earned since last position update</div>
            </div>
          </div>

          {/* Current Unclaimed Fees */}
          {unclaimedFees && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-sm font-medium mb-2">💰 Current Unclaimed Fees</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{token0Info ? token0Info.symbol : 'Token 0'}:</span>
                  <div className="font-mono text-lg font-semibold text-green-600">
                    {unclaimedFees.unclaimedFees0Formatted}
                  </div>
                  <div className="text-xs text-muted-foreground">Raw: {unclaimedFees.unclaimedFees0.toString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{token1Info ? token1Info.symbol : 'Token 1'}:</span>
                  <div className="font-mono text-lg font-semibold text-green-600">
                    {unclaimedFees.unclaimedFees1Formatted}
                  </div>
                  <div className="text-xs text-muted-foreground">Raw: {unclaimedFees.unclaimedFees1.toString()}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                💡 These are the fees you've earned from trades since your last position update
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Subscriber Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Subscriber</h4>
          <div className="text-sm">
            <span className="text-muted-foreground">Address:</span>
            <div className="font-mono">{formatAddress(subscriber)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
