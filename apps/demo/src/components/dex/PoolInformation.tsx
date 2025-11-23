// apps/demo/src/components/dex/PoolInformation.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClService, PoolData } from '@sodax/sdk';


interface PoolInformationProps {
  poolData: PoolData | null;
  formatAmount: (amount: bigint, decimals: number) => string;
  formatConversionRate: (rate: bigint) => string;
}

export function PoolInformation({
  poolData,
  formatAmount,
  formatConversionRate,
}: PoolInformationProps): JSX.Element | null {
  if (!poolData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Pool ID:</span>
            <div className="font-mono text-xs">{poolData.poolId.slice(0, 10)}...</div>
          </div>
          <div>
            <span className="text-muted-foreground">Fee Tier:</span>
            <div>{poolData.feeTier / 10000}%</div>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Token 0:</span>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {poolData.token0.symbol}
              </span>
              {poolData.token0IsStatAToken && poolData.token0UnderlyingToken && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">🔄 Wrapped Token (ERC4626)</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <div>
                      <span className="text-muted-foreground">Underlying:</span>{' '}
                      <span className="ml-1 inline-flex items-center rounded-md border border-input bg-background px-2 py-1 text-xs font-medium">
                        {poolData.token0UnderlyingToken.symbol}
                      </span>
                    </div>
                    {poolData.token0ConversionRate && (
                      <div>
                        <span className="text-muted-foreground">Rate:</span>{' '}
                        <span className="font-mono">
                          1 {poolData.token0.symbol} = {formatConversionRate(poolData.token0ConversionRate)}{' '}
                          {poolData.token0UnderlyingToken.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Token 1:</span>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {poolData.token1.symbol}
              </span>
              {poolData.token1IsStatAToken && poolData.token1UnderlyingToken && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">🔄 Wrapped Token (ERC4626)</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <div>
                      <span className="text-muted-foreground">Underlying:</span>{' '}
                      <span className="ml-1 inline-flex items-center rounded-md border border-input bg-background px-2 py-1 text-xs font-medium">
                        {poolData.token1UnderlyingToken.symbol}
                      </span>
                    </div>
                    {poolData.token1ConversionRate && (
                      <div>
                        <span className="text-muted-foreground">Rate:</span>{' '}
                        <span className="font-mono">
                          1 {poolData.token1.symbol} = {formatConversionRate(poolData.token1ConversionRate)}{' '}
                          {poolData.token1UnderlyingToken.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Current Price:</span>
            <div className="font-mono">
              {poolData.price.toSignificant(6)} {poolData.token1.symbol}/{poolData.token0.symbol}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Current Tick:</span>
            <div className="font-mono">{poolData.currentTick}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Liquidity:</span>
            <div className="font-mono">{poolData.totalLiquidity.toString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

