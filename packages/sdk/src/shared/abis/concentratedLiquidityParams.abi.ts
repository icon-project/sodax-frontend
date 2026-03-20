// ABI parameter definitions for concentrated liquidity operations

/**
 * PoolKey structure ABI definition
 */
export const poolKeyAbi = [
  { type: 'address', name: 'currency0' },
  { type: 'address', name: 'currency1' },
  { type: 'address', name: 'hooks' },
  { type: 'address', name: 'poolManager' },
  { type: 'uint24', name: 'fee' },
  { type: 'bytes32', name: 'parameters' },
] as const;

/**
 * Swap exact input single parameters ABI definition
 */
export const swapExactInSingleParamsAbi = [
  {
    type: 'tuple',
    name: 'params',
    components: [
      {
        type: 'tuple',
        name: 'poolKey',
        components: poolKeyAbi,
      },
      { type: 'bool', name: 'zeroForOne' },
      { type: 'uint128', name: 'amountIn' },
      { type: 'uint128', name: 'amountOutMinimum' },
      { type: 'bytes', name: 'hookData' },
    ],
  },
] as const;

/**
 * Mint position parameters ABI definition
 */
export const mintPositionParamsAbi = [
  {
    type: 'tuple',
    name: 'poolKey',
    components: poolKeyAbi,
  },
  { type: 'int24', name: 'tickLower' },
  { type: 'int24', name: 'tickUpper' },
  { type: 'uint128', name: 'liquidity' },
  { type: 'uint256', name: 'amount0' },
  { type: 'uint256', name: 'amount1' },
  { type: 'address', name: 'recipient' },
  { type: 'bytes', name: 'hookData' },
] as const;

/**
 * Modify liquidity parameters ABI definition (for increase/decrease liquidity)
 * Based on: (uint256 tokenId, uint256 liquidity, uint128 amount0Max, uint128 amount1Max, bytes hookData)
 */
export const modifyLiquidityParamsAbi = [
  { type: 'uint256', name: 'tokenId' },
  { type: 'uint256', name: 'liquidity' },
  { type: 'uint128', name: 'amount0Max' },
  { type: 'uint128', name: 'amount1Max' },
  { type: 'bytes', name: 'hookData' },
] as const;
