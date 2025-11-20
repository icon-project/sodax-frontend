export const multiHubWalletManagerAbi = [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_walletImplementation",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "createWallet",
            "inputs": [
                {
                    "name": "tag",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getWalletsOfByTag",
            "inputs": [
                {
                    "name": "user",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tag",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address[]",
                    "internalType": "address[]"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "registerWallet",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tag",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "unregisterWallet",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "walletTagData",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "updateWalletTag",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "oldTag",
                    "type": "bytes",
                    "internalType": "bytes"
                },
                {
                    "name": "newTag",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "walletImplementation",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "walletsOf",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "bytes",
                    "internalType": "bytes"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "WalletCreated",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "creator",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "tag",
                    "type": "bytes",
                    "indexed": false,
                    "internalType": "bytes"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "WalletRegistered",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "tag",
                    "type": "bytes",
                    "indexed": false,
                    "internalType": "bytes"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "WalletTagUpdated",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "oldTag",
                    "type": "bytes",
                    "indexed": false,
                    "internalType": "bytes"
                },
                {
                    "name": "newTag",
                    "type": "bytes",
                    "indexed": false,
                    "internalType": "bytes"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "WalletUnregistered",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "FailedDeployment",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InsufficientBalance",
            "inputs": [
                {
                    "name": "balance",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "needed",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        }
    ]