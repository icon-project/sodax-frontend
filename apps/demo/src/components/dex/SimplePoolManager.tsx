// apps/demo/src/components/dex/SimplePoolManager.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, Wallet } from 'lucide-react';
import type { ChainType, ConcentratedLiquidityService } from '@sodax/sdk';

// Type for pool data
type PoolData = Awaited<ReturnType<InstanceType<typeof ConcentratedLiquidityService>['getPoolData']>>;
import { getXChainType, useWalletProvider, useXAccount, useXDisconnect } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { ChainSelector } from '@/components/shared/ChainSelector';

// Type for pool keys (from @pancakeswap/infinity-sdk)
type PoolKey = ReturnType<InstanceType<typeof ConcentratedLiquidityService>['getPools']>[number];

export function SimplePoolManager(): JSX.Element {
  const { sodax } = useSodaxContext();
  // Wallet integration
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const xAccount = useXAccount(selectedChainId);
  const disconnect = useXDisconnect();
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  // Pool state
  const [pools, setPools] = useState<PoolKey[]>([]);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState<number>(-1);
  const [poolData, setPoolData] = useState<PoolData | null>(null);

  // Form state
  const [token0Amount, setToken0Amount] = useState<string>('');
  const [token1Amount, setToken1Amount] = useState<string>('');
  const [token0Balance, setToken0Balance] = useState<bigint>(0n);
  const [token1Balance, setToken1Balance] = useState<bigint>(0n);

  // Liquidity supply state
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [liquidityToken0Amount, setLiquidityToken0Amount] = useState<string>('');
  const [liquidityToken1Amount, setLiquidityToken1Amount] = useState<string>('');
  const [lastEditedToken, setLastEditedToken] = useState<'token0' | 'token1' | null>(null);
  const [slippageTolerance, setSlippageTolerance] = useState<string>('0.5'); // Default 0.5%

  // Position management state
  const [positionId, setPositionId] = useState<string>('');
  const [positionInfo, setPositionInfo] = useState<Awaited<
    ReturnType<InstanceType<typeof ConcentratedLiquidityService>['getPositionInfo']>
  > | null>(null);
  const [isValidPosition, setIsValidPosition] = useState<boolean>(false);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load pools on init
  useEffect(() => {
      setPools(sodax.dex.clService.getPools());
  }, [sodax.dex.clService]);

  // Reset state when chain changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: setter functions are stable
  useEffect(() => {
    setSelectedPoolIndex(-1);
    setPoolData(null);
    setToken0Amount('');
    setToken1Amount('');
    setToken0Balance(0n);
    setToken1Balance(0n);
  }, [selectedChainId]);

  // Load pool data when pool is selected
  useEffect(() => {
    if (selectedPoolIndex >= 0 && pools[selectedPoolIndex]) {
      loadPoolData(pools[selectedPoolIndex]);
    }
  }, [selectedPoolIndex, pools]);

  // Load balances when pool data changes
  useEffect(() => {
    if (poolData && spokeProvider && selectedChainId) {
      loadBalances();
    }
  }, [poolData, spokeProvider, selectedChainId]);

  const loadPoolData = async (poolKey: PoolKey): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const data = await sodax.dex.clService.getPoolData(poolKey, sodax.hubProvider.publicClient);
      setPoolData(data);
    } catch (err) {
      console.error('Failed to load pool data:', err);
      setError(`Failed to load pool data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (): Promise<void> => {
    if (!poolData || !spokeProvider) return;

    try {
      // Get the assets for this pool
      const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, pools[selectedPoolIndex]);
      if (!assets) return;

      // Get balances from AssetService
      const balance0 = await sodax.dex.assetService.getDeposit(poolData.token0.address, spokeProvider);
      const balance1 = await sodax.dex.assetService.getDeposit(poolData.token1.address, spokeProvider);

      setToken0Balance(balance0);
      setToken1Balance(balance1);
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  };

  // Fetch and validate position info
  const fetchPositionInfo = async (tokenId: string): Promise<void> => {
    if (!tokenId || selectedPoolIndex === -1) {
      setPositionInfo(null);
      setIsValidPosition(false);
      return;
    }

    try {
      const tokenIdBigInt = BigInt(tokenId);
      const publicClient = sodax.hubProvider.publicClient;
      const info = await sodax.dex.clService.getPositionInfo(tokenIdBigInt, publicClient);

      // Validate that position belongs to current pool
      const currentPoolKey = pools[selectedPoolIndex];
      const isValid =
        info.poolKey.currency0.toLowerCase() === currentPoolKey.currency0.toLowerCase() &&
        info.poolKey.currency1.toLowerCase() === currentPoolKey.currency1.toLowerCase() &&
        info.poolKey.fee === currentPoolKey.fee;

      setPositionInfo(info);
      setIsValidPosition(isValid);

      if (isValid) {
        // Pre-fill price range from position
        const minPriceNum = Number(info.tickLowerPrice.toSignificant(6));
        const maxPriceNum = Number(info.tickUpperPrice.toSignificant(6));
        setMinPrice(minPriceNum.toString());
        setMaxPrice(maxPriceNum.toString());
        setError('');
      } else {
        setError('Position does not belong to the selected pool');
      }
    } catch (err) {
      console.error('Failed to fetch position info:', err);
      setPositionInfo(null);
      setIsValidPosition(false);
      setError('Invalid position ID or position not found');
    }
  };

  const handleDeposit = async (tokenIndex: 0 | 1): Promise<void> => {
    if (!poolData || !spokeProvider) {
      setError('Please ensure wallet is connected and services are initialized');
      return;
    }

    const amount = tokenIndex === 0 ? token0Amount : token1Amount;
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
    const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, pools[selectedPoolIndex]);
    const originalAsset = tokenIndex === 0 ? assets.token0 : assets.token1;

    setLoading(true);
    setError('');

    try {
      const amountBigInt = BigInt(Math.floor(Number.parseFloat(amount) * 10 ** token.decimals));

      // Check allowance
      const allowanceResult = await sodax.dex.assetService.isAllowanceValid(
        {
          asset: originalAsset,
          amount: amountBigInt,
          poolToken: token.address,
        },
        spokeProvider,
      );

      if (!allowanceResult.ok) {
        throw new Error('Allowance check failed');
      }

      // Approve if needed
      if (!allowanceResult.value) {
        const approveResult = await sodax.dex.assetService.approve(
          {
            asset: originalAsset,
            amount: amountBigInt,
            poolToken: token.address,
          },
          spokeProvider,
          false,
        );

        if (!approveResult.ok) {
          throw new Error('Approval failed');
        }
      }

      // Execute deposit
      const depositResult = await sodax.dex.assetService.deposit(
        {
          asset: originalAsset,
          amount: amountBigInt,
          poolToken: token.address,
        },
        spokeProvider,
      );

      if (!depositResult.ok) {
        throw new Error(`Deposit failed: ${depositResult.error?.code || 'Unknown error'}`);
      }

      // Clear form and reload balances
      if (tokenIndex === 0) {
        setToken0Amount('');
      } else {
        setToken1Amount('');
      }

      await loadBalances();
      setError('');
    } catch (err) {
      console.error('Deposit failed:', err);
      setError(`Deposit failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (tokenIndex: 0 | 1): Promise<void> => {
    if (!poolData || !spokeProvider) {
      setError('Please ensure wallet is connected and services are initialized');
      return;
    }

    const amount = tokenIndex === 0 ? token0Amount : token1Amount;
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
    const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, pools[selectedPoolIndex]);
    const originalAsset = tokenIndex === 0 ? assets.token0 : assets.token1;

    setLoading(true);
    setError('');

    try {
      const amountBigInt = BigInt(Math.floor(Number.parseFloat(amount) * 10 ** token.decimals));

      // Execute withdraw
      const withdrawResult = await sodax.dex.assetService.withdraw(
        {
          poolToken: token.address,
          asset: originalAsset,
          amount: amountBigInt,
        },
        spokeProvider,
      );

      if (!withdrawResult.ok) {
        throw new Error(`Withdraw failed: ${withdrawResult.error.code}`);
      }

      // Clear form and reload balances
      if (tokenIndex === 0) {
        setToken0Amount('');
      } else {
        setToken1Amount('');
      }

      await loadBalances();
      setError('');
    } catch (err) {
      console.error('Withdraw failed:', err);
      setError(`Withdraw failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate token1 amount when token0 amount changes
  const handleToken0AmountChange = (value: string): void => {
    setLiquidityToken0Amount(value);
    setLastEditedToken('token0');

    // Only calculate if we have all required values
    if (!value || !minPrice || !maxPrice || !poolData) {
      return;
    }

    const amount0 = Number.parseFloat(value);
    const minPriceNum = Number.parseFloat(minPrice);
    const maxPriceNum = Number.parseFloat(maxPrice);

    if (amount0 <= 0 || minPriceNum <= 0 || maxPriceNum <= 0 || minPriceNum >= maxPriceNum) {
      return;
    }

    try {
      const amount0BigInt = BigInt(Math.floor(amount0 * 10 ** poolData.token0.decimals));
      const tickSpacing = poolData.tickSpacing;

      const tickLower = sodax.dex.clService.priceToTick(minPriceNum, poolData.token0, poolData.token1, tickSpacing);
      const tickUpper = sodax.dex.clService.priceToTick(maxPriceNum, poolData.token0, poolData.token1, tickSpacing);

      const amount1BigInt = sodax.dex.clService.calculateAmount1FromAmount0(
        amount0BigInt,
        tickLower,
        tickUpper,
        BigInt(poolData.currentTick),
      );

      const amount1 = Number(amount1BigInt) / 10 ** poolData.token1.decimals;
      setLiquidityToken1Amount(amount1.toFixed(6));
    } catch (err) {
      console.error('Failed to calculate token1 amount:', err);
    }
  };

  // Auto-calculate token0 amount when token1 amount changes
  const handleToken1AmountChange = (value: string): void => {
    setLiquidityToken1Amount(value);
    setLastEditedToken('token1');

    // Only calculate if we have all required values
    if (!value || !minPrice || !maxPrice || !poolData) {
      return;
    }

    const amount1 = Number.parseFloat(value);
    const minPriceNum = Number.parseFloat(minPrice);
    const maxPriceNum = Number.parseFloat(maxPrice);

    if (amount1 <= 0 || minPriceNum <= 0 || maxPriceNum <= 0 || minPriceNum >= maxPriceNum) {
      return;
    }

    try {
      const amount1BigInt = BigInt(Math.floor(amount1 * 10 ** poolData.token1.decimals));
      const tickSpacing = poolData.tickSpacing;

      const tickLower = sodax.dex.clService.priceToTick(minPriceNum, poolData.token0, poolData.token1, tickSpacing);
      const tickUpper = sodax.dex.clService.priceToTick(maxPriceNum, poolData.token0, poolData.token1, tickSpacing);

      const amount0BigInt = sodax.dex.clService.calculateAmount0FromAmount1(
        amount1BigInt,
        tickLower,
        tickUpper,
        BigInt(poolData.currentTick),
      );

      const amount0 = Number(amount0BigInt) / 10 ** poolData.token0.decimals;
      setLiquidityToken0Amount(amount0.toFixed(6));
    } catch (err) {
      console.error('Failed to calculate token0 amount:', err);
    }
  };

  // Recalculate amounts when price range changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers are stable and we only want to recalculate on price changes
  useEffect(() => {
    if (!minPrice || !maxPrice || !poolData || !lastEditedToken) {
      return;
    }

    const minPriceNum = Number.parseFloat(minPrice);
    const maxPriceNum = Number.parseFloat(maxPrice);

    if (minPriceNum <= 0 || maxPriceNum <= 0 || minPriceNum >= maxPriceNum) {
      return;
    }

    // Recalculate based on which token was last edited
    if (lastEditedToken === 'token0' && liquidityToken0Amount) {
      handleToken0AmountChange(liquidityToken0Amount);
    } else if (lastEditedToken === 'token1' && liquidityToken1Amount) {
      handleToken1AmountChange(liquidityToken1Amount);
    }
  }, [minPrice, maxPrice]);

  const handleSupplyLiquidity = async (): Promise<void> => {
    if (!poolData || !spokeProvider) {
      setError('Please ensure wallet is connected and services are initialized');
      return;
    }

    if (!minPrice || !maxPrice || !liquidityToken0Amount || !liquidityToken1Amount) {
      setError('Please enter all required values');
      return;
    }

    const minPriceNum = Number.parseFloat(minPrice);
    const maxPriceNum = Number.parseFloat(maxPrice);
    const amount0 = Number.parseFloat(liquidityToken0Amount);
    const amount1 = Number.parseFloat(liquidityToken1Amount);

    if (minPriceNum <= 0 || maxPriceNum <= 0 || amount0 <= 0 || amount1 <= 0) {
      setError('All values must be greater than 0');
      return;
    }

    if (minPriceNum >= maxPriceNum) {
      setError('Min price must be less than max price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const amount0BigInt = BigInt(Math.floor(amount0 * 10 ** poolData.token0.decimals));
      const amount1BigInt = BigInt(Math.floor(amount1 * 10 ** poolData.token1.decimals));

      // Convert prices to ticks
      const token0 = poolData.token0;
      const token1 = poolData.token1;
      const tickSpacing = poolData.tickSpacing;

      const tickLower = sodax.dex.clService.priceToTick(minPriceNum, token0, token1, tickSpacing);
      const tickUpper = sodax.dex.clService.priceToTick(maxPriceNum, token0, token1, tickSpacing);

      // Apply slippage BEFORE calculating liquidity
      // This ensures we calculate liquidity for slightly less than user's balance
      const slippage = Number.parseFloat(slippageTolerance) || 0.5;
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100)); // e.g., 0.5% => 9950

      const amount0ForLiquidity = (amount0BigInt * slippageMultiplier) / 10000n;
      const amount1ForLiquidity = (amount1BigInt * slippageMultiplier) / 10000n;

      // Calculate liquidity based on reduced amounts (accounting for slippage)
      const liquidity = sodax.dex.clService.calculateLiquidityFromAmounts(
        amount0ForLiquidity,
        amount1ForLiquidity,
        tickLower,
        tickUpper,
        BigInt(poolData.currentTick),
      );

      // Check if we're increasing an existing position or minting a new one
      if (positionId && isValidPosition) {
        // Increase liquidity in existing position
        const increaseResult = await sodax.dex.clService.increaseLiquidity(
          {
            poolKey: pools[selectedPoolIndex],
            tokenId: BigInt(positionId),
            tickLower,
            tickUpper,
            liquidity, // Conservative liquidity calculated with slippage
            amount0Max: amount0BigInt, // Full balance as max
            amount1Max: amount1BigInt, // Full balance as max
            sqrtPriceX96: poolData.sqrtPriceX96,
          },
          spokeProvider,
        );

        if (!increaseResult.ok) {
          console.error('Increase liquidity failed:', increaseResult.error);
          throw new Error(`Increase liquidity failed: ${increaseResult.error?.code || 'Unknown error'}`);
        }
      } else {
        // Mint new position
        const supplyResult = await sodax.dex.clService.supplyLiquidity(
          {
            poolKey: pools[selectedPoolIndex],
            tickLower,
            tickUpper,
            liquidity, // Conservative liquidity calculated with slippage
            amount0Max: amount0BigInt, // Full balance as max
            amount1Max: amount1BigInt, // Full balance as max
            sqrtPriceX96: poolData.sqrtPriceX96,
          },
          spokeProvider,
        );

        if (!supplyResult.ok) {
          console.error('Supply liquidity failed:', supplyResult.error);
          throw new Error(`Supply liquidity failed: ${supplyResult.error?.code || 'Unknown error'}`);
        }
      }

      // Clear form and reload balances
      setMinPrice('');
      setMaxPrice('');
      setLiquidityToken0Amount('');
      setLiquidityToken1Amount('');

      await loadBalances();
      setError('');
    } catch (err) {
      console.error('Supply liquidity failed:', err);
      setError(`Supply liquidity failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecreaseLiquidity = async (): Promise<void> => {
    if (!poolData || !spokeProvider || !positionId || !isValidPosition || !positionInfo) {
      setError('Please enter a valid position ID first');
      return;
    }

    if (!liquidityToken0Amount) {
      setError('Please enter percentage to decrease (0-100)');
      return;
    }

    const percentage = Number.parseFloat(liquidityToken0Amount);

    if (percentage <= 0 || percentage > 100) {
      setError('Percentage must be between 0 and 100');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate liquidity to remove based on percentage
      const liquidityToRemove = (positionInfo.liquidity * BigInt(Math.floor(percentage * 100))) / 10000n;

      // Calculate expected token amounts from this liquidity
      const expectedAmount0 = (positionInfo.amount0 * BigInt(Math.floor(percentage * 100))) / 10000n;
      const expectedAmount1 = (positionInfo.amount1 * BigInt(Math.floor(percentage * 100))) / 10000n;

      // Apply slippage to minimum amounts
      const slippage = Number.parseFloat(slippageTolerance) || 0.5;
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      const amount0Min = (expectedAmount0 * slippageMultiplier) / 10000n;
      const amount1Min = (expectedAmount1 * slippageMultiplier) / 10000n;

      const decreaseResult = await sodax.dex.clService.decreaseLiquidity(
        {
          poolKey: pools[selectedPoolIndex],
          tokenId: BigInt(positionId),
          liquidity: liquidityToRemove,
          amount0Min,
          amount1Min,
        },
        spokeProvider,
      );

      if (!decreaseResult.ok) {
        console.error('Decrease liquidity failed:', decreaseResult.error);
        throw new Error(`Decrease liquidity failed: ${decreaseResult.error?.code || 'Unknown error'}`);
      }

      // Clear form and refresh
      setLiquidityToken0Amount('');
      setLiquidityToken1Amount('');
      await fetchPositionInfo(positionId);
      await loadBalances();
      setError('');
    } catch (err) {
      console.error('Decrease liquidity failed:', err);
      setError(`Decrease liquidity failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBurnPosition = async (): Promise<void> => {
    if (!poolData || !spokeProvider || !positionId || !isValidPosition || !positionInfo) {
      setError('Please enter a valid position ID first');
      return;
    }

    let confirmMessage = '';
    if (positionInfo.liquidity > 0n) {
      const token0Amount = `${formatAmount(positionInfo.amount0, poolData.token0.decimals)} ${poolData.token0.symbol}`;
      const token1Amount = `${formatAmount(positionInfo.amount1, poolData.token1.decimals)} ${poolData.token1.symbol}`;

      let token0Details = token0Amount;
      let token1Details = token1Amount;

      if (positionInfo.amount0Underlying && poolData.token0IsStatAToken && poolData.token0UnderlyingToken) {
        const underlyingAmount = formatAmount(positionInfo.amount0Underlying, poolData.token0UnderlyingToken.decimals);
        token0Details += ` (≈${underlyingAmount} ${poolData.token0UnderlyingToken.symbol})`;
      }

      if (positionInfo.amount1Underlying && poolData.token1IsStatAToken && poolData.token1UnderlyingToken) {
        const underlyingAmount = formatAmount(positionInfo.amount1Underlying, poolData.token1UnderlyingToken.decimals);
        token1Details += ` (≈${underlyingAmount} ${poolData.token1UnderlyingToken.symbol})`;
      }

      confirmMessage = `This position has liquidity. Burning will:\n1. Remove all liquidity:\n   - ${token0Details}\n   - ${token1Details}\n2. Burn the NFT\n\nAre you sure?`;
    } else {
      confirmMessage = 'Are you sure you want to burn this position? This action cannot be undone.';
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: If position has liquidity, decrease it to 0 first
      if (positionInfo.liquidity > 0n) {
        const slippage = Number.parseFloat(slippageTolerance) || 0.5;
        const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
        const amount0Min = (positionInfo.amount0 * slippageMultiplier) / 10000n;
        const amount1Min = (positionInfo.amount1 * slippageMultiplier) / 10000n;

        const decreaseResult = await sodax.dex.clService.decreaseLiquidity(
          {
            poolKey: pools[selectedPoolIndex],
            tokenId: BigInt(positionId),
            liquidity: positionInfo.liquidity,
            amount0Min,
            amount1Min,
          },
          spokeProvider,
        );

        if (!decreaseResult.ok) {
          console.error('Decrease liquidity failed:', decreaseResult.error);
          throw new Error(`Failed to remove liquidity: ${decreaseResult.error?.code || 'Unknown error'}`);
        }
      }

      // Step 2: Burn the position NFT
      const burnResult = await sodax.dex.clService.burnPosition(
        {
          poolKey: pools[selectedPoolIndex],
          tokenId: BigInt(positionId),
          amount0Min: 0n,
          amount1Min: 0n,
        },
        spokeProvider,
      );

      if (!burnResult.ok) {
        console.error('Burn position failed:', burnResult.error);
        throw new Error(`Burn position failed: ${burnResult.error?.code || 'Unknown error'}`);
      }

      // Clear position state
      setPositionId('');
      setPositionInfo(null);
      setIsValidPosition(false);
      setMinPrice('');
      setMaxPrice('');
      setLiquidityToken0Amount('');
      setLiquidityToken1Amount('');

      await loadBalances();
      setError('');
    } catch (err) {
      console.error('Burn position failed:', err);
      setError(`Burn position failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: bigint, decimals: number): string => {
    return (Number(amount) / 10 ** decimals).toFixed(6);
  };

  const formatConversionRate = (rate: bigint): string => {
    return (Number(rate) / 10 ** 18).toFixed(6);
  };

  const calculateUnderlyingAmount = (wrappedAmount: bigint, conversionRate: bigint, decimals: number): string => {
    const underlying = (wrappedAmount * conversionRate) / BigInt(10 ** 18);
    return formatAmount(underlying, decimals);
  };

  return (
    <div className="space-y-6">
      {/* Chain and Wallet Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label htmlFor="chain">Select Chain</Label>
            <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
            <p className="text-xs text-muted-foreground">Selected chain: {selectedChainId || 'None'}</p>
          </div>

          {/* Wallet Connection */}
          <div className="space-y-2">
            <Label>Wallet</Label>
            {xAccount?.address ? (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="font-mono text-sm">
                    {xAccount.address.slice(0, 6)}...{xAccount.address.slice(-4)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnect(getXChainType(selectedChainId) as ChainType)}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-md border-dashed">
                <p className="text-sm text-muted-foreground">Connect your wallet to manage liquidity</p>
                <Button onClick={openWalletModal}>Connect Wallet</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pool Selection */}
      {selectedChainId ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pool">Available Pools</Label>
              <Select
                value={selectedPoolIndex >= 0 ? selectedPoolIndex.toString() : ''}
                onValueChange={value => setSelectedPoolIndex(Number.parseInt(value, 10))}
                disabled={pools.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={pools.length === 0 ? 'No pools available' : 'Select a pool'} />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((pool, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      Pool {index + 1} - Fee: {pool.fee / 10000}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {pools.length} pool{pools.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pool data...
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="font-medium">Please select a chain to continue</p>
              <p className="text-sm">Select a chain from the dropdown above to view available pools</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pool Information */}
      {poolData && (
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
      )}

      {/* Deposit/Withdraw Interface */}
      {poolData && xAccount?.address && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Liquidity</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4">
                {/* Token 0 Deposit */}
                <div className="space-y-2">
                  <Label htmlFor="token0-deposit">{poolData.token0.symbol}</Label>
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
                  <Button onClick={() => handleDeposit(0)} disabled={loading || !token0Amount} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Deposit {poolData.token0.symbol}
                  </Button>
                </div>

                {/* Token 1 Deposit */}
                <div className="space-y-2">
                  <Label htmlFor="token1-deposit">{poolData.token1.symbol}</Label>
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
                  <Button onClick={() => handleDeposit(1)} disabled={loading || !token1Amount} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Deposit {poolData.token1.symbol}
                  </Button>
                </div>

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
                          onChange={e => {
                            setPositionId(e.target.value);
                            fetchPositionInfo(e.target.value);
                          }}
                        />
                        {positionId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPositionId('');
                              setPositionInfo(null);
                              setIsValidPosition(false);
                              setMinPrice('');
                              setMaxPrice('');
                            }}
                          >
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
                            onChange={e => setMinPrice(e.target.value)}
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
                            onChange={e => setMaxPrice(e.target.value)}
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
                            onChange={e => handleToken0AmountChange(e.target.value)}
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
                            onChange={e => handleToken1AmountChange(e.target.value)}
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
                          onChange={e => setSlippageTolerance(e.target.value)}
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
                            onClick={() => setSlippageTolerance('0.1')}
                            className="h-7 text-xs"
                          >
                            0.1%
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSlippageTolerance('0.5')}
                            className="h-7 text-xs"
                          >
                            0.5%
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSlippageTolerance('1')}
                            className="h-7 text-xs"
                          >
                            1%
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reduces liquidity calculation to protect against price changes. Your full token balance is used
                        as the maximum.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleSupplyLiquidity}
                        disabled={loading || !minPrice || !maxPrice || !liquidityToken0Amount || !liquidityToken1Amount}
                        className="w-full"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {positionId && isValidPosition ? 'Increase Liquidity' : 'Supply Liquidity (New Position)'}
                      </Button>

                      {positionId && isValidPosition && (
                        <>
                          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <Label htmlFor="decrease-percentage" className="text-sm font-medium">
                              Decrease Liquidity (%)
                            </Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                id="decrease-percentage"
                                type="number"
                                placeholder="Enter % to remove (e.g., 50 for 50%)"
                                value={liquidityToken0Amount}
                                onChange={e => {
                                  setLiquidityToken0Amount(e.target.value);
                                  setLiquidityToken1Amount('');
                                }}
                                min="0"
                                max="100"
                                step="1"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Enter percentage of position to remove (100 = all liquidity)
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={handleDecreaseLiquidity}
                              disabled={loading || !liquidityToken0Amount}
                              variant="outline"
                              className="w-full"
                            >
                              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Decrease Liquidity
                            </Button>
                            <Button
                              onClick={handleBurnPosition}
                              disabled={loading || !positionInfo}
                              variant="destructive"
                              className="w-full"
                              title="Remove all liquidity and burn this position NFT"
                            >
                              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Burn Position
                            </Button>
                          </div>
                        </>
                      )}

                      {positionId && isValidPosition && positionInfo && positionInfo.liquidity > 0n && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 space-y-1">
                          <p className="font-medium">ℹ️ Burn will automatically remove liquidity</p>
                          <div className="mt-1">
                            <p>
                              Will withdraw: {formatAmount(positionInfo.amount0, poolData.token0.decimals)}{' '}
                              {poolData.token0.symbol} + {formatAmount(positionInfo.amount1, poolData.token1.decimals)}{' '}
                              {poolData.token1.symbol}
                            </p>
                            {(positionInfo.amount0Underlying || positionInfo.amount1Underlying) && (
                              <p className="text-xs mt-1">
                                {positionInfo.amount0Underlying &&
                                  poolData.token0IsStatAToken &&
                                  poolData.token0UnderlyingToken && (
                                    <>
                                      ≈{' '}
                                      {formatAmount(
                                        positionInfo.amount0Underlying,
                                        poolData.token0UnderlyingToken.decimals,
                                      )}{' '}
                                      {poolData.token0UnderlyingToken.symbol}
                                    </>
                                  )}
                                {positionInfo.amount0Underlying &&
                                  positionInfo.amount1Underlying &&
                                  poolData.token0IsStatAToken &&
                                  poolData.token1IsStatAToken &&
                                  ' + '}
                                {positionInfo.amount1Underlying &&
                                  poolData.token1IsStatAToken &&
                                  poolData.token1UnderlyingToken && (
                                    <>
                                      {formatAmount(
                                        positionInfo.amount1Underlying,
                                        poolData.token1UnderlyingToken.decimals,
                                      )}{' '}
                                      {poolData.token1UnderlyingToken.symbol}
                                    </>
                                  )}{' '}
                                (underlying)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                {/* Token 0 Withdraw */}
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
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Withdraw {poolData.token0.symbol}
                  </Button>
                </div>

                {/* Token 1 Withdraw */}
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
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Withdraw {poolData.token1.symbol}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}
    </div>
  );
}