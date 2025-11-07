export const IntentsAbi = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'HUB_CHAIN_ID',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'UPGRADE_INTERFACE_VERSION',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addSpoke',
    inputs: [
      {
        name: 'chainID',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'spokeAddress',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'assetManager',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IAssetManager',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'cancelIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct Intents.Intent',
        components: [
          {
            name: 'intentId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'creator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'outputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'minOutputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'allowPartialFill',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'srcChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dstChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'srcAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'dstAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'solver',
            type: 'address',
            internalType: 'address',
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
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'connection',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IConnection',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct Intents.Intent',
        components: [
          {
            name: 'intentId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'creator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'outputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'minOutputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'allowPartialFill',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'srcChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dstChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'srcAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'dstAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'solver',
            type: 'address',
            internalType: 'address',
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
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'externalFills',
    inputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'intentHash',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'inputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'outputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'fillIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct Intents.Intent',
        components: [
          {
            name: 'intentId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'creator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'outputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'minOutputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'allowPartialFill',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'srcChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dstChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'srcAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'dstAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'solver',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'data',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
      {
        name: '_inputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_outputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_externalFillId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getImplementation',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [
      {
        name: '_walletFactory',
        type: 'address',
        internalType: 'contract IWalletFactory',
      },
      {
        name: '_assetManager',
        type: 'address',
        internalType: 'contract IAssetManager',
      },
      {
        name: '_connection',
        type: 'address',
        internalType: 'contract IConnection',
      },
      {
        name: '_HUB_CHAIN_ID',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'intentStates',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'exists',
        type: 'bool',
        internalType: 'bool',
      },
      {
        name: 'remainingInput',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'receivedOutput',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'pendingPayment',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingIntentStates',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'pendingInput',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'pendingOutput',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingPayouts',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'solver',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'preFillIntent',
    inputs: [
      {
        name: 'intent',
        type: 'tuple',
        internalType: 'struct Intents.Intent',
        components: [
          {
            name: 'intentId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'creator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'outputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'minOutputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'allowPartialFill',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'srcChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dstChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'srcAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'dstAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'solver',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'data',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
      {
        name: '_inputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_outputAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_externalFillId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'proxiableUUID',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'recvMessage',
    inputs: [
      {
        name: 'srcChainId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'srcAddress',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: 'connSn',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'payload',
        type: 'bytes',
        internalType: 'bytes',
      },
      {
        name: 'signatures',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setWhitelistedSolver',
    inputs: [
      {
        name: 'solver',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'whitelisted',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'spokes',
    inputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'upgradeToAndCall',
    inputs: [
      {
        name: 'newImplementation',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'walletFactory',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IWalletFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'whitelistedSolvers',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ExternalFillFailed',
    inputs: [
      {
        name: 'fillId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'fill',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Intents.ExternalFill',
        components: [
          {
            name: 'intentHash',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'to',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'outputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Initialized',
    inputs: [
      {
        name: 'version',
        type: 'uint64',
        indexed: false,
        internalType: 'uint64',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'IntentCancelled',
    inputs: [
      {
        name: 'intentHash',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'IntentCreated',
    inputs: [
      {
        name: 'intentHash',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'intent',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Intents.Intent',
        components: [
          {
            name: 'intentId',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'creator',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'outputToken',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'inputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'minOutputAmount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'allowPartialFill',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'srcChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'dstChain',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'srcAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'dstAddress',
            type: 'bytes',
            internalType: 'bytes',
          },
          {
            name: 'solver',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'data',
            type: 'bytes',
            internalType: 'bytes',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'IntentFilled',
    inputs: [
      {
        name: 'intentHash',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      {
        name: 'intentState',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Intents.IntentState',
        components: [
          {
            name: 'exists',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'remainingInput',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'receivedOutput',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'pendingPayment',
            type: 'bool',
            internalType: 'bool',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Upgraded',
    inputs: [
      {
        name: 'implementation',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AddressEmptyCode',
    inputs: [
      {
        name: 'target',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC1967InvalidImplementation',
    inputs: [
      {
        name: 'implementation',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC1967NonPayable',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FailedCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FillAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'IntentAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'IntentNotFound',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidInitialization',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidOutputToken',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidSolver',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotInitializing',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'PartialFillNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PendingFillExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'SpokeNotConfigured',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UUPSUnauthorizedCallContext',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UUPSUnsupportedProxiableUUID',
    inputs: [
      {
        name: 'slot',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: [],
  },
] as const;
