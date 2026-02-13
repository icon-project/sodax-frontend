// apps/demo/src/components/dex/ManageLiquidity.tsx
import React, { type JSX, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ChainId, ClPositionInfo, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import { useXBalances, type XAccount } from '@sodax/wallet-sdk-react';
import { UserPositions } from '@/components/dex/UserPositions';
import {
  createWithdrawParamsProps,
  useCreateDepositParams,
  useDexAllowance,
  useDexApprove,
  useDexDeposit,
  useDexWithdraw,
  useSodaxContext,
} from '@sodax/dapp-kit';
import { NavLink } from 'react-router';

interface ManageLiquidityProps {
  poolData: PoolData;
  xAccount: XAccount;
  spokeProvider: SpokeProvider;
  pools: PoolKey[];
  selectedPoolIndex: number;
  // Form state
  token0Balance: bigint;
  token1Balance: bigint;
  minPrice: string;
  maxPrice: string;
  liquidityToken0Amount: string;
  liquidityToken1Amount: string;
  slippageTolerance: string;
  positionId: string;
  positionInfo: ClPositionInfo | null;
  isValidPosition: boolean;
  selectedPoolKey: PoolKey;
  selectedChainId: ChainId;
  // Handlers
  onLiquidityToken0AmountChange: (value: string) => void;
  onLiquidityToken1AmountChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onSlippageToleranceChange: (value: string) => void;
  onPositionIdChange: (value: string) => void;
  onClearPosition: () => void;
  onSupplyLiquidity: () => Promise<void>;
  onDecreaseLiquidity: () => Promise<void>;
  // Helper functions
  formatAmount: (amount: bigint, decimals: number) => string;
  calculateUnderlyingAmount: (wrappedAmount: bigint, conversionRate: bigint, decimals: number) => string;
}

export function ManageLiquidity({
  poolData,
  xAccount,
  spokeProvider,
  pools,
  selectedPoolIndex,
  token0Balance,
  token1Balance,
  minPrice,
  maxPrice,
  liquidityToken0Amount,
  liquidityToken1Amount,
  slippageTolerance,
  positionId,
  positionInfo,
  isValidPosition,
  onLiquidityToken0AmountChange,
  onLiquidityToken1AmountChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSlippageToleranceChange,
  onPositionIdChange,
  onClearPosition,
  onSupplyLiquidity,
  formatAmount,
  calculateUnderlyingAmount,
  selectedPoolKey,
  selectedChainId,
}: ManageLiquidityProps): JSX.Element | null {
  const { sodax } = useSodaxContext();

  // UI state
  const [error, setError] = useState<string>('');

  // Form state
  const [token0Amount, setToken0Amount] = useState<string>('');
  const [token1Amount, setToken1Amount] = useState<string>('');

  const poolSpokeAssets = sodax.dex.clService.getAssetsForPool(spokeProvider, pools[selectedPoolIndex]);
  const { data: sourceBalances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: [poolSpokeAssets.token0, poolSpokeAssets.token1],
    address: xAccount.address,
  });
  const spokeToken0Balance = sourceBalances?.[poolSpokeAssets.token0.address ?? ''] ?? 0n;
  const spokeToken1Balance = sourceBalances?.[poolSpokeAssets.token1.address ?? ''] ?? 0n;

  // Reset state when chain changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: setter functions are stable
  useEffect(() => {
    setToken0Amount('');
    setToken1Amount('');
  }, [selectedChainId]);

  const createDepositParams0 = useCreateDepositParams({
    tokenIndex: 0,
    amount: token0Amount,
    poolData,
    poolSpokeAssets,
  });
  const createDepositParams1 = useCreateDepositParams({
    tokenIndex: 1,
    amount: token1Amount,
    poolData,
    poolSpokeAssets,
  });
  const { data: hasToken0Allowed, isLoading: isToken0AllowanceLoading } = useDexAllowance({
    params: createDepositParams0,
    spokeProvider,
  });
  const { data: hasToken1Allowed, isLoading: isToken1AllowanceLoading } = useDexAllowance({
    params: createDepositParams1,
    spokeProvider,
  });
  const { mutateAsync: approveToken0, isPending: isApprovingToken0 } = useDexApprove();
  const { mutateAsync: approveToken1, isPending: isApprovingToken1 } = useDexApprove();

  // Hooks for mutations
  const depositMutation = useDexDeposit();
  const withdrawMutation = useDexWithdraw();

  // Handle mutation errors and success
  useEffect(() => {
    if (depositMutation.isSuccess) {
      setError('');
    } else if (depositMutation.error) {
      setError(`Deposit failed: ${depositMutation.error.message}`);
    }
  }, [depositMutation.isSuccess, depositMutation.error]);

  useEffect(() => {
    if (withdrawMutation.isSuccess) {
      setError('');
    } else if (withdrawMutation.error) {
      setError(`Withdraw failed: ${withdrawMutation.error.message}`);
    }
  }, [withdrawMutation.isSuccess, withdrawMutation.error]);

  // Combined loading state
  const loading = depositMutation.isPending || withdrawMutation.isPending;

  const handleApproveToken0 = async () => {
    if (!createDepositParams0) {
      setError('Please enter a valid amount ');
      return;
    }

    if (!spokeProvider) {
      setError('Spoke provider is not set');
      return;
    }

    await approveToken0({ params: createDepositParams0, spokeProvider });
  };
  const handleApproveToken1 = async () => {
    if (!createDepositParams1) {
      setError('Please enter a valid amount');
      return;
    }

    if (!spokeProvider) {
      setError('Spoke provider is not set');
      return;
    }
    await approveToken1({ params: createDepositParams1, spokeProvider });
  };

  // Handle deposit
  const handleDeposit = async (tokenIndex: 0 | 1): Promise<void> => {
    if (!poolData || !spokeProvider || !selectedPoolKey) {
      setError('Please ensure wallet is connected and services are initialized');
      return;
    }

    const params = tokenIndex === 0 ? createDepositParams0 : createDepositParams1;
    if (!params) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');

    try {
      await depositMutation.mutateAsync({ params, spokeProvider });

      // Clear form
      if (tokenIndex === 0) {
        setToken0Amount('');
      } else {
        setToken1Amount('');
      }
      setError('');
    } catch (err) {
      console.error('Deposit failed:', err);
      setError(`Deposit failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle withdraw
  const handleWithdraw = async (tokenIndex: 0 | 1): Promise<void> => {
    if (!poolData || !spokeProvider || !selectedPoolKey) {
      setError('Please ensure wallet is connected and services are initialized');
      return;
    }

    const amount = tokenIndex === 0 ? token0Amount : token1Amount;
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');

    try {
      await withdrawMutation.mutateAsync({
        params: createWithdrawParamsProps({
          tokenIndex,
          amount,
          poolData,
          poolSpokeAssets,
        }),
        spokeProvider,
      });

      // Clear form
      if (tokenIndex === 0) {
        setToken0Amount('');
      } else {
        setToken1Amount('');
      }
      setError('');
    } catch (err) {
      console.error('Withdraw failed:', err);
      setError(`Withdraw failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!poolData || !xAccount?.address) {
    console.warn('[ManageLiquidity] Pool data or xAccount address is required');
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Liquidity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 divide-x divide-border">
            <TabsTrigger className="cursor-pointer" value="deposit">
              Deposit
            </TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="withdraw">
              Withdraw
            </TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="positions">
              My positions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            {/* Token 0 Deposit */}
            {!sodax.dex.assetService.isSodaAsXSodaInPool({
              chainId: selectedChainId,
              asset: poolSpokeAssets.token0.address,
              poolToken: poolData.token0.address,
            }) ? (
              <div className="space-y-2">
                <Label htmlFor="token0-deposit">
                  Deposit {poolSpokeAssets.token0.symbol} as {poolData.token0.symbol}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="token0-deposit"
                    type="number"
                    placeholder="0.0"
                    value={token0Amount}
                    onChange={e => setToken0Amount(e.target.value)}
                    className="flex-1"
                  />
                  <span className="inline-flex items-center rounded-md border border-input bg-background px-3 text-sm font-medium">
                    {poolData.token0.symbol}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Balance ({spokeProvider.chainConfig.chain.name}):{' '}
                    {formatAmount(spokeToken0Balance, poolSpokeAssets.token0.decimals)} {poolSpokeAssets.token0.symbol}
                    <br />
                    Deposited Balance ({sodax.hubProvider.chainConfig.chain.name}):{' '}
                    {formatAmount(token0Balance, poolData.token0.decimals)} {poolData.token0.symbol}
                  </p>
                  {poolData.token0IsStatAToken &&
                    poolData.token0ConversionRate &&
                    poolData.token0UnderlyingToken &&
                    token0Balance > 0n && (
                      <p className="text-blue-600 dark:text-blue-400">
                        ≈{' '}
                        {calculateUnderlyingAmount(
                          token0Balance,
                          poolData.token0ConversionRate,
                          poolData.token0UnderlyingToken.decimals,
                        )}{' '}
                        {poolData.token0UnderlyingToken.symbol} (underlying)
                      </p>
                    )}
                </div>
                <Button
                  className="w-full"
                  type="button"
                  variant="default"
                  onClick={handleApproveToken0}
                  disabled={
                    createDepositParams0 === undefined ||
                    isToken0AllowanceLoading ||
                    hasToken0Allowed ||
                    isApprovingToken0
                  }
                >
                  {isApprovingToken0 ? 'Approving...' : hasToken0Allowed ? 'Approved' : 'Approve'}
                </Button>
                <Button onClick={() => handleDeposit(0)} disabled={loading || !token0Amount} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Deposit {poolData.token0.symbol}
                </Button>
              </div>
            ) : (
              <div className="space-x-2 flex flex-row items-center">
                <p>Deposit of Soda to xSoda requires Staking SODA to XSODA</p>
                <NavLink to={'/staking'}>
                  <Button>Stake</Button>
                </NavLink>
              </div>
            )}

            {/* Token 1 Deposit */}
            {!sodax.dex.assetService.isSodaAsXSodaInPool({
              chainId: selectedChainId,
              asset: poolSpokeAssets.token1.address,
              poolToken: poolData.token1.address,
            }) ? (
              <div className="space-y-2">
                <Label htmlFor="token1-deposit">
                  Deposit {poolSpokeAssets.token1.symbol} as {poolData.token1.symbol}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="token1-deposit"
                    type="number"
                    placeholder="0.0"
                    value={token1Amount}
                    onChange={e => setToken1Amount(e.target.value)}
                    className="flex-1"
                  />
                  <span className="inline-flex items-center rounded-md border border-input bg-background px-3 text-sm font-medium">
                    {poolData.token1.symbol}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Balance ({spokeProvider.chainConfig.chain.name}):{' '}
                    {formatAmount(spokeToken1Balance, poolSpokeAssets.token1.decimals)} {poolSpokeAssets.token1.symbol}
                    <br />
                    Deposited Balance ({sodax.hubProvider.chainConfig.chain.name}):{' '}
                    {formatAmount(token1Balance, poolData.token1.decimals)} {poolData.token1.symbol}
                  </p>
                  {poolData.token1IsStatAToken &&
                    poolData.token1ConversionRate &&
                    poolData.token1UnderlyingToken &&
                    token1Balance > 0n && (
                      <p className="text-blue-600 dark:text-blue-400">
                        ≈{' '}
                        {calculateUnderlyingAmount(
                          token1Balance,
                          poolData.token1ConversionRate,
                          poolData.token1UnderlyingToken.decimals,
                        )}{' '}
                        {poolData.token1UnderlyingToken.symbol} (underlying)
                      </p>
                    )}
                </div>
                <Button
                  className="w-full"
                  type="button"
                  variant="default"
                  onClick={handleApproveToken1}
                  disabled={
                    createDepositParams1 === undefined ||
                    isToken1AllowanceLoading ||
                    hasToken1Allowed ||
                    isApprovingToken1
                  }
                >
                  {isApprovingToken1 ? 'Approving...' : hasToken1Allowed ? 'Approved' : 'Approve'}
                </Button>
                <Button onClick={() => handleDeposit(1)} disabled={loading || !token1Amount} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Deposit {poolData.token1.symbol}
                </Button>
              </div>
            ) : (
              <div className="space-x-2 flex flex-row items-center">
                <p>Deposit of Soda to xSoda requires Staking SODA to XSODA</p>
                <NavLink to={'/staking'}>
                  <Button>Stake</Button>
                </NavLink>
              </div>
            )}

            {/* Supply Liquidity Section */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">
                  {positionId && isValidPosition ? 'Manage Position' : 'Supply Liquidity to Pool'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Position ID Input */}
                <div className="space-y-2">
                  <Label htmlFor="position-id" className="text-sm font-medium">
                    Position ID (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="position-id"
                      type="text"
                      placeholder="Enter position ID to increase/decrease liquidity"
                      value={positionId}
                      onChange={e => onPositionIdChange(e.target.value)}
                    />
                    {positionId && (
                      <Button type="button" variant="outline" size="sm" onClick={onClearPosition}>
                        Clear
                      </Button>
                    )}
                  </div>
                  {isValidPosition && positionInfo && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        ✓ Valid Position Found
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="text-muted-foreground">Current {poolData.token0.symbol}:</span>
                            <span className="ml-1 font-mono">
                              {formatAmount(positionInfo.amount0, poolData.token0.decimals)}
                            </span>
                          </div>
                          {positionInfo.amount0Underlying &&
                            poolData.token0IsStatAToken &&
                            poolData.token0UnderlyingToken && (
                              <div className="text-blue-600 dark:text-blue-400 pl-2">
                                <span className="text-muted-foreground">≈</span>
                                <span className="ml-1 font-mono">
                                  {formatAmount(
                                    positionInfo.amount0Underlying,
                                    poolData.token0UnderlyingToken.decimals,
                                  )}
                                </span>
                                <span className="ml-1">{poolData.token0UnderlyingToken.symbol}</span>
                              </div>
                            )}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-muted-foreground">Current {poolData.token1.symbol}:</span>
                            <span className="ml-1 font-mono">
                              {formatAmount(positionInfo.amount1, poolData.token1.decimals)}
                            </span>
                          </div>
                          {positionInfo.amount1Underlying &&
                            poolData.token1IsStatAToken &&
                            poolData.token1UnderlyingToken && (
                              <div className="text-blue-600 dark:text-blue-400 pl-2">
                                <span className="text-muted-foreground">≈</span>
                                <span className="ml-1 font-mono">
                                  {formatAmount(
                                    positionInfo.amount1Underlying,
                                    poolData.token1UnderlyingToken.decimals,
                                  )}
                                </span>
                                <span className="ml-1">{poolData.token1UnderlyingToken.symbol}</span>
                              </div>
                            )}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Liquidity:</span>
                          <span className="ml-1 font-mono">{positionInfo.liquidity.toString()}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-green-200 dark:border-green-800">
                          <p className="font-medium text-green-800 dark:text-green-200 mb-1">💰 Unclaimed Fees</p>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-muted-foreground">Fees {poolData.token0.symbol}:</span>
                            <span className="ml-1 font-mono font-semibold text-green-700 dark:text-green-300">
                              {formatAmount(positionInfo.unclaimedFees0, poolData.token0.decimals)}
                            </span>
                          </div>
                          {positionInfo.unclaimedFees0Underlying &&
                            poolData.token0IsStatAToken &&
                            poolData.token0UnderlyingToken && (
                              <div className="text-blue-600 dark:text-blue-400 pl-2">
                                <span className="text-muted-foreground">≈</span>
                                <span className="ml-1 font-mono">
                                  {formatAmount(
                                    positionInfo.unclaimedFees0Underlying,
                                    poolData.token0UnderlyingToken.decimals,
                                  )}
                                </span>
                                <span className="ml-1">{poolData.token0UnderlyingToken.symbol}</span>
                              </div>
                            )}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-muted-foreground">Fees {poolData.token1.symbol}:</span>
                            <span className="ml-1 font-mono font-semibold text-green-700 dark:text-green-300">
                              {formatAmount(positionInfo.unclaimedFees1, poolData.token1.decimals)}
                            </span>
                          </div>
                          {positionInfo.unclaimedFees1Underlying &&
                            poolData.token1IsStatAToken &&
                            poolData.token1UnderlyingToken && (
                              <div className="text-blue-600 dark:text-blue-400 pl-2">
                                <span className="text-muted-foreground">≈</span>
                                <span className="ml-1 font-mono">
                                  {formatAmount(
                                    positionInfo.unclaimedFees1Underlying,
                                    poolData.token1UnderlyingToken.decimals,
                                  )}
                                </span>
                                <span className="ml-1">{poolData.token1UnderlyingToken.symbol}</span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                  {positionId && !isValidPosition && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Enter a position ID to increase liquidity or leave empty to create new position
                    </p>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="min-price" className="text-xs text-muted-foreground">
                        Min Price
                      </Label>
                      <Input
                        id="min-price"
                        type="number"
                        placeholder="0.0"
                        value={minPrice}
                        onChange={e => onMinPriceChange(e.target.value)}
                        step="0.000001"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="max-price" className="text-xs text-muted-foreground">
                        Max Price
                      </Label>
                      <Input
                        id="max-price"
                        type="number"
                        placeholder="0.0"
                        value={maxPrice}
                        onChange={e => onMaxPriceChange(e.target.value)}
                        step="0.000001"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current price: {poolData.price ? Number(poolData.price.toSignificant(6)) : 'N/A'}{' '}
                    {poolData.token1.symbol}/{poolData.token0.symbol}
                  </p>
                </div>

                {/* Token Amounts */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Token Amounts</Label>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="liquidity-token0" className="text-xs text-muted-foreground">
                        {poolData.token0.symbol} Amount
                      </Label>
                      <Input
                        id="liquidity-token0"
                        type="number"
                        placeholder="0.0"
                        value={liquidityToken0Amount}
                        onChange={e => onLiquidityToken0AmountChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-calculates {poolData.token1.symbol} amount based on price range
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="liquidity-token1" className="text-xs text-muted-foreground">
                        {poolData.token1.symbol} Amount
                      </Label>
                      <Input
                        id="liquidity-token1"
                        type="number"
                        placeholder="0.0"
                        value={liquidityToken1Amount}
                        onChange={e => onLiquidityToken1AmountChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-calculates {poolData.token0.symbol} amount based on price range
                      </p>
                    </div>
                  </div>
                </div>

                {/* Slippage Tolerance */}
                <div className="space-y-2">
                  <Label htmlFor="slippage" className="text-sm font-medium">
                    Slippage Tolerance
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="slippage"
                      type="number"
                      placeholder="0.5"
                      value={slippageTolerance}
                      onChange={e => onSlippageToleranceChange(e.target.value)}
                      step="0.1"
                      min="0"
                      max="50"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <div className="flex gap-1 ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSlippageToleranceChange('0.1')}
                        className="h-7 text-xs"
                      >
                        0.1%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSlippageToleranceChange('0.5')}
                        className="h-7 text-xs"
                      >
                        0.5%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSlippageToleranceChange('1')}
                        className="h-7 text-xs"
                      >
                        1%
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reduces liquidity calculation to protect against price changes. Your full token balance is used as
                    the maximum.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={onSupplyLiquidity}
                    disabled={loading || !minPrice || !maxPrice || !liquidityToken0Amount || !liquidityToken1Amount}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {positionId && isValidPosition ? 'Increase Liquidity' : 'Supply Liquidity (New Position)'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            {/* Token 0 Withdraw */}
            {!sodax.dex.assetService.isSodaAsXSodaInPool({
              chainId: selectedChainId,
              asset: poolSpokeAssets.token0.address,
              poolToken: poolData.token0.address,
            }) ? (
              <div className="space-y-2">
                <Label htmlFor="token0-withdraw">{poolData.token0.symbol}</Label>
                <div className="flex gap-2">
                  <Input
                    id="token0-withdraw"
                    type="number"
                    placeholder="0.0"
                    value={token0Amount}
                    onChange={e => setToken0Amount(e.target.value)}
                    className="flex-1"
                  />
                  <span className="inline-flex items-center rounded-md border border-input bg-background px-3 text-sm font-medium">
                    {poolData.token0.symbol}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Balance: {formatAmount(token0Balance, poolData.token0.decimals)} {poolData.token0.symbol}
                  </p>
                  {poolData.token0IsStatAToken &&
                    poolData.token0ConversionRate &&
                    poolData.token0UnderlyingToken &&
                    token0Balance > 0n && (
                      <p className="text-blue-600 dark:text-blue-400">
                        ≈{' '}
                        {calculateUnderlyingAmount(
                          token0Balance,
                          poolData.token0ConversionRate,
                          poolData.token0UnderlyingToken.decimals,
                        )}{' '}
                        {poolData.token0UnderlyingToken.symbol} (underlying)
                      </p>
                    )}
                </div>
                <Button
                  onClick={() => handleWithdraw(0)}
                  disabled={loading || !token0Amount}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Withdraw {poolData.token0.symbol}
                </Button>
              </div>
            ) : (
              <div className="space-x-2 flex flex-row items-center">
                <p>Withdraw of xSoda to Soda requires unstaking xSoda to Soda</p>
                <NavLink to={'/staking'}>
                  <Button>Unstake</Button>
                </NavLink>
              </div>
            )}

            {/* Token 1 Withdraw */}
            {!sodax.dex.assetService.isSodaAsXSodaInPool({
              chainId: selectedChainId,
              asset: poolSpokeAssets.token1.address,
              poolToken: poolData.token1.address,
            }) ? (
              <div className="space-y-2">
                <Label htmlFor="token1-withdraw">{poolData.token1.symbol}</Label>
                <div className="flex gap-2">
                  <Input
                    id="token1-withdraw"
                    type="number"
                    placeholder="0.0"
                    value={token1Amount}
                    onChange={e => setToken1Amount(e.target.value)}
                    className="flex-1"
                  />
                  <span className="inline-flex items-center rounded-md border border-input bg-background px-3 text-sm font-medium">
                    {poolData.token1.symbol}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Balance: {formatAmount(token1Balance, poolData.token1.decimals)} {poolData.token1.symbol}
                  </p>
                  {poolData.token1IsStatAToken &&
                    poolData.token1ConversionRate &&
                    poolData.token1UnderlyingToken &&
                    token1Balance > 0n && (
                      <p className="text-blue-600 dark:text-blue-400">
                        ≈{' '}
                        {calculateUnderlyingAmount(
                          token1Balance,
                          poolData.token1ConversionRate,
                          poolData.token1UnderlyingToken.decimals,
                        )}{' '}
                        {poolData.token1UnderlyingToken.symbol} (underlying)
                      </p>
                    )}
                </div>
                <Button
                  onClick={() => handleWithdraw(1)}
                  disabled={loading || !token1Amount}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Withdraw {poolData.token1.symbol}
                </Button>
              </div>
            ) : (
              <div className="space-x-2 flex flex-row items-center">
                <p>Withdraw of xSoda to Soda requires unstaking xSoda to Soda</p>
                <NavLink to={'/staking'}>
                  <Button>Unstake</Button>
                </NavLink>
              </div>
            )}
          </TabsContent>
          <TabsContent value="positions" className="space-y-4">
            <UserPositions
              userAddress={xAccount.address}
              poolKey={selectedPoolKey}
              poolData={poolData}
              spokeProvider={spokeProvider}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}
    </Card>
  );
}
