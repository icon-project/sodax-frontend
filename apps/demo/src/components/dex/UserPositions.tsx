// apps/demo/src/components/dex/UserPositions.tsx
import React, { type JSX, useEffect, useState } from 'react';
import type { Hash, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import {
  createDecreaseLiquidityParamsProps,
  useDecreaseLiquidity,
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
import { Loader2 } from 'lucide-react';

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
  const [percentageToRemove, setPercentageToRemove] = useState(0);
  const { data, isLoading, isError, error: positionInfoError } = usePositionInfo({ tokenId, poolKey });
  const claimRewardsMutation = useClaimRewards();
  const decreaseLiquidityMutation = useDecreaseLiquidity();
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

  // Handle decrease liquidity position
  const handleDecreaseLiquidity = async (percentage: number): Promise<void> => {
    if (percentage <= 0 || percentage > 100) {
      setError('Percentage must be between 0 and 100');
      return;
    }
    setError('');

    // Show confirmation dialog if position has liquidity and user wants to remove all liquidity
    let confirmMessage = '';
    if (positionInfo.liquidity > 0n && percentage === 100) {
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

      confirmMessage = `Remove all liquidity:\n   - ${token0Details}\n   - ${token1Details}`;
    } else {
      confirmMessage = `Remove ${percentage}% of liquidity`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setError('');

    try {
      // NOTE: when removing 100% of liquidity unclaimed fees are supposedly included (double check)
      await decreaseLiquidityMutation.mutateAsync({
        params: createDecreaseLiquidityParamsProps({
          poolKey: poolKey,
          tokenId: tokenId,
          percentage: percentageToRemove,
          positionInfo: positionInfo,
          slippageTolerance: 0.5,
        }),
        spokeProvider,
      });

      // Clear percentage to remove
      setPercentageToRemove(0);
      setError('');
    } catch (err) {
      if (err instanceof Error && err.message === 'Decrease liquidity cancelled by user') {
        return; // User cancelled, don't show error
      }
      console.error('Decrease liquidity failed:', err);
      setError(`Decrease liquidity failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Unclaimed {poolData.token0.symbol} Fees</p>
          <p className="font-mono">{fees0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Unclaimed {poolData.token1.symbol} Fees</p>
          <p className="font-mono">{fees1}</p>
        </div>
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleClaimRewards}
            disabled={!hasUnclaimedFees || claimRewardsMutation.isPending}
          >
            {claimRewardsMutation.isPending ? 'Claiming...' : 'Claim'}
          </Button>
        </div>
        {error ? <div className="col-span-2 text-xs text-destructive">{error}</div> : null}
      </div>
      <div className="mt-4">
        <div className="flex flex-col space-y-2 p-2 rounded w-full">
          <Label htmlFor="decrease-percentage" className="text-sm font-medium">
            Decrease Liquidity (%)
          </Label>
          <div className="flex gap-2 items-center w-fit">
            <Input
              className="w-[60px]"
              id="decrease-percentage"
              type="number"
              placeholder="Enter % to remove (e.g., 50 for 50%)"
              value={percentageToRemove}
              onChange={e => setPercentageToRemove(Number(e.target.value))}
            />
            <span className="text-sm text-muted-foreground">%</span>
            <Button
              onClick={() => handleDecreaseLiquidity(percentageToRemove)}
              disabled={isLoading || !percentageToRemove}
              variant="outline"
              className="w-fit ml-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Decrease Liquidity
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Enter percentage of position to remove (100 = all liquidity)</p>
        </div>

        <div className="grid grid-rows-2 gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => handleDecreaseLiquidity(100)}
              disabled={isLoading}
            >
              {isLoading ? 'Removing...' : 'Remove all liquidity'}
            </Button>
          </div>
        </div>
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
