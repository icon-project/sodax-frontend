export const connectionAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'dstChainId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'dstAddress',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'payload',
        type: 'bytes',
      },
    ],
    name: 'sendMessage',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
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
        internalType: 'uint256',
        name: 'connSn',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'payload',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: 'signedMessages',
        type: 'bytes[]',
      },
    ],
    name: 'verifyMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
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
        name: 'signedMessages',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
