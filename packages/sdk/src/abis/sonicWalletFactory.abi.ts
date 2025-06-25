export const sonicWalletFactoryAbi = [
  {
    type: 'function',
    name: 'route',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        internalType: 'struct ISonicRouterWallet.ContractCall[]',
        components: [
          {
            name: 'addr',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'data',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getDeployedAddress',
    inputs: [
      {
        name: 'user',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [
      {
        name: 'computedAddress',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
] as const;