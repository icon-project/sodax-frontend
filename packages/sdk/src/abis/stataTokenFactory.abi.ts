// packages/sdk/src/abis/stataTokenFactory.abi.ts

export const stataTokenFactoryAbi = [
  {
    type: 'function',
    name: 'getStataTokens',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address[]',
        internalType: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getStataToken',
    inputs: [
      {
        name: 'underlying',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
] as const;
