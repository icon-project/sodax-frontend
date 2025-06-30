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
  {
    type: 'function',
    name: 'borrowAllowance',
    inputs: [
      {
        name: 'fromUser',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'toUser',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
] as const;
