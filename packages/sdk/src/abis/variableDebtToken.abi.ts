export const variableDebtTokenAbi = [
  {
    inputs: [
      {
        name: 'delegatee',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    name: 'approveDelegation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;