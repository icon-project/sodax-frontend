import { describe, expect, it } from 'vitest';
import { PositionMath, TickMath } from '@pancakeswap/v3-sdk';
import { ClService } from './ConcentratedLiquidityService.js';

const sqrtPriceAtTick = (tick: number): bigint => BigInt(TickMath.getSqrtRatioAtTick(tick).toString());

describe('ClService.calculateMaxAmountsForSlippage', () => {
  const tickLower = -1000n;
  const tickUpper = 1000n;
  const currentTick = 0n;
  const sqrtPriceX96 = sqrtPriceAtTick(0);
  const liquidity = 10n ** 18n;

  it('returns zero for both tokens when liquidity is zero', () => {
    const result = ClService.calculateMaxAmountsForSlippage(0n, tickLower, tickUpper, currentTick, sqrtPriceX96, 1);
    expect(result.amount0Max).toBe(0n);
    expect(result.amount1Max).toBe(0n);
  });

  it('returns exactly the current amounts when slippage is zero', () => {
    const current0 = PositionMath.getToken0Amount(0, -1000, 1000, sqrtPriceX96, liquidity);
    const current1 = PositionMath.getToken1Amount(0, -1000, 1000, sqrtPriceX96, liquidity);

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      0,
    );

    expect(result.amount0Max).toBe(current0);
    expect(result.amount1Max).toBe(current1);
  });

  it('returns amounts at least as large as the current amounts for a positive slippage', () => {
    const current0 = PositionMath.getToken0Amount(0, -1000, 1000, sqrtPriceX96, liquidity);
    const current1 = PositionMath.getToken1Amount(0, -1000, 1000, sqrtPriceX96, liquidity);

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      1,
    );

    expect(result.amount0Max).toBeGreaterThanOrEqual(current0);
    expect(result.amount1Max).toBeGreaterThanOrEqual(current1);
  });

  it('is monotonic in slippage: larger slippage never produces smaller max amounts', () => {
    const low = ClService.calculateMaxAmountsForSlippage(liquidity, tickLower, tickUpper, currentTick, sqrtPriceX96, 1);
    const high = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      10,
    );

    expect(high.amount0Max).toBeGreaterThanOrEqual(low.amount0Max);
    expect(high.amount1Max).toBeGreaterThanOrEqual(low.amount1Max);
  });

  it('slippagePercent scale is percent: 10% produces strictly larger amounts than 1% for an in-range position', () => {
    const onePercent = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      1,
    );
    const tenPercent = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      10,
    );

    expect(tenPercent.amount0Max).toBeGreaterThan(onePercent.amount0Max);
    expect(tenPercent.amount1Max).toBeGreaterThan(onePercent.amount1Max);
  });

  it('handles the current tick at the lower range boundary (position entirely in token0)', () => {
    const boundaryTick = tickLower;
    const boundarySqrtPrice = sqrtPriceAtTick(Number(boundaryTick));
    const current1 = PositionMath.getToken1Amount(
      Number(boundaryTick),
      Number(tickLower),
      Number(tickUpper),
      boundarySqrtPrice,
      liquidity,
    );
    expect(current1).toBe(0n);

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      boundaryTick,
      boundarySqrtPrice,
      1,
    );

    expect(result.amount0Max).toBeGreaterThan(0n);
  });

  it('handles the current tick at the upper range boundary (position entirely in token1)', () => {
    const boundaryTick = tickUpper;
    const boundarySqrtPrice = sqrtPriceAtTick(Number(boundaryTick));
    const current0 = PositionMath.getToken0Amount(
      Number(boundaryTick),
      Number(tickLower),
      Number(tickUpper),
      boundarySqrtPrice,
      liquidity,
    );
    expect(current0).toBe(0n);

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      boundaryTick,
      boundarySqrtPrice,
      1,
    );

    expect(result.amount1Max).toBeGreaterThan(0n);
  });

  it('handles the current tick below the range', () => {
    const belowTick = -2000n;
    const belowSqrtPrice = sqrtPriceAtTick(Number(belowTick));

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      belowTick,
      belowSqrtPrice,
      1,
    );

    expect(result.amount0Max).toBeGreaterThan(0n);
    expect(result.amount1Max).toBe(0n);
  });

  it('handles the current tick above the range', () => {
    const aboveTick = 2000n;
    const aboveSqrtPrice = sqrtPriceAtTick(Number(aboveTick));

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      aboveTick,
      aboveSqrtPrice,
      1,
    );

    expect(result.amount0Max).toBe(0n);
    expect(result.amount1Max).toBeGreaterThan(0n);
  });

  it('handles a very narrow range around the current tick', () => {
    const narrowLower = -10n;
    const narrowUpper = 10n;

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      narrowLower,
      narrowUpper,
      currentTick,
      sqrtPriceX96,
      1,
    );

    expect(result.amount0Max).toBeGreaterThan(0n);
    expect(result.amount1Max).toBeGreaterThan(0n);
  });

  it('handles a very wide range', () => {
    const wideLower = -100000n;
    const wideUpper = 100000n;

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      wideLower,
      wideUpper,
      currentTick,
      sqrtPriceX96,
      0.5,
    );

    expect(result.amount0Max).toBeGreaterThan(0n);
    expect(result.amount1Max).toBeGreaterThan(0n);
  });

  it('handles realistic large liquidity values without overflow', () => {
    const largeLiquidity = 10n ** 24n;

    const result = ClService.calculateMaxAmountsForSlippage(
      largeLiquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      0.5,
    );

    expect(result.amount0Max).toBeGreaterThan(0n);
    expect(result.amount1Max).toBeGreaterThan(0n);
  });

  it('handles sub-percent slippage (0.1%)', () => {
    const current0 = PositionMath.getToken0Amount(0, -1000, 1000, sqrtPriceX96, liquidity);
    const current1 = PositionMath.getToken1Amount(0, -1000, 1000, sqrtPriceX96, liquidity);

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      0.1,
    );

    expect(result.amount0Max).toBeGreaterThanOrEqual(current0);
    expect(result.amount1Max).toBeGreaterThanOrEqual(current1);
  });

  it('matches direct PositionMath call within the worst-case bound', () => {
    const slippagePercent = 2;
    const SLIPPAGE_SCALE = 1_000_000_000n;
    const slippageScaled = BigInt(Math.round((slippagePercent * Number(SLIPPAGE_SCALE)) / 100));
    const sqrtPriceSquared = sqrtPriceX96 * sqrtPriceX96;

    const sqrtPriceX96Down = bigIntSqrt((sqrtPriceSquared * (SLIPPAGE_SCALE - slippageScaled)) / SLIPPAGE_SCALE);
    const sqrtPriceX96Up = bigIntSqrt((sqrtPriceSquared * (SLIPPAGE_SCALE + slippageScaled)) / SLIPPAGE_SCALE);
    const tickDown = TickMath.getTickAtSqrtRatio(sqrtPriceX96Down);
    const tickUp = TickMath.getTickAtSqrtRatio(sqrtPriceX96Up);

    const expectedAmount0AtDrop = PositionMath.getToken0Amount(
      tickDown,
      Number(tickLower),
      Number(tickUpper),
      sqrtPriceX96Down,
      liquidity,
    );
    const expectedAmount1AtRise = PositionMath.getToken1Amount(
      tickUp,
      Number(tickLower),
      Number(tickUpper),
      sqrtPriceX96Up,
      liquidity,
    );
    const current0 = PositionMath.getToken0Amount(0, -1000, 1000, sqrtPriceX96, liquidity);
    const current1 = PositionMath.getToken1Amount(0, -1000, 1000, sqrtPriceX96, liquidity);

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      tickLower,
      tickUpper,
      currentTick,
      sqrtPriceX96,
      slippagePercent,
    );

    expect(result.amount0Max).toBe(expectedAmount0AtDrop > current0 ? expectedAmount0AtDrop : current0);
    expect(result.amount1Max).toBe(expectedAmount1AtRise > current1 ? expectedAmount1AtRise : current1);
  });

  it('preserves precision for large sqrtPriceX96 values that overflow JS Number', () => {
    // sqrtPriceX96 at a high tick is far beyond Number.MAX_SAFE_INTEGER (~2^53).
    const highTick = 200000n;
    const largeSqrtPrice = sqrtPriceAtTick(Number(highTick));
    expect(largeSqrtPrice).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));

    const result = ClService.calculateMaxAmountsForSlippage(
      liquidity,
      highTick - 100n,
      highTick + 100n,
      highTick,
      largeSqrtPrice,
      0.5,
    );

    expect(result.amount0Max).toBeGreaterThan(0n);
    expect(result.amount1Max).toBeGreaterThan(0n);
  });
});

function bigIntSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('bigIntSqrt: negative');
  if (n < 2n) return n;
  let x = 1n << ((BigInt(n.toString(2).length) + 1n) / 2n);
  while (true) {
    const next = (x + n / x) / 2n;
    if (next >= x) return x;
    x = next;
  }
}
