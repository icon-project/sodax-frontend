// apps/demo/src/components/dex/PoolInfo.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type { ConcentratedLiquidityService, PoolData, EvmHubProvider } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { createSonicPublicClient } from '@/lib/token-utils';

interface PoolInfoProps {
  poolData: PoolData | null;
  clService?: ConcentratedLiquidityService;
}

export function PoolInfo({ poolData, clService }: PoolInfoProps) {
  const [dynamicFees, setDynamicFees] = useState<{
    lpFee: number;
    protocolFee: number;
    lpFeePercentage: string;
    protocolFeePercentage: string;
    totalFeePercentage: string;
  } | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);

  useEffect(() => {
    if (poolData && poolData.feeTier === 8388608) {
      // Only fetch dynamic fees for dynamic fee pools
      fetchDynamicFees();
    }
  }, [poolData]);

  const fetchDynamicFees = async () => {
    if (!poolData || !clService) return;

    setLoadingFees(true);
    try {
      const publicClient = createSonicPublicClient();

      // Get current fee rates from the hook using ConcentratedLiquidityService
      const feeRates = await publicClient.readContract({
        address: poolData.poolKey.hooks,
        abi: [
          {
            inputs: [],
            name: 'lpFee',
            outputs: [{ name: '', type: 'uint24' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'protocolFee',
            outputs: [{ name: '', type: 'uint24' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'lpFee',
        args: [],
      });

      const protocolFee = await publicClient.readContract({
        address: poolData.poolKey.hooks,
        abi: [
          {
            inputs: [],
            name: 'protocolFee',
            outputs: [{ name: '', type: 'uint24' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'protocolFee',
        args: [],
      });

      const lpFee = feeRates as number;
      const protocolFeeValue = protocolFee as number;

      // Convert to percentages (fee rates are in basis points)
      const lpFeePercentage = (lpFee / 10000).toFixed(4);
      const protocolFeePercentage = (protocolFeeValue / 10000).toFixed(4);
      const totalFeePercentage = ((lpFee + protocolFeeValue) / 10000).toFixed(4);

      setDynamicFees({
        lpFee,
        protocolFee: protocolFeeValue,
        lpFeePercentage: `${lpFeePercentage}%`,
        protocolFeePercentage: `${protocolFeePercentage}%`,
        totalFeePercentage: `${totalFeePercentage}%`,
      });
    } catch (error) {
      console.error('Failed to fetch dynamic fees:', error);
    } finally {
      setLoadingFees(false);
    }
  };
  if (!poolData) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">No pool data available</div>
        </CardContent>
      </Card>
    );
  }

  const {
    poolId,
    sqrtPriceX96,
    currentTick,
    currentPriceBA,
    currentPriceAB,
    currentPriceBAFormatted,
    currentPriceABFormatted,
    totalLiquidity,
    feeTier,
    tickSpacing,
    protocolFee,
    lpFee,
    token0,
    token1,
    isActive,
  } = poolData;

  // Helper function to format address
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate token amounts using ConcentratedLiquidityService
  const tokenAmounts = clService
    ? clService.calculatePoolTokenAmounts(sqrtPriceX96, totalLiquidity, token0.decimals, token1.decimals)
    : { amount0: '0', amount1: '0' };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              {token0.symbol}/{token1.symbol}
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              {token0.name} / {token1.name}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>
            {poolData.feeTier === 8388608 ? (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Dynamic Fee
              </Badge>
            ) : (
              <Badge variant="outline">{feeTier / 10000}% Fee</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pool Identification */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Pool Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Pool ID:</span>
              <div className="font-mono text-xs">{formatAddress(poolId)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tick Spacing:</span>
              <div>{tickSpacing}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Current Market Prices */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Current Market Prices</h4>

          {/* A/B Prices (Token0/Token1) */}
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {token0.symbol}/{token1.symbol}
            </div>
            <div className="text-lg font-mono font-semibold">{currentPriceABFormatted}</div>
            <div className="text-xs text-muted-foreground">Raw: {currentPriceAB.toExponential(6)}</div>
          </div>

          {/* B/A Prices (Token1/Token0) */}
          <div className="mb-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {token1.symbol}/{token0.symbol}
            </div>
            <div className="text-lg font-mono font-semibold">{currentPriceBAFormatted}</div>
            <div className="text-xs text-muted-foreground">Raw: {currentPriceBA.toExponential(6)}</div>
          </div>
        </div>

        <Separator />

        {/* Pool State */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Pool State</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current Tick:</span>
              <div className="font-mono">{currentTick}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Liquidity:</span>
              <div className="font-mono">{totalLiquidity.toString()}</div>
            </div>
            {poolData.feeTier === 8388608 && dynamicFees ? (
              <>
                <div>
                  <span className="text-muted-foreground">Current LP Fee:</span>
                  <div className="font-semibold text-blue-600">{dynamicFees.lpFeePercentage}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Protocol Fee:</span>
                  <div className="font-semibold text-blue-600">{dynamicFees.protocolFeePercentage}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Fee Rate:</span>
                  <div className="font-semibold text-blue-600">{dynamicFees.totalFeePercentage}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-muted-foreground">Protocol Fee:</span>
                  <div>{protocolFee / 10000}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">LP Fee:</span>
                  <div>{lpFee / 10000}%</div>
                </div>
              </>
            )}
            {poolData.feeTier === 8388608 && loadingFees && (
              <div className="col-span-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading dynamic fees...</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Pool Reserves */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Pool Reserves</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">{token0.symbol} Amount:</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{tokenAmounts.amount0}</div>
                  <div className="text-xs text-muted-foreground">{token0.name}</div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">{token1.symbol} Amount:</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{tokenAmounts.amount1}</div>
                  <div className="text-xs text-muted-foreground">{token1.name}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            💡 Token amounts are calculated based on current price and total liquidity
          </div>
        </div>

        <Separator />

        {/* Token Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Token Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Token 0:</span>
              <div className="font-semibold">{token0.symbol}</div>
              <div className="text-xs text-muted-foreground">
                {token0.name} ({formatAddress(token0.address)})
              </div>
              <div className="text-xs text-muted-foreground">Decimals: {token0.decimals}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Token 1:</span>
              <div className="font-semibold">{token1.symbol}</div>
              <div className="text-xs text-muted-foreground">
                {token1.name} ({formatAddress(token1.address)})
              </div>
              <div className="text-xs text-muted-foreground">Decimals: {token1.decimals}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
