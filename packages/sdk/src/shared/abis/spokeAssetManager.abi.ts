export const spokeAssetManagerAbi = [
  {
    inputs: [],
    name: 'InsufficientValue',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferFailed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'oldRateLimit',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newRateLimit',
        type: 'address',
      },
    ],
    name: 'RateLimitUpdated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'connection',
    outputs: [
      {
        internalType: 'contract IConnection',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getImplementation',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'hubAssetManager',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'hubChainId',
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
  {
    inputs: [
      {
        internalType: 'contract IConnection',
        name: '_connection',
        type: 'address',
      },
      {
        internalType: 'contract RateLimit',
        name: '_rateLimit',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: '_hubAssetManager',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: '_hubChainId',
        type: 'uint256',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rateLimit',
    outputs: [
      {
        internalType: 'contract RateLimit',
        name: '',
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
        name: 'nonce',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'srcChainId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'srcAddress',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'payload',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: 'signatures',
        type: 'bytes[]',
      },
    ],
    name: 'recvMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract RateLimit',
        name: '_rateLimit',
        type: 'address',
      },
    ],
    name: 'setRateLimit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'to',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'transfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
