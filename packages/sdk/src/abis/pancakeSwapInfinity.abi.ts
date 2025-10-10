// packages/sdk/src/abis/pancakeSwapInfinity.abi.ts
export const pancakeSwapInfinityPositionManagerAbi = [
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'payload',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
    ],
    name: 'modifyLiquidities',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'actions',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: 'params',
        type: 'bytes[]',
      },
    ],
    name: 'modifyLiquiditiesWithoutLock',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },

  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'positions',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'currency0',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'currency1',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'hooks',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'poolManager',
            type: 'address',
          },
          {
            internalType: 'uint24',
            name: 'fee',
            type: 'uint24',
          },
          {
            internalType: 'bytes32',
            name: 'parameters',
            type: 'bytes32',
          },
        ],
        internalType: 'struct PoolKey',
        name: 'poolKey',
        type: 'tuple',
      },
      {
        internalType: 'int24',
        name: 'tickLower',
        type: 'int24',
      },
      {
        internalType: 'int24',
        name: 'tickUpper',
        type: 'int24',
      },
      {
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside0LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside1LastX128',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_subscriber',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint128',
        name: 'amount0Max',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: 'amount1Max',
        type: 'uint128',
      },
    ],
    name: 'collect',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export const pancakeSwapInfinityPoolManagerAbi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'currency0',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'currency1',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'hooks',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'poolManager',
            type: 'address',
          },
          {
            internalType: 'uint24',
            name: 'fee',
            type: 'uint24',
          },
          {
            internalType: 'bytes32',
            name: 'parameters',
            type: 'bytes32',
          },
        ],
        internalType: 'struct PoolKey',
        name: 'key',
        type: 'tuple',
      },
      {
        internalType: 'uint160',
        name: 'sqrtPriceX96',
        type: 'uint160',
      },
    ],
    name: 'initialize',
    outputs: [
      {
        internalType: 'contract IPool',
        name: 'pool',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'currency0',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'currency1',
        type: 'address',
      },
      {
        internalType: 'uint24',
        name: 'fee',
        type: 'uint24',
      },
    ],
    name: 'getPool',
    outputs: [
      {
        internalType: 'contract IPool',
        name: 'pool',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const pancakeSwapInfinityDefaultHookAbi = [
  {
    inputs: [],
    name: 'getHooksRegistrationBitmap',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
