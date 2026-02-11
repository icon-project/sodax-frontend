// apps/demo/src/components/dex/UserPositions.tsx
import React, { type JSX, useEffect, useState } from 'react';
import type { Hash, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import {
  createBurnPositionParamsProps,
  useBurnPosition,
  useClaimRewards,
  usePositionInfo,
  useSodaxContext,
} from '@sodax/dapp-kit';
import {
  formatCompactNumber,
  formatTokenAmount,
  getTokenIdsFromLocalStorage,
  normaliseTokenAmount,
  saveTokenIdToLocalStorage,
} from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type UserPositionsProps = Readonly<{
  userAddress: string;
  poolKey: PoolKey;
  poolData: PoolData;
  spokeProvider: SpokeProvider;
}>;

type PositionListItemProps = Readonly<{
  tokenId: string;
  poolKey: PoolKey;
  poolData: PoolData;
  spokeProvider: SpokeProvider;
}>;

function PositionListItem({ tokenId, poolKey, poolData, spokeProvider }: PositionListItemProps): JSX.Element | null {
  const { data, isLoading, isError, error: positionInfoError } = usePositionInfo({ tokenId, poolKey });
  const claimRewardsMutation = useClaimRewards();
  const burnPositionMutation = useBurnPosition();
  const [error, setError] = useState<string>('');

  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
        Loading position {tokenId}...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        Failed to load position {tokenId}: {positionInfoError?.message ?? 'Unknown error'}
      </div>
    );
  }

  if (!data?.isValid) {
    return null;
  }

  const { positionInfo } = data;
  const amount0 = formatTokenAmount(positionInfo.amount0, poolData.token0.decimals, 8);
  const amount1 = formatTokenAmount(positionInfo.amount1, poolData.token1.decimals, 8);
  const fees0 = formatTokenAmount(positionInfo.unclaimedFees0, poolData.token0.decimals, poolData.token0.decimals);
  const fees1 = formatTokenAmount(positionInfo.unclaimedFees1, poolData.token1.decimals, poolData.token1.decimals);
  const liquidity = formatCompactNumber(positionInfo.liquidity);
  const lowerPrice = positionInfo.tickLowerPrice.toSignificant(6);
  const upperPrice = positionInfo.tickUpperPrice.toSignificant(6);
  const quoteSymbol = `${poolData.token1.symbol}/${poolData.token0.symbol}`;
  const priceRange = `${lowerPrice}  - ${upperPrice} ${quoteSymbol}`;
  const hasUnclaimedFees = positionInfo.unclaimedFees0 > 0n || positionInfo.unclaimedFees1 > 0n;

  const handleClaimRewards = async (): Promise<void> => {
    setError('');
    try {
      await claimRewardsMutation.mutateAsync({
        params: {
          poolKey,
          tokenId: BigInt(tokenId),
          tickLower: BigInt(positionInfo.tickLower),
          tickUpper: BigInt(positionInfo.tickUpper),
        },
        spokeProvider,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
    }
  };

  // Handle burn position
  const handleBurnPosition = async (): Promise<void> => {
    // Show confirmation dialog if position has liquidity
    let confirmMessage = '';
    if (positionInfo.liquidity > 0n) {
      const token0Amount = `${normaliseTokenAmount(positionInfo.amount0, poolData.token0.decimals)} ${poolData.token0.symbol}`;
      const token1Amount = `${normaliseTokenAmount(positionInfo.amount1, poolData.token1.decimals)} ${poolData.token1.symbol}`;

      let token0Details = token0Amount;
      let token1Details = token1Amount;

      if (positionInfo.amount0Underlying && poolData.token0IsStatAToken && poolData.token0UnderlyingToken) {
        const underlyingAmount = normaliseTokenAmount(
          positionInfo.amount0Underlying,
          poolData.token0UnderlyingToken.decimals,
        );
        token0Details += ` (≈${underlyingAmount} ${poolData.token0UnderlyingToken.symbol})`;
      }

      if (positionInfo.amount1Underlying && poolData.token1IsStatAToken && poolData.token1UnderlyingToken) {
        const underlyingAmount = normaliseTokenAmount(
          positionInfo.amount1Underlying,
          poolData.token1UnderlyingToken.decimals,
        );
        token1Details += ` (≈${underlyingAmount} ${poolData.token1UnderlyingToken.symbol})`;
      }

      confirmMessage = `This position has liquidity. Burning will:\n1. Remove all liquidity:\n   - ${token0Details}\n   - ${token1Details}\n2. Burn the NFT\n\nAre you sure?`;
    } else {
      confirmMessage = 'Are you sure you want to burn this position? This action cannot be undone.';
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setError('');

    try {
      // Step 1: If position has liquidity, decrease it to 0 first
      // if (positionInfo.liquidity > 0n) {
      //   const slippage = 0.5;
      //   const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      //   const amount0Min = (positionInfo.amount0 * slippageMultiplier) / 10000n;
      //   const amount1Min = (positionInfo.amount1 * slippageMultiplier) / 10000n;

      //   const decreaseResult = await sodax.dex.clService.decreaseLiquidity({
      //     params: {
      //       poolKey: poolKey,
      //       tokenId: BigInt(tokenId),
      //       liquidity: positionInfo.liquidity,
      //       amount0Min,
      //       amount1Min,
      //     },
      //     spokeProvider,
      //   });

      //   if (!decreaseResult.ok) {
      //     console.error('Decrease liquidity failed:', decreaseResult.error);
      //     throw new Error(`Failed to remove liquidity: ${decreaseResult.error?.code || 'Unknown error'}`);
      //   }
      // }

      await burnPositionMutation.mutateAsync({
        params: createBurnPositionParamsProps({
          poolKey: poolKey,
          tokenId: tokenId,
          positionInfo: positionInfo,
          slippageTolerance: 0.5,
        }),
        spokeProvider,
      });

      // Clear position state
      // setPositionId('');
      // setMinPrice('');
      // setMaxPrice('');
      // setLiquidityToken0Amount('');
      // setLiquidityToken1Amount('');
      setError('');
    } catch (err) {
      if (err instanceof Error && err.message === 'Burn cancelled by user') {
        return; // User cancelled, don't show error
      }
      console.error('Burn position failed:', err);
      setError(`Burn position failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Position #{tokenId}</p>
          <p className="text-xs text-muted-foreground">
            Tick range: {positionInfo.tickLower} to {positionInfo.tickUpper}
          </p>
          <p className="text-xs text-muted-foreground">Price range: {priceRange}</p>
        </div>
        <div className="text-xs text-muted-foreground">Liquidity: {liquidity}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{poolData.token0.symbol} Amount</p>
          <p className="font-mono">{amount0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{poolData.token1.symbol} Amount</p>
          <p className="font-mono">{amount1}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Unclaimed fees</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleClaimRewards}
              disabled={!hasUnclaimedFees || claimRewardsMutation.isPending}
            >
              {claimRewardsMutation.isPending ? 'Claiming...' : 'Claim'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleBurnPosition}
              disabled={burnPositionMutation.isPending}
            >
              {burnPositionMutation.isPending ? 'Burning...' : 'Burn'}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Unclaimed {poolData.token0.symbol} Fees</p>
          <p className="font-mono">{fees0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Unclaimed {poolData.token1.symbol} Fees</p>
          <p className="font-mono">{fees1}</p>
        </div>
        {error ? <div className="col-span-2 text-xs text-destructive">{error}</div> : null}
      </div>
    </div>
  );
}

export function UserPositions({ userAddress, poolKey, poolData, spokeProvider }: UserPositionsProps): JSX.Element {
  const { sodax } = useSodaxContext();
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [newTokenId, setNewTokenId] = useState<string>('');
  const [hubTxHashInput, setHubTxHashInput] = useState<string>('');
  const selectedChainId = spokeProvider.chainConfig.chain.id;

  useEffect(() => {
    if (!userAddress) {
      setTokenIds([]);
      setIsLoaded(true);
      return;
    }
    setTokenIds(getTokenIdsFromLocalStorage(selectedChainId, userAddress));
    setIsLoaded(true);
  }, [userAddress, selectedChainId]);

  const isNewTokenIdValid = newTokenId.trim() !== '' && Number.isFinite(Number(newTokenId));

  const handleSaveTokenId = (): void => {
    if (!userAddress || !isNewTokenIdValid) {
      return;
    }
    const trimmedTokenId = newTokenId.trim();
    saveTokenIdToLocalStorage(userAddress, selectedChainId, trimmedTokenId);
    setTokenIds(getTokenIdsFromLocalStorage(selectedChainId, userAddress));
    setNewTokenId('');
  };

  if (!isLoaded) {
    return <div className="text-sm text-muted-foreground">Loading positions...</div>;
  }

  if (!userAddress) {
    return <div className="text-sm text-muted-foreground">Connect a wallet to view positions.</div>;
  }

  const handleFindPositionId = async (): Promise<void> => {
    if (!hubTxHashInput.trim()) {
      globalThis.alert('Please enter a hub tx hash');
      return;
    }

    try {
      const mintPositionEvent = await sodax.dex.clService.getMintPositionEvent(hubTxHashInput.trim() as Hash);
      saveTokenIdToLocalStorage(userAddress, selectedChainId, mintPositionEvent.tokenId.toString());
      setHubTxHashInput('');
      globalThis.alert(`Position ID: ${mintPositionEvent.tokenId.toString()}`);
    } catch (err) {
      console.error('Find position ID failed:', err);
      globalThis.alert(`Find position ID failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My positions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          Utils
          <div className="space-y-2">
            <Label htmlFor="position-token-id" className="text-xs text-muted-foreground">
              Save an existing position ID (token ID)
            </Label>
            <div className="flex gap-2">
              <Input
                id="position-token-id"
                type="number"
                placeholder="Enter token ID"
                value={newTokenId}
                onChange={event => setNewTokenId(event.target.value)}
              />
              <Button type="button" onClick={handleSaveTokenId} disabled={!isNewTokenIdValid}>
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-token-id" className="text-xs text-muted-foreground">
              Hub tx hash (find existing position ID)
            </Label>
            <div className="flex gap-2">
              <Input
                id="hub-tx-hash"
                type="text"
                placeholder="0x..."
                value={hubTxHashInput}
                onChange={event => setHubTxHashInput(event.target.value)}
              />
              <Button type="button" onClick={handleFindPositionId} disabled={!hubTxHashInput.trim()}>
                Find position ID
              </Button>
            </div>
          </div>
        </div>
        <div className="h-px bg-border" />
        {tokenIds.length === 0 ? (
          <div className="text-sm text-muted-foreground">No saved positions found for this wallet.</div>
        ) : (
          tokenIds.map(tokenId => (
            <PositionListItem
              key={tokenId}
              tokenId={tokenId}
              poolKey={poolKey}
              poolData={poolData}
              spokeProvider={spokeProvider}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
