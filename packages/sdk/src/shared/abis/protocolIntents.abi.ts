// packages/sdk/src/shared/abis/protocolIntents.abi.ts
export const ProtocolIntentsAbi = [
  {
    type: 'function',
    name: 'setAutoSwapPreferences',
    inputs: [
      {
        name: 'outputToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'dstChain',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'dstAddress',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createIntentAutoSwap',
    inputs: [
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'fromToken',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minOutputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAutoSwapPreferences',
    inputs: [
      {
        name: 'user',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct AutoSwapPreferences',
        components: [
          {
            name: 'outputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'dstChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dstAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const;
